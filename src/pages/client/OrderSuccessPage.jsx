import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, CreditCard, PackageCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useResource } from '@/hooks/useResource';
import { useOrderRefresh } from '@/hooks/useOrderRefresh';
import { usePaymentConfirmation } from '@/hooks/usePaymentConfirmation';
import { checkoutService } from '@/services/client/checkoutService';
import { rememberPayment } from '@/lib/checkoutAttempt';
import { canPayOrder, paymentNames, paymentRedirect } from '@/lib/checkout';
import { currency, errorMessage } from '@/lib/utils';
import { PurchaseFrame, purchasePanel, purchaseButton } from '@/components/checkout/PurchaseFrame';
import { CommerceStatus } from '@/components/checkout/OrderUI';
import { ResourceState } from '@/components/common/ResourceState';

export default function OrderSuccessPage() {
  const { id } = useParams(), { user } = useAuth(), locked = useRef(false);
  const order = useResource(() => checkoutService.order(id), [id]);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  useOrderRefresh(order.reload, { enabled: order.data?.status === 'pending_payment', interval: 5000 });
  usePaymentConfirmation(order.data?.id, order.data?.paymentStatus);
  async function pay() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { const payment = await checkoutService.initiate(id, order.data.paymentMethod); rememberPayment(user.username, payment); window.location.assign(paymentRedirect(payment)); }
    catch (e) { setError(errorMessage(e)); order.reload({ background: true }); }
    finally { locked.current = false; setBusy(false); }
  }
  const data = order.data;
  return <PurchaseFrame step={3} title="Đơn hàng đã được ghi nhận"><section className={`${purchasePanel} !mx-auto max-w-2xl p-6 text-center sm:p-10`}><ResourceState loading={order.loading} error={order.error} onRetry={order.reload} />{!order.loading && !order.error && data && <><span className="!mx-auto grid size-20 place-items-center rounded-full bg-sage text-primary">{data.paymentStatus === 'paid' ? <CheckCircle2 size={42} strokeWidth={1.5} /> : <PackageCheck size={40} strokeWidth={1.5} />}</span><p className="!mt-6 text-xs uppercase tracking-[.15em] text-stone-400">CẢM ƠN BẠN ĐÃ CHỌN MỘC</p><h2 className="!mt-3 font-serif text-2xl text-primary">{data.paymentStatus === 'paid' ? 'Thanh toán thành công!' : data.status === 'pending_payment' ? 'Đã tạo đơn, chờ thanh toán' : 'Đặt hàng thành công!'}</h2><p className="!mt-3 text-xs leading-7 text-stone-500">{data.status === 'pending_payment' ? 'Đơn đã được giữ hàng. Vui lòng tiếp tục thanh toán trước thời hạn để cửa hàng chuẩn bị đơn.' : 'Bạn có thể theo dõi trạng thái xử lý và giao hàng trong chi tiết đơn.'}</p><div className="!mt-6 rounded-xl bg-cream p-5 text-left"><dl className="space-y-3 text-xs">{[['Mã đơn hàng', data.orderCode], ['Người nhận', data.receiverName], ['Số điện thoại', data.receiverPhone], ['Địa chỉ', data.shippingAddress], ['Thanh toán', paymentNames[data.paymentMethod]], ['Tổng tiền', currency(data.pricing.totalAmount)]].map(([label, value]) => <div className="flex justify-between gap-4" key={label}><dt className="shrink-0 text-stone-500">{label}</dt><dd className="text-right font-medium">{value}</dd></div>)}</dl><div className="!mt-4 flex flex-wrap justify-end gap-2"><CommerceStatus value={data.status} /><CommerceStatus type="payment" value={data.paymentStatus} /></div></div>{canPayOrder(data) && <button type="button" disabled={busy} onClick={pay} className={`${purchaseButton} !mt-6`}><CreditCard size={17} />{busy ? 'Đang mở cổng thanh toán…' : `Thanh toán qua ${paymentNames[data.paymentMethod] || data.paymentMethod}`}</button>}<div className="!mt-5 flex flex-wrap justify-center gap-4"><Link className="rounded-xl border border-line px-5 py-3 text-xs font-medium text-primary" to={`/don-hang/${encodeURIComponent(data.id)}`}>Theo dõi đơn hàng</Link><Link className="px-5 py-3 text-xs text-stone-500" to="/san-pham">Tiếp tục mua sắm</Link></div></>}{(error || order.refreshError) && <p role="alert" className="!mt-4 text-xs leading-6 text-red-700">{error || order.refreshError}</p>}</section></PurchaseFrame>;
}
