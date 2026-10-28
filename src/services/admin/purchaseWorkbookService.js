import { openImportWorkbookCells } from './importWorkbookCells';

const text = (value) => String(value ?? '').trim();
const headers = ['supplierCode', 'expectedDeliveryDate', 'note', 'sku', 'quantity', 'unitPrice'];

// Amend only blank supplier-code cells, then let the existing backend preview
// validate the resulting workbook. No purchase order is created here.
export async function fillPurchaseWorkbookSupplier(file, previewRows, supplierCode) {
  const code = text(supplierCode);
  if (!code || code.length > 50) throw new Error('Chọn nhà cung cấp có mã hợp lệ từ danh sách.');
  if (!previewRows?.length || previewRows.length > 100) throw new Error('Cần kiểm tra file từ 1 đến 100 dòng trước khi bổ sung nhà cung cấp.');
  if (previewRows.some((row) => text(row.values?.supplierCode) && text(row.values.supplierCode).toUpperCase() !== code.toUpperCase())) throw new Error('Mã nhà cung cấp đã có trong file khác lựa chọn hiện tại. Hãy sửa file; hệ thống chỉ bổ sung ô trống.');
  const sheet = await openImportWorkbookCells(file, headers, 100);
  const seen = new Set();
  let changed = 0;
  for (const entry of previewRows) {
    if (!Number.isInteger(entry.row) || entry.row < 2 || seen.has(entry.row) || !entry.values) throw new Error('Dòng Excel không khớp bản xem trước. Vui lòng chọn lại file.');
    seen.add(entry.row);
    if (sheet.text(`D${entry.row}`).trim() !== text(entry.values.sku) || sheet.text(`A${entry.row}`).trim() !== text(entry.values.supplierCode)) throw new Error('Dữ liệu file khác bản xem trước. Hãy kiểm tra lại file trước khi bổ sung.');
    if (text(entry.values.supplierCode)) continue;
    sheet.fillBlank(`A${entry.row}`, code);
    changed++;
  }
  if (!changed) throw new Error('Không còn dòng thiếu mã nhà cung cấp để bổ sung.');
  return sheet.save('-da-chon-ncc');
}
