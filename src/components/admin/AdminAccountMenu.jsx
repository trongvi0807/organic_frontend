import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, LogOut, ShieldCheck } from 'lucide-react';
import { hasRole } from '@/lib/permissions';

export function AdminAccountMenu({ user }) {
  const [open, setOpen] = useState(false), root = useRef(null), button = useRef(null), id = useId();
  const { pathname } = useLocation();
  const name = user?.fullName || user?.username || 'Tài khoản';
  const role = hasRole(user, 'ADMIN') ? 'Quản trị viên' : hasRole(user, 'WAREHOUSE_STAFF') ? 'Nhân viên kho' : 'Nhân viên bán hàng';
  const initials = name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => { const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); }; document.addEventListener('pointerdown', outside); return () => document.removeEventListener('pointerdown', outside); }, []);
  return <div className="adk-account-menu" ref={root} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={(event) => { if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); button.current?.focus(); } }}>
    <button type="button" ref={button} className="adk-account-trigger" aria-label={`Tài khoản ${name}`} aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => setOpen((old) => !old)}><span className="adk-avatar">{initials}</span><span className="adk-account-copy"><strong>{name}</strong><small>{role}</small></span><ChevronDown size={14} /></button>
    {open && <div className="adk-account-panel" id={`${id}-panel`}><div><strong>{name}</strong><span><ShieldCheck size={13} />{role}</span></div><Link to="/" onClick={() => setOpen(false)}><ArrowUpRight size={16} />Xem cửa hàng</Link><Link to="/dang-xuat" onClick={() => setOpen(false)}><LogOut size={16} />Đăng xuất</Link></div>}
  </div>;
}
