import api, { publicApi, unwrap } from '../api';

const client = purpose => purpose === 'change' ? api : publicApi;
export const passwordService = {
  request: async (purpose, email) => ({ ...unwrap(await client(purpose).post(`/auth/password/${purpose}/request`, purpose === 'change' ? undefined : { email }, { timeout: 30000 })), requestedAt: Date.now() }),
  verify: async (purpose, challengeId, otp) => unwrap(await client(purpose).post(`/auth/password/${purpose}/verify`, { challengeId, otp })),
  complete: async (purpose, resetToken, newPassword, confirmPassword) => unwrap(await client(purpose).post(`/auth/password/${purpose}/complete`, { resetToken, newPassword, confirmPassword })),
};

// Proof stays in memory: never in a URL, localStorage, or browser history.
let grant;
export function rememberPasswordGrant(result, purpose, owner) {
  if (!result?.resetToken || !Number.isFinite(result.expiresIn) || result.expiresIn <= 0) throw new Error('Chưa nhận được quyền đổi mật khẩu. Vui lòng xác thực lại.');
  grant = { token: result.resetToken, purpose, owner: owner || null, expiresAt: Date.now() + result.expiresIn * 1000 };
}
export function getPasswordGrant(owner) {
  if (!grant || grant.expiresAt <= Date.now() || grant.owner !== (owner || null)) { grant = null; return null; }
  return grant;
}
export function clearPasswordGrant() { grant = null; }
export function passwordValidation(password, confirmation) {
  if (password.trim().length === 0 || password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.';
  if (new TextEncoder().encode(password).length > 72) return 'Mật khẩu tối đa 72 byte; vui lòng giảm độ dài hoặc số ký tự có dấu.';
  if (password !== confirmation) return 'Mật khẩu xác nhận chưa khớp.';
  return '';
}
