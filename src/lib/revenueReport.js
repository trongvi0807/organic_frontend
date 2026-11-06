import { adminDate } from './adminFormat';
export function revenueChartRows(report) {
  return (report?.periods || []).map(period => ({ day: period.from, endDay: period.to,
    label: adminDate(period.from), revenue: Number(period.amounts.totalNet), refunds: Number(period.amounts.refunds),
    liquidation: Number(period.amounts.liquidationRevenue), orders: period.amounts.orderCount }));
}
function csvCell(value) {
  let text = String(value ?? '');
  if (typeof value === 'string' && /^[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
export function revenueCsv(report) {
  const rows = [
    ['BÁO CÁO DOANH THU', `${report.from} - ${report.to}`],
    ['Cập nhật', report.generatedAt],
    ['Quy tắc', 'Theo ngày đặt đơn; hoàn thành công cập nhật đến hiện tại. Thanh lý theo ngày hoàn tất. Không gồm phí giao hàng.'],
    ['Từ ngày','Đến ngày','Số đơn','Tiền hàng trước giảm (VNĐ)','Giảm giá và điểm (VNĐ)','Tiền hoàn (VNĐ)','Tiền hàng thuần (VNĐ)','Thu thanh lý (VNĐ)','Tổng doanh thu thuần (VNĐ)'],
    ...report.periods.map(row => [row.from,row.to,row.amounts.orderCount,row.amounts.grossSales,row.amounts.discounts,row.amounts.refunds,row.amounts.salesNet,row.amounts.liquidationRevenue,row.amounts.totalNet]),
    ['TỔNG','',report.summary.orderCount,report.summary.grossSales,report.summary.discounts,report.summary.refunds,report.summary.salesNet,report.summary.liquidationRevenue,report.summary.totalNet],
    ...report.warnings.map(warning => ['Lưu ý',warning]),
  ];
  return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
}
