import { describe, expect, it } from 'vitest';
import { createDemoOrders } from '@/constants/demoOrders';
import { cancellationEligibility, cancellationPayload, filterOrders, isCompleted, orderBadge, orderDateTime, orderProgress, paymentBadge, validateCancellation } from './customerOrders';

describe('Customer order rules and truthful payment states', () => {
  const orders = createDemoOrders();
  it('keeps pending payment, COD collection and refunds distinct from completed', () => {
    expect(orderBadge(orders[0])[0]).toBe('Chờ thanh toán');
    expect(paymentBadge(orders[0])[0]).toBe('Chờ thanh toán');
    expect(paymentBadge(orders[1])[0]).toBe('Chưa thu tiền · COD');
    expect(orderBadge(orders[7])[0]).toBe('Đã hủy · Chờ hoàn tiền');
    expect(paymentBadge(orders[7])[0]).toBe('Chờ hoàn tiền');
    expect(isCompleted(orders[10])).toBe(false);
    expect(isCompleted(orders[5])).toBe(true);
    expect(orderBadge({ status: 'future_status' })[0]).toBe('Chưa xác định trạng thái');
  });
  it('searches business codes and accent-insensitive product names, never technical IDs', () => {
    expect(filterOrders(orders, { search: '#OM261028' }).map((order) => order.id)).toEqual(['demo-order-1']);
    expect(filterOrders(orders, { search: 'ca rot' }).length).toBeGreaterThan(0);
    expect(filterOrders(orders, { search: 'demo-order-1' })).toEqual([]);
  });
  it('combines status and inclusive local-date range correctly', () => {
    expect(filterOrders(orders, { tab: 'preparing', from: '2026-10-25', to: '2026-10-26' }).map((order) => order.status)).toEqual(['confirmed', 'preparing']);
    expect(filterOrders(orders, { tab: 'completed' }).every(isCompleted)).toBe(true);
    expect(filterOrders(orders, { tab: 'returns' }).map((order) => order.id)).toEqual(['demo-order-8', 'demo-order-9']);
  });
  it('formats local Spring timestamps and UTC timestamps as dd-mm-yyyy • HH:mm', () => {
    expect(orderDateTime('2026-10-28T08:30:00')).toBe('28-10-2026 • 08:30');
    expect(orderDateTime('2026-10-27T18:30:00Z')).toBe('28-10-2026 • 01:30');
  });
  it('does not infer missing confirmation and preparation dates from creation date', () => {
    const progress = orderProgress({ ...orders[4], confirmedAt: undefined, preparingAt: undefined });
    expect(progress.stage).toBe(2); expect(progress.steps[0].date).toBeUndefined(); expect(progress.steps[1].date).toBeUndefined();
    expect(progress.steps[2].date).toBe('2026-10-24T11:00:00+07:00');
    expect(orderProgress(orders[9]).stopped).toBe(true);
    expect(orderProgress(orders[9]).reason).toContain('Không liên hệ được');
  });
  it.each(['preparing', 'shipping', 'delivered', 'completed', 'cancelled', 'expired', 'failed'])('does not offer cancellation for %s', (status) => {
    expect(cancellationEligibility({ ...orders[1], status }, true).visible).toBe(false);
  });
  it('allows unpaid early cancellation but prevents paid cancellation on the existing real contract', () => {
    expect(cancellationEligibility(orders[11]).allowed).toBe(true);
    expect(cancellationEligibility(orders[2]).visible).toBe(true);
    expect(cancellationEligibility(orders[2]).allowed).toBe(false);
    expect(cancellationEligibility(orders[2], true).allowed).toBe(true);
    expect(cancellationEligibility({ ...orders[11], paymentStatus: 'requires_review' }).visible).toBe(false);
  });
  it('blocks stale order states once any shipment has been handed over', () => {
    expect(cancellationEligibility({ ...orders[11], shipments: [{ status: 'in_transit' }] }, true).visible).toBe(false);
    expect(cancellationEligibility({ ...orders[11], shipments: [{ status: 'delivered', shippedAt: '2026-10-20' }, { status: 'pending', bookedAt: '2026-10-28' }] }, true).visible).toBe(false);
  });
  it('requires a reason and an explanation for Other, and validates refund fields', () => {
    expect(validateCancellation({}, false).reason).toBeTruthy();
    expect(validateCancellation({ reason: 'other', otherReason: '  ' }, false).otherReason).toContain('cụ thể');
    const errors = validateCancellation({ reason: 'address', accountNumber: '-1', phone: '123', bank: 'Bank text' }, true);
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(['accountHolder', 'accountNumber', 'phone', 'branch', 'bank']));
    const valid = { reason: 'other', otherReason: ' Đổi kế hoạch ', accountHolder: 'KHACH MO PHONG', accountNumber: '1234567890', bank: 'Khác', otherBank: 'Ngan hang mau', branch: 'Tan Phu', phone: '0900000000' };
    expect(validateCancellation(valid, true)).toEqual({});
    expect(cancellationPayload(valid, true).refundAccount.bank).toBe('Ngan hang mau');
    expect(cancellationPayload(valid, true).reason).toBe('Đổi kế hoạch');
    expect(cancellationPayload({ reason: 'address' }, false)).not.toHaveProperty('refundAccount');
  });
  it('keeps mock line discounts and the payable total consistent', () => {
    orders.forEach(({ pricing }) => expect(pricing.items.reduce((sum, item) => sum + item.lineAmount - item.discountAmount, 0) + pricing.shippingFee).toBe(pricing.totalAmount));
  });
});
