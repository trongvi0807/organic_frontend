// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
const clients = vi.hoisted(() => ({ privatePost: vi.fn(), publicPost: vi.fn() }));
vi.mock('../api', () => ({ default: { post: clients.privatePost }, publicApi: { post: clients.publicPost }, unwrap: r => r.data.data }));
import { passwordService, rememberPasswordGrant, getPasswordGrant, clearPasswordGrant, passwordValidation } from './passwordService';
beforeEach(() => { vi.clearAllMocks(); clearPasswordGrant(); clients.privatePost.mockResolvedValue({ data: { data: { challengeId: 'c', expiresIn: 300 } } }); clients.publicPost.mockResolvedValue({ data: { data: { challengeId: 'c', expiresIn: 300 } } }); });
it('uses authenticated APIs only for change and never sends a client-selected email for it', async () => {
  await passwordService.request('change', 'other@example.com');
  expect(clients.privatePost).toHaveBeenCalledWith('/auth/password/change/request', undefined, { timeout: 30000 });
  expect(clients.publicPost).not.toHaveBeenCalled();
  await passwordService.request('forgot', 'customer@example.com');
  expect(clients.publicPost).toHaveBeenCalledWith('/auth/password/forgot/request', { email: 'customer@example.com' }, { timeout: 30000 });
});
it('submits proof to verification and completion without placing it in URLs', async () => {
  await passwordService.verify('forgot', 'challenge', '123456');
  await passwordService.complete('forgot', 'one-time-proof', 'NewPass@123', 'NewPass@123');
  expect(clients.publicPost).toHaveBeenCalledWith('/auth/password/forgot/verify', { challengeId: 'challenge', otp: '123456' });
  expect(clients.publicPost).toHaveBeenCalledWith('/auth/password/forgot/complete', { resetToken: 'one-time-proof', newPassword: 'NewPass@123', confirmPassword: 'NewPass@123' });
});
it('binds in-memory proof to the owner, expires it and never writes it to web storage', () => {
  const local = vi.spyOn(Storage.prototype, 'setItem');
  rememberPasswordGrant({ resetToken: 'proof', expiresIn: 300 }, 'change', 'customer-a');
  expect(getPasswordGrant('customer-a').purpose).toBe('change');
  expect(getPasswordGrant('customer-b')).toBeNull();
  expect(local).not.toHaveBeenCalled();
  vi.useFakeTimers();
  try {
    rememberPasswordGrant({ resetToken: 'proof', expiresIn: 300 }, 'forgot');
    vi.advanceTimersByTime(300001); expect(getPasswordGrant()).toBeNull();
  } finally { vi.useRealTimers(); local.mockRestore(); }
});
it('validates confirmation and bcrypt UTF-8 length without silently truncating passwords', () => {
  expect(passwordValidation('short', 'short')).toContain('8');
  expect(passwordValidation('NewPass@123', 'Other@123')).toContain('chưa khớp');
  expect(passwordValidation('ế'.repeat(25), 'ế'.repeat(25))).toContain('72 byte');
  expect(passwordValidation('NewPass@123', 'NewPass@123')).toBe('');
});
