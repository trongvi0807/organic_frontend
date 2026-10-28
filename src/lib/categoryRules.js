import { nextRecordCode } from './recordCodes';

export const cleanCategoryName = (value) => String(value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim();
const nameKey = (value) => cleanCategoryName(value).toLowerCase();
const codeKey = (value) => String(value ?? '').trim().toUpperCase();

export function generateCategoryCode(rows) {
  return nextRecordCode(rows.map((row) => ({ categoryCode: codeKey(row.categoryCode) })), 'categoryCode', 'LSP');
}

export function categoryIdentityErrors(rows, values, ownId) {
  const others = rows.filter((row) => row.id !== ownId);
  const errors = {};
  if (nameKey(values.categoryName) && others.some((row) => nameKey(row.categoryName) === nameKey(values.categoryName))) {
    errors.categoryName = 'Tên loại sản phẩm đã tồn tại. Vui lòng nhập tên khác.';
  }
  if (codeKey(values.categoryCode) && others.some((row) => codeKey(row.categoryCode) === codeKey(values.categoryCode))) {
    errors.categoryCode = 'Mã loại sản phẩm đã tồn tại. Vui lòng tải lại danh sách để cấp mã mới.';
  }
  return errors;
}
