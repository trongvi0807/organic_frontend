import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Package, Shapes, ArrowUpRight, LogOut, Menu, X, Leaf, ChevronRight, CircleHelp, Users, Truck, MapPin, ShieldCheck, Link2, Home } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_MODE } from '@/services/api';
import { hasRole, mayRead } from '@/lib/permissions';

export function AdminLayout() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  const sidebarRef = useRef(null);
  const menuRef = useRef(null);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => { setMobile(media.matches); if (!media.matches) setOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!mobile || !open) return;
    const sidebar = sidebarRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () => [...sidebar.querySelectorAll('a[href], button:not([disabled])')];
    const frame = requestAnimationFrame(() => controls()[0]?.focus());
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
      if (event.key !== 'Tab') return;
      const items = controls(), first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    sidebar.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      sidebar.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (window.matchMedia('(max-width: 640px)').matches) menuRef.current?.focus();
    };
  }, [mobile, open]);
  const { pathname } = useLocation();
  const links = [
    { path: 'home', name: 'Trang chủ', icon: Home, visible: isAdmin },
    { path: 'products', name: 'Sản phẩm', icon: Package, visible: isAdmin },
    { path: 'categories', name: 'Loại sản phẩm', icon: Shapes, visible: isAdmin },
    { path: 'customers', name: 'Khách hàng', icon: Users, visible: mayRead(user, 'customers') },
    { path: 'suppliers', name: 'Nhà cung cấp', icon: Truck, visible: true },
    { path: 'origins', name: 'Xuất xứ organic', icon: MapPin, visible: true },
    { path: 'certifications', name: 'Chứng nhận organic', icon: ShieldCheck, visible: true },
    { path: 'traceability', name: 'Truy xuất sản phẩm', icon: Link2, visible: true },
  ].filter((item) => item.visible);
  const name = links.find((item) => pathname === `/admin/${item.path}`)?.name || 'Quản lý cửa hàng';
  const roleName = isAdmin ? 'Quản trị viên' : hasRole(user, 'WAREHOUSE_STAFF') ? 'Nhân viên kho' : 'Nhân viên bán hàng';
  return <div className="admin-shell"><a href="#main-content" className="skip-link">Bỏ qua đến nội dung</a><aside ref={sidebarRef} id="admin-navigation" inert={mobile && !open} role={mobile ? 'dialog' : undefined} aria-modal={mobile && open ? true : undefined} aria-label="Điều hướng quản lý" className={`admin-sidebar ${open ? 'sidebar-open' : ''}`}><div className="sidebar-brand"><Logo /><button className="icon-button sidebar-close" aria-label="Đóng menu" onClick={() => setOpen(false)}><X size={20} /></button></div><span className="admin-workspace-label">KHÔNG GIAN QUẢN LÝ</span><nav aria-label="Quản lý cửa hàng"><span className="nav-group-label">CỬA HÀNG & NGUỒN GỐC</span>{links.map(({ path, name: title, icon: Icon }) => <NavLink key={path} to={`/admin/${path}`} onClick={() => setOpen(false)}><Icon size={18} />{title}<ChevronRight size={14} /></NavLink>)}</nav><div className="sidebar-bottom"><div className="sidebar-green-note"><Leaf size={24} strokeWidth={1.2} /><strong>Chăm chút từ những điều nhỏ.</strong><Link to="/">Ghé thăm cửa hàng <ArrowUpRight size={14} /></Link></div><Link className="sidebar-logout" to="/dang-xuat"><LogOut size={17} />Đăng xuất</Link><div className="sidebar-user"><span>{(user.fullName || user.username).slice(0, 1).toUpperCase()}</span><div><strong>{user.fullName || user.username}</strong><small>{roleName}</small></div><Leaf size={17} /></div></div></aside>{open && <button className="sidebar-backdrop" aria-label="Đóng menu" onClick={() => setOpen(false)} />}<div className="admin-main"><header className="admin-topbar"><div><button ref={menuRef} aria-expanded={open} aria-controls="admin-navigation" className="icon-button admin-menu-toggle" aria-label="Mở menu quản lý" onClick={() => setOpen(true)}><Menu size={21} /></button><span>Quản lý cửa hàng</span><ChevronRight size={13} /><strong>{name}</strong></div><div><span className="admin-mode"><i />{DEMO_MODE ? 'Dữ liệu mẫu' : 'Kết nối API'}</span><Link to="/" className="admin-store-link">Xem cửa hàng <ArrowUpRight size={15} /></Link></div></header><main className="admin-content" id="main-content"><Outlet /></main><footer className="admin-footer"><span>© {new Date().getFullYear()} Mộc Organic</span><span><CircleHelp size={13} />Thông tin được quản lý theo quyền tài khoản.</span></footer></div></div>;
}
