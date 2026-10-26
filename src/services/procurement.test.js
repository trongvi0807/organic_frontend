import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }, DEMO_MODE: false, unwrap: (r) => r.data.data }));
import api from './api';
import { goodsReceiptService, inventoryService, purchaseOrderService } from './admin/procurementService';
import { notificationService } from './admin/notificationService';
const response = (data) => ({ data: { data } });
beforeEach(() => { vi.clearAllMocks(); for (const method of Object.values(api)) method.mockResolvedValue(response({})); });
it('uses backend document endpoints with filters and content pagination', async () => {
  api.get.mockResolvedValue(response({ content: [{ id: 'o' }], totalElements: 1 }));
  expect((await purchaseOrderService.list({ status: 'pending_approval', page: 0, size: 10 })).items).toEqual([{ id: 'o' }]);
  expect(api.get).toHaveBeenCalledWith('/purchase-orders', { params: { status: 'pending_approval', page: 0, size: 10 } });
});
it('keeps submit body absent and approval decision distinct', async () => {
  await goodsReceiptService.submit('g'); await goodsReceiptService.decide('g', 'reject', ' sai hạn '); await purchaseOrderService.decide('o', 'approve', '');
  expect(api.post).toHaveBeenCalledWith('/goods-receipts/g/submit', undefined);
  expect(api.post).toHaveBeenCalledWith('/goods-receipts/g/reject', { note: 'sai hạn' });
  expect(api.post).toHaveBeenCalledWith('/purchase-orders/o/approve', { note: null });
});
it('sends full edits through PUT and thresholds through PATCH', async () => {
  await purchaseOrderService.save('o', { items: [] }); await inventoryService.threshold('v', 0);
  expect(api.put).toHaveBeenCalledWith('/purchase-orders/o', { items: [] });
  expect(api.patch).toHaveBeenCalledWith('/inventory/variants/v/reorder-level', { reorderLevel: 0 });
});
it('uses current identity inbox and DELETE body when removing FCM devices', async () => {
  await notificationService.read('n'); await notificationService.retry('n'); await notificationService.register('token'); await notificationService.unregister('token');
  expect(api.patch).toHaveBeenCalledWith('/notifications/n/read'); expect(api.post).toHaveBeenCalledWith('/notifications/n/retry');
  expect(api.put).toHaveBeenCalledWith('/notifications/devices', { token: 'token' });
  expect(api.delete).toHaveBeenCalledWith('/notifications/devices', { data: { token: 'token' } });
});
