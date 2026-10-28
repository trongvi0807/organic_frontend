// Bound expanded size before the workbook parser allocates worksheet XML.
export function validateXlsxArchive(buffer) {
  const data = new DataView(buffer);
  if (data.byteLength < 22) throw new Error('Tệp Excel không hợp lệ.');
  let end = -1;
  for (let offset = data.byteLength - 22; offset >= Math.max(0, data.byteLength - 65557); offset--) {
    if (data.getUint32(offset, true) === 0x06054b50 && offset + 22 + data.getUint16(offset + 20, true) === data.byteLength) { end = offset; break; }
  }
  if (end < 0 || data.getUint16(end + 4, true) || data.getUint16(end + 6, true)) throw new Error('Tệp Excel không đúng cấu trúc .xlsx.');
  const count = data.getUint16(end + 10, true), start = data.getUint32(end + 16, true), size = data.getUint32(end + 12, true);
  if (count > 512 || start + size > end) throw new Error('Tệp Excel có quá nhiều thành phần hoặc bị hỏng.');
  let offset = start, total = 0;
  for (let entry = 0; entry < count; entry++) {
    if (offset + 46 > end || data.getUint32(offset, true) !== 0x02014b50) throw new Error('Tệp Excel bị hỏng.');
    if (data.getUint16(offset + 8, true) & 1) throw new Error('Không nhận tệp Excel có mật khẩu.');
    total += data.getUint32(offset + 24, true);
    if (total > 30 * 1024 * 1024) throw new Error('Dữ liệu giải nén vượt 30 MB. Chỉ giữ trang sản phẩm cần nhập rồi lưu lại tệp.');
    offset += 46 + data.getUint16(offset + 28, true) + data.getUint16(offset + 30, true) + data.getUint16(offset + 32, true);
  }
  if (offset !== start + size) throw new Error('Tệp Excel không đúng cấu trúc.');
}
