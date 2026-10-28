import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import api from './api';
import { excelImportService } from './admin/fileService';

let server, received = [], committed = new Map(), writes = 0;
const originalBase = api.defaults.baseURL;
beforeAll(async () => {
  vi.stubGlobal('sessionStorage', { getItem: () => JSON.stringify({ accessToken: 'qa-file-token' }) });
  server = createServer(async (request, response) => {
    const buffers = []; for await (const chunk of request) buffers.push(chunk);
    const form = await new Request('http://localhost/import', { method: 'POST', headers: { 'content-type': request.headers['content-type'] }, body: Buffer.concat(buffers) }).formData();
    const file = form.get('file'), bytes = Buffer.from(await file.arrayBuffer());
    const hash = createHash('sha256').update(bytes).digest('hex');
    received.push({ url: request.url, authorization: request.headers.authorization, contentType: request.headers['content-type'], key: request.headers['idempotency-key'], fields: [...form.keys()], filename: file.name, bytes, hash: form.get('fileSha256') });
    response.setHeader('Content-Type', 'application/json');
    if (request.url.endsWith('/preview')) { response.end(JSON.stringify({ data: { fileSha256: hash, canImport: true, rowCount: 1, rows: [], errors: [] } })); return; }
    const key = request.headers['idempotency-key'];
    if (!committed.has(key)) {
      committed.set(key, { executionId: 'execution-1', purchaseOrderId: 'po-1', purchaseOrderStatus: 'pending_approval' }); writes++;
      // Simulate a committed transaction whose HTTP response was lost.
      request.socket.destroy(); return;
    }
    response.writeHead(201); response.end(JSON.stringify({ data: committed.get(key) }));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve)); api.defaults.baseURL = `http://127.0.0.1:${server.address().port}/api/v1`;
});
afterAll(async () => { api.defaults.baseURL = originalBase; vi.unstubAllGlobals(); server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); });
it('sends authenticated binary multipart and recovers a committed purchase import without creating another order', async () => {
  const bytes = new Uint8Array([80, 75, 3, 4, 0, 1, 2, 3]);
  const file = new File([bytes], 'don-mua.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const preview = await excelImportService.preview('purchase_orders', file);
  await expect(excelImportService.execute('purchase_orders', file, preview.fileSha256, 'same-key')).rejects.toThrow();
  const saved = await excelImportService.execute('purchase_orders', file, preview.fileSha256, 'same-key');
  expect(saved.purchaseOrderId).toBe('po-1'); expect(writes).toBe(1);
  expect(received.map((r) => r.url)).toEqual(['/api/v1/purchase-orders/import/preview', '/api/v1/purchase-orders/import', '/api/v1/purchase-orders/import']);
  for (const r of received) { expect(r.authorization).toBe('Bearer qa-file-token'); expect(r.contentType).toMatch(/^multipart\/form-data; boundary=/); expect(r.bytes).toEqual(Buffer.from(bytes)); expect(r.filename).toBe('don-mua.xlsx'); }
  expect(received[0].fields).toEqual(['file']);
  for (const r of received.slice(1)) { expect(r.fields).toEqual(['file', 'fileSha256']); expect(r.key).toBe('same-key'); expect(r.hash).toBe(preview.fileSha256); }
});
