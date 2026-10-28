import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, ArrowRight, Leaf, X } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { StoreFooter } from '@/components/layout/StoreFooter';
import { useAuth } from '@/contexts/AuthContext';
import { HomeProvider, useHome } from '@/contexts/HomeContext';
import { dashboardPath } from '@/lib/permissions';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { StoreSearch } from '@/components/layout/StoreSearch';
import { StoreAccountMenu } from '@/components/layout/StoreAccountMenu';
import { StoreCartButton } from '@/components/layout/StoreCartButton';
import { shoppingReturn, validShoppingReturn } from '@/lib/shoppingReturn';

export function StoreLayout() {
  return <HomeProvider><StoreContent /></HomeProvider>;
}
function StoreContent() {
  const { user } = useAuth(), { data: home } = useHome(), content = home?.content;
  const [mobileOpen, setMobileOpen] = useState(false), [searchExpanded, setSearchExpanded] = useState(false);
  const navigate = useNavigate(), location = useLocation();
  const links = [{ to: '/', label: 'Trang chủ', end: true }, { to: '/san-pham', label: 'Sản phẩm' }, { to: '/ve-cua-hang', label: 'Về cửa hàng' }, { to: '/diem-noi-bat', label: 'Điểm nổi bật' }];
  function cart() { setMobileOpen(false); navigate('/gio-hang', { state: { shoppingReturn: location.pathname === '/' || location.pathname.startsWith('/san-pham') ? validShoppingReturn({ to: location.pathname + location.search + location.hash, y: window.scrollY }) : shoppingReturn() } }); }
  return <>
    <a href="#main-content" className="skip-link">Bỏ qua đến nội dung</a>
    <div className="announcement"><span><Leaf size={12} /> Một chút xanh, một đời lành.</span><span>Khám phá sản phẩm và nguồn gốc được công bố <ArrowRight size={12} /></span></div>
    <header className={`store-header ${searchExpanded ? 'is-searching' : ''}`}><div className="container header-inner"><Logo /><nav className="store-primary-nav" aria-label="Điều hướng chính">{links.map((link) => <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>)}</nav><div className="header-actions"><NotificationBell storefront /><StoreSearch onExpandedChange={setSearchExpanded} /><StoreAccountMenu /><StoreCartButton onClick={cart} /><button type="button" className="icon-button mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Mở menu" aria-expanded={mobileOpen}>{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button></div></div>{mobileOpen && <nav className="mobile-nav" aria-label="Menu di động">{links.map((link) => <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>{link.label}</Link>)}<Link to={user ? dashboardPath(user) : '/dang-nhap'} onClick={() => setMobileOpen(false)}>Tài khoản</Link>{!user && <Link to="/dang-ky" onClick={() => setMobileOpen(false)}>Đăng ký</Link>}</nav>}</header>
    <main id="main-content"><Outlet /></main>
    <StoreFooter content={content} user={user} />
  </>;
}
