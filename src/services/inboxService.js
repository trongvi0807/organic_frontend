import { notificationService } from './admin/notificationService';
import { checkoutService } from './client/checkoutService';
import { orderService } from './admin/orderService';
import { hasRole } from '@/lib/permissions';
import { orderLabels, paymentLabels } from '@/lib/checkout';
import { readStorage, writeStorage } from '@/lib/storage';

const readKey = (user) => `moc.order-updates.read:${user.username}`;
export async function loadInbox(user) {
  const staff = hasRole(user, 'ADMIN', 'SALES_STAFF'), stock = hasRole(user, 'ADMIN', 'WAREHOUSE_STAFF');
  const requests = [];
  if (stock) requests.push(notificationService.list({ page: 0, size: 20 }).then((page) => page.items.map((n) => ({ ...n, key: `stock:${n.id}`, source: 'stock', target: `/admin/inventory?variantId=${encodeURIComponent(n.variantId)}`, read: !!n.readAt }))));
  if (staff || hasRole(user, 'CUSTOMER')) requests.push((staff ? orderService.list : checkoutService.orders)({ page: 0, size: 10 }).then((page) => {
    const read = readStorage(readKey(user), []);
    return page.items.map((order) => { const key = `order:${order.id}:${order.status}:${order.paymentStatus}`; return { key, id: order.id, source: 'order', title: order.orderCode, message: `${orderLabels[order.status] || order.status} · ${paymentLabels[order.paymentStatus] || order.paymentStatus}`, read: read.includes(key), target: staff ? `/admin/sales-orders?orderId=${encodeURIComponent(order.id)}` : `/don-hang/${encodeURIComponent(order.id)}`, createdAt: order.orderedAt }; });
  }));
  const results = await Promise.allSettled(requests);
  const items = results.flatMap((r) => r.status === 'fulfilled' ? r.value : []);
  return { owner: user.username, items, partialError: results.some((r) => r.status === 'rejected') };
}
export async function readInboxItem(user, item) {
  if (item.source === 'stock') await notificationService.read(item.id);
  else { const values = readStorage(readKey(user), []); writeStorage(readKey(user), [...new Set([item.key, ...values])].slice(0, 200)); }
}
