import { adminDate } from './adminFormat';
import { receiptStatuses } from './procurement';

const numeric = (value) => value != null && value !== '' && Number.isFinite(Number(value));
const sum = (rows, key) => rows.every((row) => numeric(row[key])) ? rows.reduce((total, row) => total + Number(row[key]), 0) : undefined;
const datetime = (value) => value ? adminDate(value, true).replaceAll('-', '/') : undefined;

export function receiptFormData(receipt, order = {}, context = {}, formId = 'goods_receipt') {
  const supplier = context.supplier || order.supplier || {};
  let items = (receipt.items || []).map((line) => ({
    id: line.id, productCode: context.products?.[line.variant?.productId]?.productCode,
    productName: line.variant?.productName, unit: line.variant?.variantName,
    quantityOrdered: line.quantityOrdered, quantityExpected: line.quantityExpected ?? line.quantityOrdered,
    quantityReceivedPreviously: line.quantityReceivedPreviously ?? 0,
    quantityReceived: line.quantityReceived, quantityRejected: line.quantityRejected,
    quantityActual: numeric(line.quantityReceived) && numeric(line.quantityRejected) ? Number(line.quantityReceived) + Number(line.quantityRejected) : undefined,
    batchCode: line.batch?.batchCode, manufactureDate: line.batch?.manufactureDate, expiryDate: line.batch?.expiryDate,
    batchExpiry: line.batch ? `${line.batch.batchCode} / ${adminDate(line.batch.expiryDate).replaceAll('-', '/')}` : undefined,
    unitPrice: line.unitPrice, acceptedAmount: line.acceptedAmount,
    condition: line.discrepancyReason, note: line.discrepancyReason,
  }));
  if (formId === 'rejected_goods') items = items.filter((line) => Number(line.quantityRejected) > 0);
  return {
    documentNumber: formId === 'goods_receipt' ? receipt.receiptCode : undefined,
    createdAt: formId === 'goods_receipt' ? receipt.receiptDate : undefined,
    supplierName: supplier.supplierName, supplierCode: supplier.supplierCode,
    purchaseOrderCode: receipt.purchaseOrderCode || order.orderCode, orderDate: order.orderDate,
    inspector: receipt.receivedByEmployee?.fullName, receiverName: receipt.receivedByEmployee?.fullName,
    items, itemCount: items.length, totalAmount: receipt.acceptedTotalAmount,
    fullyAcceptedCount: items.filter((line) => numeric(line.quantityExpected) && Number(line.quantityExpected) > 0 && Number(line.quantityReceived) === Number(line.quantityExpected)).length,
    discrepancyCount: items.filter((line) => numeric(line.quantityExpected) && Number(line.quantityReceived) !== Number(line.quantityExpected)).length,
    rejectedTotal: sum(items, 'quantityRejected'), note: [receiptStatuses[receipt.status] && `Trạng thái phiếu nguồn: ${receiptStatuses[receipt.status]}`, receipt.note].filter(Boolean).join('\n'),
    discrepancyNote: [receipt.note, ...items.map((line) => line.condition).filter(Boolean)].join('\n'),
    signers: formId === 'goods_receipt' ? [undefined, receipt.receivedByEmployee?.fullName, receipt.receivedByEmployee?.fullName, receipt.confirmedByEmployee?.fullName] : [undefined, receipt.receivedByEmployee?.fullName, undefined],
  };
}

export function inventoryFormData(batches = [], context = {}, formId = 'stock_card') {
  const first = batches[0] || {}, variant = first.variant || {};
  const items = batches.map((batch) => ({
    id: batch.id, productCode: context.products?.[batch.variant?.productId]?.productCode,
    productName: batch.variant?.productName, unit: batch.variant?.variantName,
    batchCode: batch.batchCode, expiryDate: batch.expiryDate,
    bookQuantity: batch.quantityOnHand, onHand: batch.quantityOnHand,
    condition: batch.expired ? 'Đã hết hạn sử dụng' : undefined,
  }));
  return {
    productCode: context.products?.[variant.productId]?.productCode, productName: variant.productName, unit: variant.variantName,
    batchCode: first.batchCode, manufactureDate: first.manufactureDate, expiryDate: first.expiryDate,
    items, itemCount: items.length,
    // Batch balances cannot reconstruct historical stock movements or physical counts.
    movements: [],
  };
}

