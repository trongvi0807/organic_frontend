import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./admin/notificationService', () => ({ notificationService: { list: vi.fn(), read: vi.fn() } }));
vi.mock('./client/checkoutService', () => ({ checkoutService: { orders: vi.fn() } }));
vi.mock('./admin/orderService', () => ({ orderService: { list: vi.fn() } }));
import { notificationService } from './admin/notificationService';
import { checkoutService } from './client/checkoutService';
import { orderService } from './admin/orderService';
import { loadInbox, readInboxItem } from './inboxService';
const order = { id: 'o', orderCode: 'OD1', status: 'confirmed', paymentStatus: 'pending', orderedAt: '2026-10-26T10:00' };
beforeEach(() => { vi.clearAllMocks(); const values = new Map(); vi.stubGlobal('localStorage', { getItem: (k) => values.get(k), setItem: (k, v) => values.set(k, v) }); checkoutService.orders.mockResolvedValue({ items: [order] }); orderService.list.mockResolvedValue({ items: [order] }); notificationService.list.mockResolvedValue({ items: [{ id: 'n', variantId: 'v', title: 'Cần nhập', readAt: null }] }); });
it('reads only own orders for customers and marks order updates locally by account/status', async () => {
  const user = { username: 'an', roles: ['CUSTOMER'] };
  const first = await loadInbox(user); expect(first.items[0].read).toBe(false);
  expect(notificationService.list).not.toHaveBeenCalled(); expect(orderService.list).not.toHaveBeenCalled();
  await readInboxItem(user, first.items[0]); expect((await loadInbox(user)).items[0].read).toBe(true);
  expect((await loadInbox({ username: 'binh', roles: ['CUSTOMER'] })).items[0].read).toBe(false);
  checkoutService.orders.mockResolvedValue({ items: [{ ...order, status: 'shipping' }] }); expect((await loadInbox(user)).items[0].read).toBe(false);
});
it('sales staff reads staff orders without calling the warehouse-only notifications endpoint', async () => {
  const inbox = await loadInbox({ username: 'sales', roles: ['SALES_STAFF'] });
  expect(inbox.items[0].target).toBe('/admin/sales-orders?orderId=o'); expect(notificationService.list).not.toHaveBeenCalled();
});
it('warehouse staff does not request the sales-only management/orders endpoint', async () => {
  const inbox = await loadInbox({username:'warehouse',roles:['WAREHOUSE_STAFF']});
  expect(inbox.items.map((item)=>item.source)).toEqual(['stock']);
  expect(orderService.list).not.toHaveBeenCalled(); expect(checkoutService.orders).not.toHaveBeenCalled();
  expect(inbox.partialError).toBe(false);
});
it('Admin combines warehouse alerts and sales updates; warehouse read syncs through backend', async () => {
  const user = { username: 'admin', roles: ['ADMIN'] }; const inbox = await loadInbox(user);
  expect(inbox.items.map((n) => n.source)).toEqual(['stock', 'order']); await readInboxItem(user, inbox.items[0]); expect(notificationService.read).toHaveBeenCalledWith('n');
});
it('keeps successful notification sources visible when another source fails', async () => {
  orderService.list.mockRejectedValue(new Error('offline')); const inbox = await loadInbox({ username: 'admin', roles: ['ADMIN'] }); expect(inbox.items).toHaveLength(1); expect(inbox.partialError).toBe(true);
});
