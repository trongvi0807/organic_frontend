import { describe, expect, it } from 'vitest';
import { buildDashboard, categoryBreakdown, dashboardDay, dashboardRange, deliveryOutcome, documentActivities, expiryAlerts, revenueGrowth } from './adminDashboard';
import { createDashboardDemo } from '@/constants/demoDashboard';
const today = '2026-10-28';
const order = (id, day, status, paymentStatus, amount = 100000, extra = {}) => ({ id, orderedAt: `${day}T12:00:00+07:00`, status, paymentStatus, pricing: { totalAmount: amount, currency: 'VND', items: [] }, ...extra });
const ready = (data) => ({ status: 'ready', data });

describe('Dashboard periods and paid-order metrics', () => {
  it('uses Vietnamese business dates, includes both period edges and handles month/year changes', () => {
    expect(dashboardRange(today, 7)).toEqual({ start: '2026-10-22', end: today, previousStart: '2026-10-15', previousEnd: '2026-10-21', days: 7 });
    expect(dashboardRange('2026-01-02', 7).start).toBe('2025-12-27');
    expect(dashboardDay('2026-10-27T18:30:00Z')).toBe(today);
    expect(dashboardRange(today, 0).days).toBe(7);
    expect(() => dashboardRange('invalid')).toThrow('Ngày thống kê không hợp lệ');
  });
  it('never counts pending/review-required/refunded/cancelled payments as revenue and compares equal periods', () => {
    const orders = [order('a', '2026-10-22', 'confirmed', 'paid', 120000), order('b', today, 'completed', 'paid', 80000), order('c', '2026-10-21', 'completed', 'paid', 100000),
      order('d', today, 'pending_payment', 'pending'), order('e', today, 'confirmed', 'requires_review'), order('f', today, 'cancelled', 'paid'), order('g', today, 'completed', 'refunded'), order('h', today, 'completed', 'partially_refunded'),
      order('i', '2026-10-29', 'completed', 'paid')];
    const model = buildDashboard({ sources: { orders: ready(orders) } }, { today });
    expect(model.revenue).toBe(200000); expect(model.previousRevenue).toBe(100000); expect(model.growth).toBe(100);
    expect(model.currentOrders).toHaveLength(7); expect(model.chart.reduce((sum, row) => sum + row.orders, 0)).toBe(7);
    expect(model.excludedRevenueCount).toBe(1); expect(model.processing).toBe(2);
  });
  it('does not produce infinite/fictional growth when the previous period has no revenue', () => {
    expect(revenueGrowth(100000, 0)).toBeNull(); expect(revenueGrowth(null, 100)).toBeNull(); expect(revenueGrowth(0, 100)).toBe(-100); expect(revenueGrowth(0, 0)).toBeNull();
  });
  it('uses one final delivery outcome per order, excluding shipments still in transit', () => {
    const failed = order('f', today, 'shipping', 'unpaid', 100000, { shipments: [{ status: 'failed', bookedAt: today }] });
    const inTransit = order('t', today, 'shipping', 'paid', 100000, { shipments: [{ status: 'in_transit', bookedAt: today }] });
    const retry = order('r', today, 'completed', 'paid', 100000, { shipments: [{ status: 'failed', bookedAt: '2026-10-27' }, { status: 'delivered', bookedAt: today }] });
    expect(deliveryOutcome(inTransit)).toBeNull(); expect(deliveryOutcome(retry)).toBe('success');
    const model = buildDashboard({ sources: { orders: ready([failed, inTransit, retry]) } }, { today });
    expect(model.deliveryRate).toBe(50); expect(model.delivered).toBe(1); expect(model.deliveryTotal).toBe(2);
    expect(buildDashboard({ sources: { orders: ready([inTransit]) } }, { today }).deliveryRate).toBeNull();
  });
  it('leaves unavailable metrics unknown instead of displaying zeros and excludes non-VND amounts', () => {
    const model = buildDashboard({ sources: { orders: { status: 'error', data: [] }, stock: { status: 'forbidden', data: [] } } }, { today });
    expect(model.revenue).toBeNull(); expect(model.processing).toBeNull(); expect(model.warningCount).toBeNull();
    const usd = order('usd', today, 'completed', 'paid', 10, { pricing: { totalAmount: 10, currency: 'USD', items: [] } });
    expect(buildDashboard({ sources: { orders: ready([usd]) } }, { today }).revenue).toBe(0);
  });
  it('aggregates weekly chart buckets without changing totals', () => {
    const sample = createDashboardDemo(today), sources = Object.fromEntries(Object.entries(sample).map(([key, rows]) => [key, ready(rows)]));
    const daily = buildDashboard({ sources }, { today, days: 30 }), weekly = buildDashboard({ sources }, { today, days: 30, granularity: 'week' });
    expect(daily.chart).toHaveLength(30); expect(weekly.chart).toHaveLength(5);
    expect(weekly.chart.reduce((sum, row) => sum + row.revenue, 0)).toBe(daily.revenue);
    expect(weekly.chart.reduce((sum, row) => sum + row.orders, 0)).toBe(daily.currentOrders.length);
  });
});
describe('Organic stock, classification and operations', () => {
  it('warns only confirmed lots with physical stock, ordered by expiry; today is not silently treated as expired', () => {
    const batches = [{ id: 'expired', confirmed: true, quantityOnHand: 3, expiryDate: '2026-10-27' }, { id: 'today', confirmed: true, quantityOnHand: 1, expiryDate: today }, { id: 'soon', confirmed: true, quantityOnHand: 2, expiryDate: '2026-10-30' },
      { id: 'draft', confirmed: false, quantityOnHand: 10, expiryDate: today }, { id: 'empty', confirmed: true, quantityOnHand: 0, expiryDate: today }, { id: 'bad', confirmed: true, quantityOnHand: 2, expiryDate: 'invalid' }, { id: 'far', confirmed: true, quantityOnHand: 2, expiryDate: '2026-12-01' }];
    const alerts = expiryAlerts(batches, today, 7); expect(alerts.map((row) => row.id)).toEqual(['expired', 'today', 'soon']); expect(alerts[0].statusLabel).toBe('Đã quá hạn'); expect(alerts[1].expiryLabel).toBe('Hết hạn hôm nay'); expect(alerts[2].daysLeft).toBe(2);
  });
  it('joins category through product/variant IDs, never through guessed product names, and excludes shipping', () => {
    const lines = [{ variantId: 'extra-variant', productName: 'Name changed', lineAmount: 100000, discountAmount: 10000 }, { variantId: 'unknown', productName: 'Cà rốt', lineAmount: 50000, discountAmount: 0 }];
    const result = categoryBreakdown([order('o', today, 'completed', 'paid', 155000, { pricing: { totalAmount: 155000, shippingFee: 15000, items: lines } })], [{ id: 'p', defaultVariantId: 'default-v', categoryId: 'c', categoryName: 'Rau củ' }], [{ variant: { id: 'extra-variant', productId: 'p' } }]);
    expect(result.total).toBe(140000); expect(result.unclassified).toBe(50000); expect(result.entries.find((row) => row.name === 'Rau củ').value).toBe(90000);
  });
  it('does not label rejection timestamps as approvals or substitute the current user as actor', () => {
    const activities = documentActivities([{ id: 'p', orderCode: 'PO01', status: 'rejected', orderDate: `${today}T08:00`, approvedAt: `${today}T09:00`, approvedByEmployee: { fullName: 'Người từ chối' } }], [{ id: 'r', receiptCode: 'PN01', status: 'rejected', receiptDate: `${today}T10:00`, receivedByEmployee: { fullName: 'Người lập' }, confirmedAt: `${today}T11:00`, confirmedByEmployee: { fullName: 'Người từ chối phiếu' } }]);
    expect(activities.map((row) => row.title)).toEqual(['Từ chối phiếu nhập', 'Lập phiếu nhập kho', 'Từ chối đơn mua', 'Lập đơn mua']); expect(activities.at(-1).actor).toBeUndefined();
  });
  it('separates pending work from accepted and completed requests', () => {
    const demo = createDashboardDemo(today), model = buildDashboard({ sources: Object.fromEntries(Object.entries(demo).map(([key, rows]) => [key, ready(rows)])) }, { today });
    expect(model.pendingPurchases).toHaveLength(2); expect(model.pendingReceipts).toHaveLength(1); expect(model.pendingReturns).toHaveLength(2); expect(model.warningCount).toBe(model.alerts.length + model.lowStock.length);
  });
});
