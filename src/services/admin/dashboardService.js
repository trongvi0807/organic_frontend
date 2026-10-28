import api, { DEMO_MODE, unwrap } from '../api';
import { requireBackend } from '../backendGuard';
import { allPages, normalizePage } from '@/lib/apiData';
import { hasRole, PRODUCT_MANAGERS } from '@/lib/permissions';
import { orderService } from './orderService';
import { purchaseOrderService, goodsReceiptService, inventoryService } from './procurementService';
import { productService } from './productService';
import { catalogService } from '../client/catalogService';
import { createDashboardDemo } from '@/constants/demoDashboard';

export const dashboardSources = {
  orders: { label: 'Đơn bán', roles: ['ADMIN', 'SALES_STAFF', 'WAREHOUSE_STAFF'], list: orderService.list },
  products: { label: 'Danh mục sản phẩm', roles: ['ADMIN', 'SALES_STAFF', 'WAREHOUSE_STAFF'] },
  stock: { label: 'Mức tồn kho', roles: ['ADMIN', 'WAREHOUSE_STAFF'], list: inventoryService.list },
  batches: { label: 'Lô hàng', roles: ['ADMIN', 'WAREHOUSE_STAFF'], list: inventoryService.batches },
  purchases: { label: 'Đơn mua', roles: ['ADMIN', 'WAREHOUSE_STAFF'], list: purchaseOrderService.list },
  receipts: { label: 'Phiếu nhập', roles: ['ADMIN', 'WAREHOUSE_STAFF'], list: goodsReceiptService.list },
  returns: { label: 'Yêu cầu đổi trả', roles: ['ADMIN', 'SALES_STAFF'], list: async (params) => { requireBackend(); return normalizePage(unwrap(await api.get('/management/return-requests', { params }))); } },
};
export const dashboardService = {
  async snapshot(user, { demo = DEMO_MODE, today } = {}) {
    const sample = demo ? createDashboardDemo(today) : null;
    const entries = await Promise.all(Object.entries(dashboardSources).map(async ([key, source]) => {
      if (!hasRole(user, ...source.roles)) return [key, { status: 'forbidden', data: [], label: source.label }];
      if (demo) return [key, { status: 'ready', data: sample[key], label: source.label }];
      try {
        const list = key === 'products' ? hasRole(user, ...PRODUCT_MANAGERS) ? productService.list : catalogService.products : source.list;
        return [key, { status: 'ready', data: await allPages(list), label: source.label }];
      } catch { return [key, { status: 'error', data: [], label: source.label, message: `Chưa tải được ${source.label.toLowerCase()}. Vui lòng thử lại.` }]; }
    }));
    return { sources: Object.fromEntries(entries), demo, loadedAt: new Date().toISOString() };
  },
  async returnRequest(id) { requireBackend(); return unwrap(await api.get(`/management/return-requests/${encodeURIComponent(id)}`)); },
};
