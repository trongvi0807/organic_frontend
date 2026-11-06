import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authService } from '@/services/auth/authService';
import { api, unwrap, getSession, setSession } from '@/services/api';
import { hasRole, can, STAFF_ROLES } from '@/lib/permissions';
import { disablePush, revokeLocalPush } from '@/services/pushNotifications';
import { DEMO_MODE } from '@/services/api';

const AuthContext = createContext(null);
function restoreSession() {
  const session = getSession();
  if (session?.accessToken === 'demo-only') { setSession(null); return null; }
  if (session && !session.sessionId) { session.sessionId = crypto.randomUUID(); setSession(session); }
  return session;
}
export function AuthProvider({ children }) {
  const [session, updateSession] = useState(restoreSession);
  useEffect(() => {
    const expired = () => { updateSession(null); revokeLocalPush().catch(() => toast.error('Chưa thu hồi được thông báo trên thiết bị. Kiểm tra kết nối mạng.')); toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'); };
    window.addEventListener('moc:session-expired', expired);
    const refreshed = () => updateSession(getSession());
    window.addEventListener('moc:session-refreshed', refreshed);
    return () => { window.removeEventListener('moc:session-expired', expired); window.removeEventListener('moc:session-refreshed', refreshed); };
  }, []);
  useEffect(() => {
    if (!session?.sessionId) return;
    let active = true, pending = false;
    const sessionId = session.sessionId;
    async function synchronize() {
      if (pending || document.visibilityState === 'hidden') return;
      pending = true;
      try {
        const profile = unwrap(await api.get('/auth/session'));
        const current = getSession();
        if (!active || current?.sessionId !== sessionId || !Array.isArray(profile?.roles)) return;
        if (JSON.stringify(current.user) !== JSON.stringify(profile)) {
          const next = { ...current, user: profile };
          setSession(next); updateSession(next);
        }
      } catch { /* Connection failures keep the session; protected requests still enforce current rights. */ }
      finally { pending = false; }
    }
    synchronize();
    const timer = setInterval(synchronize, 60000);
    window.addEventListener('focus', synchronize);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', synchronize); };
  }, [session?.sessionId]);
  function finishLogin(result) {
    if (!result?.accessToken || !result.refreshToken || !result.user?.username || !Array.isArray(result.user.roles)) throw new Error('Chưa nhận đủ thông tin đăng nhập. Vui lòng thử lại.');
    const next = { ...result, sessionId: crypto.randomUUID() };
    setSession(next); updateSession(next);
    return next.user;
  }
  async function login(values) { return finishLogin(await authService.login(values)); }
  async function logout() {
    if (!DEMO_MODE && session?.user) {
      try { await disablePush(session.user, false); }
      catch { toast.error('Chưa gỡ hoàn toàn thông báo trên thiết bị. Kiểm tra kết nối trước khi dùng máy chung.'); }
    }
    try { await authService.logout(); }
    finally { setSession(null); updateSession(null); }
  }
  function clearSession() {
    setSession(null); updateSession(null);
    revokeLocalPush().catch(() => {});
  }
  const user = session?.user;
  const isAdmin = hasRole(user, 'ADMIN');
  function updateProfile(profile) {
    updateSession((old) => {
      if (!old) return old;
      const next = { ...old, user: { ...old.user, fullName: profile.fullName, email: profile.email, phoneNumber: profile.phoneNumber, avatarUrl: profile.avatarUrl, profileCompletionRequired: !profile.phoneNumber?.trim() } };
      setSession(next); return next;
    });
  }
  return <AuthContext.Provider value={{ user, isAdmin, isStaff: hasRole(user, ...STAFF_ROLES), login, finishLogin, logout, clearSession, updateProfile }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
