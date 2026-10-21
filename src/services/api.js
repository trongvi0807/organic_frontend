import axios from 'axios';

const runtime = typeof window === 'undefined' ? {} : window.__MOC_CONFIG__ || {};
export const DEMO_MODE = (runtime.VITE_DEMO_MODE ?? import.meta.env.VITE_DEMO_MODE) === 'true';
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
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  if (error.response?.status === 401 && !error.config?.url?.startsWith('/auth/')) {
    setSession(null);
    window.dispatchEvent(new Event('moc:session-expired'));
  }
  return Promise.reject(error);
});
export const unwrap = (response) => response.data.data;
export default api;
