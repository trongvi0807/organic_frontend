import { createServer } from 'node:http';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import api from './api';
import { createProfileService } from './client/profileService';
import { AVATAR_UPLOAD_TIMEOUT_MS, avatarUploadError } from '@/lib/avatarUpload';

const originalBaseURL = api.defaults.baseURL;
let server, received;
const profile = { id: 'customer-qa', fullName: 'Khách hàng QA', avatarUrl: 'https://cdn.example.com/avatar.png', addresses: [] };
beforeAll(async () => {
  server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const contentType = request.headers['content-type'];
    const form = await new Request('http://localhost/upload', { method: 'POST', headers: { 'content-type': contentType }, body }).formData();
    const file = form.get('file');
    received = { method: request.method, url: request.url, authorization: request.headers.authorization, contentType,
      fields: [...form.keys()], filename: file.name, mime: file.type, bytes: new Uint8Array(await file.arrayBuffer()) };
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ data: profile }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  api.defaults.baseURL = `http://127.0.0.1:${server.address().port}/api/v1`;
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
afterAll(async () => { api.defaults.baseURL = originalBaseURL; server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); });

describe('Avatar upload over real Axios HTTP transport', () => {
  it('sends authenticated multipart file bytes and reads the full profile response', async () => {
    vi.stubGlobal('sessionStorage', { getItem: () => JSON.stringify({ accessToken: 'qa-upload-token' }) });
    const bytes = new Uint8Array([137,80,78,71,13,10,26,10,0]);
    const result = await createProfileService().uploadAvatar(new File([bytes], 'avatar.png', { type: 'image/png' }));
    expect(received).toMatchObject({ method: 'POST', url: '/api/v1/customers/me/avatar', authorization: 'Bearer qa-upload-token', fields: ['file'], filename: 'avatar.png', mime: 'image/png' });
    expect(received.contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect(received.bytes).toEqual(bytes);
    expect(result).toEqual(profile);
  });
  it('allows Cloudinary processing time without extending ordinary API calls', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: profile } });
    await createProfileService().uploadAvatar(new File(['image'], 'avatar.webp', { type: 'image/webp' }));
    expect(post.mock.calls[0][2].timeout).toBe(AVATAR_UPLOAD_TIMEOUT_MS);
    expect(AVATAR_UPLOAD_TIMEOUT_MS).toBe(60_000);
    expect(api.defaults.timeout).toBe(15_000);
  });
  it('rejects empty images before sending a request', async () => {
    const post = vi.spyOn(api, 'post');
    await expect(createProfileService().uploadAvatar(new File([], 'empty.png', { type: 'image/png' }))).rejects.toThrow('rỗng');
    expect(post).not.toHaveBeenCalled();
  });
});

describe('Avatar upload diagnostics', () => {
  it('keeps the server message and HTTP status so proxy errors can be traced', () => {
    const message = 'Hãy nộp bài trước khi tải tệp lên kho.';
    expect(avatarUploadError({ response: { status: 400, data: { message } } })).toBe(`Tải ảnh thất bại (HTTP 400): ${message}`);
    expect(avatarUploadError({ response: { status: 413, data: '<html>Request Entity Too Large</html>' } })).toContain('HTTP 413');
    expect(avatarUploadError({ response: { status: 415 } })).toContain('multipart');
  });
  it('distinguishes timeout, connection and local validation errors', () => {
    expect(avatarUploadError({ code: 'ECONNABORTED' })).toContain('vẫn đang xử lý');
    expect(avatarUploadError({ code: 'ETIMEDOUT' })).toContain('tải lại hồ sơ');
    expect(avatarUploadError({ code: 'ERR_NETWORK' })).toContain('Không kết nối');
    expect(avatarUploadError(new Error('Chọn ảnh JPEG, PNG hoặc WebP.'))).toBe('Chọn ảnh JPEG, PNG hoặc WebP.');
  });
});
