import { openImportWorkbookCells } from './importWorkbookCells';

const headers = ['productCode', 'productName', 'slug', 'categoryId', 'brandId', 'description', 'productStatus', 'organicClaimStatus', 'certificationIds', 'originId', 'imageUrl', 'sku', 'variantName', 'netQuantity', 'unitId', 'sellingPrice', 'compareAtPrice', 'barcode', 'reorderLevel', 'variantStatus'];

// Only invoked after the user chooses categories for a backend-parsed workbook.
// The resulting file is previewed again; that exact file/hash is used for import.
export async function fillProductWorkbookCategories(file, previewRows, assignments) {
  const sheet = await openImportWorkbookCells(file, headers, 500);
  const rows = new Map(previewRows.map((row) => [row.row, row.values]));
  const seen = new Set();
  for (const entry of assignments) {
    const expected = rows.get(entry.row);
    if (!Number.isInteger(entry.row) || entry.row < 2 || !expected || seen.has(entry.row) || String(expected.categoryId ?? '').trim()) throw new Error('Danh sách dòng cần bổ sung không khớp bản xem trước. Vui lòng kiểm tra lại file.');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.categoryId)) throw new Error('Loại sản phẩm được chọn chưa có mã định danh hợp lệ từ backend.');
    seen.add(entry.row);
    if (sheet.text(`A${entry.row}`).trim() !== String(expected.productCode ?? '').trim() || sheet.text(`L${entry.row}`).trim() !== String(expected.sku ?? '').trim()) throw new Error('Dữ liệu file đã khác bản xem trước. Hãy chọn lại file trước khi bổ sung.');
    sheet.fillBlank(`D${entry.row}`, entry.categoryId);
  }
  if (!assignments.length) throw new Error('Không còn dòng thiếu loại sản phẩm để bổ sung.');
  return sheet.save('-da-chon-loai');
}
