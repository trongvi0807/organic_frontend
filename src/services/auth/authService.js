import api, { publicApi, DEMO_MODE, unwrap, refreshSession } from '../api';

export const authService = {
  refresh: refreshSession,
  async login(values) {
    return unwrap(await publicApi.post('/auth/login', { username: values.username, password: values.password, rememberMe: values.rememberMe === true }));
  },
  async register(values) {
    if (DEMO_MODE) throw new Error('Chức năng đăng ký hiện chưa sẵn sàng. Vui lòng thử lại sau.');
    const payload = Object.fromEntries(['username','password','confirmPassword','fullName','phoneNumber','email'].map(key => [key,values[key]]));
    return unwrap(await publicApi.post('/auth/register', payload));
  },
  async verifyOtp(values) { return unwrap(await publicApi.post('/auth/verify-otp', { email:values.email, otp:values.otp })); },
  async resendOtp(email) { return unwrap(await publicApi.post('/auth/resend-otp', { email })); },
  async logout() { if (!DEMO_MODE) await api.post('/auth/logout'); },
};
