import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('../api', () => ({ default: { post: vi.fn() }, publicApi: { post: vi.fn() }, unwrap: (response) => response.data.data }));
import api, { publicApi } from '../api';
import { googleAuthService } from './googleAuthService';
beforeEach(() => { vi.resetAllMocks(); });

it('uses nonce cookies and app bearer authentication only for account linking', async () => {
  const result = { clientId: 'client.apps.googleusercontent.com', nonce: 'nonce', expiresIn: 300 };
  publicApi.post.mockResolvedValue({ data: { data: result } }); api.post.mockResolvedValue({ data: { data: result } });
  expect(await googleAuthService.challenge('login')).toEqual(result);
  expect(publicApi.post).toHaveBeenCalledWith('/auth/google/challenge', undefined, { withCredentials: true });
  await googleAuthService.challenge('link');
  expect(api.post).toHaveBeenCalledWith('/auth/google/link/challenge', undefined, { withCredentials: true });
});
it('does not create a challenge for a disposed React mount and serializes cookie mutations', async () => {
  let finish;
  publicApi.post.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; })).mockResolvedValue({ data: { data: { nonce: 'latest' } } });
  const first = googleAuthService.challenge('login');
  await vi.waitFor(() => expect(publicApi.post).toHaveBeenCalledTimes(1));
  const skipped = googleAuthService.challenge('login', () => false);
  const latest = googleAuthService.challenge('login');
  expect(publicApi.post).toHaveBeenCalledTimes(1);
  finish({ data: { data: { nonce: 'first' } } });
  expect(await first).toEqual({ nonce: 'first' }); expect(await skipped).toBeNull();
  expect(await latest).toEqual({ nonce: 'latest' }); expect(publicApi.post).toHaveBeenCalledTimes(2);
});
it('sends only Google credentials and the documented login/link fields', async () => {
  publicApi.post.mockResolvedValue({ data: { data: { accessToken: 'app-access', refreshToken: 'app-refresh' } } });
  api.post.mockResolvedValue({ data: { data: { provider: 'GOOGLE', linked: true } } });
  await googleAuthService.login('temporary-google-credential', true);
  expect(publicApi.post).toHaveBeenCalledWith('/auth/google', { credential: 'temporary-google-credential', rememberMe: true }, { withCredentials: true });
  await googleAuthService.link('temporary-google-credential', 'current-password');
  expect(api.post).toHaveBeenCalledWith('/auth/google/link', { credential: 'temporary-google-credential', currentPassword: 'current-password' }, { withCredentials: true });
});