export function saleFormData(order, shipment, formId) {
  const paid = order.paymentStatus === 'paid', quote = order.pricing || {};
  const items = (quote.items || []).map((line) => ({
    id: line.variantId, productName: line.productName, unit: line.variantName,
    quantity: line.quantity, requestedQuantity: line.quantity,
    confirmedQuantity: ['confirmed', 'paid', 'preparing', 'shipping', 'delivered', 'completed'].includes(order.status) ? line.quantity : undefined,
    unitPrice: line.unitPrice, lineAmount: line.lineAmount, discountAmount: line.discountAmount,
    netAmount: numeric(line.lineAmount) && numeric(line.discountAmount) ? Number(line.lineAmount) - Number(line.discountAmount) : undefined,
  }));
  const isSalesDocument = ['sales_receipt', 'order_confirmation'].includes(formId);
  return {
    documentNumber: isSalesDocument ? order.orderCode : undefined,
    createdAt: isSalesDocument ? order.orderedAt : undefined,
    orderCode: order.orderCode, orderedAt: order.orderedAt,
    customerName: order.customer?.fullName, customerPhone: order.customer?.phoneNumber,
    receiverName: order.receiverName, receiverPhone: order.receiverPhone, shippingAddress: order.shippingAddress,
    salesperson: order.assignedEmployeeName, items, itemCount: items.length,
    subtotal: quote.subtotal, shippingFee: quote.shippingFee, totalAmount: quote.totalAmount,
    discountTotal: numeric(quote.promotionDiscount) && numeric(quote.pointsDiscount) ? Number(quote.promotionDiscount) + Number(quote.pointsDiscount) : undefined,
    pointsEarned: order.pointsEarned, promotionCode: quote.promotionCode,
    paidAmount: paid ? quote.totalAmount : undefined, remainingAmount: paid ? 0 : undefined,
    paymentStates: paid ? ['Đã thanh toán'] : order.paymentStatus === 'unpaid' ? ['Chưa thanh toán'] : [],
    paymentOptions: order.paymentMethod === 'cod' ? ['Thanh toán khi nhận hàng'] : [],
    note: order.note, deliveryNote: order.note,
    driverName: shipment?.driverName, driverPhone: shipment?.driverPhone, carrier: shipment?.carrier,
    // A carrier tracking code is not an independently issued delivery-note number.
    deliveredAt: datetime(shipment?.deliveredAt), failureReason: shipment?.failureReason,
    preDeliveryPayment: paid ? ['Đã thanh toán'] : [],
    codAmount: paid ? 0 : order.paymentMethod === 'cod' && order.paymentStatus !== 'requires_review' ? quote.totalAmount : undefined,
    cashCollected: order.cashCollectedAt ? quote.totalAmount : undefined,
    deliveryResults: shipment?.status === 'delivered' ? ['Giao thành công toàn bộ'] : [],
    deliveryResultNote: shipment?.note,
    // A failed delivery does not prove that all products were returned or restocked.
    signers: formId === 'delivery_note' ? [shipment?.driverName, undefined] : formId === 'delivery_failure' ? [shipment?.driverName, undefined, undefined] : [],
  };
}

export function feedbackFormData(detail) {
  const record = detail.feedback || {};
  return {
    documentNumber: record.feedbackCode, createdAt: record.createdAt,
    customerName: record.customer?.fullName, orderCode: record.order?.orderCode,
    assignedEmployee: record.assignedEmployee?.fullName, content: detail.content,
    evidenceTypes: [...new Set((detail.media || []).map((item) => item.mediaType === 'image' ? 'Hình ảnh' : item.mediaType === 'video' ? 'Video' : null).filter(Boolean))],
    items: [], signers: [undefined, record.assignedEmployee?.fullName],
  };
}

export function returnFormData(detail) {
  const record = detail.request || {};
  return {
    requestCode: record.requestCode, orderCode: record.order?.orderCode, customerName: record.customer?.fullName,
    createdAt: record.decidedAt, requestedAt: record.requestedAt,
    approvedRefundAmount: record.approvedRefundAmount,
    decisionNote: [detail.decisionNote, detail.policyNote].filter(Boolean).join('\n'),
    items: (detail.items || []).map((line) => ({ id: line.id, productName: line.productName, unit: line.variantName, requestedQuantity: line.requestedQuantity, condition: line.conditionNote })),
    signers: [record.assignedEmployee?.fullName, detail.decidedByEmployee?.fullName, undefined],
    // An approved proposal is not evidence of an executed refund.
    refundStates: [],
  };
}

export function returnReceiptFormData(detail, receipts = []) {
  const record = detail.request || {}, totals = record.totals || {};
  return {
    requestCode: record.requestCode, orderCode: record.orderCode, customerName: record.customer?.fullName,
    items: receipts.map((item) => ({ id: item.id, productName: item.productName, unit: item.variantName, receivedQuantity: item.receivedQuantity, batchCode: item.batchCode, expiryDate: item.expiryDate, condition: item.inspectionNote, returnReason: item.receiptNote })),
    receivedTotal: totals.receivedQuantity, restockedTotal: totals.restockedQuantity, pendingTotal: totals.pendingQuantity, disposedTotal: totals.disposedQuantity,
  };
}
