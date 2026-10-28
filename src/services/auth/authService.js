import api, { publicApi, DEMO_MODE, unwrap, refreshSession } from '../api';
import { DEMO_ACCOUNTS } from '@/constants/demo';

export const authService = {
  refresh: refreshSession,
  async login(values) {
    if (!DEMO_MODE) return unwrap(await publicApi.post('/auth/login', { username: values.username, password: values.password, rememberMe: values.rememberMe === true }));
    const account = DEMO_ACCOUNTS.find((user) => user.username === values.username && user.password === values.password);
    if (!account) throw new Error('Tài khoản mẫu hoặc mật khẩu không đúng.');
    return { accessToken: 'demo-only', user: { username: account.username, fullName: account.fullName, roles: account.roles } };
  },
  async register(values) {
    if (DEMO_MODE) throw new Error('Đăng ký và gửi OTP cần backend thật. Vui lòng dùng tài khoản mẫu bên dưới.');
    const payload = Object.fromEntries(['username','password','confirmPassword','fullName','phoneNumber','email'].map(key => [key,values[key]]));
    return unwrap(await publicApi.post('/auth/register', payload));
  },
  async verifyOtp(values) { return unwrap(await publicApi.post('/auth/verify-otp', { email:values.email, otp:values.otp })); },
  async resendOtp(email) { return unwrap(await publicApi.post('/auth/resend-otp', { email })); },
  async logout() { if (!DEMO_MODE) await api.post('/auth/logout'); },
};
