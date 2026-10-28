import { today } from './apiData';

export const orderStatuses = { pending_approval: 'Chờ duyệt', approved: 'Đã duyệt', partially_received: 'Giao hàng một phần', rejected: 'Từ chối', received: 'Đã nhập kho', closed: 'Đã đóng', cancelled: 'Đã hủy' };
export const receiptStatuses = { draft: 'Bản nháp', pending_approval: 'Chờ duyệt', confirmed: 'Đã nhập kho', rejected: 'Từ chối', cancelled: 'Đã hủy' };
export const canEditOrder = (order) => !order.goodsReceiptId && !order.receiptCount && ['pending_approval', 'approved', 'rejected'].includes(order.status);
export const canEditReceipt = (receipt) => ['draft', 'rejected'].includes(receipt.status);
const integer = (value) => value !== '' && Number.isSafeInteger(Number(value)) && Number(value) >= 0 && Number(value) <= 99999999999;

export function orderPayload(values) {
  if (!values.supplierId) throw new Error('Chọn nhà cung cấp.');
  if (values.expectedDeliveryDate && values.expectedDeliveryDate < today()) throw new Error('Ngày giao dự kiến không được trong quá khứ.');
  if (!values.items.length || values.items.length > 100) throw new Error('Đơn cần từ 1 đến 100 dòng sản phẩm.');
  const ids = new Set();
  const items = values.items.map((line, index) => {
    if (!line.variantId || ids.has(line.variantId)) throw new Error(`Dòng ${index + 1}: chọn sản phẩm và không lặp sản phẩm.`);
    ids.add(line.variantId);
    if (!integer(line.quantity) || Number(line.quantity) < 1) throw new Error(`Dòng ${index + 1}: số lượng phải là số gói/hộp nguyên từ 1.`);
    if (!/^\d+(\.\d{1,2})?$/.test(String(line.unitPrice)) || Number(line.unitPrice) <= 0 || Number(line.unitPrice) >= 1e12) throw new Error(`Dòng ${index + 1}: giá mua phải lớn hơn 0, tối đa 2 số lẻ.`);
    return { variantId: line.variantId, quantity: Number(line.quantity), unitPrice: Number(line.unitPrice) };
  });
  return { supplierId: values.supplierId, expectedDeliveryDate: values.expectedDeliveryDate || null, note: values.note.trim() || null, items };
}
export function receiptLines(order, receipt) {
  return order.items.map((line) => {
    const saved = receipt?.items.find((item) => item.purchaseOrderDetailId === line.id);
    const capacity = line.quantityAvailableToReceive ?? line.quantityOrdered;
    return { purchaseOrderDetailId: line.id, variant: line.variant, quantityOrdered: line.quantityOrdered, quantityReceivedPreviously: line.quantityReceived ?? 0, quantityAvailableToReceive: capacity, unitPrice: line.unitPrice,
      quantityReceived: saved?.quantityReceived ?? capacity, quantityRejected: saved?.quantityRejected ?? 0,
      discrepancyReason: saved?.discrepancyReason || '', batchCode: saved?.batch?.batchCode || '', manufactureDate: saved?.batch?.manufactureDate || '', expiryDate: saved?.batch?.expiryDate || '', originDescription: saved?.batch?.originDescription || '' };
  });
}
export function receiptPayload(values) {
  if (!values.purchaseOrderId || !values.items.length) throw new Error('Chọn đơn đã duyệt và đối chiếu đủ các dòng.');
  const items = values.items.map((line, index) => {
    const received = Number(line.quantityReceived), rejected = Number(line.quantityRejected), ordered = Number(line.quantityAvailableToReceive ?? line.quantityOrdered);
    const prefix = `Dòng ${index + 1}: `;
    if (!integer(line.quantityReceived) || !integer(line.quantityRejected)) throw new Error(prefix + 'số lượng đạt và bị loại phải là số nguyên không âm.');
    if (received + rejected > ordered) throw new Error(prefix + 'số đạt + bị loại vượt số còn được nhận của đơn mua. Hãy tải lại tiến độ.');
    if (received < ordered && !line.discrepancyReason.trim()) throw new Error(prefix + 'ghi rõ nguyên nhân chênh lệch và thỏa thuận với nhà cung cấp.');
    if (received > 0) {
      if (!line.batchCode.trim() || !line.expiryDate) throw new Error(prefix + 'cần mã lô và hạn sử dụng cho hàng đạt.');
      if (line.expiryDate < today()) throw new Error(prefix + 'lô đã hết hạn.');
      if (line.manufactureDate && (line.manufactureDate > today() || line.manufactureDate > line.expiryDate)) throw new Error(prefix + 'ngày sản xuất không hợp lệ.');
    }
    return { purchaseOrderDetailId: line.purchaseOrderDetailId, quantityReceived: received, quantityRejected: rejected, discrepancyReason: line.discrepancyReason.trim() || null,
      batchCode: received ? line.batchCode.trim() : null, manufactureDate: received ? line.manufactureDate || null : null, expiryDate: received ? line.expiryDate : null, originDescription: received ? line.originDescription.trim() || null : null };
  });
  if (!items.some((line) => line.quantityReceived > 0 || line.quantityRejected > 0)) throw new Error('Phiếu nhập cần ít nhất một sản phẩm thực nhận hoặc bị loại.');
  return { purchaseOrderId: values.purchaseOrderId, note: values.note.trim() || null, items };
}
