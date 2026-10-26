import { describe, expect, it } from 'vitest';
import { canEditOrder, canEditReceipt, orderPayload, receiptLines, receiptPayload } from './procurement';

const order = { supplierId: 's', note: '', expectedDeliveryDate: '', items: [{ variantId: 'v', quantity: '10', unitPrice: '12500.50' }] };
const receipt = { purchaseOrderId: 'o', note: '', items: [{ purchaseOrderDetailId: 'line', quantityOrdered: 10, quantityReceived: '8', quantityRejected: '1', discrepancyReason: '1 hỏng, thiếu 1; đã thống nhất đóng đơn', batchCode: ' LOT ', manufactureDate: '', expiryDate: '2099-01-01', originDescription: '' }] };
describe('Procurement business safeguards', () => {
  it('sends agreed buying price, whole package quantities and only request fields', () => {
    expect(orderPayload(order)).toEqual({ supplierId: 's', note: null, expectedDeliveryDate: null, items: [{ variantId: 'v', quantity: 10, unitPrice: 12500.5 }] });
  });
  it('rejects duplicate variants and fractional quantities', () => {
    expect(() => orderPayload({ ...order, items: [...order.items, ...order.items] })).toThrow('không lặp');
    expect(() => orderPayload({ ...order, items: [{ ...order.items[0], quantity: '1.5' }] })).toThrow('nguyên');
  });
  it('rejects zero price, excessive precision and past delivery dates', () => {
    for (const unitPrice of ['0', '-1', '12.555']) expect(() => orderPayload({ ...order, items: [{ ...order.items[0], unitPrice }] })).toThrow('giá mua');
    expect(() => orderPayload({ ...order, expectedDeliveryDate: '2000-01-01' })).toThrow('quá khứ');
  });
  it('retains all order lines including completely rejected lines and strips UI fields', () => {
    const rejected = { ...receipt.items[0], quantityReceived: '0', quantityRejected: '10', batchCode: 'ignored', expiryDate: '' };
    expect(receiptPayload({ ...receipt, items: [rejected] }).items[0]).toEqual({ purchaseOrderDetailId: 'line', quantityReceived: 0, quantityRejected: 10, discrepancyReason: rejected.discrepancyReason, batchCode: null, manufactureDate: null, expiryDate: null, originDescription: null });
    expect(receiptPayload(receipt).items[0].batchCode).toBe('LOT');
  });
  it('requires discrepancy agreement even if received + rejected equals ordered', () => {
    expect(() => receiptPayload({ ...receipt, items: [{ ...receipt.items[0], quantityReceived: 9, quantityRejected: 1, discrepancyReason: '' }] })).toThrow('thỏa thuận');
  });
  it('prevents over receipt, fractions, missing lot and expired stock', () => {
    for (const patch of [{ quantityReceived: 10, quantityRejected: 1 }, { quantityReceived: 1.1 }, { batchCode: '' }, { expiryDate: '2000-01-01' }, { manufactureDate: '2100-01-01' }]) expect(() => receiptPayload({ ...receipt, items: [{ ...receipt.items[0], ...patch }] })).toThrow();
  });
  it('maps edited receipt lines by order detail ID rather than list index', () => {
    const lines = receiptLines({ items: [{ id: 'a', quantityOrdered: 5 }, { id: 'b', quantityOrdered: 7 }] }, { items: [{ purchaseOrderDetailId: 'b', quantityReceived: 3, quantityRejected: 4, batch: { batchCode: 'B' } }] });
    expect(lines.map((l) => l.quantityReceived)).toEqual([5, 3]); expect(lines[1].batchCode).toBe('B');
  });
  it('locks received/cancelled orders and every order with a receipt', () => {
    expect(canEditOrder({ status: 'approved', goodsReceiptId: 'g' })).toBe(false);
    expect(canEditOrder({ status: 'received' })).toBe(false);
    expect(canEditOrder({ status: 'approved' })).toBe(true);
    expect(canEditReceipt({ status: 'pending_approval' })).toBe(false);
    expect(canEditReceipt({ status: 'rejected' })).toBe(true);
  });
});
