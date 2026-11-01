import { Link, useLocation } from 'react-router-dom';
import { UserRound, LogOut, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hasRole, dashboardPath } from '@/lib/permissions';
import { DEMO_MODE } from '@/services/api';
import { ProfilePanel } from '@/components/customers/ProfilePanel';
import { CommerceHeader } from '@/components/checkout/OrderUI';
import { GoogleAccountLink } from '@/components/auth/GoogleAccountLink';
import { loginReturnPath } from '@/lib/loginReturn';

export default function AccountPage() {
  const { user, isStaff } = useAuth();
  const { state } = useLocation();
  const profileReturnTo = state?.profileReturnTo ? loginReturnPath(user, state.profileReturnTo) : null;
  return <div className="container account-page">{hasRole(user, 'CUSTOMER') && <CommerceHeader title="Không gian của bạn" />}<span className="eyebrow">TÀI KHOẢN CỦA BẠN</span><h1>Xin chào, {user.fullName || user.username}.</h1><p>Cập nhật thông tin cá nhân và địa chỉ nhận hàng của bạn.</p>{user.profileCompletionRequired && <p role="status" className="!my-5 rounded-xl bg-amber-50 p-4 text-sm leading-7 text-amber-900">Bổ sung họ tên và số điện thoại trong hồ sơ trước khi đặt hàng.</p>}{profileReturnTo && profileReturnTo !== '/tai-khoan' && !user.profileCompletionRequired && <Link className="!my-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm !text-white" to={profileReturnTo}>Tiếp tục thao tác trước đó <ArrowUpRight size={16} className="!ml-2" /></Link>}{hasRole(user, 'CUSTOMER') && !DEMO_MODE ? <ProfilePanel self /> : <><span className="auth-leaf"><UserRound size={27} /></span><div className="account-details"><div><span>Tên đăng nhập</span><strong>{user.username}</strong></div><div><span>Email</span><strong>{user.email || 'Chưa cung cấp'}</strong></div><div><span>Vai trò</span><strong>{user.roles?.join(', ')}</strong></div></div>{DEMO_MODE && <p className="form-note">Chức năng cập nhật hồ sơ hiện chưa sẵn sàng. Vui lòng thử lại sau.</p>}</>}<GoogleAccountLink /><div className="account-links"><Link to={isStaff ? dashboardPath(user) : '/san-pham'} className="hero-cta">{isStaff ? 'Không gian quản lý' : 'Khám phá sản phẩm'} <ArrowUpRight size={17} /></Link><Link className="text-link" to="/dang-xuat"><LogOut size={16} />Đăng xuất</Link></div></div>;
}
