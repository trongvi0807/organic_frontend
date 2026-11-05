import api, { unwrap } from '../api';
import { requireBackend } from '../backendGuard';
import { allPages, normalizePage } from '@/lib/apiData';
import { hasRole, rolesFor, PRODUCT_MANAGERS } from '@/lib/permissions';
import { orderService } from './orderService';
import { purchaseOrderService, goodsReceiptService, inventoryService } from './procurementService';
import { productService } from './productService';
import { catalogService } from '../client/catalogService';

export const dashboardSources = {
  orders: { label: 'Đơn bán', roles: rolesFor('order.read'), list: orderService.list },
  products: { label: 'Danh mục sản phẩm', roles: rolesFor('staff.read') },
  stock: { label: 'Mức tồn kho', roles: rolesFor('inventory.read'), list: inventoryService.list },
  batches: { label: 'Lô hàng', roles: rolesFor('inventory.read'), list: inventoryService.batches },
  purchases: { label: 'Đơn mua', roles: rolesFor('purchase.read'), list: purchaseOrderService.list },
  receipts: { label: 'Phiếu nhập', roles: rolesFor('receipt.read'), list: goodsReceiptService.list },
  returns: { label: 'Yêu cầu đổi trả', roles: rolesFor('return.read'), list: async (params) => { requireBackend(); return normalizePage(unwrap(await api.get('/management/return-requests', { params }))); } },
};
export const dashboardService = {
  async snapshot(user) {
    const entries = await Promise.all(Object.entries(dashboardSources).map(async ([key, source]) => {
      if (!hasRole(user, ...source.roles)) return [key, { status: 'forbidden', data: [], label: source.label }];
      try {
        const list = key === 'products' ? hasRole(user, ...PRODUCT_MANAGERS) ? productService.list : catalogService.products : source.list;
        return [key, { status: 'ready', data: await allPages(list), label: source.label }];
      } catch { return [key, { status: 'error', data: [], label: source.label, message: `Chưa tải được ${source.label.toLowerCase()}. Vui lòng thử lại.` }]; }
    }));
    return { sources: Object.fromEntries(entries), demo: false, loadedAt: new Date().toISOString() };
  },
  async returnRequest(id) { requireBackend(); return unwrap(await api.get(`/management/return-requests/${encodeURIComponent(id)}`)); },
};
