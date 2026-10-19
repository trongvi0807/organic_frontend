import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Package, Shapes, ArrowUpRight, LogOut, Menu, X, Leaf, ChevronRight, CircleHelp } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_MODE } from '@/services/api';

export function AdminLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const name = location.pathname.includes('categories') ? 'Loại sản phẩm' : 'Sản phẩm';
  return <div className="admin-shell"><aside className={`admin-sidebar ${open ? 'sidebar-open' : ''}`}><div className="sidebar-brand"><Logo /><button className="icon-button sidebar-close" aria-label="Đóng menu" onClick={() => setOpen(false)}><X size={20} /></button></div><span className="admin-workspace-label">KHÔNG GIAN QUẢN TRỊ</span><nav aria-label="Quản trị"><span className="nav-group-label">QUẢN LÝ CỬA HÀNG</span><NavLink to="/admin/products" onClick={() => setOpen(false)}><Package size={19} /> Sản phẩm <ChevronRight size={14} /></NavLink><NavLink to="/admin/categories" onClick={() => setOpen(false)}><Shapes size={19} /> Loại sản phẩm <ChevronRight size={14} /></NavLink></nav><div className="sidebar-bottom"><div className="sidebar-green-note"><Leaf size={24} strokeWidth={1.2} /><strong>Chăm chút từ những điều nhỏ.</strong><p>Mỗi sản phẩm tốt là một lời hứa với khách hàng.</p><Link to="/">Ghé thăm cửa hàng <ArrowUpRight size={14} /></Link></div><Link className="sidebar-logout" to="/dang-xuat"><LogOut size={17} />Đăng xuất</Link><div className="sidebar-user"><span>{(user.fullName || user.username).slice(0, 1).toUpperCase()}</span><div><strong>{user.fullName || user.username}</strong><small>Quản trị viên</small></div><Leaf size={17} /></div></div></aside>{open && <button className="sidebar-backdrop" aria-label="Đóng menu" onClick={() => setOpen(false)} />}<div className="admin-main"><header className="admin-topbar"><div><button className="icon-button admin-menu-toggle" aria-label="Mở menu quản trị" onClick={() => setOpen(true)}><Menu size={21} /></button><span>Quản lý cửa hàng</span><ChevronRight size={13} /><strong>{name}</strong></div><div><span className="admin-mode"><i />{DEMO_MODE ? 'Dữ liệu mẫu' : 'Kết nối API'}</span><Link to="/" className="admin-store-link">Xem cửa hàng <ArrowUpRight size={15} /></Link></div></header><main className="admin-content" id="main-content"><Outlet /></main><footer className="admin-footer"><span>© {new Date().getFullYear()} Mộc Organic</span><span><CircleHelp size={13} />Chăm chút mỗi ngày, tươi lành mỗi sản phẩm.</span></footer></div></div>;
}
