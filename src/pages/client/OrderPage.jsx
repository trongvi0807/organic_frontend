import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useResource } from '@/hooks/useResource';
import { useOrderRefresh } from '@/hooks/useOrderRefresh';
import { usePaymentConfirmation } from '@/hooks/usePaymentConfirmation';
import { checkoutService } from '@/services/client/checkoutService';
import { canCancelOrder, canPayOrder, paymentNames, paymentRedirect } from '@/lib/checkout';
import { rememberPayment } from '@/lib/checkoutAttempt';
import { CommerceHeader, CommerceStatus, OrderContents, QuoteSummary, commercePanel } from '@/components/checkout/OrderUI';
import { ResourceState } from '@/components/common/ResourceState';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/dialog';
import { Select } from '@/components/ui/field';
import { errorMessage } from '@/lib/utils';

export default function OrderPage() {
  const { id } = useParams(); const { user } = useAuth();
  const detail = useResource(() => checkoutService.order(id), [id]);
  useOrderRefresh(detail.reload, { enabled: detail.data?.paymentStatus === 'pending', interval: 5000 });
  usePaymentConfirmation(detail.data?.id, detail.data?.paymentStatus);
  const methods = useResource(() => checkoutService.methods(), []);
  const [gateway, setGateway] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [cancel, setCancel] = useState(false);
  const locked = useRef(false);
  async function pay() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { const payment = await checkoutService.initiate(id, gateway || detail.data.paymentMethod); rememberPayment(user.username, payment); window.location.assign(paymentRedirect(payment)); }
    catch (err) { setError(`${errorMessage(err)} Tải lại đơn để kiểm tra phiên đang có trước khi thử lại.`); detail.reload(); }
    finally { locked.current = false; setBusy(false); }
  }
  async function cancelOrder() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { await checkoutService.cancel(id); setCancel(false); detail.reload(); toast.success('Đã hủy đơn.'); }
    catch (err) { setError(errorMessage(err)); detail.reload(); } finally { locked.current = false; setBusy(false); }
  }
  const order = !detail.loading && !detail.error ? detail.data : null;
  return <div className="container py-10"><CommerceHeader title={order?.orderCode || 'Chi tiết đơn hàng'} description="Thông tin và trạng thái được xác nhận từ hệ thống cửa hàng." /><ResourceState loading={detail.loading} error={detail.error} onRetry={detail.reload} />{order && <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_350px]"><div className="min-w-0 space-y-5"><section className={commercePanel}><OrderContents order={order} /></section><section className={commercePanel}><h2 className="!mb-4 text-lg font-semibold">Các lần thanh toán</h2>{order.payments?.length ? order.payments.map((p) => <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-0"><span className="text-sm">{paymentNames[p.gateway] || p.gateway}</span><CommerceStatus type="payment" value={p.status} /><Link className="text-xs underline" to={`/payment/result?paymentId=${encodeURIComponent(p.id)}`}>Kiểm tra kết quả</Link></div>) : <p className="text-sm text-stone-500">Chưa có phiên thanh toán trực tuyến.</p>}</section>{['delivered', 'completed'].includes(order.status) && <Link to="/danh-gia-cua-toi" className="inline-flex min-h-12 items-center rounded-xl bg-sage px-5 text-sm">Đánh giá sản phẩm đã nhận →</Link>}</div><QuoteSummary quote={order.pricing}><div className="space-y-3"><Button variant="outline" className="w-full" disabled={busy} onClick={detail.reload}>Tải lại trạng thái</Button>{canPayOrder(order) && <><ResourceState loading={methods.loading} error={methods.error} onRetry={methods.reload} /><Select aria-label="Cổng thanh toán" value={gateway || order.paymentMethod} onChange={(e) => setGateway(e.target.value)} disabled={busy}>{Object.entries(paymentNames).filter(([name]) => name !== 'cod').map(([name, label]) => <option key={name} value={name} disabled={!methods.data?.[name]}>{label}{!methods.data?.[name] ? ' (chưa bật)' : ''}</option>)}</Select><Button className="w-full" onClick={pay} disabled={busy || methods.loading || !!methods.error || !methods.data?.[gateway || order.paymentMethod]}>{busy ? 'Đang tạo phiên…' : 'Tiếp tục thanh toán'}</Button><p className="text-xs leading-6 text-stone-500">Phiên VNPay còn hiệu lực có thể chưa hủy/đổi cổng được. Không thanh toán qua nhiều đường dẫn cùng lúc.</p></>}{canCancelOrder(order) && <Button variant="ghost" className="w-full" disabled={busy} onClick={() => setCancel(true)}>Yêu cầu hủy đơn</Button>}</div></QuoteSummary></div>}{error && <p role="alert" className="!mt-5 rounded-xl bg-red-50 p-5 text-sm leading-6 text-red-800">{error}</p>}<Modal open={cancel} onOpenChange={(value) => { if (!busy) setCancel(value); }} title="Hủy đơn hàng?" description="Backend sẽ kiểm tra điều kiện hủy và đóng phiên thanh toán nếu cổng hỗ trợ. Đơn đã thu tiền cần nhân viên đối soát."><div className="form-actions"><Button variant="outline" disabled={busy} onClick={() => setCancel(false)}>Giữ đơn</Button><Button disabled={busy} onClick={cancelOrder}>Xác nhận hủy</Button></div></Modal></div>;
}
