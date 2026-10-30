import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./client/checkoutService', () => ({ checkoutService: { sync: vi.fn(), capture: vi.fn() } }));
import { checkoutService } from './client/checkoutService';
import { mayCapturePaypal, verifyReturnedPayment } from './client/paymentVerificationService';
let index = 0;
const attempt = (gateway = 'stripe', status = 'pending') => ({ id: `payment-${index}`, orderId: `order-${index}`, gateway, status });
beforeEach(() => { vi.resetAllMocks(); index++; });
it('automatically uses backend synchronization for Stripe and keeps its authoritative result', async () => {
  const payment = attempt(); checkoutService.sync.mockResolvedValue({ ...payment, status: 'paid' });
  expect((await verifyReturnedPayment({ username: 'khach', payment })).status).toBe('paid');
  expect(checkoutService.sync).toHaveBeenCalledWith(payment.id); expect(checkoutService.capture).not.toHaveBeenCalled();
});
it('automatically captures an approved PayPal return only after checking for an already recorded payment', async () => {
  const payment = attempt('paypal'), returnQuery = 'gateway=paypal&token=paypal-order&PayerID=buyer';
  checkoutService.sync.mockResolvedValue(payment); checkoutService.capture.mockResolvedValue({ ...payment, status: 'paid' });
  const result = await verifyReturnedPayment({ username: 'khach', payment, returnQuery });
  expect(result.status).toBe('paid'); expect(checkoutService.sync).toHaveBeenCalledTimes(1); expect(checkoutService.capture).toHaveBeenCalledWith(payment.id);
  expect(checkoutService.sync.mock.invocationCallOrder[0]).toBeLessThan(checkoutService.capture.mock.invocationCallOrder[0]);
});
it('does not capture an already settled PayPal charge or a cancelled/unapproved return', async () => {
  const payment = attempt('paypal'); checkoutService.sync.mockResolvedValue({ ...payment, status: 'paid' });
  await verifyReturnedPayment({ username: 'khach', payment, returnQuery: 'gateway=paypal&token=approved' });
  expect(checkoutService.capture).not.toHaveBeenCalled();
  expect(mayCapturePaypal(payment, 'gateway=paypal&token=approved', true)).toBe(false);
  expect(mayCapturePaypal(payment, 'status=paid', false)).toBe(false);
  expect(mayCapturePaypal({ ...payment, status: 'capturing' }, '', false)).toBe(true);
});
it('never turns a URL success marker into payment success when the server still says pending/review', async () => {
  const payment = attempt(); checkoutService.sync.mockResolvedValue({ ...payment, status: 'requires_review' });
  expect((await verifyReturnedPayment({ username: 'khach', payment, returnQuery: 'status=paid&success=true' })).status).toBe('requires_review');
});
it('shares concurrent checks/capture attempts and does not send another charge on background rerenders', async () => {
  const payment = attempt('paypal'); let finish;
  checkoutService.sync.mockReturnValue(new Promise((resolve) => { finish = resolve; })); checkoutService.capture.mockResolvedValue({ ...payment, status: 'paid' });
  const input = { username: 'khach', payment, returnQuery: 'gateway=paypal&token=approved' };
  const one = verifyReturnedPayment(input), two = verifyReturnedPayment(input); finish(payment);
  expect((await Promise.all([one, two])).map((result) => result.status)).toEqual(['paid', 'paid']);
  await verifyReturnedPayment(input); expect(checkoutService.sync).toHaveBeenCalledTimes(1); expect(checkoutService.capture).toHaveBeenCalledTimes(1);
});
it('does not accept another payment ID or send gateway requests for terminal/creating attempts', async () => {
  const payment = attempt(); checkoutService.sync.mockResolvedValue({ ...payment, id: 'another-payment', status: 'paid' });
  await expect(verifyReturnedPayment({ username: 'khach', payment })).rejects.toThrow('không khớp');
  vi.clearAllMocks(); for (const status of ['paid', 'requires_review', 'expired', 'creating']) await verifyReturnedPayment({ username: 'khach', payment: { ...payment, status } });
  expect(checkoutService.sync).not.toHaveBeenCalled(); expect(checkoutService.capture).not.toHaveBeenCalled();
});
