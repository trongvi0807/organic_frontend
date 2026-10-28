import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Leaf, PackageSearch, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useResource } from '@/hooks/useResource';
import { useOrderRefresh } from '@/hooks/useOrderRefresh';
import { customerOrderService, resetDemoOrders } from '@/services/client/customerOrderService';
import { ORDER_TABS, customerOrderError, filterOrders, matchesOrderTab } from '@/lib/customerOrders';
import { parseAdminDate } from '@/lib/adminFormat';
import { ResourceState } from '@/components/common/ResourceState';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { AdminDateInput, AdminForm } from '@/components/admin/AdminForm';
import { CancelOrderModal } from '@/components/orders/CancelOrderModal';
import { ReturnRequestModal } from '@/components/orders/ReturnRequestModal';
import { DemoOrderNotice, OrderCard } from '@/components/orders/OrderPrimitives';
import '@/styles/customer-orders.css';

const PAGE_SIZE = 5;
export default function OrderHistoryPage({ demo = false }) {
  const [params, setParams] = useSearchParams();
  const tab = ORDER_TABS.some(([key]) => key === params.get('trang-thai')) ? params.get('trang-thai') : 'all';
  const search = params.get('q') || '', from = parseAdminDate(params.get('tu-ngay') || ''), to = parseAdminDate(params.get('den-ngay') || '');
  const [fromDraft, setFromDraft] = useState(from), [toDraft, setToDraft] = useState(to), [dateKey, setDateKey] = useState(0);
  useEffect(() => { setFromDraft(from); setToDraft(to); setDateKey((key) => key + 1); }, [from, to]);
  const [page, setPage] = useState(0), [cancelling, setCancelling] = useState(null), [returning, setReturning] = useState(null);
  const list = useResource(() => customerOrderService.list(demo), [demo]);
  useOrderRefresh(list.reload, { enabled: !demo, interval: 15000 });
  const orders = list.data?.orders || [];
  const filtered = useMemo(() => filterOrders(orders, { tab, search, from, to }), [orders, tab, search, from, to]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE), currentPage = Math.min(page, Math.max(0, totalPages - 1));
  function query(updates) {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) => { if (value) next.set(key, value); else next.delete(key); });
    setParams(next, { replace: true }); setPage(0);
  }
  function cleared() { setParams({}, { replace: true }); setFromDraft(''); setToDraft(''); setDateKey((value) => value + 1); setPage(0); }
  function cancelled(result) { list.setData({ ...list.data, orders: orders.map((order) => order.id === result.id ? { ...order, ...result } : order) }); list.reload({ background: true }); }
  const demoReview = () => toast.info('Đây là đơn mô phỏng. Để gửi đánh giá thật, hãy mở đơn đã hoàn tất trong tài khoản của bạn.', { position: 'top-left' });
  return <div className="customer-orders bg-[#F7FAF5] text-[#283C2D]"><div className="container py-8 sm:py-12">
    {demo && <DemoOrderNotice onReset={() => { resetDemoOrders(); list.reload(); }} />}
    <nav className="!mb-7 flex items-center gap-2 text-xs text-stone-500" aria-label="Đường dẫn">{demo ? <span>Tài khoản mô phỏng</span> : <Link className="hover:text-[#1B4D2E]" to="/tai-khoan">Tài khoản</Link>}<span>/</span><span className="text-[#1B4D2E]" aria-current="page">Đơn hàng</span></nav>
    <header className="!mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="!mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-[.2em] text-[#7E925F]"><Leaf size={14} />MỖI ĐƠN HÀNG, MỘT LỰA CHỌN LÀNH</p><h1 className="font-serif text-3xl font-medium text-[#1B4D2E] sm:text-4xl">Lịch sử mua hàng</h1><p className="!mt-3 max-w-xl text-sm leading-7 text-stone-500">Theo dõi hành trình từ cửa hàng đến bạn, cùng những thông tin minh bạch cho từng lựa chọn.</p></div><Button variant="outline" disabled={list.loading} onClick={() => list.reload({ background: !!list.data })}><RefreshCw size={15} />Cập nhật trạng thái</Button></header>
    <div className="!mb-6 order-surface overflow-visible p-4 sm:p-5"><nav className="order-tabs" aria-label="Lọc trạng thái đơn hàng">{ORDER_TABS.map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} className={tab === key ? 'active' : ''} onClick={() => query({ 'trang-thai': key === 'all' ? '' : key })}>{label}<span>{orders.filter((order) => matchesOrderTab(order, key)).length}</span></button>)}</nav><div className="!mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]"><label className="relative flex min-w-0 items-center self-end"><Search className="pointer-events-none absolute left-4 text-stone-400" size={18} /><input className="input !pl-11" value={search} maxLength={150} onChange={(event) => query({ q: event.target.value })} aria-label="Tìm mã đơn hàng hoặc tên sản phẩm" placeholder="Tìm theo mã đơn hoặc tên sản phẩm…" /></label><AdminForm key={dateKey} className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[180px_180px_auto]" onSubmit={(event) => { event.preventDefault(); const date = (value) => value ? `${value.slice(8, 10)}-${value.slice(5, 7)}-${value.slice(0, 4)}` : ''; query({ 'tu-ngay': date(fromDraft), 'den-ngay': date(toDraft) }); }}><Field label="Từ ngày"><AdminDateInput aria-label="Từ ngày" value={fromDraft} onChange={(event) => setFromDraft(event.target.value)} /></Field><Field label="Đến ngày"><AdminDateInput aria-label="Đến ngày" value={toDraft} min={fromDraft} onChange={(event) => setToDraft(event.target.value)} /></Field><Button type="submit" variant="outline" className="col-span-2 sm:col-auto">Lọc</Button></AdminForm></div></div>
    {(list.data?.warning || list.refreshError) && <p role="status" className="order-warning !mb-5">{list.refreshError ? 'Chưa cập nhật được trạng thái mới nhất. Dữ liệu dưới đây là lần tải gần nhất; vui lòng thử lại.' : list.data.warning}</p>}
    <ResourceState loading={list.loading} error={list.error ? customerOrderError({ message: list.error }) : ''} onRetry={list.reload} />
    {!list.loading && !list.error && <><div className="!mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500"><p aria-live="polite">{filtered.length} đơn hàng{tab !== 'all' && ` · ${ORDER_TABS.find(([key]) => key === tab)?.[1]}`}</p>{(search || from || to || tab !== 'all') && <button className="font-medium text-[#1B4D2E] underline underline-offset-4" onClick={cleared}>Xóa bộ lọc</button>}</div>{filtered.length ? <div className="space-y-5">{filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE).map((order) => <OrderCard key={order.id} order={order} demo={demo} onCancel={setCancelling} onReturn={setReturning} onDemoReview={demoReview} />)}</div> : <section className="order-surface flex flex-col items-center px-5 py-16 text-center"><span className="!mb-5 rounded-full bg-[#EDF3E8] p-5 text-[#7D9864]"><PackageSearch size={40} /></span><h2 className="!font-serif !text-2xl !font-medium text-[#1B4D2E]">{orders.length ? 'Chưa tìm thấy đơn phù hợp' : 'Hành trình tươi lành đang chờ bạn'}</h2><p className="!mt-3 !mb-6 max-w-md text-sm leading-7 text-stone-500">{orders.length ? 'Thử đổi từ khóa, khoảng thời gian hoặc chọn trạng thái khác nhé.' : 'Khám phá thực phẩm hữu cơ và tạo đơn hàng đầu tiên của bạn.'}</p>{orders.length ? <Button onClick={cleared} variant="outline">Xóa bộ lọc</Button> : <Link to="/san-pham" className="order-action order-action-primary">Khám phá sản phẩm <ArrowRight size={16} /></Link>}</section>}<Pagination page={currentPage} size={PAGE_SIZE} totalPages={totalPages} totalElements={filtered.length} onChange={setPage} /></>}
    <div className="!mt-8 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-500"><Link to="/san-pham" className="inline-flex items-center gap-2 hover:text-[#1B4D2E]"><ArrowLeft size={15} />Tiếp tục mua sắm</Link><span className="flex items-center gap-2"><ShieldCheck size={16} />Trạng thái thanh toán luôn cần được hệ thống xác nhận.</span></div>
    {cancelling && <CancelOrderModal key={cancelling.id} order={orders.find((order) => order.id === cancelling.id) || cancelling} demo={demo} onClose={() => setCancelling(null)} onCancelled={cancelled} onRefresh={() => list.reload({ background: true })} />}
    {returning && <ReturnRequestModal key={returning.id} order={returning} demo={demo} onClose={() => setReturning(null)} onChanged={() => list.reload({ background: true })} />}
  </div></div>;
}
