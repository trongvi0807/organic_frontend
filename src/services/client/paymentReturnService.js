import { checkoutService } from './checkoutService';
import { paymentByReference, rememberPayment } from '@/lib/checkoutAttempt';
import { paymentReferenceFromUrl } from '@/lib/paymentReturn';

// VNPay's return reference is not a payment UUID. Resolve it against backend-issued
// links, never against the latest arbitrary payment or a client-reported success flag.
export async function resolvePaymentReturn({ username, reference, paymentId }) {
  if (!reference) return paymentId ? checkoutService.payment(paymentId) : null;
  if (!/^[a-f0-9]{32}$/i.test(reference)) throw new Error('Tham chiếu VNPay không hợp lệ. Mở đơn hàng để kiểm tra giao dịch.');
  const cached = paymentByReference(username, reference);
  if (cached?.id) {
    try {
      const payment = await checkoutService.payment(cached.id);
      const returnedReference = paymentReferenceFromUrl(payment);
      if (payment.gateway === 'vnpay' && (!returnedReference || returnedReference === reference)) return payment;
    } catch (error) {
      if (error.response?.status !== 404) throw error;
    }
  }
  // This also recovers a return in another tab or after session mapping was lost.
  // Bound the search; an older transaction can always be opened from its own order.
  for (let page = 0; page < 10; page++) {
    const orders = await checkoutService.orders({ page, size: 50 });
    for (const order of orders.items) {
      const payment = order.payments?.find((item) => paymentReferenceFromUrl(item) === reference);
      if (payment) {
        const current = await checkoutService.payment(payment.id);
        rememberPayment(username, { ...current, paymentUrl: current.paymentUrl || payment.paymentUrl });
        return current;
      }
    }
    if (page + 1 >= (orders.totalPages || 1)) break;
  }
  throw new Error('Chưa tìm thấy giao dịch VNPay trong các đơn gần đây. Mở đúng đơn trong Đơn mua và chọn Kiểm tra kết quả; không thanh toán lại nếu đã chuyển tiền.');
}
