export const cleanPromotionName = (value) => String(value ?? '').normalize('NFC').replace(/[\s\p{Z}\uFEFF]+/gu, ' ').trim();
const identity = (value) => cleanPromotionName(value).toLocaleLowerCase('vi');

export function promotionIdentityErrors(rows, values, id) {
  const others = rows.filter((row) => String(row.id) !== String(id || ''));
  const errors = {};
  if (identity(values.name) && others.some((row) => identity(row.name) === identity(values.name))) errors.name = 'Tên ưu đãi đã tồn tại. Vui lòng dùng tên khác.';
  if (identity(values.promotionCode) && others.some((row) => identity(row.promotionCode) === identity(values.promotionCode))) errors.promotionCode = 'Mã ưu đãi đã tồn tại. Vui lòng tải lại danh sách để cấp mã mới.';
  return errors;
}
