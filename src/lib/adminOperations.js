import { inDateRange, matchesSearch, orderCreator } from './adminFormat';
export function filterDocuments(rows, filters, { receipt = false, sales = false, orders = new Map() } = {}) {
  if (filters.from && filters.to && filters.from > filters.to) return [];
  return rows.filter((row) => {
    const purchase = receipt ? orders.get(row.purchaseOrderId) : row;
    const amount = sales ? row.pricing?.totalAmount : receipt ? row.acceptedTotalAmount : row.totalAmount;
    const creator = sales ? orderCreator(row) : (receipt ? row.receivedByEmployee : row.createdByEmployee)?.fullName;
    return (!filters.status || row.status === filters.status)
      && (!filters.supplierId || purchase?.supplier?.id === filters.supplierId)
      && (!filters.paymentStatus || row.paymentStatus === filters.paymentStatus)
      && inDateRange(sales ? row.orderedAt : receipt ? row.receiptDate : row.orderDate, filters.from, filters.to)
      && matchesSearch([creator, sales && row.receiverName, sales && row.receiverPhone].filter(Boolean).join(' '), filters.person)
      && matchesSearch([row.orderCode, row.receiptCode, row.purchaseOrderCode, row.note, row.approvalNote, row.shippingAddress, creator, row.receiverName, row.receiverPhone, purchase?.supplier?.supplierName, ...(row.items || row.pricing?.items || []).map((line) => `${line.variant?.productName || line.productName} ${line.variant?.variantName || line.variantName} ${line.batch?.batchCode || ''}`)].filter(Boolean).join(' '), filters.search)
      && (filters.minAmount === '' || Number(amount) >= Number(filters.minAmount))
      && (filters.maxAmount === '' || Number(amount) <= Number(filters.maxAmount));
  });
}
export const rejectionReasons = [
  ['quality', 'Sản phẩm không đạt chất lượng'], ['quantity', 'Số lượng hoặc trọng lượng không khớp'],
  ['price', 'Giá mua không đúng thỏa thuận'], ['document', 'Thông tin chứng từ chưa đầy đủ'],
  ['expiry', 'Lô hàng hoặc hạn sử dụng không hợp lệ'], ['supplier', 'Nhà cung cấp chưa đáp ứng yêu cầu'], ['other', 'Khác'],
];
export function rejectionNote(reason, detail) {
  const selected = rejectionReasons.find(([key]) => key === reason);
  if (!selected) throw new Error('Vui lòng chọn lý do từ chối.');
  if (reason === 'other' && !detail.trim()) throw new Error('Vui lòng nhập lý do cụ thể.');
  return `${selected[1]}${detail.trim() ? `: ${detail.trim()}` : ''}`;
}
