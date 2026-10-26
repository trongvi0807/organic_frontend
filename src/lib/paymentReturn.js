export function paymentReferenceFromUrl(payment) {
  if (payment.gateway !== 'vnpay' || !payment.paymentUrl) return '';
  try { return new URL(payment.paymentUrl).searchParams.get('vnp_TxnRef') || ''; } catch { return ''; }
}
