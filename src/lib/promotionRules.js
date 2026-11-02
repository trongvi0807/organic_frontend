export const cleanPromotionName = (value) => String(value ?? '').normalize('NFC').replace(/[\s\p{Z}\uFEFF]+/gu, ' ').trim();
const identity = (value) => cleanPromotionName(value).toLocaleLowerCase('vi');

export function promotionIdentityErrors(rows, values, id) {
  const others = rows.filter((row) => String(row.id) !== String(id || ''));
  const errors = {};
  if (identity(values.name) && others.some((row) => identity(row.name) === identity(values.name))) errors.name = 'Tên ưu đãi đã tồn tại. Vui lòng dùng tên khác.';
  if (identity(values.promotionCode) && others.some((row) => identity(row.promotionCode) === identity(values.promotionCode))) errors.promotionCode = 'Mã ưu đãi đã tồn tại. Vui lòng tải lại danh sách để cấp mã mới.';
  return errors;
}

function hundredths(value) {
  const text = String(value ?? '').trim();
  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(text)) return null;
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
}

// Use decimal arithmetic and round percentage discounts to whole VND like checkout.
export function automaticPromotionMaximum(referenceAmount, values) {
  const rate = hundredths(values.discountValue);
  if (rate == null || rate <= 0n) return '';
  if (values.discountType === 'fixed_amount') return String(values.discountValue);
  if (values.discountType !== 'percentage' || rate > 10000n) return '';
  const amount = hundredths(referenceAmount);
  if (amount == null || amount <= 0n) return '';
  const wholeDong = (amount + 50n) / 100n;
  return String((wholeDong * rate + 5000n) / 10000n);
}

export function voucherExchangeValueError(values) {
  const cost = Number(values.pointsCost);
  if (!Number.isInteger(cost) || cost <= 0) return '';
  const caps = [];
  if (values.discountType === 'fixed_amount' && Number(values.discountValue) > 0) caps.push(Math.round(Number(values.discountValue)));
  if (values.maxDiscountAmount !== '' && values.maxDiscountAmount != null && Number(values.maxDiscountAmount) > 0)
    caps.push(Math.round(Number(values.maxDiscountAmount)));
  return caps.length && Math.min(...caps) <= cost * 2000
    ? `Voucher cần giảm tối đa nhiều hơn ${(cost * 2000).toLocaleString('vi-VN')}₫ để có lợi hơn trừ trực tiếp ${cost} điểm.` : '';
}
