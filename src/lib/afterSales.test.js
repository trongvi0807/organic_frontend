import { expect, it, vi } from 'vitest';
import { decisionPayload, keyedOperation, supportHistoryText, supportSystemText, validateSupportFiles, warehousePayload } from './afterSales';

const detail = { request: { proposalVersion: 3, order: { status: 'completed', paymentStatus: 'paid' } }, items: [
  { id: 'request-line', productName: 'Cà rốt hữu cơ', requestedQuantity: 2, policyReviewRequired: true },
  { id: 'request-line-2', productName: 'Táo hữu cơ', requestedQuantity: 1, policyReviewRequired: false },
] };
const values = { 'request-line': { quantity: 1, type: 'return_refund', amount: '', returnRequired: false }, 'request-line-2': { quantity: 0, type: 'refund', amount: 0 } };

it('keeps the proposal version, sends every request-detail line and leaves refund caps to the server', () => {
  expect(decisionPayload(detail, values, 'Đã kiểm tra', 'Bao bì còn nguyên')).toEqual({
    expectedProposalVersion: 3, note: 'Đã kiểm tra', policyNote: 'Bao bì còn nguyên', items: [
      { detailId: 'request-line', approvedQuantity: 1, resolutionType: 'return_refund', returnRequired: true, refundAmount: null },
      { detailId: 'request-line-2', approvedQuantity: 0, resolutionType: null, returnRequired: false, refundAmount: null },
    ],
  });
});
it('rejects fractional/excessive quantities, missing policy and refunds on unpaid orders', () => {
  expect(() => decisionPayload(detail, values, 'Kiểm tra', '')).toThrow('chính sách');
  for (const quantity of [-1, 1.5, 3, '']) expect(() => decisionPayload(detail, { ...values, 'request-line': { ...values['request-line'], quantity } }, 'Kiểm tra', 'Có căn cứ')).toThrow('Số lượng');
  expect(() => decisionPayload({ ...detail, request: { ...detail.request, order: { status: 'delivered', paymentStatus: 'pending' } } }, values, 'Kiểm tra', 'Có căn cứ')).toThrow('chưa ghi nhận thanh toán');
});
it('never combines an exchange with a refund or allows collecting cancelled orders', () => {
  const exchange = { ...values, 'request-line': { quantity: 1, type: 'exchange', amount: 20000, returnRequired: true } };
  expect(decisionPayload(detail, exchange, 'Đổi cùng hàng', 'Có căn cứ').items[0]).toEqual(expect.objectContaining({ resolutionType: 'exchange', refundAmount: null, returnRequired: true }));
  expect(() => decisionPayload({ ...detail, request: { ...detail.request, order: { status: 'cancelled', paymentStatus: 'paid' } } }, values, 'Kiểm tra', 'Có căn cứ')).toThrow('Đơn đã hủy');
});

const line = { returnRequestDetailId: 'request-detail', returnRequired: true, remainingToReceive: 3, originalAllocations: [{ id: 'allocation', batchCode: 'LOT-01', availableToIdentify: 2 }] };
const item = { version: 7, uninspectedQuantity: 3, passedHeldQuantity: 2, failedHeldQuantity: 1 };
it('uses original shipment allocation and request-detail IDs when receiving returned goods', () => {
  expect(warehousePayload('receive', { note: 'Đã nhận', quantity: 2, allocation: 'allocation' }, null, line)).toEqual({ returnRequestDetailId: 'request-detail', originalOrderDetailBatchId: 'allocation', quantity: 2, note: 'Đã nhận' });
  expect(() => warehousePayload('receive', { note: 'Đã nhận', quantity: 3, allocation: 'allocation' }, null, line)).toThrow('lô gốc');
  expect(() => warehousePayload('receive', { note: 'Đã nhận', quantity: 1, allocation: 'batch-id' }, null, line)).toThrow('không thuộc');
});
it('validates incremental inspection and disposal quantities with the latest receipt version', () => {
  expect(warehousePayload('inspect', { passed: 2, failed: 1, note: 'Đã kiểm' }, item)).toEqual({ expectedVersion: 7, note: 'Đã kiểm', passedQuantity: 2, failedQuantity: 1 });
  expect(() => warehousePayload('inspect', { passed: 2, failed: 2, note: 'Đã kiểm' }, item)).toThrow('Tổng số lượng');
  expect(() => warehousePayload('dispose', { passed: 0, failed: 2, note: 'Đã loại bỏ' }, item)).toThrow('Số lượng');
  expect(() => warehousePayload('restock', { quantity: -1, note: 'Nhập lại' }, item)).toThrow('Số lượng');
  expect(warehousePayload('reinspect', { from: 'failed', quantity: 1, note: 'Kiểm tra lại' }, item)).toEqual({ expectedVersion: 7, note: 'Kiểm tra lại', from: 'failed', quantity: 1 });
});
it('keeps an uncertain operation key instead of sending a changed operation under a new key', () => {
  vi.stubGlobal('crypto', { randomUUID: () => 'same-key' });
  const operation = keyedOperation(), body = { quantity: 2, expectedVersion: 7 };
  expect(operation.prepare(body)).toBe('same-key'); expect(operation.prepare({ ...body })).toBe('same-key');
  expect(() => operation.prepare({ quantity: 3, expectedVersion: 7 })).toThrow('chưa rõ kết quả');
  operation.clear(); expect(operation.prepare({ quantity: 3, expectedVersion: 8 })).toBe('same-key');
  vi.unstubAllGlobals();
});
it('validates evidence formats, sizes and per-message limits', () => {
  const image = { type: 'image/png', size: 1024 };
  expect(validateSupportFiles([image])).toBe('');
  expect(validateSupportFiles(Array(6).fill(image))).toContain('5 ảnh');
  expect(validateSupportFiles([{ type: 'video/mp4', size: 51 * 1024 * 1024 }])).toContain('50 MB');
  expect(validateSupportFiles([{ type: 'application/pdf', size: 100 }])).toContain('Chỉ nhận');
});
it('renders audit snapshots as explanations without showing technical IDs', () => {
  const snapshot = JSON.stringify({ receiptItemId: 'private-id', input: { originalOrderDetailBatchId: 'allocation-id' }, note: 'Đã nhận đủ', received: 2, passed: 1, failed: 1 });
  const text = supportHistoryText(snapshot);
  expect(text).toContain('Đã nhận đủ'); expect(text).toContain('Đạt: 1'); expect(text).not.toContain('private-id'); expect(text).not.toContain('allocation-id');
  const system = supportSystemText('RR-01 / goods_received / aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee: Đã nhận');
  expect(system).toContain('Nhận hàng'); expect(system).not.toContain('aaaaaaaa');
  expect(supportSystemText('Trạng thái: pending -> processing. Đã nhận việc.')).toContain('Đang xử lý');
  expect(supportHistoryText('Bao bì {500 g}')).toBe('Bao bì {500 g}');
});
