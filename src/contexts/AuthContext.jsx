import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authService } from '@/services/auth/authService';
import { getSession, setSession } from '@/services/api';
import { hasRole, STAFF_ROLES } from '@/lib/permissions';
import { disablePush, revokeLocalPush } from '@/services/pushNotifications';
import { DEMO_MODE } from '@/services/api';

const AuthContext = createContext(null);
function restoreSession() {
  const session = getSession();
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
  async function login(values) {
    const next = { ...await authService.login(values), sessionId: crypto.randomUUID() };
    setSession(next); updateSession(next);
    return next.user;
  }
  async function logout() {
    if (!DEMO_MODE && hasRole(session?.user, 'ADMIN', 'WAREHOUSE_STAFF')) {
      try { await disablePush(session.user, false); }
      catch { toast.error('Chưa gỡ hoàn toàn thông báo trên thiết bị. Kiểm tra kết nối trước khi dùng máy chung.'); }
    }
    try { await authService.logout(); }
    finally { setSession(null); updateSession(null); }
  }
  const user = session?.user;
  const isAdmin = hasRole(user, 'ADMIN');
  function updateProfile(profile) {
    updateSession((old) => {
      if (!old) return old;
      const next = { ...old, user: { ...old.user, fullName: profile.fullName, email: profile.email, phoneNumber: profile.phoneNumber, avatarUrl: profile.avatarUrl } };
      setSession(next); return next;
    });
  }
  return <AuthContext.Provider value={{ user, isAdmin, isStaff: hasRole(user, ...STAFF_ROLES), login, logout, updateProfile }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
