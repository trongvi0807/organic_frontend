import { expect, it } from 'vitest';
import { feedbackFormData, inventoryFormData, receiptFormData, returnFormData, returnReceiptFormData, saleFormData } from './businessFormData';

it('separates actual delivered, accepted and rejected amounts in receiving, and never invents an inspection document number', () => {
  const receipt = { receiptCode: 'NK-1', receiptDate: '2026-10-28', acceptedTotalAmount: 40000, items: [{ id: 'l', variant: { productId: 'p', productName: 'Rau', variantName: 'Gói' }, quantityOrdered: 10, quantityReceived: 8, quantityRejected: 1, unitPrice: 5000, acceptedAmount: 40000, discrepancyReason: 'Hỏng 1, thiếu 1' }] };
  const data = receiptFormData(receipt, {}, { products: { p: { productCode: 'SP01' } } }, 'receiving_inspection');
  expect(data.items[0]).toMatchObject({ productCode: 'SP01', quantityActual: 9, quantityReceived: 8, quantityRejected: 1 }); expect(data.documentNumber).toBeUndefined(); expect(data.createdAt).toBeUndefined();
  expect(receiptFormData(receipt, {}, {}, 'goods_receipt').documentNumber).toBe('NK-1');
  expect(receiptFormData({ ...receipt, items: [...receipt.items, { quantityRejected: 0 }] }, {}, {}, 'rejected_goods').items).toHaveLength(1);
});
it('does not turn stock balances into historical transactions, observed physical counts or approved disposal quantities', () => {
  const data = inventoryFormData([{ batchCode: 'LOT1', quantityOnHand: 50, expired: true, variant: { productName: 'Rau' } }]);
  expect(data.items[0].bookQuantity).toBe(50); expect(data.movements).toEqual([]); expect(data.items[0].countedQuantity).toBeUndefined(); expect(data.items[0].handlingQuantity).toBeUndefined(); expect(data.items[0].condition).toContain('hết hạn');
});
const order = { orderCode: 'DH-1', orderedAt: '2026-10-28', status: 'shipping', paymentMethod: 'vnpay', paymentStatus: 'pending', receiverName: 'Người nhận', pricing: { items: [{ variantId: 'v', sku: 'SKU-NOT-SP', quantity: 2, unitPrice: 60000, lineAmount: 120000, discountAmount: 20000 }], subtotal: 120000, totalAmount: 100000, promotionDiscount: 15000, pointsDiscount: 5000 }, shipments: [] };
it('keeps exact saved sales totals and treats pending payment as unverified rather than paid', () => {
  const data = saleFormData(order, undefined, 'sales_receipt'); expect(data.items[0].netAmount).toBe(100000); expect(data.totalAmount).toBe(100000); expect(data.discountTotal).toBe(20000); expect(data.paidAmount).toBeUndefined(); expect(data.paymentStates).toEqual([]); expect(data.items[0].productCode).toBeUndefined(); expect(data.customerName).toBeUndefined();
});
it('does not mistake a tracking number for a delivery form number or failed delivery for a completed warehouse return', () => {
  const data = saleFormData(order, { trackingCode: 'CARRIER-1', status: 'failed', failureReason: 'Khách vắng' }, 'delivery_failure');
  expect(data.documentNumber).toBeUndefined(); expect(data.deliveryNumber).toBeUndefined(); expect(data.items[0].returnedQuantity).toBeUndefined(); expect(data.failureReason).toBe('Khách vắng'); expect(data.deliveryResults).toEqual([]);
});
it('only marks paid and zero cash due when the backend confirms paid', () => {
  const data = saleFormData({ ...order, paymentStatus: 'paid' }, undefined, 'delivery_note'); expect(data.paidAmount).toBe(100000); expect(data.codAmount).toBe(0); expect(data.preDeliveryPayment).toEqual(['Đã thanh toán']);
});
it('does not claim an approved refund has been executed', () => {
  const data = returnFormData({ request: { requestCode: 'RT-1', approvedRefundAmount: 100000, status: 'approved' }, items: [{ requestedQuantity: 1 }] }); expect(data.approvedRefundAmount).toBe(100000); expect(data.refundStates).toEqual([]); expect(data.refundedAt).toBeUndefined(); expect(data.items[0].relatedAmount).toBeUndefined();
});
it('prints feedback without treating every order item as a complained-about product', () => {
  const data = feedbackFormData({ feedback: { feedbackCode: 'FB-1', customer: { fullName: 'Khách' } }, content: 'Giao muộn', media: [{ mediaType: 'video' }] }); expect(data.items).toEqual([]); expect(data.content).toBe('Giao muộn'); expect(data.evidenceTypes).toEqual(['Video']);
});
it('uses actual return-receipt totals without inventing an execution date or signature', () => {
  const data = returnReceiptFormData({ request: { requestCode: 'RT-1', totals: { receivedQuantity: 10, restockedQuantity: 3, pendingQuantity: 7, disposedQuantity: 0 } } }, [{ id: 'r', receivedQuantity: 10 }]); expect(data).toMatchObject({ receivedTotal: 10, restockedTotal: 3, pendingTotal: 7, disposedTotal: 0 }); expect(data.createdAt).toBeUndefined(); expect(data.handledAt).toBeUndefined();
});
