import { Link } from 'react-router-dom';
import { UserRound, LogOut, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole, dashboardPath } from '@/lib/permissions';
import { DEMO_MODE } from '@/services/api';
import { ProfilePanel } from '@/components/customers/ProfilePanel';

export default function AccountPage() {
  const { user, isStaff } = useAuth();
  return <div className="container account-page"><span className="eyebrow">TÀI KHOẢN CỦA BẠN</span><h1>Xin chào, {user.fullName || user.username}.</h1><p>Cập nhật thông tin cá nhân và địa chỉ nhận hàng của bạn.</p>{hasRole(user, 'CUSTOMER') && !DEMO_MODE ? <ProfilePanel self /> : <><span className="auth-leaf"><UserRound size={27} /></span><div className="account-details"><div><span>Tên đăng nhập</span><strong>{user.username}</strong></div><div><span>Email</span><strong>{user.email || 'Chưa cung cấp'}</strong></div><div><span>Vai trò</span><strong>{user.roles?.join(', ')}</strong></div></div>{DEMO_MODE && <p className="form-note">Cập nhật hồ sơ, ảnh và địa chỉ cần kết nối API thật.</p>}</>}<div className="account-links"><Link to={isStaff ? dashboardPath(user) : '/san-pham'} className="hero-cta">{isStaff ? 'Không gian quản lý' : 'Khám phá sản phẩm'} <ArrowUpRight size={17} /></Link><Link className="text-link" to="/dang-xuat"><LogOut size={16} />Đăng xuất</Link></div></div>;
}
