import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./admin/notificationService', () => ({ notificationService: { list: vi.fn(), read: vi.fn() } }));
vi.mock('./client/checkoutService', () => ({ checkoutService: { orders: vi.fn(), promotions: vi.fn() } }));
vi.mock('./client/homeService', () => ({ homeService: { products: vi.fn() } }));
vi.mock('./inboxNotifications', () => ({ inboxNotifications: { list: vi.fn(), read: vi.fn() } }));
import { inboxNotifications } from './inboxNotifications';
vi.mock('./admin/orderService', () => ({ orderService: { list: vi.fn() } }));
import { notificationService } from './admin/notificationService';
import { checkoutService } from './client/checkoutService';
import { homeService } from './client/homeService';
import { orderService } from './admin/orderService';
import { loadInbox, readInboxItem } from './inboxService';
const order = { id: 'o', orderCode: 'OD1', status: 'confirmed', paymentStatus: 'pending', orderedAt: '2026-10-26T10:00' };
beforeEach(() => { vi.clearAllMocks(); inboxNotifications.list.mockResolvedValue({page:{items:[]},unreadCount:0}); const values = new Map(); vi.stubGlobal('localStorage', { getItem: (k) => values.get(k), setItem: (k, v) => values.set(k, v) }); checkoutService.orders.mockResolvedValue({ items: [order] }); checkoutService.promotions.mockResolvedValue({ items: [] }); homeService.products.mockResolvedValue([]); orderService.list.mockResolvedValue({ items: [order] }); notificationService.list.mockResolvedValue({ items: [{ id: 'n', variantId: 'v', title: 'Cần nhập', readAt: null }] }); });
it('reads only own orders for customers and marks order updates locally by account/status', async () => {
  const user = { username: 'an', roles: ['CUSTOMER'] };
  const first = await loadInbox(user); expect(first.items[0].read).toBe(false);
  expect(notificationService.list).not.toHaveBeenCalled(); expect(orderService.list).not.toHaveBeenCalled();
  await readInboxItem(user, first.items[0]); expect((await loadInbox(user)).items[0].read).toBe(true);
  expect((await loadInbox({ username: 'binh', roles: ['CUSTOMER'] })).items[0].read).toBe(false);
  checkoutService.orders.mockResolvedValue({ items: [{ ...order, status: 'shipping' }] }); expect((await loadInbox(user)).items[0].read).toBe(false);
});
it('sales staff reads staff orders without calling the warehouse-only notifications endpoint', async () => {
  inboxNotifications.list.mockResolvedValue({page:{items:[{id:'order-notice',category:'order',target:'/admin/sales-orders?orderId=o'}]},unreadCount:1});
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
  inboxNotifications.list.mockResolvedValue({page:{items:[{id:'order-notice',category:'order',target:'/admin/sales-orders?orderId=o'}]},unreadCount:1});
  const user = { username: 'admin', roles: ['ADMIN'] }; const inbox = await loadInbox(user);
  expect(inbox.items.map((n) => n.source)).toEqual(['order', 'stock']); await readInboxItem(user, inbox.items.find(item=>item.source==='stock')); expect(notificationService.read).toHaveBeenCalledWith('n');
});
it('keeps successful notification sources visible when another source fails', async () => {
  inboxNotifications.list.mockRejectedValueOnce(new Error('offline')); const inbox = await loadInbox({ username: 'admin', roles: ['ADMIN'] }); expect(inbox.items).toHaveLength(1); expect(inbox.partialError).toBe(true);
});
it('shows public new products to guests without requesting private promotions or orders', async () => {
  homeService.products.mockResolvedValue([{ id: 'uuid-private', productCode: 'SP01', productName: 'Rau cải hữu cơ', slug: 'rau-cai' }]);
  const inbox = await loadInbox(null); expect(inbox.owner).toBe('guest'); expect(inbox.items).toHaveLength(1);
  expect(inbox.items[0]).toMatchObject({ source: 'product', message: 'Rau cải hữu cơ', target: '/san-pham/rau-cai', read: false });
  expect(checkoutService.orders).not.toHaveBeenCalled(); expect(checkoutService.promotions).not.toHaveBeenCalled();
  await readInboxItem(null, inbox.items[0]); expect((await loadInbox(null)).items[0].read).toBe(true);
});
it('combines actual active promotions with new products and customer-owned orders', async () => {
  homeService.products.mockResolvedValue([{ id: 'p', productName: 'Cà rốt', slug: 'ca-rot' }]);
  checkoutService.promotions.mockResolvedValue({ items: [{ id: 'promo-id', promotionCode: 'XANH10', name: 'Ăn lành', discountType: 'percentage', discountValue: 10, minOrderValue: 200000, startDate: '2026-10-28T00:00', endDate: '2026-11-30T00:00' }] });
  const user = { username: 'an', roles: ['CUSTOMER'] }, inbox = await loadInbox(user);
  expect(inbox.items.map((item) => item.source)).toEqual(['promotion', 'order', 'product']);
  const promo = inbox.items.find(item=>item.source==='promotion'); expect(promo.title).toBe('Ưu đãi XANH10'); expect(promo.message).toContain('10%'); expect(promo.message).not.toContain('promo-id'); expect(promo.target).toBe('/gio-hang');
  await readInboxItem(user, promo); expect((await loadInbox(user)).items.find(item=>item.source==='promotion').read).toBe(true);
  checkoutService.promotions.mockResolvedValue({ items: [{ id: 'promo-id', promotionCode: 'XANH10', discountType: 'percentage', discountValue: 10, startDate: '2026-12-01', endDate: '2026-12-31' }] });
  expect((await loadInbox(user)).items.find(item=>item.source==='promotion').read).toBe(false);
});

it('uses the durable customer order notice instead of a duplicate synthetic status',async()=>{
  inboxNotifications.list.mockResolvedValue({page:{items:[{id:'durable',category:'order',title:'Đang chuẩn bị hàng',target:'/don-hang/o',readAt:null,createdAt:'2026-11-06'}]},unreadCount:1});
  const user={username:'an',roles:['CUSTOMER']},result=await loadInbox(user);
  expect(result.items.filter(item=>item.source==='order')).toHaveLength(1);
  await readInboxItem(user,result.items[0]);expect(inboxNotifications.read).toHaveBeenCalledWith('durable');
});
