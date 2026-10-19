import api, { DEMO_MODE, unwrap } from '../api';
import { DEMO_ACCOUNTS } from '@/constants/demo';

export const authService = {
  async login(values) {
    if (!DEMO_MODE) return unwrap(await api.post('/auth/login', values));
    const account = DEMO_ACCOUNTS.find((user) => user.username === values.username && user.password === values.password);
    if (!account) throw new Error('Tài khoản mẫu hoặc mật khẩu không đúng.');
    return { accessToken: 'demo-only', user: { username: account.username, fullName: account.fullName, roles: account.roles } };
  },
  async register(values) {
    if (DEMO_MODE) throw new Error('Đăng ký và gửi OTP cần backend thật. Vui lòng dùng tài khoản mẫu bên dưới.');
    return unwrap(await api.post('/auth/register', values));
  },
  async verifyOtp(values) { return unwrap(await api.post('/auth/verify-otp', values)); },
  async resendOtp(email) { return unwrap(await api.post('/auth/resend-otp', { email })); },
  async logout() { if (!DEMO_MODE) await api.post('/auth/logout'); },
};
