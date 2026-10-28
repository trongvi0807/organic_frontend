import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, Copy, Leaf, Package, Ticket, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { hasRole } from '@/lib/permissions';
import { orderDateTime } from '@/lib/customerOrders';

const sources = { order: ['Đơn hàng', Package], product: ['Sản phẩm mới', Leaf], promotion: ['Ưu đãi', Ticket], stock: ['Cảnh báo kho', Bell] };
export function NotificationBell({ storefront = false }) {
  const { user } = useAuth(), inbox = useNotifications(), navigate = useNavigate();
  const [open, setOpen] = useState(false), [tab, setTab] = useState('all'), [error, setError] = useState(''), [busy, setBusy] = useState(false), [copied, setCopied] = useState('');
  const root = useRef(null), button = useRef(null), currentOwner = useRef(user?.username || 'guest'), titleId = useId();
  currentOwner.current = user?.username || 'guest';
  useEffect(() => {
    if (!open) return;
    const outside = (event) => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = (event) => { if (event.key === 'Escape') { setOpen(false); button.current?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  useEffect(() => { setOpen(false); setTab('all'); setCopied(''); setError(''); }, [user?.username]);
  async function view(item) {
    if (busy) return; setBusy(true); setError(''); const owner = currentOwner.current;
    try { await inbox.markRead(item); if (currentOwner.current !== owner) return; setOpen(false); navigate(item.target); }
    catch { if (currentOwner.current === owner) setError('Chưa đánh dấu được thông báo. Vui lòng thử lại.'); }
    finally { setBusy(false); }
  }
  async function copy(code) {
    try { await navigator.clipboard.writeText(code); setCopied(code); setError(''); }
    catch { setError('Chưa sao chép được mã. Bạn có thể chọn và sao chép mã hiển thị trong thông báo.'); }
  }
  const items = inbox.items.filter((item) => tab === 'all' || item.source === tab);
  return <div ref={root} className="relative"><button ref={button} type="button" className="icon-button relative" aria-label={inbox.unread ? `Thông báo, ${inbox.unread} tin chưa đọc` : 'Thông báo'} aria-haspopup="dialog" aria-expanded={open} onClick={() => { setOpen((value) => !value); setError(''); if (!open) inbox.reloadInbox({ background: true }); }}><Bell size={21} />{inbox.unread > 0 && <span className="absolute right-0.5 top-0.5 size-2.5 rounded-full border-2 border-white bg-red-500" aria-hidden="true" />}</button>
    {open && <section role="dialog" aria-labelledby={titleId} className="fixed left-3 right-3 top-24 z-[45] max-h-[75dvh] w-auto overflow-y-auto rounded-2xl border border-line bg-white text-primary shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+12px)] sm:w-[380px]"><div className="flex items-center justify-between border-b border-line p-4"><div><h2 id={titleId} className="!font-sans !text-base !font-semibold">Thông báo của bạn</h2><p className="!mt-1 text-[10px] text-stone-400">{inbox.unread} thông báo chưa đọc</p></div><button type="button" className="icon-button" aria-label="Đóng thông báo" onClick={() => setOpen(false)}><X size={17} /></button></div>
      <div className="flex gap-1 overflow-x-auto border-b border-line p-2" aria-label="Loại thông báo">{[['all', 'Tất cả'], ...Object.entries(sources).filter(([source]) => source !== 'stock' ? storefront || inbox.items.some((item) => item.source === source) : inbox.items.some((item) => item.source === source)).map(([key, [label]]) => [key, label])].map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-[10px] ${tab === key ? 'bg-sage font-semibold text-primary' : 'text-stone-500 hover:bg-stone-50'}`}>{label}</button>)}</div>
      <div aria-live="polite">{inbox.inboxLoading && <p className="p-4 text-sm">Đang tải thông báo…</p>}{(error || inbox.inboxError) && <p role="status" className="p-4 text-xs leading-6 text-amber-800">{error || 'Một nguồn thông báo chưa cập nhật được. Vui lòng thử lại.'}</p>}{!inbox.inboxLoading && !items.length && <p className="p-5 text-sm leading-7 text-stone-500">Chưa có thông báo trong mục này.</p>}</div>
      <ul className="divide-y divide-line">{items.map((item) => { const [label, Icon] = sources[item.source] || ['Cập nhật', Bell]; return <li key={item.key} className={item.read ? '' : 'bg-[#f6f9f1]'}><button type="button" disabled={busy} onClick={() => view(item)} className="flex w-full gap-3 p-4 text-left transition-colors hover:bg-sage"><span className={`!mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${item.source === 'promotion' ? 'bg-amber-100 text-amber-700' : 'bg-[#E8EFDF] text-[#6D8953]'}`}><Icon size={16} /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="text-[9px] text-stone-400">{label}</span>{!item.read && <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-label="Chưa đọc" />}</span><strong className="!mt-1 block break-words !text-xs !font-semibold">{item.title}</strong><span className="!mt-1 block text-[11px] leading-6 text-stone-500">{item.message}</span>{item.createdAt && <span className="!mt-1 block text-[9px] text-stone-400">{orderDateTime(item.createdAt)}</span>}</span></button>{item.promotionCode && <div className="px-4 pb-3 pl-[60px]"><button type="button" className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-[#CBD8BD] px-2 py-1.5 text-[10px] font-medium" onClick={() => copy(item.promotionCode)}>{copied === item.promotionCode ? <Check size={12} /> : <Copy size={12} />}{copied === item.promotionCode ? 'Đã sao chép' : `Sao chép ${item.promotionCode}`}</button></div>}</li>; })}</ul>
      <footer className="space-y-2 border-t border-line p-4 text-xs">{!user && <p className="leading-6 text-stone-500"><Link className="font-medium text-primary underline" to="/dang-nhap" onClick={() => setOpen(false)}>Đăng nhập</Link> để xem mã giảm giá và theo dõi thông báo đơn hàng riêng của bạn.</p>}{hasRole(user, 'CUSTOMER') && <Link to="/don-hang" className="block font-medium underline" onClick={() => setOpen(false)}>Xem đơn hàng của tôi</Link>}{hasRole(user, 'ADMIN', 'WAREHOUSE_STAFF') && <Link className="block underline" to="/admin/notifications" onClick={() => setOpen(false)}>Mở hộp thư cảnh báo kho</Link>}<p className="text-[10px] leading-5 text-stone-400">{hasRole(user, 'ADMIN', 'WAREHOUSE_STAFF') ? 'Cảnh báo kho đồng bộ trạng thái đã đọc qua hệ thống.' : 'Cập nhật khi bạn đang sử dụng website. Trạng thái đã xem được lưu trên trình duyệt này.'}</p></footer>
    </section>}
  </div>;
}
