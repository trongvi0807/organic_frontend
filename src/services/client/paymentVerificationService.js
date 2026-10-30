import { checkoutService } from './checkoutService';

export const gatewayVerificationDelay = { stripe: 15000, paypal: 20000, vnpay: 300000 };
const checks = new Map();
export const awaitingPayment = (payment) => ['pending', 'creating', 'capturing', 'closing'].includes(payment?.status);

export function mayCapturePaypal(payment, returnQuery, cancelled) {
  if (cancelled || payment?.gateway !== 'paypal' || !['pending', 'capturing'].includes(payment.status)) return false;
  const params = new URLSearchParams(returnQuery);
  // Return parameters only select the workflow. The server checks ownership, actual
  // PayPal approval, amount and capture result; none of these parameters means paid.
  return payment.status === 'capturing' || params.get('gateway') === 'paypal' && !!params.get('token');
}

function matchingPayment(result, original) {
  if (!result || result.id !== original.id || result.orderId !== original.orderId || result.gateway !== original.gateway || !result.status) {
    throw new Error('Kết quả xác minh không khớp giao dịch đang xem. Vui lòng mở lại chi tiết đơn hàng.');
  }
  return result;
}

export async function verifyReturnedPayment({ username, payment, returnQuery = '', cancelled = false }) {
  if (!payment?.id || !awaitingPayment(payment) || !gatewayVerificationDelay[payment.gateway] || payment.status === 'creating') return payment;
  const capture = mayCapturePaypal(payment, returnQuery, cancelled);
  const key = `${username}:${payment.id}:${capture ? 'capture' : 'sync'}`;
  const now = Date.now();
  for (const [name, entry] of checks) if (!entry.flight && now - entry.touched > 600000) checks.delete(name);
  const prior = checks.get(key);
  if (prior?.flight) return prior.flight;
  if (prior && now < prior.nextAt) return prior.result || payment;
  const entry = { touched: now, nextAt: now + gatewayVerificationDelay[payment.gateway], result: null };
  const flight = (async () => {
    let result = matchingPayment(await checkoutService.sync(payment.id), payment);
    if (capture && ['pending', 'capturing'].includes(result.status)) result = matchingPayment(await checkoutService.capture(payment.id), payment);
    entry.result = result;
    return result;
  })();
  entry.flight = flight; checks.set(key, entry);
  try { return await flight; }
  finally { entry.flight = null; entry.touched = Date.now(); }
}
