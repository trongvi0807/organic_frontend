export const expiryFilters = [
  ['', 'Tất cả hạn dùng'], ['near_expiry', 'Cận hạn'], ['clearance', 'Cần xem xét thanh lý'],
  ['expired', 'Đã hết hạn'], ['today', 'Hết hạn hôm nay'], ['unknown', 'Thiếu thông tin'],
  ['not_expired', 'Chưa hết hạn'],
];

export function remainingDaysText(days) {
  if (days == null) return 'Chưa xác định';
  if (days < 0) return `Đã hết hạn ${Math.abs(days)} ngày`;
  if (days === 0) return 'Hết hạn hôm nay';
  return `Còn ${days} ngày`;
}

export const expiryLabels = {
  normal: 'Còn hạn', near_expiry: 'Cận hạn', clearance: 'Cần xem xét thanh lý',
  today: 'Hết hạn hôm nay', expired: 'Đã hết hạn', unknown: 'Thiếu thông tin',
};

export function expiryPolicyPayload(custom, warning, clearance) {
  if (!custom) return { warningDays: null, clearanceDays: null };
  const w = Number(warning), c = Number(clearance);
  if (String(warning).trim() === '' || String(clearance).trim() === '' || !Number.isInteger(w) || !Number.isInteger(c)
      || w < 0 || w > 3650 || c < 0 || c > w) {
    throw new Error('Nhập cả hai ngưỡng từ 0 đến 3650 ngày; ngưỡng đề xuất thanh lý không được lớn hơn ngưỡng cận hạn.');
  }
  return { warningDays: w, clearanceDays: c };
}
