import { notificationService } from './admin/notificationService';
import { checkoutService } from './client/checkoutService';
import { hasRole, can, STAFF_ROLES } from '@/lib/permissions';
import { readStorage, writeStorage } from '@/lib/storage';
import { homeService } from './client/homeService';
import { DEMO_MODE } from './api';
import { productHref } from '@/lib/productDetail';
import { currency } from '@/lib/utils';
import { orderBadge, paymentBadge } from '@/lib/customerOrders';
import { inboxNotifications } from './inboxNotifications';

const readKey = (user) => `moc.order-updates.read:${user?.username || 'guest'}`;
export async function loadInbox(user) {
  const stock = can(user, 'inventory.read');
  const requests = [];
  if (user && !DEMO_MODE) requests.push(inboxNotifications.list().then(result => ({
    unreadCount: result.unreadCount,
    unreadByCategory: result.unreadByCategory,
    orderActionCount: result.orderActionCount,
    items: (result.page.items || result.page.content || []).map(n => ({ ...n, source: n.category, orderId: n.category === 'order' ? new URL(n.target, 'https://local.invalid').searchParams.get('orderId') : null, key: `inbox:${n.id}`, persistent: true, read: !!n.readAt })),
  })));
  if (stock && !DEMO_MODE) requests.push(notificationService.list({ page: 0, size: 20 }).then((page) => page.items.map((n) => ({ ...n, key: `stock:${n.id}`, source: 'stock', target: `/admin/inventory?variantId=${encodeURIComponent(n.variantId)}`, read: !!n.readAt }))));
  if (!DEMO_MODE && hasRole(user, 'CUSTOMER') && !hasRole(user, ...STAFF_ROLES)) requests.push(checkoutService.orders({ page: 0, size: 10 }).then((page) => {
    const read = readStorage(readKey(user), []);
    return page.items.map((order) => { const key = `order:${order.id}:${order.status}:${order.paymentStatus}`; return { key, id: order.id, source: 'order', title: order.orderCode ? `Đơn #${order.orderCode}` : 'Đơn hàng chưa có mã', message: `${orderBadge(order)[0]} · ${paymentBadge(order)[0]}`, read: read.includes(key), target: `/don-hang/${encodeURIComponent(order.id)}`, createdAt: order.orderedAt }; });
  }));
  if (!user || hasRole(user, 'CUSTOMER')) {
    requests.push(homeService.products('newest').then((products) => {
      const read = readStorage(readKey(user), []);
      return products.slice(0, 6).map((product) => { const key = `product:${product.id}`; return { key, source: 'product', title: 'Sản phẩm mới tại organicfood.vn', message: product.productName || 'Khám phá thực phẩm tươi lành vừa được giới thiệu.', target: productHref(product), read: read.includes(key) }; });
    }));
    if (user && !DEMO_MODE) requests.push(checkoutService.promotions({ page: 0, size: 8 }).then((page) => {
      const read = readStorage(readKey(user), []);
      return page.items.map((promo) => { const key = `promotion:${promo.id}:${promo.startDate}:${promo.endDate}`; const discount = promo.discountType === 'percentage' ? `${Number(promo.discountValue)}%` : currency(promo.discountValue); return { key, source: 'promotion', title: `Ưu đãi ${promo.promotionCode || 'của organicfood.vn'}`, message: `${promo.name || 'Mã giảm giá đang hiệu lực'} · Giảm ${discount}${Number(promo.minOrderValue) > 0 ? ` cho đơn từ ${currency(promo.minOrderValue)}` : ''}. Kiểm tra điều kiện áp dụng tại giỏ hàng.`, promotionCode: promo.promotionCode, target: '/gio-hang', read: read.includes(key), createdAt: promo.startDate }; });
    }));
  }
  const results = await Promise.allSettled(requests);
  const items = results.flatMap((r) => r.status === 'fulfilled' ? (r.value.items || r.value) : [])
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const persistentUnread = results.reduce((total, result) => total + (result.status === 'fulfilled' ? Number(result.value.unreadCount || 0) : 0), 0);
  const persistent = results.find(result => result.status === 'fulfilled' && result.value.unreadCount !== undefined)?.value;
  const unreadByCategory = persistent?.unreadByCategory || items.filter(item => item.persistent && !item.read).reduce((counts, item) => ({ ...counts, [item.source]: (counts[item.source] || 0) + 1 }), {});
  return { owner: user?.username || 'guest', items, persistentUnread, unreadByCategory, orderActionCount: Number(persistent?.orderActionCount || 0), inboxLoaded: !!persistent, partialError: results.some((r) => r.status === 'rejected') };
}
export async function readInboxItem(user, item) {
  if (item.persistent) await inboxNotifications.read(item.id);
  else if (item.source === 'stock') await notificationService.read(item.id);
  else { const values = readStorage(readKey(user), []); writeStorage(readKey(user), [...new Set([item.key, ...values])].slice(0, 200)); }
}
