import { adminDate, parseAdminDate } from './adminFormat';

export const dashboardDay = (value) => parseAdminDate(adminDate(value));
const numeric = (value) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
const number = (value) => numeric(value) ? Number(value) : 0;
export function shiftDay(day, offset) {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return '';
  const date = new Date(`${day}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + offset); return date.toISOString().slice(0, 10);
}
export function dashboardRange(today, days = 7) {
  if (!dashboardDay(today)) throw new Error('Ngày thống kê không hợp lệ.');
  const length = [1, 7, 30].includes(Number(days)) ? Number(days) : 7;
  const start = shiftDay(today, 1 - length);
  return { start, end: today, previousStart: shiftDay(start, -length), previousEnd: shiftDay(start, -1), days: length };
}
export function revenueGrowth(current, previous) {
  if (!numeric(current) || !numeric(previous) || Number(previous) <= 0) return null;
  return (Number(current) - Number(previous)) / Number(previous) * 100;
}
// A collection of paid orders, not an accounting ledger or payment-date report.
export const revenueEligible = (order) => order.paymentStatus === 'paid' && ['confirmed', 'paid', 'preparing', 'shipping', 'delivered', 'completed'].includes(order.status)
  && (order.pricing?.currency || 'VND') === 'VND' && numeric(order.pricing?.totalAmount);
const within = (order, start, end) => { const day = dashboardDay(order.orderedAt); return !!day && day >= start && day <= end; };
export function deliveryOutcome(order) {
  const last = [...(order.shipments || [])].sort((a, b) => String(b.bookedAt || '').localeCompare(String(a.bookedAt || '')))[0];
  if (last?.status === 'delivered') return 'success';
  if (['failed', 'returned'].includes(last?.status)) return 'failed';
  if (!last && ['delivered', 'completed'].includes(order.status)) return 'success';
  return null;
}
export function expiryAlerts(batches, today, threshold = 14) {
  const now = Date.parse(`${today}T00:00:00Z`);
  return batches.filter((batch) => batch.confirmed === true && number(batch.quantityOnHand) > 0 && dashboardDay(batch.expiryDate)).map((batch) => {
    const daysLeft = Math.round((Date.parse(`${dashboardDay(batch.expiryDate)}T00:00:00Z`) - now) / 86400000);
    return { ...batch, daysLeft, severity: daysLeft <= 3 ? 'danger' : 'warning',
      expiryLabel: daysLeft < 0 ? `Quá hạn ${Math.abs(daysLeft)} ngày` : daysLeft === 0 ? 'Hết hạn hôm nay' : `Còn ${daysLeft} ngày`,
      statusLabel: daysLeft < 0 ? 'Đã quá hạn' : daysLeft <= 3 ? 'Cần ưu tiên' : 'Cận hạn' };
  }).filter((batch) => batch.daysLeft <= threshold).sort((a, b) => a.daysLeft - b.daysLeft || String(a.batchCode).localeCompare(String(b.batchCode)));
}
export function categoryBreakdown(orders, products, stocks) {
  const byProduct = new Map(products.map((product) => [product.id, product]));
  const byVariant = new Map(products.filter((p) => p.defaultVariantId).map((p) => [p.defaultVariantId, p]));
  for (const product of products) for (const variant of product.variants || []) byVariant.set(variant.id, product);
  for (const stock of stocks) { const product = byProduct.get(stock.variant?.productId); if (product) byVariant.set(stock.variant.id, product); }
  const totals = new Map(); let unclassified = 0;
  for (const order of orders.filter(revenueEligible)) for (const line of order.pricing?.items || []) {
    if (!numeric(line.lineAmount) || !numeric(line.discountAmount)) continue;
    const amount = Math.max(0, number(line.lineAmount) - number(line.discountAmount));
    const product = byVariant.get(line.variantId), classified = !!product?.categoryName;
    const key = classified ? product.categoryId || product.categoryName : 'unclassified';
    const previous = totals.get(key) || { key, name: classified ? product.categoryName : 'Chưa phân loại', value: 0 };
    totals.set(key, { ...previous, value: previous.value + amount }); if (!classified) unclassified += amount;
  }
  const entries = [...totals.values()].filter((entry) => entry.value > 0).sort((a, b) => b.value - a.value), total = entries.reduce((sum, entry) => sum + entry.value, 0);
  return { entries, total, unclassified, coverage: total ? (total - unclassified) / total * 100 : null };
}
export function documentActivities(purchases, receipts) {
  const rows = [];
  for (const order of purchases) {
    if (order.orderDate) rows.push({ key: `po-created:${order.id}`, type: 'purchase', code: order.orderCode, actor: order.createdByEmployee?.fullName, date: order.orderDate, title: 'Lập đơn mua', id: order.id });
    // The backend uses approvedAt/approvedByEmployee for both approval and rejection.
    if (order.approvedAt && order.approvedByEmployee) rows.push({ key: `po-approved:${order.id}`, type: 'purchase', code: order.orderCode, actor: order.approvedByEmployee.fullName, date: order.approvedAt,
      title: order.status === 'rejected' ? 'Từ chối đơn mua' : ['approved', 'received', 'partially_received'].includes(order.status) ? 'Duyệt đơn mua' : 'Ghi nhận quyết định đơn mua', id: order.id });
  }
  for (const receipt of receipts) {
    if (receipt.receiptDate) rows.push({ key: `receipt-created:${receipt.id}`, type: 'receipt', code: receipt.receiptCode, actor: receipt.receivedByEmployee?.fullName, date: receipt.receiptDate, title: 'Lập phiếu nhập kho', id: receipt.id });
    if (receipt.confirmedAt && receipt.confirmedByEmployee) rows.push({ key: `receipt-approved:${receipt.id}`, type: 'receipt', code: receipt.receiptCode, actor: receipt.confirmedByEmployee.fullName, date: receipt.confirmedAt,
      title: receipt.status === 'rejected' ? 'Từ chối phiếu nhập' : receipt.status === 'confirmed' ? 'Duyệt nhập kho' : 'Ghi nhận quyết định phiếu nhập', id: receipt.id });
  }
  return rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
}
export function buildDashboard(snapshot, { today, days = 7, granularity = 'day', expiryDays = 14 }) {
  const sources = snapshot?.sources || {}, ready = (source) => sources[source]?.status === 'ready', rows = (source) => sources[source]?.data || [];
  const range = dashboardRange(today, days), orders = rows('orders'), current = orders.filter((o) => within(o, range.start, range.end));
  const previous = orders.filter((o) => within(o, range.previousStart, range.previousEnd));
  const revenue = ready('orders') ? current.filter(revenueEligible).reduce((sum, o) => sum + number(o.pricing.totalAmount), 0) : null;
  const previousRevenue = ready('orders') ? previous.filter(revenueEligible).reduce((sum, o) => sum + number(o.pricing.totalAmount), 0) : null;
  const outcomes = current.map(deliveryOutcome).filter(Boolean), delivered = outcomes.filter((value) => value === 'success').length;
  const series = [];
  for (let day = range.start; day <= range.end; day = shiftDay(day, 1)) {
    const dayOrders = current.filter((o) => dashboardDay(o.orderedAt) === day);
    series.push({ day, endDay: day, label: adminDate(day), revenue: dayOrders.filter(revenueEligible).reduce((sum, o) => sum + number(o.pricing.totalAmount), 0), orders: dayOrders.length });
  }
  const chart = granularity === 'week' ? Array.from({ length: Math.ceil(series.length / 7) }, (_, i) => {
    const week = series.slice(i * 7, (i + 1) * 7);
    return { day: week[0].day, endDay: week.at(-1).day, label: `${week[0].label}–${week.at(-1).label}`, revenue: week.reduce((sum, row) => sum + row.revenue, 0), orders: week.reduce((sum, row) => sum + row.orders, 0) };
  }) : series;
  const alerts = expiryAlerts(rows('batches'), today, expiryDays), lowStock = rows('stock').filter((row) => row.lowStock === true);
  return { range, ready, currentOrders: current, revenue, previousRevenue, growth: revenueGrowth(revenue, previousRevenue), chart,
    processing: ready('orders') ? orders.filter((o) => ['pending_confirmation', 'confirmed', 'preparing'].includes(o.status)).length : null,
    deliveryRate: ready('orders') && outcomes.length ? delivered / outcomes.length * 100 : null, delivered, deliveryTotal: outcomes.length,
    alerts, lowStock, warningCount: ready('batches') && ready('stock') ? alerts.length + lowStock.length : null,
    categories: categoryBreakdown(current, rows('products'), rows('stock')),
    pendingPurchases: rows('purchases').filter((row) => row.status === 'pending_approval'),
    pendingReceipts: rows('receipts').filter((row) => row.status === 'pending_approval'),
    pendingReturns: rows('returns').filter((row) => ['pending', 'reviewing'].includes(row.status)),
    activities: documentActivities(rows('purchases'), rows('receipts')).slice(0, 8),
    recentOrders: current.slice().sort((a, b) => String(b.orderedAt).localeCompare(String(a.orderedAt))).slice(0, 7),
    excludedRevenueCount: current.filter((o) => o.paymentStatus === 'partially_refunded' || (o.pricing?.currency && o.pricing.currency !== 'VND')).length,
  };
}
