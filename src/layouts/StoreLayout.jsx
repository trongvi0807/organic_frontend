import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, UserRound, ShoppingBag, Menu, ArrowRight, Leaf, X } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { StoreFooter } from '@/components/layout/StoreFooter';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { HomeProvider, useHome } from '@/contexts/HomeContext';
import { dashboardPath } from '@/lib/permissions';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { shoppingReturn, validShoppingReturn } from '@/lib/shoppingReturn';

export function StoreLayout() {
  return <HomeProvider><StoreContent /></HomeProvider>;
}

function StoreContent() {
  const { user } = useAuth();
  const { data: home } = useHome();
  const content = home?.content;
  const { cart } = useShop();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const links = [{ to: '/', label: 'Trang chủ', end: true }, { to: '/san-pham', label: 'Sản phẩm' }, { to: '/ve-cua-hang', label: 'Về cửa hàng' }, { to: '/diem-noi-bat', label: 'Điểm nổi bật' }];
  return <>
    <a href="#main-content" className="skip-link">Bỏ qua đến nội dung</a>
    <div className="announcement"><span><Leaf size={12} /> Một chút xanh, một đời lành.</span><span>Khám phá sản phẩm và nguồn gốc được công bố <ArrowRight size={12} /></span></div>
    <header className="store-header"><div className="container header-inner"><Logo /><nav aria-label="Điều hướng chính">{links.map((link) => link.to.includes('#') ? <a key={link.to} href={link.to}>{link.label}</a> : <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>)}</nav><div className="header-actions"><NotificationBell /><button className="icon-button" aria-label="Tìm sản phẩm" onClick={() => setSearchOpen(true)}><Search size={20} /></button><Link className="account-link" to={user ? dashboardPath(user) : '/dang-nhap'} aria-label={user ? 'Tài khoản của bạn' : 'Đăng nhập'}><UserRound size={20} /><span>{user ? user.fullName?.split(' ').at(-1) || user.username : 'Tài khoản'}</span></Link><button className="icon-button cart-toggle" onClick={() => { setMobileOpen(false); navigate('/gio-hang', { state: { shoppingReturn: location.pathname === '/' || location.pathname.startsWith('/san-pham') ? validShoppingReturn({ to: location.pathname + location.search + location.hash, y: window.scrollY }) : shoppingReturn() } }); }} aria-label={`Giỏ hàng, ${cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm`}><ShoppingBag size={20} /><span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></button><button className="icon-button mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Mở menu" aria-expanded={mobileOpen}>{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button></div></div>{mobileOpen && <nav className="mobile-nav" aria-label="Menu di động">{links.map((link) => <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>{link.label}</Link>)}<Link to={user ? dashboardPath(user) : '/dang-nhap'} onClick={() => setMobileOpen(false)}>Tài khoản</Link></nav>}</header>
    <main id="main-content"><Outlet /></main>
    <StoreFooter content={content} user={user} />
    <Modal open={searchOpen} onOpenChange={setSearchOpen} title="Bạn đang tìm điều tươi lành nào?" description="Tìm theo tên sản phẩm hoặc mã sản phẩm."><form className="search-modal-form" onSubmit={(event) => { event.preventDefault(); navigate(`/san-pham?q=${encodeURIComponent(new FormData(event.currentTarget).get('query'))}`); setSearchOpen(false); }}><input className="input" name="query" placeholder="Bơ sáp, rau củ, trà thảo mộc…" autoFocus required /><Button type="submit"><Search size={17} />Tìm kiếm</Button></form></Modal>
  </>;
}
