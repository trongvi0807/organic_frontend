import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { authService } from '@/services/auth/authService';
import { getSession, setSession } from '@/services/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, updateSession] = useState(getSession);
  useEffect(() => {
    const expired = () => { updateSession(null); toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'); };
    window.addEventListener('moc:session-expired', expired);
    return () => window.removeEventListener('moc:session-expired', expired);
  }, []);
  async function login(values) {
    const next = await authService.login(values);
    setSession(next); updateSession(next);
    return next.user;
  }
  async function logout() {
    try { await authService.logout(); }
    finally { setSession(null); updateSession(null); }
  }
  const user = session?.user;
  const isAdmin = user?.roles?.some((role) => role === 'ADMIN' || role === 'ROLE_ADMIN') || false;
  return <AuthContext.Provider value={{ user, isAdmin, login, logout }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
