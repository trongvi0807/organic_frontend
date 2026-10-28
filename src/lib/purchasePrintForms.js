import { orderStatuses } from './procurement';

function lineData(line, context) {
  const product = context.products?.[line.variant?.productId];
  return {
    id: line.id,
    productCode: product?.productCode ?? line.productCode ?? line.variant?.productCode,
    productName: line.variant?.productName,
    unit: line.variant?.variantName ?? line.variant?.unitId,
    quantity: line.quantityOrdered,
    unitPrice: line.unitPrice,
    amount: line.lineAmount,
    actualStock: context.actualStock?.[line.variant?.id],
  };
}

export function purchaseOrderPrintData(order, context = {}) {
  const supplier = context.supplier || order.supplier || {};
  return {
    documentNumber: order.orderCode, createdAt: order.orderDate,
    creatorName: order.createdByEmployee?.fullName,
    confirmerName: order.approvedByEmployee?.fullName,
    buyer: { contactName: order.createdByEmployee?.fullName },
    supplier: { name: supplier.supplierName, code: supplier.supplierCode, contactName: supplier.contactPerson, phone: supplier.phoneNumber, email: supplier.email, address: supplier.address },
    items: (order.items || []).map((line) => lineData(line, context)),
    totalAmount: order.totalAmount,
    productRequirements: order.note,
    delivery: { expectedDate: order.expectedDeliveryDate },
    terms: { otherNotes: [orderStatuses[order.status] && `Trạng thái đơn: ${orderStatuses[order.status]}`, order.approvalNote].filter(Boolean).join('. ') },
  };
}

export function purchaseRequisitionPrintData(order, context = {}) {
  return {
    // No independent requisition number/date/approval exists in the current API.
    purchaserName: order.createdByEmployee?.fullName,
    requiredDate: order.expectedDeliveryDate,
    suggestedSupplier: (context.supplier || order.supplier)?.supplierName,
    items: (order.items || []).map((line) => {
      const mapped = lineData(line, context);
      return { ...mapped, requestedQuantity: mapped.quantity };
    }),
  };
}
