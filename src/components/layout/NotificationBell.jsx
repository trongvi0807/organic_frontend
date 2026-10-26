import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { hasRole } from '@/lib/permissions';

export function NotificationBell() {
  const { user } = useAuth(); const inbox = useNotifications();
  const [open, setOpen] = useState(false); const root = useRef(null), button = useRef(null); const titleId = useId(); const navigate = useNavigate();
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    const outside = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    const escape = (e) => { if (e.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  useEffect(() => setOpen(false), [user?.username]);
  async function view(item) { if (busy) return; setBusy(true); setError(''); try { await inbox.markRead(item); setOpen(false); navigate(item.target); } catch { setError('Chưa đánh dấu được thông báo. Vui lòng thử lại.'); } finally { setBusy(false); } }
  return <div ref={root} className="relative"><button ref={button} type="button" className="icon-button relative" aria-label={inbox.unread ? 'Thông báo, có tin chưa đọc' : 'Thông báo'} aria-haspopup="dialog" aria-expanded={open} onClick={() => { setOpen((value) => !value); setError(''); if (!open && user) inbox.reloadInbox(); }}><Bell size={21} />{inbox.unread > 0 && <span className="absolute right-0.5 top-0.5 size-2.5 rounded-full border-2 border-white bg-red-500" aria-hidden="true" />}</button>{open && <section role="dialog" aria-labelledby={titleId} className="fixed left-3 right-3 top-24 z-[45] max-h-[70dvh] w-auto sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+12px)] sm:w-[340px] overflow-y-auto rounded-2xl border border-line bg-white text-primary shadow-xl"><div className="flex items-center justify-between border-b border-line p-4"><h2 id={titleId} className="!text-base !font-semibold">Thông báo gần đây</h2><button className="icon-button" aria-label="Đóng thông báo" onClick={() => setOpen(false)}><X size={17} /></button></div>{!user ? <div className="p-5 text-sm leading-7"><p>Đăng nhập để xem cập nhật đơn hàng của bạn.</p><Link className="!mt-3 inline-block underline" to="/dang-nhap" onClick={() => setOpen(false)}>Đăng nhập</Link></div> : <><div aria-live="polite">{inbox.inboxLoading && <p className="p-4 text-sm">Đang tải thông báo…</p>}{(error || inbox.inboxError) && <p role="status" className="p-4 text-xs leading-6 text-amber-800">{error || inbox.inboxError}</p>}{!inbox.inboxLoading && !inbox.items.length && <p className="p-5 text-sm text-stone-500">Chưa có thông báo gần đây.</p>}</div><ul className="divide-y divide-line">{inbox.items.map((item) => <li key={item.key}><button disabled={busy} onClick={() => view(item)} className={`flex w-full gap-3 p-4 text-left transition-colors hover:bg-sage ${item.read ? '' : 'bg-[#f5f8ef]'}`}><span className={`!mt-1.5 size-2 shrink-0 rounded-full ${item.read ? 'bg-stone-200' : 'bg-red-500'}`} /><span className="min-w-0"><strong className="block break-words !text-xs">{item.title}</strong><span className="!mt-1 block text-xs leading-6 text-stone-500">{item.message}</span></span></button></li>)}</ul><div className="space-y-2 border-t border-line p-4 text-xs">{hasRole(user, 'ADMIN', 'WAREHOUSE_STAFF') && <Link className="block underline" to="/admin/notifications" onClick={() => setOpen(false)}>Mở hộp thư cảnh báo kho</Link>}<p className="leading-5 text-stone-500">Cập nhật đơn hàng được đánh dấu đã xem trên thiết bị này. Cảnh báo kho đồng bộ trạng thái đã đọc qua API.</p></div></>}</section>}</div>;
}

