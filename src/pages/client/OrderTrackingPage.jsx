import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, Headphones, Leaf, MapPin, Package, Phone, RefreshCw, ShieldCheck, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useResource } from '@/hooks/useResource';
import { useOrderRefresh } from '@/hooks/useOrderRefresh';
import { usePaymentConfirmation } from '@/hooks/usePaymentConfirmation';
import { checkoutService } from '@/services/client/checkoutService';
import { customerOrderService } from '@/services/client/customerOrderService';
import { canPayOrder, paymentNames, paymentRedirect } from '@/lib/checkout';
import { rememberPayment } from '@/lib/checkoutAttempt';
import { customerOrderError, latestShipment, orderDateTime } from '@/lib/customerOrders';
import { currency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/field';
import { DocumentDownloadButton } from '@/components/common/DocumentDownloadButton';
import { ResourceState } from '@/components/common/ResourceState';
import { CancelOrderModal } from '@/components/orders/CancelOrderModal';
import { ReturnRequestModal } from '@/components/orders/ReturnRequestModal';
import { DemoOrderNotice, OrderActions, OrderBadge, OrderProductList, OrderReturns, OrderStepper } from '@/components/orders/OrderPrimitives';
import '@/styles/customer-orders.css';

function SectionHeading({ icon: Icon, children }) { return <h2 className="!mb-5 flex items-center gap-2.5 !font-sans !text-base !font-semibold text-[#1B4D2E]"><Icon size={19} className="text-[#7B946B]" />{children}</h2>; }
export function OrderPaymentSummary({ order }) {
  const quote = order.pricing, money = (amount) => amount == null ? 'Chưa có thông tin' : currency(amount);
  return <section className="order-surface p-5 sm:p-6"><SectionHeading icon={CreditCard}>Thông tin thanh toán</SectionHeading><dl className="space-y-4 text-sm">{[
    ['Tạm tính', money(quote?.subtotal)], ['Phí giao hàng', money(quote?.shippingFee)],
    ['Giảm giá / Khuyến mãi', money(quote?.promotionDiscount == null ? null : -quote.promotionDiscount)],
    [`Điểm thành viên đã dùng${quote?.pointsUsed != null ? ` (${quote.pointsUsed} điểm)` : ''}`, money(quote?.pointsDiscount == null ? null : -quote.pointsDiscount)],
  ].map(([label, value]) => <div className="flex flex-wrap justify-between gap-2" key={label}><dt className="text-stone-500">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}<div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-5"><dt className="font-semibold text-[#1B4D2E]">Tổng thanh toán</dt><dd className="text-right text-2xl font-semibold text-[#1B4D2E]">{money(quote?.totalAmount)}</dd></div></dl><div className="!mt-5 space-y-3 rounded-xl bg-[#F7FAF5] p-4 text-xs"><p className="flex flex-wrap justify-between gap-2"><span className="text-stone-500">Phương thức</span><strong className="font-medium">{paymentNames[order.paymentMethod] || 'Chưa có thông tin'}</strong></p><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-stone-500">Trạng thái</span><OrderBadge order={order} payment /></div>{quote?.vatIncluded && <p className="text-stone-500">Đã bao gồm VAT.</p>}</div></section>;
}
export function OrderDeliveryInfo({ order, demo }) {
  const shipment = latestShipment(order), phone = shipment?.driverPhone?.replace(/[^\d+]/g, ''), canCall = !demo && /^\+?\d{7,15}$/.test(phone || '');
  return <aside className="space-y-5"><section className="order-surface p-5 sm:p-6"><SectionHeading icon={MapPin}>Thông tin nhận hàng</SectionHeading><p className="text-sm font-semibold">{order.receiverName || 'Chưa có tên người nhận'}</p><p className="!mt-2 text-sm text-stone-600">{order.receiverPhone || 'Chưa có số điện thoại'}</p><p className="!mt-4 text-sm leading-7 text-stone-500">{order.address ? [order.address.street, order.address.ward, order.address.province].filter(Boolean).join(', ') : order.shippingAddress || 'Chưa có địa chỉ nhận hàng'}</p>{order.note && <div className="!mt-4 rounded-xl bg-[#F7FAF5] p-3"><p className="!mb-1 text-xs font-medium">Ghi chú nhận hàng</p><p className="whitespace-pre-wrap break-words text-xs leading-6 text-stone-500">{order.note}</p></div>}</section>
    <section className="order-surface p-5 sm:p-6"><SectionHeading icon={Truck}>Thông tin vận chuyển</SectionHeading>{shipment ? <><dl className="space-y-4 text-xs">{[
      ['Đơn vị vận chuyển', shipment.carrier || 'Chưa phân công'], ['Mã vận đơn', shipment.trackingCode || 'Chưa có mã vận đơn'],
      ['Người giao hàng', shipment.driverName || 'Chưa phân công'], ['Điện thoại', shipment.driverPhone || 'Chưa cập nhật'],
      ['Biển số xe', shipment.licensePlate || 'Chưa có thông tin'], ['Dự kiến giao', shipment.estimatedDeliveryAt ? orderDateTime(shipment.estimatedDeliveryAt) : 'Chưa có thời gian dự kiến'],
    ].map(([label, value]) => <div key={label}><dt className="!mb-1.5 text-stone-400">{label}</dt><dd className="break-words text-sm leading-6">{value}</dd></div>)}</dl>{shipment.note && <p className="!mt-4 text-xs leading-6 text-stone-500">Ghi chú: {shipment.note}</p>}{canCall ? <a href={`tel:${phone}`} className="order-action !mt-5 w-full"><Phone size={15} />Gọi người giao hàng</a> : <Button variant="outline" className="!mt-5 w-full" disabled><Phone size={15} />Gọi người giao hàng</Button>}</> : <div className="rounded-xl bg-[#F7FAF5] p-4 text-sm leading-7 text-stone-500">Cửa hàng sẽ cập nhật người giao và mã vận đơn khi bàn giao hàng.</div>}{order.paymentMethod === 'cod' && <p className="!mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-6 text-amber-900">{order.paymentStatus === 'paid' ? 'Đã ghi nhận thu tiền COD.' : order.status === 'cancelled' ? 'Đơn đã hủy, không thu COD.' : `Chỉ thanh toán khi nhận hàng. Số tiền COD theo đơn: ${currency(order.pricing?.totalAmount)}.`}</p>}</section>
    <div className="rounded-2xl bg-[#EAF1E4] p-5"><div className="!mb-2 flex items-center gap-2 text-sm font-semibold text-[#1B4D2E]"><Leaf size={18} />Minh bạch từ nguồn gốc</div><p className="text-xs leading-7 text-[#65755D]">Thông tin lô được hiển thị khi có dữ liệu xuất kho. Bạn có thể liên hệ cửa hàng nếu cần kiểm tra nguồn gốc của sản phẩm đã nhận.</p></div>
  </aside>;
}
export default function OrderTrackingPage({ demo = false }) {
  const { id } = useParams();
  return <OrderTrackingContent key={`${demo}-${id}`} id={id} demo={demo} />;
}
function OrderTrackingContent({ id, demo }) {
  const { user } = useAuth();
  const detail = useResource(() => customerOrderService.detail(id, demo), [id, demo]), order = !detail.loading && !detail.error ? detail.data?.order : null;
  const methods = useResource(() => demo ? Promise.resolve({}) : checkoutService.methods(), [demo]);
  useOrderRefresh(detail.reload, { enabled: !demo, interval: 10000 });
  usePaymentConfirmation(demo ? undefined : order?.id, demo ? undefined : order?.paymentStatus);
  const [cancelling, setCancelling] = useState(false), [returning, setReturning] = useState(false), [gateway, setGateway] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const locked = useRef(false), base = demo ? '/demo/don-hang' : '/don-hang';
  async function pay() {
    if (locked.current || !order || demo || !canPayOrder(order)) return;
    locked.current = true; setBusy(true); setError('');
    try { const payment = await checkoutService.initiate(order.id, gateway || order.paymentMethod); rememberPayment(user.username, payment); window.location.assign(paymentRedirect(payment)); }
    catch (err) { setError(`${customerOrderError(err)} Vui lòng tải lại đơn để kiểm tra phiên trước khi thử lại.`); detail.reload({ background: true }); }
    finally { locked.current = false; setBusy(false); }
  }
  function cancelled(result) { detail.setData({ ...detail.data, order: { ...order, ...result } }); detail.reload({ background: true }); }
  return <div className="customer-orders bg-[#F7FAF5] text-[#283C2D]"><div className="container py-8 sm:py-12">
    {demo && <DemoOrderNotice />}
    <nav className="!mb-7 flex flex-wrap items-center gap-2 text-xs text-stone-500" aria-label="Đường dẫn">{demo ? <span>Tài khoản mô phỏng</span> : <Link to="/tai-khoan">Tài khoản</Link>}<span>/</span><Link to={base}>Đơn hàng</Link><span>/</span><span aria-current="page" className="text-[#1B4D2E]">{order?.orderCode ? `#${order.orderCode}` : 'Chi tiết đơn hàng'}</span></nav>
    <ResourceState loading={detail.loading} error={detail.error ? customerOrderError({ message: detail.error }) : ''} onRetry={detail.reload} />
    {(detail.data?.warning || detail.refreshError) && <p role="status" className="order-warning !mb-5">{detail.refreshError ? 'Chưa cập nhật được trạng thái mới nhất. Vui lòng kiểm tra kết nối và tải lại.' : detail.data.warning}</p>}
    {order && <><header className="!mb-6 order-surface flex flex-wrap items-start justify-between gap-6 p-5 sm:p-7"><div><p className="!mb-2 text-[10px] font-semibold tracking-[.18em] text-[#819467]">HÀNH TRÌNH ĐƠN HÀNG</p><h1 className="font-serif text-3xl font-medium text-[#1B4D2E] sm:text-4xl">{order.orderCode ? `#${order.orderCode}` : 'Chưa có mã đơn'}</h1><p className="!mt-3 text-xs text-stone-500">Ngày đặt: {orderDateTime(order.orderedAt)}</p><div className="!mt-4 flex flex-wrap gap-2"><OrderBadge order={order} /><OrderBadge order={order} payment /></div></div><div className="sm:text-right"><p className="text-xs text-stone-500">Tổng thanh toán</p><p className="!mt-2 !mb-4 text-2xl font-semibold text-[#1B4D2E]">{currency(order.pricing?.totalAmount)}</p><a href="tel:0344855913" className="order-action"><Headphones size={16} />Liên hệ hỗ trợ</a></div></header>
    <OrderStepper order={order} /><div className="!mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="min-w-0 space-y-5"><section className="order-surface p-5 sm:p-6"><SectionHeading icon={Package}>Sản phẩm trong đơn</SectionHeading><OrderProductList order={order} /></section><OrderPaymentSummary order={order} /><OrderReturns order={order} />
      {!!order.payments?.length && <section className="order-surface p-5 sm:p-6"><SectionHeading icon={CreditCard}>Các lần thanh toán</SectionHeading><ul className="divide-y divide-stone-100">{order.payments.map((payment, i) => <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><span className="text-sm">Lần {i + 1} · {paymentNames[payment.gateway] || 'Thanh toán trực tuyến'}</span><OrderBadge order={{ paymentStatus: payment.status }} payment />{!demo && <Link className="text-xs font-medium text-[#1B4D2E] underline" to={`/payment/result?paymentId=${encodeURIComponent(payment.id)}`}>Kiểm tra kết quả</Link>}</li>)}</ul></section>}
      {canPayOrder(order) && <section className="order-surface p-5 sm:p-6"><SectionHeading icon={CreditCard}>Tiếp tục thanh toán</SectionHeading>{demo ? <p className="text-sm leading-7 text-stone-500">Đơn mô phỏng không tạo phiên thanh toán thật. Các trạng thái thanh toán mẫu được dùng để kiểm thử giao diện.</p> : <div className="space-y-4"><ResourceState loading={methods.loading} error={methods.error ? customerOrderError({ message: methods.error }) : ''} onRetry={methods.reload} /><label className="field"><span>Cổng thanh toán</span><Select value={gateway || order.paymentMethod} onChange={(event) => setGateway(event.target.value)} disabled={busy} aria-label="Cổng thanh toán">{Object.entries(paymentNames).filter(([name]) => name !== 'cod').map(([name, label]) => <option value={name} key={name} disabled={!methods.data?.[name]}>{label}{!methods.data?.[name] ? ' (chưa bật)' : ''}</option>)}</Select></label><Button onClick={pay} disabled={busy || methods.loading || !!methods.error || !methods.data?.[gateway || order.paymentMethod]}>{busy ? 'Đang tạo phiên…' : 'Tiếp tục thanh toán'}</Button><p className="text-xs leading-6 text-stone-500">Không thanh toán qua nhiều đường dẫn cùng lúc. Phiên VNPay còn hiệu lực có thể chưa hủy hoặc đổi cổng được.{order.paymentDueAt && ` Hạn chờ: ${orderDateTime(order.paymentDueAt)}.`}</p></div>}</section>}
    </div><OrderDeliveryInfo order={order} demo={demo} /></div>
    {error && <p className="!mt-5 order-warning !text-red-800" role="alert">{error}</p>}<footer className="!mt-7 order-surface flex flex-wrap items-center justify-between gap-5 p-5"><div className="flex flex-wrap gap-3"><Link to={base} className="order-action"><ArrowLeft size={15} />Danh sách đơn hàng</Link><Button variant="outline" disabled={busy} onClick={() => detail.reload({ background: true })}><RefreshCw size={15} />Cập nhật trạng thái</Button>{!demo && <DocumentDownloadButton kind="customerSale" id={order.id} />}</div><OrderActions order={order} demo={demo} detail onCancel={() => setCancelling(true)} onReturn={() => setReturning(true)} onDemoReview={() => toast.info('Đơn mô phỏng chỉ dùng thử giao diện. Bạn có thể viết đánh giá từ đơn thật đã hoàn tất.', { position: 'top-left' })} /></footer><p className="!mt-6 flex items-center gap-2 text-xs leading-6 text-stone-400"><ShieldCheck size={16} className="shrink-0" />Hành trình và thanh toán được hiển thị theo dữ liệu hệ thống xác nhận.</p>
    {cancelling && <CancelOrderModal order={order} demo={demo} onClose={() => setCancelling(false)} onCancelled={cancelled} onRefresh={() => detail.reload({ background: true })} />}{returning && <ReturnRequestModal order={order} demo={demo} onClose={() => setReturning(false)} onChanged={() => detail.reload({ background: true })} />}
    </>}
  </div></div>;
}
