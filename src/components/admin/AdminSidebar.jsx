import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, ChevronRight, LogOut, Moon, ShieldCheck, Sun, X } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { adminGroupPath, getAdminNavigation, isAdminItemActive } from '@/constants/adminNavigation';
import { hasRole } from '@/lib/permissions';
import { cn } from '@/lib/utils';

function SidebarLink({ item, onNavigate, lastPaths, compact }) {
  const { pathname } = useLocation();
  const active = isAdminItemActive(item, pathname), Icon = item.icon;
  return <Link to={lastPaths?.[item.id] || adminGroupPath(item)} aria-label={item.name} title={compact ? item.name : undefined} aria-current={active ? 'page' : undefined} onClick={onNavigate} className={cn('adk-nav-link', active && 'is-active')}>
    <Icon size={20} strokeWidth={1.65} aria-hidden="true" /><span className="adk-nav-copy">{item.name}</span>{active && <ChevronRight size={14} className="adk-nav-arrow" aria-hidden="true" />}
  </Link>;
}

export default function AdminSidebar({ user, open, mobile, compact, onClose, sidebarRef, lastPaths }) {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('moc.admin.sidebar.theme') !== 'light'; } catch { return true; }
  });
  const links = getAdminNavigation(user);
  const name = user?.fullName || user?.username || 'Tài khoản';
  const role = hasRole(user, 'ADMIN') ? 'Quản trị viên' : hasRole(user, 'WAREHOUSE_STAFF') ? 'Nhân viên kho' : 'Nhân viên bán hàng';
  const rail = compact && !mobile;
  function toggleTheme() {
    const next = !dark; setDark(next);
    try { localStorage.setItem('moc.admin.sidebar.theme', next ? 'dark' : 'light'); } catch { /* Preserve the current selection in memory. */ }
  }
  return <>
    {open && mobile && <button type="button" tabIndex={-1} onClick={onClose} aria-label="Đóng menu quản lý" className="adk-nav-backdrop" />}
    <aside ref={sidebarRef} id="admin-navigation" inert={mobile && !open} aria-hidden={mobile && !open ? true : undefined} role={mobile ? 'dialog' : undefined} aria-modal={mobile && open ? true : undefined} aria-label="Điều hướng quản trị" data-theme={dark ? 'dark' : 'light'} className={cn('adk-sidebar', open && 'is-open', rail && 'is-compact')}>
      <div className="adk-sidebar-brand"><Logo light={dark} /><button type="button" onClick={onClose} aria-label="Đóng menu" className="adk-sidebar-close"><X size={21} /></button></div>
      <div className="adk-sidebar-intro"><span>KHÔNG GIAN LÀM VIỆC</span><small>Quản lý cửa hàng</small></div>
      <nav aria-label="Quản lý cửa hàng" className="adk-sidebar-nav"><ul>{links.map((item) => <li key={item.id}><SidebarLink item={item} onNavigate={onClose} lastPaths={lastPaths} compact={rail} /></li>)}</ul></nav>
      <div className="adk-sidebar-bottom"><div className="adk-sidebar-note"><span><ShieldCheck size={19} strokeWidth={1.5} /></span><div><strong>{role}</strong><p>Chức năng hiển thị theo quyền tài khoản.</p></div></div>
        <div className="adk-sidebar-tools"><Link to="/" onClick={onClose} aria-label="Xem cửa hàng" title={rail ? 'Xem cửa hàng' : undefined}><ArrowUpRight size={17} /><span>Xem cửa hàng</span></Link><button type="button" onClick={toggleTheme} title={dark ? 'Sidebar nền sáng' : 'Sidebar nền tối'} aria-label={dark ? 'Chuyển sidebar sang nền sáng' : 'Chuyển sidebar sang nền tối'}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button></div>
        <div className="adk-sidebar-user"><span className="adk-avatar">{name.slice(0, 1).toUpperCase()}</span><div><strong>{name}</strong><small>{role}</small></div><Link to="/dang-xuat" onClick={onClose} aria-label="Đăng xuất" title="Đăng xuất"><LogOut size={17} /></Link></div>
      </div>
    </aside>
  </>;
}
