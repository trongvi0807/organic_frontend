import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./api', () => ({ default: { get: vi.fn() }, DEMO_MODE: false, unwrap: (r) => r.data.data }));
vi.mock('./admin/orderService', () => ({ orderService: { list: vi.fn() } }));
vi.mock('./admin/procurementService', () => ({ purchaseOrderService: { list: vi.fn() }, goodsReceiptService: { list: vi.fn() }, inventoryService: { list: vi.fn(), batches: vi.fn() } }));
vi.mock('./admin/productService', () => ({ productService: { list: vi.fn() } }));
vi.mock('./client/catalogService', () => ({ catalogService: { products: vi.fn() } }));
import api from './api';
import { orderService } from './admin/orderService';
import { purchaseOrderService, goodsReceiptService, inventoryService } from './admin/procurementService';
import { productService } from './admin/productService';
import { catalogService } from './client/catalogService';
import { dashboardService } from './admin/dashboardService';
const user = (role) => ({ username: role, roles: [role] });
beforeEach(() => { vi.clearAllMocks(); for (const method of [orderService.list, purchaseOrderService.list, goodsReceiptService.list, inventoryService.list, inventoryService.batches, productService.list, catalogService.products]) method.mockResolvedValue({ items: [], totalPages: 1, totalElements: 0 }); api.get.mockResolvedValue({ data: { data: { content: [], totalPages: 1, totalElements: 0 } } }); });
it('reads all pages and exact existing endpoints for an Admin without inventing statistics APIs', async () => {
  orderService.list.mockImplementation(({ page }) => Promise.resolve({ items: [{ orderCode: `OM${page}` }], totalPages: 2 }));
  const snapshot = await dashboardService.snapshot(user('ADMIN'));
  expect(snapshot.sources.orders.data).toHaveLength(2); expect(orderService.list).toHaveBeenCalledWith({ page: 1, size: 50 });
  expect(api.get).toHaveBeenCalledExactlyOnceWith('/management/return-requests', { params: { page: 0, size: 50 } }); expect(productService.list).toHaveBeenCalled(); expect(catalogService.products).not.toHaveBeenCalled();
});
it('does not request warehouse/procurement or Admin product APIs for sales staff', async () => {
  const snapshot = await dashboardService.snapshot(user('SALES_STAFF'));
  expect(snapshot.sources.stock.status).toBe('forbidden'); expect(snapshot.sources.purchases.status).toBe('forbidden'); expect(inventoryService.list).not.toHaveBeenCalled(); expect(purchaseOrderService.list).not.toHaveBeenCalled(); expect(productService.list).not.toHaveBeenCalled(); expect(catalogService.products).toHaveBeenCalled(); expect(api.get).toHaveBeenCalled();
});
it('does not request return data for warehouse staff but preserves authorized sales and stock data', async () => {
  const snapshot = await dashboardService.snapshot(user('WAREHOUSE_STAFF'));
  expect(snapshot.sources.returns.status).toBe('forbidden'); expect(api.get).not.toHaveBeenCalled(); expect(orderService.list).toHaveBeenCalled(); expect(inventoryService.list).toHaveBeenCalled();
});
it('marks a failed source unknown while preserving successful sources; never substitutes demo data', async () => {
  inventoryService.batches.mockRejectedValue(new Error('Offline')); const snapshot = await dashboardService.snapshot(user('ADMIN'));
  expect(snapshot.demo).toBe(false); expect(snapshot.sources.batches.status).toBe('error'); expect(snapshot.sources.orders.status).toBe('ready'); expect(snapshot.sources.batches.data).toEqual([]);
});
it('provides explicitly labeled demo data with no network calls or unauthorized sources', async () => {
  const snapshot = await dashboardService.snapshot(user('SALES_STAFF'), { demo: true, today: '2026-10-28' });
  expect(snapshot.demo).toBe(true); expect(snapshot.sources.orders.data.length).toBeGreaterThan(100); expect(snapshot.sources.stock.status).toBe('forbidden'); expect(orderService.list).not.toHaveBeenCalled(); expect(api.get).not.toHaveBeenCalled();
});
