export function canCreateReceipt(order) {
  if (!['approved', 'partially_received'].includes(order.status)) return false;
  if (typeof order.canCreateReceipt === 'boolean') return order.canCreateReceipt;
  return !order.goodsReceiptId;
}
export function receiptCandidates(orders, receipt) {
  return orders.filter((order) => canCreateReceipt(order) || (receipt?.purchaseOrderId === order.id && ['approved', 'partially_received'].includes(order.status)));
}
export function purchaseDelivery(order, receipts) {
  const confirmed = receipts.filter((receipt) => receipt.purchaseOrderId === order.id && receipt.status === 'confirmed');
  const pending = receipts.filter((receipt) => receipt.purchaseOrderId === order.id && ['draft', 'pending_approval', 'rejected'].includes(receipt.status));
  const lines = order.items.map((line) => {
    const received = Number(line.quantityReceived ?? confirmed.reduce((total, receipt) => total + receipt.items.filter((item) => item.purchaseOrderDetailId === line.id).reduce((sum, item) => sum + Number(item.quantityReceived), 0), 0));
    const awaiting = Number(line.quantityPending ?? pending.reduce((total, receipt) => total + receipt.items.filter((item) => item.purchaseOrderDetailId === line.id).reduce((sum, item) => sum + Number(item.quantityReceived), 0), 0));
    const ordered = Number(line.quantityOrdered);
    return { ...line, ordered, received, awaiting, remaining: Math.max(0, ordered - received), exceeded: received > ordered };
  });
  return { lines, confirmed, pending, ordered: lines.reduce((sum, line) => sum + line.ordered, 0), received: lines.reduce((sum, line) => sum + line.received, 0), remaining: lines.reduce((sum, line) => sum + line.remaining, 0), receivedValue: Number(order.receivedTotalAmount ?? confirmed.reduce((sum, receipt) => sum + Number(receipt.acceptedTotalAmount), 0)) };
}
export function convertPurchaseQuantity(quantity, factor) {
  const units = Number(quantity), perContainer = Number(factor);
  if (String(quantity).trim() === '' || !Number.isSafeInteger(units) || units < 1) throw new Error('Số lượng đặt phải là số nguyên từ 1.');
  if (String(factor).trim() === '' || !Number.isSafeInteger(perContainer) || perContainer < 1 || perContainer > 1000000) throw new Error('Số gói trong một thùng phải từ 1 đến 1.000.000.');
  const base = units * perContainer;
  if (!Number.isSafeInteger(base) || base > 99999999999) throw new Error('Số lượng sau quy đổi vượt giới hạn cho phép.');
  return base;
}
