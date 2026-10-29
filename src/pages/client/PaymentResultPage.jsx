import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { checkoutService } from '@/services/client/checkoutService';
import { useResource } from '@/hooks/useResource';
import { useOrderRefresh } from '@/hooks/useOrderRefresh';
import { usePaymentConfirmation } from '@/hooks/usePaymentConfirmation';
import { resolvePaymentReturn } from '@/services/client/paymentReturnService';
import { PurchaseFrame, purchasePanel } from '@/components/checkout/PurchaseFrame';
import { CommerceStatus } from '@/components/checkout/OrderUI';
import { ResourceState } from '@/components/common/ResourceState';
import { Button } from '@/components/ui/button';
import { errorMessage } from '@/lib/utils';

export default function PaymentResultPage({ cancelled = false }) {
  const { user } = useAuth(), [params] = useSearchParams();
  const reference = params.get('vnp_TxnRef') || '', explicitId = params.get('paymentId') || '';
  const returnQuery = params.toString();
  return <PaymentResultContent key={`${user.username}:${returnQuery}`} username={user.username} reference={reference} explicitId={explicitId} returnQuery={returnQuery} cancelled={cancelled} />;
}

function PaymentResultContent({ username, reference, explicitId, returnQuery, cancelled }) {
  const reconciled = useRef({ revision: 0, payment: null });
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const payment = useResource(async () => {
    const revision = reconciled.current.revision;
    const result = await resolvePaymentReturn({ username, reference, paymentId: explicitId, returnQuery });
    // A GET started before reconciliation must not overwrite its newer result.
    return revision === reconciled.current.revision ? result : reconciled.current.payment;
  }, [reference, explicitId, username, returnQuery]);
  const id = payment.data?.id, status = payment.data?.status;
  const pending = ['pending', 'creating', 'capturing', 'closing'].includes(status);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const locked = useRef(false);
  const autoSynced = useRef(new Set());
  useOrderRefresh(payment.reload, { enabled: pending && !busy, interval: 4000 });
  usePaymentConfirmation(payment.data?.orderId, status);
  const verify = useCallback(async (capture = false) => {
    if (locked.current || !id) return;
    locked.current = true; setBusy(true); setError('');
    try {
      const result = capture ? await checkoutService.capture(id) : await checkoutService.sync(id);
      if (!mounted.current) return;
      reconciled.current = { revision: reconciled.current.revision + 1, payment: result };
      payment.setData(result);
    }
    catch (e) { if (mounted.current) { setError(errorMessage(e)); payment.reload({ background: true }); } }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }, [id, payment.setData, payment.reload]);
  useEffect(() => {
    // QueryDR once for legacy links without a signed return. Polling stays read-only.
    if (!id || !pending || payment.data?.gateway !== 'vnpay' || new URLSearchParams(returnQuery).has('vnp_SecureHash') || busy) return;
    const key = `${username}:${id}`;
    if (autoSynced.current.has(key)) return;
    autoSynced.current.add(key);
    verify();
  }, [id, pending, payment.data?.gateway, returnQuery, username, busy, verify]);
  return <PurchaseFrame step={3} title={status === 'paid' ? 'Thanh toán thành công' : cancelled ? 'Bạn đã quay lại từ cổng thanh toán' : 'Kết quả thanh toán'}>
    <section className={`${purchasePanel} !mx-auto max-w-2xl p-6 text-center sm:p-10`}>
      <ResourceState loading={payment.loading} error={payment.error} onRetry={payment.reload} />
      {!reference && !explicitId && <p className="text-sm leading-7">Không tìm thấy mã giao dịch. Mở đơn hàng để chọn lần thanh toán cần kiểm tra.</p>}
      {!payment.loading && !payment.error && payment.data && <><div className={`!mx-auto !mb-5 grid size-20 place-items-center rounded-full ${status === 'paid' ? 'bg-sage text-primary' : 'bg-amber-50 text-amber-700'}`}>{status === 'paid' ? <CheckCircle2 size={42} strokeWidth={1.5} /> : pending ? <LoaderCircle size={35} className="animate-spin motion-reduce:animate-none" /> : <Clock3 size={36} />}</div><div className="!mb-4 flex flex-wrap items-center justify-center gap-3"><strong className="text-sm uppercase">{payment.data.gateway}</strong><CommerceStatus type="payment" value={status} /></div><h2 className="font-serif text-2xl text-primary">{status === 'paid' ? 'Cảm ơn bạn đã thanh toán!' : pending ? 'Đang chờ xác nhận giao dịch' : 'Thông tin giao dịch của bạn'}</h2>
      <p className="!mt-4 text-sm leading-7 text-stone-500">{status === 'paid' ? 'Hệ thống đã xác minh thanh toán. Đơn hàng được cập nhật tự động và chuyển đến cửa hàng để chuẩn bị.' : status === 'requires_review' ? 'Giao dịch này cần cửa hàng đối chiếu trước khi xử lý đơn. Vui lòng không thanh toán thêm.' : pending ? 'Trang sẽ tự cập nhật khi nhận được xác nhận từ cổng. Nếu bạn đã trả tiền, vui lòng giữ mã giao dịch và không thanh toán lại.' : cancelled ? 'Quay lại từ cổng không tự hủy đơn. Kiểm tra đơn hàng để tiếp tục hoặc yêu cầu hủy.' : 'Giao dịch chưa được xác nhận thành công. Xem chi tiết đơn để kiểm tra hướng xử lý.'}</p>
      <p className="!mt-5 rounded-xl bg-cream p-4 text-sm">Số tiền giao dịch <strong className="!ml-2 text-primary">{Number(payment.data.amount).toLocaleString('vi-VN', { maximumFractionDigits: 2 })} {payment.data.currency}</strong></p>
      {pending && payment.data.gateway === 'vnpay' && <p className="!mt-4 text-xs leading-6 text-stone-500">Hệ thống đang đối chiếu kết quả với VNPay. Nếu bạn đã bị trừ tiền, không tạo lần thanh toán mới; trạng thái đơn sẽ cập nhật ngay sau khi xác minh.</p>}
      {payment.data.failureMessage && <p className="!mt-3 text-xs text-amber-800">{payment.data.failureMessage}</p>}
      <div className="!mt-6 flex flex-wrap justify-center gap-3"><Link className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm !text-white" to={`/don-hang/${encodeURIComponent(payment.data.orderId)}`}>Theo dõi đơn hàng</Link>{status !== 'paid' && <Button variant="outline" disabled={busy} onClick={() => payment.reload({ background: true })}>Kiểm tra lại trạng thái</Button>}{!cancelled && payment.data.gateway === 'paypal' && ['pending', 'capturing'].includes(status) && <Button disabled={busy} onClick={() => verify(true)}>Xác nhận giao dịch PayPal</Button>}{pending && ['stripe', 'paypal', 'vnpay'].includes(payment.data.gateway) && <Button variant="outline" disabled={busy} onClick={() => verify()}>Đối chiếu với cổng</Button>}</div>
      <p className="!mt-5 flex items-center justify-center gap-2 text-[10px] text-stone-400"><ShieldCheck size={13} />Chỉ xác nhận thành công theo kết quả đã xác minh từ hệ thống</p></>}
      {(error || payment.refreshError) && <p className="!mt-4 text-xs leading-6 text-red-700" role="alert">{error || `Chưa lấy được trạng thái mới: ${payment.refreshError}`}</p>}
      <Link className="!mt-6 inline-block text-xs text-primary underline" to="/don-hang">Xem danh sách đơn hàng</Link>
    </section>
  </PurchaseFrame>;
}
