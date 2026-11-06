export const liquidationReasons = { clearance: "Hàng cận hạn / tồn lâu", damaged: "Hàng hỏng", expired: "Hàng hết hạn", other: "Khác" };
export const liquidationStatuses = { draft: 'Bản nháp', pending_approval: 'Chờ duyệt', approved: 'Đã duyệt · Chờ xử lý', rejected: 'Từ chối', completed: 'Đã hoàn tất', cancelled: 'Đã hủy' };
export const liquidationMethods = { sale: 'Bán thanh lý', dispose: 'Tiêu hủy' };
export const liquidationActions = { create: 'Lập phiếu', update: 'Sửa phiếu', submit: 'Gửi duyệt', approve: 'Phê duyệt, giữ hàng', reject: 'Từ chối', cancel: 'Hủy phiếu', complete: 'Hoàn tất, trừ tồn kho' };
export function liquidationPayload({ method, reason, note, items, reasonType }) {
  if (!['sale', 'dispose'].includes(method)) throw new Error('Vui lòng chọn phương án xử lý.');
  if (!reason?.trim()) throw new Error('Vui lòng ghi rõ lý do thanh lý.');
  if (reason.trim().length > 2000 || (note?.length || 0) > 2000) throw new Error('Lý do và ghi chú tối đa 2.000 ký tự.');
  if (!items?.length || items.length > 100) throw new Error('Phiếu phải có từ 1 đến 100 lô hàng.');
  reasonType ||= method === "sale" ? "clearance" : "other";
  if (!liquidationReasons[reasonType] || (method === "sale" && ["damaged", "expired"].includes(reasonType))) throw new Error("Hàng hỏng/hết hạn phải chọn tiêu hủy.");
  const seen = new Set();
  return { method, reasonType, reason: reason.trim(), note: note?.trim() || null, items: items.map(row => {
    const batchId = row.batchId || row.id;
    if (!batchId || seen.has(batchId)) throw new Error('Không được lặp lô trong cùng phiếu.');
    seen.add(batchId);
    if (!/^\d+(\.\d{1,3})?$/.test(String(row.quantity)) || Number(row.quantity) <= 0 || Number(row.quantity) > 99999999999.999) throw new Error('Số lượng phải lớn hơn 0, tối đa 3 chữ số thập phân.');
    const price = method === 'dispose' ? 0 : row.unitPrice;
    if (!/^\d+(\.\d{1,2})?$/.test(String(price)) || !Number.isFinite(Number(price)) || Number(price) < (method === 'sale' ? 0.01 : 0) || Number(price) > 999999999999.99) throw new Error('Giá thanh lý phải lớn hơn 0 và tối đa 2 chữ số thập phân.');
    if (reasonType === 'expired' && row.expired === false) throw new Error('Lý do hết hạn chỉ áp dụng lô đã hết hạn.');
    if (method === 'sale' && row.expired) throw new Error('Hàng hết hạn không được bán thanh lý. Chọn phương án tiêu hủy.');
    if (row.available != null && Number(row.quantity) > Number(row.available)) throw new Error(`Lô ${row.lotCode || row.batchCode || ''} không đủ lượng trống để thanh lý.`);
    return { batchId, quantity: Number(row.quantity), unitPrice: Number(price) };
  }) };
}
export function liquidationTotal(items, method) {
  if (method === 'dispose') return 0;
  return items.reduce((total, row) => total + Math.round(Number(row.quantity || 0) * Number(row.unitPrice || 0) * 100) / 100, 0);
}
