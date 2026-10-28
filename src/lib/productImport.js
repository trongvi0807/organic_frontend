import { searchText } from './adminFormat';
import { variantPayload } from './catalogAssets';
import { duplicateProduct, generateProductCode, readProductRules } from './productRules';
import { slugify } from './utils';

export const importHeaders = ['Tên sản phẩm', 'Mã loại sản phẩm', 'Mã nhà cung cấp', 'Mã xuất xứ', 'Đóng gói', 'Trọng lượng', 'Đơn vị', 'Giá bán', 'Giá so sánh', 'Mô tả'];
export const MAX_IMPORT_ROWS = 200;
export function importCell(value) {
  if (value == null) return '';
  if (typeof value === 'object') {
    if (value.formula || value.sharedFormula) throw new Error('Không chấp nhận ô công thức. Hãy dán giá trị thay cho công thức.');
    if (value.richText) return value.richText.map((part) => part.text).join('');
    if (value.text != null) return String(value.text);
    throw new Error('Ô dữ liệu phải là văn bản hoặc số.');
  }
  return String(value).trim();
}
export function mapImportRows(matrix) {
  const [header, ...rows] = matrix;
  if (!header) throw new Error('Tệp chưa có tiêu đề cột.');
  const names = header.map((value) => searchText(importCell(value)));
  const indexes = importHeaders.map((label) => names.indexOf(searchText(label)));
  if (indexes.some((index) => index < 0)) throw new Error('Thiếu cột bắt buộc. Hãy dùng tệp Excel mẫu của hệ thống.');
  if (new Set(names.filter(Boolean)).size !== names.filter(Boolean).length) throw new Error('Tiêu đề cột bị trùng.');
  const result = [];
  rows.forEach((row, index) => {
    if (!row?.some((value) => value != null && value !== '')) return;
    try { result.push({ row: index + 2, cells: indexes.map((column) => importCell(row[column])) }); }
    catch (error) { result.push({ row: index + 2, cells: [], errors: [error.message] }); }
  });
  if (!result.length) throw new Error('Chưa có sản phẩm trong trang SanPham.');
  if (result.length > MAX_IMPORT_ROWS) throw new Error(`Mỗi lần nhập tối đa ${MAX_IMPORT_ROWS} sản phẩm.`);
  return result;
}
function codeMatch(rows, field, value, label) {
  const matches = rows.filter((row) => searchText(row[field]) === searchText(value));
  if (!value || matches.length !== 1) throw new Error(`${label} không tồn tại hoặc không duy nhất: ${value || '(trống)'}.`);
  if (matches[0].status !== 'active') throw new Error(`${label} chưa hoạt động.`);
  return matches[0];
}
export function prepareProductImport(rows, { categories, suppliers, origins, existing, rules = readProductRules() }) {
  const used = [...existing];
  return rows.map((row) => {
    if (row.errors?.length) return row;
    const [productName, categoryCode, supplierCode, originCode, pack, quantity, unit, sellingPrice, compareAtPrice, description] = row.cells;
    try {
      const category = codeMatch(categories, 'categoryCode', categoryCode, 'Loại sản phẩm');
      const supplier = codeMatch(suppliers, 'supplierCode', supplierCode, 'Nhà cung cấp');
      const origin = codeMatch(origins, 'originCode', originCode, 'Xuất xứ');
      if (origin.supplierId !== supplier.id) throw new Error('Xuất xứ không thuộc nhà cung cấp đã chọn.');
      if (!productName?.trim() || productName.length > 200) throw new Error('Tên sản phẩm bắt buộc, tối đa 200 ký tự.');
      if (description.length > 20000) throw new Error('Mô tả tối đa 20.000 ký tự.');
      const code = generateProductCode(category, rules, used);
      const values = { productCode: code, productName, slug: slugify(productName), categoryId: category.id, brandId: null, description, status: 'draft', organicClaimStatus: 'pending', certificationIds: [] };
      if (!values.slug || values.slug.length > 220) throw new Error('Tên sản phẩm chưa tạo được đường dẫn hợp lệ.');
      if (duplicateProduct(used, values)) throw new Error('Tên sản phẩm trùng dữ liệu đang có hoặc trùng trong tệp.');
      const price = variantPayload({ sku: `${code}-01`, variantName: pack, netQuantity: quantity, unitId: unit, sellingPrice, compareAtPrice, reorderLevel: 0, status: 'active' });
      used.push(values);
      return { ...row, errors: [], values, price, originId: origin.id, supplierName: supplier.supplierName, categoryName: category.categoryName, state: { productId: null, variantId: null, currentStatus: 'draft' } };
    } catch (error) { return { ...row, errors: [error.message] }; }
  });
}
