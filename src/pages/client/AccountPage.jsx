import { Link } from 'react-router-dom';
import { UserRound, LogOut, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountPage() {
  const { user, isAdmin } = useAuth();
  return <div className="container account-page"><span className="auth-leaf"><UserRound size={27} /></span><span className="eyebrow">BẠN CỦA MỘC</span><h1>Xin chào, {user.fullName || user.username}.</h1><p>Một ngày thật xanh bắt đầu từ những điều giản dị.</p><div className="account-details"><div><span>Tên đăng nhập</span><strong>{user.username}</strong></div><div><span>Email</span><strong>{user.email || 'Chưa cung cấp'}</strong></div><div><span>Vai trò</span><strong>{isAdmin ? 'Quản trị viên' : 'Khách hàng'}</strong></div></div><div className="account-links"><Link to={isAdmin ? '/admin/products' : '/san-pham'} className="hero-cta">{isAdmin ? 'Trang quản trị' : 'Khám phá sản phẩm'} <ArrowUpRight size={17} /></Link><Link className="text-link" to="/dang-xuat"><LogOut size={16} />Đăng xuất</Link></div></div>;
}
