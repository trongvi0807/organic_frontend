import { allPages } from '@/lib/apiData';
import { mapImportRows, MAX_IMPORT_ROWS } from '@/lib/productImport';
import { productService } from './productService';
import { categoryService } from './categoryService';
import { originService, supplierService, traceabilityService } from './managementService';
import { saveCatalogWorkflow } from '@/lib/catalogWorkflow';
import { duplicateProduct, generateProductCode, readProductRules } from '@/lib/productRules';
import { validateXlsxArchive } from '@/lib/xlsxArchive';

export async function readProductWorkbook(file) {
  if (!/\.xlsx$/i.test(file?.name || '')) throw new Error('Chỉ nhận tệp Excel .xlsx. Hãy lưu lại tệp .xls thành .xlsx trước.');
  if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('Tệp Excel phải lớn hơn 0 và không vượt 5 MB.');
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  validateXlsxArchive(buffer);
  try { await workbook.xlsx.load(buffer, { ignoreNodes: ['drawing', 'picture', 'sheetProtection', 'extLst'] }); }
  catch { throw new Error('Không đọc được tệp Excel. Kiểm tra định dạng .xlsx và tệp không có mật khẩu.'); }
  const sheet = workbook.getWorksheet('SanPham');
  if (!sheet) throw new Error('Không tìm thấy trang SanPham. Hãy dùng tệp mẫu.');
  if (sheet.rowCount > MAX_IMPORT_ROWS + 1 || sheet.columnCount > 30) throw new Error(`Tệp tối đa ${MAX_IMPORT_ROWS} dòng sản phẩm và 30 cột. Xóa các dòng/cột thừa rồi thử lại.`);
  return mapImportRows(Array.from({ length: sheet.rowCount }, (_, index) => sheet.getRow(index + 1).values.slice(1)));
}
export async function productImportReferences() {
  const [categories, suppliers, origins, existing] = await Promise.all([allPages(categoryService.list), allPages(supplierService.list), allPages(originService.list), allPages(productService.list)]);
  return { categories, suppliers, origins, existing, rules: readProductRules() };
}
export async function importProductRow(row) {
  const existing = await allPages(productService.list);
  if (!row.state.productId) {
    row.values.productCode = generateProductCode({ id: row.values.categoryId }, readProductRules(), existing);
    row.price.sku = `${row.values.productCode}-01`;
  }
  if (duplicateProduct(existing, row.values, row.state.productId)) throw new Error('Tên hoặc mã đã tồn tại. Tải lại danh sách và kiểm tra trước khi nhập tiếp.');
  return saveCatalogWorkflow({ values: row.values, price: row.price, originId: row.originId, state: row.state }, { products: productService, traceability: traceabilityService });
}
