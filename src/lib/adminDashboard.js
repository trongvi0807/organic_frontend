import { revenueChartRows } from './revenueReport';
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
export function buildDashboard(snapshot, { today, days = 7, granularity = 'day', expiryDays = 14, revenueReport = null, revenueAllowed = true }) {
  const sources = snapshot?.sources || {}, sourceReady = (source) => sources[source]?.status === 'ready', rows = (source) => sources[source]?.data || [];
  const range = dashboardRange(today, days), orders = rows('orders'), current = orders.filter((o) => within(o, range.start, range.end));
  const financialReady = revenueAllowed && revenueReport?.from === range.start && revenueReport?.to === range.end && revenueReport?.granularity === granularity && numeric(revenueReport?.summary?.totalNet);
  const ready = source => source === 'revenue' ? financialReady : sourceReady(source);
  const revenue = financialReady ? Number(revenueReport.summary.totalNet) : null;
  const previousRevenue = financialReady ? Number(revenueReport.previousSummary.totalNet) : null;
  const outcomes = current.map(deliveryOutcome).filter(Boolean), delivered = outcomes.filter(value => value === 'success').length;
  const chart = financialReady ? revenueChartRows(revenueReport) : [];
  const categoryEntries = financialReady ? revenueReport.categories.map(row => ({ key: row.id || 'unallocated', name: row.name, value: Number(row.netRevenue) })).filter(row => row.value !== 0) : [];
  const alerts = expiryAlerts(rows('batches'), today, expiryDays), lowStock = rows('stock').filter((row) => row.lowStock === true);
  return { range, ready, currentOrders: current, revenue, previousRevenue, growth: financialReady ? revenueReport.growthPercent : null, chart, revenueAllowed,
    processing: ready('orders') ? orders.filter((o) => ['pending_confirmation', 'confirmed', 'preparing'].includes(o.status)).length : null,
    deliveryRate: ready('orders') && outcomes.length ? delivered / outcomes.length * 100 : null, delivered, deliveryTotal: outcomes.length,
    alerts, lowStock, warningCount: ready('batches') && ready('stock') ? alerts.length + lowStock.length : null,
    categories: { entries: categoryEntries, total: financialReady ? Number(revenueReport.summary.salesNet) : 0, unclassified: 0 },
    pendingPurchases: rows('purchases').filter((row) => row.status === 'pending_approval'),
    pendingReceipts: rows('receipts').filter((row) => row.status === 'pending_approval'),
    pendingReturns: rows('returns').filter((row) => ['pending', 'reviewing'].includes(row.status)),
    activities: documentActivities(rows('purchases'), rows('receipts')).slice(0, 8),
    recentOrders: current.slice().sort((a, b) => String(b.orderedAt).localeCompare(String(a.orderedAt))).slice(0, 7),
    revenueWarnings: financialReady ? revenueReport.warnings : [],
  };
}
