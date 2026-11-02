import { NavLink } from 'react-router-dom';
import { Heart, MessageCircle, Package, RotateCcw, Star, TicketPercent, UserRound } from 'lucide-react';
import { useShop } from '@/contexts/ShopContext';
import '@/styles/customer-account.css';

const links = [
  ['/tai-khoan', 'Tài khoản', UserRound],
  ['/don-hang', 'Đơn hàng', Package],
  ['/diem-thuong', 'Điểm thưởng', TicketPercent],
  ['/yeu-thich', 'Sản phẩm yêu thích', Heart],
  ['/danh-gia-cua-toi', 'Đánh giá của tôi', Star],
  ['/phan-hoi', 'Phản hồi & hỗ trợ', MessageCircle],
  ['/doi-tra', 'Đổi trả', RotateCcw],
];

export function CustomerAccountNav() {
  const { favorites } = useShop();
  return <nav className="customer-account-nav" aria-label="Không gian tài khoản">
    {links.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/tai-khoan'}
      className={({ isActive }) => `customer-account-link${isActive ? ' is-active' : ''}`}>
      <Icon size={18} aria-hidden="true" /><span>{label}</span>
      {to === '/yeu-thich' && favorites.length > 0 && <span className="customer-account-count">{favorites.length}</span>}
    </NavLink>)}
  </nav>;
}
