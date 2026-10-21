import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldX } from 'lucide-react';
import { hasRole } from '@/lib/permissions';

export function ProtectedRoute({ admin = false, roles }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/dang-nhap" state={{ from: location.pathname + location.search }} replace />;
  if ((admin && !isAdmin) || (roles && !hasRole(user, ...roles))) return <div className="access-denied"><ShieldX size={45} /><h1>Bạn chưa có quyền truy cập</h1><p>Tài khoản hiện tại chưa có quyền sử dụng chức năng này.</p><Link to="/" className="hero-cta">Về trang chủ</Link><Link to="/dang-xuat">Đổi tài khoản</Link></div>;
  return <Outlet />;
}
