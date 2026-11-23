export const expiryFilters = [
  ['', 'Tất cả hạn dùng'], ['near_expiry', 'Cận hạn'], ['clearance', 'Cần xem xét thanh lý'],
  ['stopped', 'Đã ngừng nhận đơn'], ['expired', 'Đã hết hạn'], ['today', 'Hết hạn hôm nay'], ['unknown', 'Thiếu thông tin'],
  ['not_expired', 'Chưa hết hạn'],
];

export function remainingDaysText(days) {
  if (days == null) return 'Chưa xác định';
  if (days < 0) return `Đã hết hạn ${Math.abs(days)} ngày`;
  if (days === 0) return 'Hết hạn hôm nay';
  return `Còn ${days} ngày`;
}

export const expiryLabels = {
  normal: 'Còn hạn', near_expiry: 'Cận hạn', clearance: 'Cần xem xét thanh lý', stopped: 'Đã ngừng nhận đơn',
  today: 'Hết hạn hôm nay', expired: 'Đã hết hạn', unknown: 'Thiếu thông tin',
};

export const expiryPolicyGroups = [['', 'Tự xác định theo danh mục'], ['dry_goods', 'Thực phẩm khô / đóng hộp / gia vị'], ['dairy', 'Sữa / sữa chua / đồ mát'], ['fresh_produce', 'Rau củ / trái cây'], ['fresh_meat', 'Thịt / cá / hải sản tươi'], ['prepared_food', 'Bánh mì / đồ chế biến trong ngày'], ['other', 'Nhóm khác']];

export function expiryPolicyPayload(custom, warning, clearance, salePolicy) {
  let extra = {};
  if (salePolicy) {
    const text = String(salePolicy.minimumRemainingHours ?? '').trim();
    const hours = text === '' ? null : Number(text);
    if (hours != null && (!Number.isInteger(hours) || hours < 0 || hours > 87600)) throw new Error('Nhập số giờ ngừng nhận đơn hợp lệ từ 0 đến 87600.');
    extra = { policyGroup: salePolicy.policyGroup || null, minimumRemainingHours: hours };
  }
  if (!custom) return { warningDays: null, clearanceDays: null, ...extra };
  const w = Number(warning), c = Number(clearance);
  if (String(warning).trim() === '' || String(clearance).trim() === '' || !Number.isInteger(w) || !Number.isInteger(c)
      || w < 0 || w > 3650 || c < 0 || c > w) {
    throw new Error('Nhập cả hai ngưỡng từ 0 đến 3650 ngày; ngưỡng đề xuất thanh lý không được lớn hơn ngưỡng cận hạn.');
  }
  return { warningDays: w, clearanceDays: c, ...extra };
}
