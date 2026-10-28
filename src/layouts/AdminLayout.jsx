import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, ChevronRight, CircleHelp, FileText, PanelLeftClose, PanelLeftOpen, Truck } from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminSectionTabs from '@/components/admin/AdminSectionTabs';
import { activeAdminGroup, flattenAdminLinks, getAdminNavigation, isAdminItemActive } from '@/constants/adminNavigation';
import { hasRole, roleCodes } from '@/lib/permissions';
import { useAdminUnsavedChanges } from '@/hooks/useAdminUnsavedChanges';
import { useAuth } from '@/contexts/AuthContext';
import { DEMO_MODE } from '@/services/api';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { AdminQuickSearch } from '@/components/admin/AdminQuickSearch';
import { AdminAccountMenu } from '@/components/admin/AdminAccountMenu';
import { AdminAppearanceProvider } from '@/contexts/AdminAppearanceContext';
import '@/styles/admin-kit.css';

export function AdminLayout() {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(() => { try { return localStorage.getItem('moc.admin.sidebar.compact') === 'true'; } catch { return false; } });
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches);
  const sidebarRef = useRef(null);
  const menuRef = useRef(null);
  const memory = useRef({ owner: '', groups: {}, tabs: {} });
  const owner = `${user?.username}:${roleCodes(user).slice().sort().join(',')}`;
  if (memory.current.owner !== owner) memory.current = { owner, groups: {}, tabs: {} };
  const group = activeAdminGroup(user, pathname);
  const activeTab = group?.children?.find((item) => isAdminItemActive(item, pathname));
  useEffect(() => {
    if (!group) return;
    memory.current.groups[group.id] = pathname + search;
    if (activeTab) memory.current.tabs[activeTab.path] = pathname + search;
  }, [owner, pathname, search, group?.id, activeTab?.path]);
  useAdminUnsavedChanges(owner);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const update = () => { setMobile(media.matches); if (!media.matches) setOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!mobile || !open) return;
    const sidebar = sidebarRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () => [...sidebar.querySelectorAll('a[href], button:not([disabled])')].filter((element) => element.getClientRects().length > 0);
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
  const links = flattenAdminLinks(getAdminNavigation(user));
  const name = group?.name || links.find((item) => isAdminItemActive(item, pathname))?.name || ({ '/admin/business-forms': 'Biểu mẫu & Bản in', '/admin/notifications': 'Thông báo', '/admin/sales-orders': 'Đơn cần chuẩn bị' }[pathname]) || 'Quản lý cửa hàng';
  function toggleMenu() {
    if (mobile) { setOpen((old) => !old); return; }
    const next = !compact; setCompact(next);
    try { localStorage.setItem('moc.admin.sidebar.compact', String(next)); } catch { /* The layout still updates without storage. */ }
  }
  return <AdminAppearanceProvider><div className={`admin-shell admin-kit ${compact ? 'adk-layout-compact' : ''}`}>
    <a href="#main-content" className="skip-link">Bỏ qua đến nội dung</a>
    <AdminSidebar user={user} open={open} mobile={mobile} compact={compact} onClose={() => setOpen(false)} sidebarRef={sidebarRef} lastPaths={memory.current.groups} />
    <div inert={mobile && open} className="admin-main">
      <header className="admin-topbar"><div className="adk-topbar-start"><button ref={menuRef} type="button" aria-expanded={mobile ? open : !compact} aria-controls="admin-navigation" className="adk-menu-toggle" aria-label={mobile ? 'Mở menu quản lý' : compact ? 'Mở rộng sidebar' : 'Thu gọn sidebar'} onClick={toggleMenu}>{mobile ? <Menu size={21} /> : compact ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}</button><div className="adk-breadcrumb"><Link to="/admin/dashboard">Quản trị</Link><ChevronRight size={13} /><strong>{activeTab?.name || name}</strong></div><AdminQuickSearch user={user} /></div><div className="adk-topbar-end"><span className={`admin-mode ${DEMO_MODE ? 'adk-demo-mode' : ''}`}><i />{DEMO_MODE ? 'Dữ liệu mẫu' : 'Không gian quản trị'}</span><NotificationBell /><span className="adk-topbar-divider" /><AdminAccountMenu user={user} /></div></header>
      <main className="admin-content" id="main-content"><div className="admin-workspace-heading"><span>{group?.children ? group.name : 'Không gian làm việc'}</span><div>{hasRole(user, 'WAREHOUSE_STAFF') && !hasRole(user, 'ADMIN', 'SALES_STAFF') && <Link to="/admin/sales-orders"><Truck size={15} />Đơn cần chuẩn bị</Link>}<Link to="/admin/business-forms"><FileText size={15} />Biểu mẫu & Bản in</Link>{hasRole(user, 'WAREHOUSE_STAFF') && !hasRole(user, 'ADMIN') && <Link to="/admin/notifications">Trung tâm thông báo</Link>}</div></div><AdminSectionTabs group={group} lastPaths={memory.current.tabs} /><div key={pathname} className="admin-route-content"><Outlet /></div></main>
      <footer className="admin-footer"><span>© {new Date().getFullYear()} Mộc Organic</span><span><CircleHelp size={13} />Thông tin được quản lý theo quyền tài khoản.</span></footer>
    </div>
  </div></AdminAppearanceProvider>;
}
