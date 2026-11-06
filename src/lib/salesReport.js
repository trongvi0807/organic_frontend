export function salesPeriod(preset, today) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) throw new Error('Ngày thống kê không hợp lệ.');
  const date = new Date(`${today}T12:00:00Z`);
  if (preset === 'month') return { from: `${today.slice(0, 7)}-01`, to: today };
  const length = { today: 1, week: 7, thirty: 30 }[preset];
  if (!length) throw new Error('Khoảng thời gian không hợp lệ.');
  date.setUTCDate(date.getUTCDate() - length + 1);
  return { from: date.toISOString().slice(0, 10), to: today };
}
export function validateSalesRange(from, to, today) {
  if (!from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return 'Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.';
  if ([from, to].some(value => !Number.isFinite(Date.parse(`${value}T12:00:00Z`)) || new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value)) return 'Vui lòng chọn ngày hợp lệ.';
  if (from > to) return 'Ngày bắt đầu không được sau ngày kết thúc.';
  if (to > today) return 'Ngày kết thúc không được sau hôm nay.';
  if ((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000 > 365) return 'Mỗi lần thống kê tối đa 366 ngày.';
  return '';
}
