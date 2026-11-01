import api, { publicApi, unwrap } from '../api';

const cookies = { withCredentials: true };
let sdkFlight, challengeQueue = Promise.resolve();

export function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (sdkFlight) return sdkFlight;
  sdkFlight = new Promise((resolve, reject) => {
    let settled = false;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    const timer = setTimeout(() => fail(), 20000);
    function fail() {
      if (settled) return;
      settled = true;
      clearTimeout(timer); script.remove(); sdkFlight = null;
      reject(new Error('Chưa tải được nút Google. Kiểm tra kết nối rồi thử lại.'));
    }
    script.onerror = fail;
    script.onload = () => {
      if (settled) return;
      clearTimeout(timer);
      if (!window.google?.accounts?.id) { fail(); return; }
      settled = true;
      resolve(window.google.accounts.id);
    };
    document.head.append(script);
  });
  return sdkFlight;
}

export const googleAuthService = {
  // Serialize challenge creation: an older mount must not overwrite the current
  // HttpOnly nonce cookie after a React StrictMode remount or mode change.
  challenge(mode, isActive = () => true) {
    const pending = challengeQueue.catch(() => {}).then(async () => {
      if (!isActive()) return null;
      const client = mode === 'link' ? api : publicApi;
      const suffix = mode === 'link' ? '/link/challenge' : '/challenge';
      return unwrap(await client.post(`/auth/google${suffix}`, undefined, cookies));
    });
    challengeQueue = pending.catch(() => {});
    return pending;
  },
  async login(credential, rememberMe) {
    return unwrap(await publicApi.post('/auth/google', { credential, rememberMe: rememberMe === true }, cookies));
  },
  async link(credential, currentPassword) {
    return unwrap(await api.post('/auth/google/link', { credential, currentPassword: currentPassword || null }, cookies));
  },
};
