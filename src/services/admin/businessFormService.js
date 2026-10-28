import api, { unwrap } from '../api';
import { requireBackend } from '../backendGuard';
import { normalizePage, allPages } from '@/lib/apiData';
import { hasRole } from '@/lib/permissions';
import { purchaseOrderService, goodsReceiptService, inventoryService } from './procurementService';
import { orderService } from './orderService';
import { loadPhysicalStock, loadPurchasePrintContext } from './purchasePrintService';
import { traceabilityService } from './managementService';
import { purchaseOrderPrintData, purchaseRequisitionPrintData } from '@/lib/purchasePrintForms';
import { feedbackFormData, inventoryFormData, receiptFormData, returnFormData, returnReceiptFormData, saleFormData } from '@/lib/businessFormData';

const get = async (url, params) => { requireBackend(); return unwrap(await api.get(url, { params })); };
export const formSourceRoles = {
  purchase: ['ADMIN', 'WAREHOUSE_STAFF'], receipt: ['ADMIN', 'WAREHOUSE_STAFF'], batch: ['ADMIN', 'WAREHOUSE_STAFF'],
  sale: ['ADMIN', 'SALES_STAFF', 'WAREHOUSE_STAFF'], feedback: ['ADMIN', 'SALES_STAFF'], return: ['ADMIN', 'SALES_STAFF'], return_receipt: ['ADMIN', 'SALES_STAFF', 'WAREHOUSE_STAFF'],
};
export const canReadFormSource = (user, source) => hasRole(user, ...(formSourceRoles[source] || []));
const sources = {
  purchase: { list: purchaseOrderService.list, get: purchaseOrderService.get, label: (row) => `${row.orderCode} · ${row.supplier?.supplierName || ''}` },
  receipt: { list: goodsReceiptService.list, get: goodsReceiptService.get, label: (row) => `${row.receiptCode} · ${row.purchaseOrderCode}` },
  batch: { list: inventoryService.batches, get: inventoryService.batch, label: (row) => `${row.batchCode} · ${row.variant?.productName || ''}` },
  sale: { list: orderService.list, get: orderService.get, label: (row) => `${row.orderCode} · ${row.receiverName || ''}` },
  feedback: { list: async (params) => normalizePage(await get('/management/feedbacks', params)), get: (id) => get(`/management/feedbacks/${encodeURIComponent(id)}`), label: (row) => `${row.feedbackCode} · ${row.subject}` },
  return: { list: async (params) => normalizePage(await get('/management/return-requests', params)), get: (id) => get(`/management/return-requests/${encodeURIComponent(id)}`), label: (row) => `${row.requestCode} · ${row.customer?.fullName || ''}` },
  return_receipt: { list: async (params) => normalizePage(await get('/management/return-receipts/requests', { ...params, pendingOnly: false })), get: (id) => get(`/management/return-receipts/requests/${encodeURIComponent(id)}`), label: (row) => `${row.requestCode} · ${row.orderCode}` },
};
export async function listFormSources(source) {
  const adapter = sources[source]; if (!adapter) return [];
  const rows = await allPages(adapter.list);
  return rows.map((row) => ({ value: row.id || row.requestId, label: adapter.label(row) }));
}

export async function loadFormData(form, id, shipmentId) {
  if (!id) return { data: {}, warnings: [] };
  const record = await sources[form.source].get(id);
  const warnings = [];
  if (form.source === 'purchase') {
    const context = await loadPurchasePrintContext(record);
    if (form.id === 'requisition') { const stock = await loadPhysicalStock(record); context.actualStock = stock.actualStock; context.warnings.push(...stock.warnings); }
    return { data: form.id === 'requisition' ? purchaseRequisitionPrintData(record, context) : purchaseOrderPrintData(record, context), warnings: context.warnings };
  }
  if (form.source === 'receipt') {
    let order = {}, context = {};
    try { order = await purchaseOrderService.get(record.purchaseOrderId); context = await loadPurchasePrintContext(order); warnings.push(...context.warnings); }
    catch { warnings.push('Không tải đủ thông tin đơn mua; dữ liệu tham chiếu thiếu được để trống.'); }
    return { data: receiptFormData(record, order, context, form.id), warnings };
  }
  if (form.source === 'batch') {
    const context = { products: {} };
    try { if (record.variant?.productId) context.products[record.variant.productId] = await traceabilityService.get(record.variant.productId); }
    catch { warnings.push('Chưa tải được mã sản phẩm, ô Mã SP để trống.'); }
    return { data: inventoryFormData([record], context, form.id), warnings: [...warnings, 'Số trên sổ lấy từ số lượng lô hiện tại. Kết quả kiểm đếm và lịch sử nhập/xuất chưa có API được để trống.'] };
  }
  if (form.source === 'sale') {
    const shipments = record.shipments || [];
    const shipment = shipments.find((row) => row.id === shipmentId) || (shipments.length === 1 ? shipments[0] : undefined);
    return { data: saleFormData(record, shipment, form.id), shipments, warnings: ['Các thông tin chưa có trong đơn bán như mã SP, lô xuất và số thực giao được để trống; không suy ra đã thu tiền/nhập lại kho từ việc in phiếu.'] };
  }
  if (form.source === 'feedback') return { data: feedbackFormData(record), warnings };
  if (form.source === 'return') return { data: returnFormData(record), warnings: ['Tiền được duyệt trong phương án chưa phải tiền đã hoàn. Kết quả hoàn tiền thực tế được để trống.'] };
  if (form.source === 'return_receipt') {
    const receipts = await allPages(async (params) => normalizePage(await get(`/management/return-receipts/requests/${encodeURIComponent(id)}/items`, params)));
    return { data: returnReceiptFormData(record, receipts), warnings };
  }
  return { data: {}, warnings };
}
