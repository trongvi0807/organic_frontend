import { expect, it } from 'vitest';
import { executionPayload } from './returnExecution';
import { supportHistoryText } from './afterSales';

const data = { proposalVersion: 4, remainingRefundAmount: 50000, payments: [{ id: 'paid-vnpay', canRefundToOriginal: true }] };
const online = { amount: 20000, refundMethod: 'original_payment', paymentId: 'paid-vnpay', note: 'Khách đã đồng ý' };
it('does not require a fictitious bank-transfer attestation for an automatic VNPay refund', () => {
  expect(executionPayload('refund', online, data)).toEqual({ proposalVersion: 4, amount: 20000, refundMethod: 'original_payment', originalPaymentId: 'paid-vnpay', confirmedTransferred: false, note: 'Khách đã đồng ý' });
});
it('rejects excess/fractional/negative amounts and unconfirmed manual payouts', () => {
  for (const amount of [0, -1, 1.5, 50001, '']) expect(() => executionPayload('refund', { ...online, amount }, data)).toThrow('Tiền hoàn');
  expect(() => executionPayload('refund', { ...online, refundMethod: 'cash', referenceCode: 'PT-123' }, data)).toThrow('hoàn tiền thực tế');
  expect(() => executionPayload('refund', { ...online, paymentId: 'unpaid' }, data)).toThrow('đã thu tiền');
});
it('sends a real manual receipt and recipient details, while keeping the server proposal version', () => {
  const input = { ...online, refundMethod: 'bank_transfer', confirmed: true, referenceCode: ' CK-123 ', recipientName: ' Nguyễn Văn An ', bankName: 'Vietcombank', bankAccountNumber: '123456789' };
  expect(executionPayload('refund', input, data)).toEqual(expect.objectContaining({ proposalVersion: 4, confirmedTransferred: true, referenceCode: 'CK-123', recipientName: 'Nguyễn Văn An', bankName: 'Vietcombank', bankAccountNumber: '123456789' }));
  expect(() => executionPayload('refund', { ...input, bankAccountNumber: 'abc' }, data)).toThrow('Số tài khoản');
});
it('requires exact money and independent evidence when reconciling a refund', () => {
  const values = { amount: 20000, outcome: 'succeeded', evidenceSource: 'merchant_portal', referenceCode: 'VNP-123', confirmed: true, note: 'Đã kiểm tra tại cổng' };
  expect(executionPayload('reconcile', values, data, { amount: 20000 })).toEqual({ outcome: 'succeeded', confirmedAmount: 20000, evidenceSource: 'merchant_portal', referenceCode: 'VNP-123', confirmed: true, note: 'Đã kiểm tra tại cổng' });
  expect(() => executionPayload('reconcile', { ...values, amount: 19999 }, data, { amount: 20000 })).toThrow('trùng chính xác');
  expect(() => executionPayload('reconcile', { ...values, confirmed: false }, data, { amount: 20000 })).toThrow('đối chiếu');
});
it('never sends client-chosen products or prices when creating a replacement', () => {
  expect(executionPayload('replacement', { receiverName: 'Khách hàng', receiverPhone: '0344855913', shippingAddress: '36 Trịnh Đình Trọng', note: 'Giao hàng đổi', items: [{ variantId: 'other', price: 1 }] }, data)).toEqual({ proposalVersion: 4, receiverName: 'Khách hàng', receiverPhone: '0344855913', shippingAddress: '36 Trịnh Đình Trọng', note: 'Giao hàng đổi' });
  expect(() => executionPayload('shipmentStatus', { shipmentStatus: 'delivered', note: 'Đã giao' }, data, null, { status: 'pending' })).toThrow('Trạng thái');
});
it('does not render internal execution IDs from an audit snapshot', () => {
  const text = supportHistoryText(JSON.stringify({ execution: true, refundId: 'internal-id', note: 'Đã hoàn đúng số tiền' }));
  expect(text).toBe('Đã hoàn đúng số tiền'); expect(text).not.toContain('internal-id');
});
