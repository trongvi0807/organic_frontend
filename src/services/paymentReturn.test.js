import { beforeEach, expect, it, vi } from 'vitest';

vi.mock('./client/checkoutService', () => ({ checkoutService: {
  payment: vi.fn(), vnpayByReference: vi.fn(), confirmVnpayReturn: vi.fn(),
} }));
import { checkoutService } from './client/checkoutService';
import { resolvePaymentReturn, vnpayReturnQuery } from './client/paymentReturnService';

const reference = '1de42a5243284c20b999eb030ad6fee8';
const pending = { id: 'payment-1', orderId: 'order-1', gateway: 'vnpay', status: 'pending', paymentUrl: null };
let sequence = 0;
function signedQuery(overrides = {}) {
  return new URLSearchParams({
    vnp_TxnRef: reference, vnp_Amount: '6000000', vnp_TmnCode: 'MERCHANT',
    vnp_ResponseCode: '00', vnp_TransactionStatus: '00', vnp_TransactionNo: '15715629',
    vnp_OrderInfo: 'Thanh toan don hang', vnp_PayDate: '20261029120000',
    vnp_SecureHash: sequence.toString(16).padStart(128, 'a'), ...overrides,
  }).toString();
}
beforeEach(() => {
  vi.resetAllMocks(); sequence += 1;
  checkoutService.vnpayByReference.mockResolvedValue(pending);
  checkoutService.payment.mockResolvedValue(pending);
});

it('finds a paid VNPay attempt by reference without browser storage or paymentUrl', async () => {
  checkoutService.vnpayByReference.mockResolvedValue({ ...pending, status: 'paid' });
  expect((await resolvePaymentReturn({ username: 'customer', reference })).status).toBe('paid');
  expect(checkoutService.vnpayByReference).toHaveBeenCalledWith(reference);
  expect(checkoutService.payment).not.toHaveBeenCalled();
});
it('submits all signed return fields to verification and uses the server result', async () => {
  const returnQuery = signedQuery();
  checkoutService.confirmVnpayReturn.mockResolvedValue({ ...pending, status: 'paid' });
  const result = await resolvePaymentReturn({ username: 'customer', reference, returnQuery });
  expect(result.status).toBe('paid');
  expect(checkoutService.confirmVnpayReturn).toHaveBeenCalledWith(returnQuery);
  expect(checkoutService.vnpayByReference).not.toHaveBeenCalled();
  await resolvePaymentReturn({ username: 'customer', reference, returnQuery });
  expect(checkoutService.confirmVnpayReturn).toHaveBeenCalledTimes(1);
  expect(checkoutService.vnpayByReference).toHaveBeenCalledWith(reference);
});
it('never turns browser 00 codes into paid when the verified result is pending or requires review', async () => {
  for (const status of ['pending', 'requires_review']) {
    checkoutService.confirmVnpayReturn.mockResolvedValue({ ...pending, status });
    const result = await resolvePaymentReturn({ username: status, reference, returnQuery: signedQuery() });
    expect(result.status).toBe(status);
  }
});
it('shares concurrent return verification and allows retry after an error', async () => {
  const returnQuery = signedQuery();
  let finish;
  checkoutService.confirmVnpayReturn.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
  const one = resolvePaymentReturn({ username: 'customer', reference, returnQuery });
  const two = resolvePaymentReturn({ username: 'customer', reference, returnQuery });
  expect(checkoutService.confirmVnpayReturn).toHaveBeenCalledTimes(1);
  finish({ ...pending, status: 'paid' });
  expect((await Promise.all([one, two])).map((p) => p.status)).toEqual(['paid', 'paid']);

  const error = new Error('Chữ ký không hợp lệ');
  checkoutService.confirmVnpayReturn.mockRejectedValueOnce(error).mockResolvedValueOnce(pending);
  const retryQuery = signedQuery({ vnp_BankCode: 'NCB' });
  await expect(resolvePaymentReturn({ username: 'customer', reference, returnQuery: retryQuery })).rejects.toBe(error);
  await expect(resolvePaymentReturn({ username: 'customer', reference, returnQuery: retryQuery })).resolves.toEqual(pending);
  expect(checkoutService.vnpayByReference).not.toHaveBeenCalled();
});
it('does not bypass a rejected signature with an optimistic status or another payment', async () => {
  const rejected = { response: { status: 400 } };
  checkoutService.confirmVnpayReturn.mockRejectedValue(rejected);
  await expect(resolvePaymentReturn({ username: 'customer', reference, paymentId: 'other', returnQuery: signedQuery() })).rejects.toBe(rejected);
  expect(checkoutService.vnpayByReference).not.toHaveBeenCalled();
  expect(checkoutService.payment).not.toHaveBeenCalled();
});
it('rejects duplicate, incomplete, malformed and mismatched references before sending requests', async () => {
  expect(() => vnpayReturnQuery(`${signedQuery()}&vnp_Amount=1`)).toThrow('bị lặp');
  expect(() => vnpayReturnQuery(`vnp_TxnRef=${reference}&vnp_ResponseCode=00`)).toThrow('Thiếu');
  await expect(resolvePaymentReturn({ reference: 'invalid/../reference' })).rejects.toThrow('không hợp lệ');
  await expect(resolvePaymentReturn({ reference: 'b'.repeat(32), returnQuery: signedQuery() })).rejects.toThrow('không khớp');
  expect(checkoutService.confirmVnpayReturn).not.toHaveBeenCalled();
  expect(checkoutService.vnpayByReference).not.toHaveBeenCalled();
});
it('preserves signed values while excluding unrelated UI parameters', () => {
  const signed = signedQuery({ vnp_OrderInfo: 'Nội dung + ký tự & dấu' });
  expect(vnpayReturnQuery(`?${signed}&paymentId=untrusted&status=paid`)).toBe(signed);
  expect(vnpayReturnQuery(`vnp_TxnRef=${reference}`)).toBe('');
});
it('uses payment UUID for legacy order links and propagates a reference lookup outage', async () => {
  await resolvePaymentReturn({ username: 'customer', paymentId: 'payment-1' });
  expect(checkoutService.payment).toHaveBeenCalledWith('payment-1');
  const outage = { response: { status: 500 } };
  checkoutService.vnpayByReference.mockRejectedValue(outage);
  await expect(resolvePaymentReturn({ username: 'customer', reference })).rejects.toBe(outage);
  expect(checkoutService.payment).toHaveBeenCalledTimes(1);
});
