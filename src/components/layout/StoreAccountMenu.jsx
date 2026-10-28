import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogIn, LogOut, Package, Settings2, UserPlus, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardPath, hasRole } from '@/lib/permissions';

export function StoreAccountMenu() {
  const { user, logout } = useAuth(), location = useLocation(), navigate = useNavigate(), id = useId();
  const root = useRef(null), trigger = useRef(null), lock = useRef(false);
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
  useEffect(() => { setOpen(false); }, [user?.username, location.pathname]);
  useEffect(() => {
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === 'Escape' && open) { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  async function signOut() {
    if (lock.current) return; lock.current = true; setBusy(true);
    try { await logout(); toast.success('Đã đăng xuất. Hẹn gặp lại bạn!', { position: 'top-left' }); }
    catch { toast.info('Đã đăng xuất trên trình duyệt. Máy chủ chưa xác nhận thu hồi phiên.', { position: 'top-left' }); }
    finally { setBusy(false); lock.current = false; setOpen(false); navigate('/', { replace: true }); }
  }
  return <div ref={root} className="store-account" onMouseEnter={() => setOpen(true)} onMouseLeave={() => { if (!root.current?.contains(document.activeElement)) setOpen(false); }} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="store-account-trigger" aria-label={user ? 'Mở menu tài khoản' : 'Đăng nhập hoặc đăng ký'} aria-expanded={open} aria-controls={id} onClick={() => setOpen(true)} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); } }}><UserRound size={21} /><span>{user ? user.fullName?.split(' ').at(-1) || 'Tài khoản' : 'Tài khoản'}</span><ChevronDown size={12} className="store-account-chevron" /></button>
    {open && <div className="store-account-panel" id={id}><div className="store-account-surface"><div className="border-b border-line px-4 py-3"><p className="text-xs font-semibold text-[#1B4D2E]">{user ? `Xin chào, ${user.fullName || 'bạn của Mộc'}` : 'Chào mừng bạn đến với Mộc'}</p><p className="!mt-1 text-[10px] leading-5 text-stone-400">{user ? 'Chăm chút từng lựa chọn tươi lành.' : 'Đăng nhập để theo dõi đơn và nhận ưu đãi.'}</p></div>{user ? <><Link to="/tai-khoan" onClick={() => setOpen(false)}><UserRound size={16} />Tài khoản của tôi</Link>{hasRole(user, 'CUSTOMER') && <Link to="/don-hang" onClick={() => setOpen(false)}><Package size={16} />Đơn hàng của tôi</Link>}{!hasRole(user, 'CUSTOMER') && <Link to={dashboardPath(user)} onClick={() => setOpen(false)}><Settings2 size={16} />Trang quản trị</Link>}<button type="button" disabled={busy} className="!text-red-700" onClick={signOut}><LogOut size={16} />{busy ? 'Đang đăng xuất…' : 'Đăng xuất'}</button></> : <><Link to="/dang-nhap" onClick={() => setOpen(false)}><LogIn size={16} />Đăng nhập</Link><Link to="/dang-ky" onClick={() => setOpen(false)}><UserPlus size={16} />Đăng ký tài khoản</Link></>}</div></div>}
  </div>;
}
