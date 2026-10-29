import axios from 'axios';
import { clearRetiredBusinessStorage } from '@/lib/retiredBusinessStorage';

clearRetiredBusinessStorage();

const runtime = typeof window === 'undefined' ? {} : window.__MOC_CONFIG__ || {};
// Business screens always use persisted service data. Kept as a compatibility export
// while the old isolated fixtures are removed; environment flags cannot enable them.
export const DEMO_MODE = false;
export const SESSION_KEY = 'moc.session';
export const api = axios.create({ baseURL: runtime.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || '/api/v1', timeout: 15000, headers: { 'Content-Type': 'application/json' } });
// Home is public: expired tokens must not log visitors out or block the homepage.
export const publicApi = axios.create({ baseURL: api.defaults.baseURL, timeout: 15000 });
// Tokens stay in sessionStorage. Backend remains the authority for all permissions.
export const getSession = () => {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; } catch { return null; }
};
export const setSession = (session) => {
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
};
api.interceptors.request.use((config) => {
  const token = getSession()?.accessToken;
  config._sessionOwner ??= getSession()?.user?.username;
  config._sessionId ??= getSession()?.sessionId;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
let refreshFlight;
export async function refreshSession() {
  const current = getSession();
  if (!current?.refreshToken) throw new Error('Phiên đăng nhập đã hết hạn.');
  if (!refreshFlight) {
    const pending = (async () => {
      const result = unwrap(await publicApi.post('/auth/refresh-token', { refreshToken: current.refreshToken }));
      if (!result?.accessToken || !result.refreshToken) throw new Error('Phản hồi làm mới phiên không hợp lệ.');
      if (getSession()?.accessToken !== current.accessToken) throw new Error('Tài khoản hoặc phiên đăng nhập đã thay đổi.');
      const next = { ...current, ...result };
      setSession(next);
      window.dispatchEvent(new Event('moc:session-refreshed'));
      return next;
    })();
    refreshFlight = pending;
    pending.finally(() => { if (refreshFlight === pending) refreshFlight = null; }).catch(() => {});
  }
  return refreshFlight;
}
api.interceptors.response.use((response) => response, async (error) => {
  const config = error.config;
  if (error.response?.status !== 401 || !config || config.url?.startsWith('/auth/')) throw error;
  const current = getSession();
  const sentToken = config.headers?.Authorization?.replace(/^Bearer /, '');
  try {
    if (config._sessionRetried || !current?.accessToken || (config._sessionOwner && config._sessionOwner !== current.user?.username) || (config._sessionId && config._sessionId !== current.sessionId)) throw error;
    config._sessionRetried = true;
    // A parallel request may already have refreshed this session.
    if (sentToken === current.accessToken) await refreshSession();
  } catch (failure) {
    const invalidSession = !current?.refreshToken || config._sessionRetried && failure === error || [400,401,403].includes(failure.response?.status);
    if (invalidSession && getSession()?.accessToken === current?.accessToken && (!config._sessionOwner || config._sessionOwner === current?.user?.username) && (!config._sessionId || config._sessionId === current?.sessionId)) {
      setSession(null);
      window.dispatchEvent(new Event('moc:session-expired'));
    }
    throw failure;
  }
  return api.request(config);
});
export const unwrap = (response) => response.data.data;
export default api;
