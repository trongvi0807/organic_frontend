import { checkoutService } from './checkoutService';
const returnFlights = new Map(), acceptedReturns = new Set();

// Keep every signed vnp_ field and reject duplicates rather than silently picking one.
// No URL status is ever used as the persisted payment status in the browser.
export function vnpayReturnQuery(search = '') {
  const fields = new URLSearchParams();
  for (const [name, value] of new URLSearchParams(search)) {
    if (!name.startsWith('vnp_')) continue;
    if (fields.has(name)) throw new Error('Kết quả VNPay có tham số bị lặp. Vui lòng mở đơn hàng để kiểm tra.');
    fields.append(name, value);
  }
  const hasResult = [...fields.keys()].some((name) => name !== 'vnp_TxnRef');
  if (!hasResult) return '';
  for (const name of ['vnp_TxnRef', 'vnp_Amount', 'vnp_TmnCode', 'vnp_ResponseCode', 'vnp_TransactionStatus', 'vnp_SecureHash']) {
    if (!fields.get(name)) throw new Error('Thiếu thông tin xác minh kết quả VNPay. Vui lòng mở đơn hàng để kiểm tra, không thanh toán lại nếu đã bị trừ tiền.');
  }
  return fields.toString();
}

async function confirmReturn(username, queryString) {
  const key = `${username}:${queryString}`;
  // Polling after one accepted return is read-only, including a pending response.
  if (acceptedReturns.has(key)) return null;
  if (!returnFlights.has(key)) {
    const pending = checkoutService.confirmVnpayReturn(queryString).then((payment) => {
      if (payment?.gateway !== 'vnpay' || !payment.id || !payment.orderId || !payment.status) {
        throw new Error('Chưa nhận được kết quả xác minh VNPay hợp lệ. Vui lòng kiểm tra lại.');
      }
      if (acceptedReturns.size >= 64) acceptedReturns.delete(acceptedReturns.values().next().value);
      acceptedReturns.add(key);
      return payment;
    });
    returnFlights.set(key, pending);
    pending.finally(() => { if (returnFlights.get(key) === pending) returnFlights.delete(key); }).catch(() => {});
  }
  return returnFlights.get(key);
}

export async function resolvePaymentReturn({ username, reference, paymentId, returnQuery = '' }) {
  if (reference && !/^[a-f0-9]{32}$/i.test(reference)) {
    throw new Error('Tham chiếu VNPay không hợp lệ. Mở đơn hàng để kiểm tra giao dịch.');
  }
  const queryString = vnpayReturnQuery(returnQuery);
  if (queryString) {
    if (!reference || new URLSearchParams(queryString).get('vnp_TxnRef') !== reference) {
      throw new Error('Kết quả VNPay không khớp tham chiếu đang xem.');
    }
    const verified = await confirmReturn(username, queryString);
    if (verified) return verified;
  }
  // Resolve even after the redirect URL is cleared, or browser storage is lost.
  if (reference) return checkoutService.vnpayByReference(reference);
  return paymentId ? checkoutService.payment(paymentId) : null;
}
