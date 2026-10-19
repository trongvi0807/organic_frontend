import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldX } from 'lucide-react';

export function ProtectedRoute({ admin = false }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/dang-nhap" state={{ from: location.pathname + location.search }} replace />;
  if (admin && !isAdmin) return <div className="access-denied"><ShieldX size={45} /><h1>Khu vực dành cho quản trị viên</h1><p>Tài khoản hiện tại chưa có quyền truy cập trang này.</p><Link to="/" className="hero-cta">Về trang chủ</Link><Link to="/dang-xuat">Đổi tài khoản</Link></div>;
  return <Outlet />;
}
