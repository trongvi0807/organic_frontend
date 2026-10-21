import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Search, UserRound, ShoppingBag, Menu, ArrowRight, Leaf, X, Plus, Minus, Trash2 } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { currency } from '@/lib/utils';
import { HomeProvider, useHome } from '@/contexts/HomeContext';
import { dashboardPath } from '@/lib/permissions';

export function StoreLayout() {
  return <HomeProvider><StoreContent /></HomeProvider>;
}

function StoreFooter({ content, user }) {
  return <footer className="store-footer"><div className="container footer-grid"><div><Logo light /><p>{content?.introduction || 'Khám phá thông tin sản phẩm từ cửa hàng.'}</p></div><div><h3>Khám phá cửa hàng</h3><Link to="/san-pham">Sản phẩm</Link><Link to="/#cau-chuyen">Về cửa hàng</Link></div><div><h3>Tài khoản</h3><Link to="/tai-khoan">Tài khoản của bạn</Link><Link to="/dang-ky">Trở thành thành viên</Link><Link to={user ? dashboardPath(user) : '/dang-nhap'}>Không gian quản lý</Link></div><div className="footer-contact"><h3>Liên hệ</h3>{content?.contactEmail && <a href={`mailto:${content.contactEmail}`}>{content.contactEmail}</a>}{content?.contactPhone && <a href={`tel:${content.contactPhone}`}>{content.contactPhone}</a>}{content?.contactAddress && <p>{content.contactAddress}</p>}{content?.openingHours && <p>Giờ mở cửa: {content.openingHours}</p>}</div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} {content?.siteName || 'Mộc Organic'}.</span><span>Thông tin cửa hàng và sản phẩm <Leaf size={12} /></span></div></footer>;
}
function StoreContent() {
  const { user } = useAuth();
  const { data: home } = useHome();
  const content = home?.content;
  const { cart, updateQuantity, removeFromCart } = useShop();
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const links = [{ to: '/', label: 'Trang chủ', end: true }, { to: '/san-pham', label: 'Sản phẩm' }, { to: '/#cau-chuyen', label: 'Về cửa hàng' }, ...(content?.highlights?.length ? [{ to: '/#song-xanh', label: 'Điểm nổi bật' }] : [])];
  const total = cart.reduce((sum, item) => sum + item.minPrice * item.quantity, 0);
  return <>
    <a href="#main-content" className="skip-link">Bỏ qua đến nội dung</a>
    <div className="announcement"><span><Leaf size={12} /> Một chút xanh, một đời lành.</span><span>Khám phá sản phẩm và nguồn gốc được công bố <ArrowRight size={12} /></span></div>
    <header className="store-header"><div className="container header-inner"><Logo /><nav aria-label="Điều hướng chính">{links.map((link) => link.to.includes('#') ? <a key={link.to} href={link.to}>{link.label}</a> : <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>)}</nav><div className="header-actions"><button className="icon-button" aria-label="Tìm sản phẩm" onClick={() => setSearchOpen(true)}><Search size={20} /></button><Link className="account-link" to={user ? dashboardPath(user) : '/dang-nhap'} aria-label={user ? 'Tài khoản của bạn' : 'Đăng nhập'}><UserRound size={20} /><span>{user ? user.fullName?.split(' ').at(-1) || user.username : 'Tài khoản'}</span></Link><button className="icon-button cart-toggle" onClick={() => setCartOpen(true)} aria-label={`Giỏ hàng, ${cart.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm`}><ShoppingBag size={20} /><span>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span></button><button className="icon-button mobile-menu-toggle" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Mở menu" aria-expanded={mobileOpen}>{mobileOpen ? <X size={21} /> : <Menu size={21} />}</button></div></div>{mobileOpen && <nav className="mobile-nav" aria-label="Menu di động">{links.map((link) => <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>{link.label}</Link>)}<Link to={user ? dashboardPath(user) : '/dang-nhap'} onClick={() => setMobileOpen(false)}>Tài khoản</Link></nav>}</header>
    <main id="main-content"><Outlet /></main>
    <StoreFooter content={content} user={user} />
    <Modal open={searchOpen} onOpenChange={setSearchOpen} title="Bạn đang tìm điều tươi lành nào?" description="Tìm theo tên sản phẩm hoặc mã sản phẩm."><form className="search-modal-form" onSubmit={(event) => { event.preventDefault(); navigate(`/san-pham?q=${encodeURIComponent(new FormData(event.currentTarget).get('query'))}`); setSearchOpen(false); }}><input className="input" name="query" placeholder="Bơ sáp, rau củ, trà thảo mộc…" autoFocus required /><Button type="submit"><Search size={17} />Tìm kiếm</Button></form></Modal>
    <Modal open={cartOpen} onOpenChange={setCartOpen} title="Giỏ hàng của bạn" description="Những lựa chọn tươi lành đang đợi bạn." className="cart-modal">{cart.length ? <><div className="cart-items">{cart.map((item) => <div className="cart-item" key={item.id}><img src={item.imageUrl || '/images/vegetables.jpg'} alt={item.productName} /><div><strong>{item.productName}</strong><p>{currency(item.minPrice)}</p><div className="quantity-control"><button onClick={() => updateQuantity(item.id, -1)} aria-label={`Giảm ${item.productName}`}><Minus size={13} /></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} disabled={item.quantity >= (item.stock ?? 99)} aria-label={`Tăng ${item.productName}`}><Plus size={13} /></button></div></div><button className="icon-button" onClick={() => removeFromCart(item.id)} aria-label={`Xóa ${item.productName} khỏi giỏ`}><Trash2 size={17} /></button></div>)}</div><div className="cart-total"><span>Tạm tính</span><strong>{currency(total)}</strong></div><p className="cart-note">Giá tạm tính theo sản phẩm bạn đã chọn trên trình duyệt.</p><p className="form-note">Giỏ hàng lưu trên trình duyệt. Chức năng đặt hàng sẽ được kết nối khi backend có API đơn hàng.</p><Button className="w-full" onClick={() => { setCartOpen(false); navigate('/san-pham'); }}>Tiếp tục chọn sản phẩm <ArrowRight size={16} /></Button></> : <div className="empty-cart"><ShoppingBag size={42} strokeWidth={1} /><h3>Giỏ hàng đang chờ những điều lành</h3><p>Cùng chọn một chút tươi ngon cho hôm nay.</p><Button onClick={() => { setCartOpen(false); navigate('/san-pham'); }}>Khám phá sản phẩm <ArrowRight size={16} /></Button></div>}</Modal>
  </>;
}
