import { paymentReferenceFromUrl } from './paymentReturn';
const storageKey = (username) => `moc.checkout.attempt:${username}`;
export function readAttempt(username) {
  try { return JSON.parse(sessionStorage.getItem(storageKey(username))) || null; } catch { return null; }
}
export function saveAttempt(username, value) {
  // A durable key is mandatory before an order request can leave the browser.
  try { sessionStorage.setItem(storageKey(username), JSON.stringify(value)); }
  catch { throw new Error('Trình duyệt không lưu được mã chống đặt trùng. Cho phép lưu trữ phiên rồi thử lại.'); }
}
export function clearAttempt(username) { try { sessionStorage.removeItem(storageKey(username)); } catch { /* Order already exists. */ } }
export function rememberPayment(username, payment) {
  try {
    const reference = paymentReferenceFromUrl(payment);
    const value = { id: payment.id, orderId: payment.orderId, reference };
    sessionStorage.setItem(`moc.payment:${username}`, JSON.stringify(value));
    if (reference) sessionStorage.setItem(`moc.payment.reference:${username}:${reference}`, JSON.stringify(value));
  }
  catch { throw new Error('Không lưu được tham chiếu thanh toán. Mở lại đơn hàng để tiếp tục.'); }
}
export function lastPayment(username) { try { return JSON.parse(sessionStorage.getItem(`moc.payment:${username}`)) || null; } catch { return null; } }
export function paymentByReference(username, reference) { try { const value = JSON.parse(sessionStorage.getItem(`moc.payment.reference:${username}:${reference}`)); return value?.reference === reference ? value : null; } catch { return null; } }
