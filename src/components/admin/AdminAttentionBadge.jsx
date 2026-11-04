import { useNotifications } from '@/contexts/NotificationContext';

export function useAdminAttention(item) {
  const { unreadByCategory = {}, orderActionCount = 0 } = useNotifications();
  if (item.path === 'sales-orders') {
    const unread = unreadByCategory.order || 0;
    return { count: orderActionCount || unread, unread, label: `${orderActionCount} đơn cần chuẩn bị hoặc sắp xếp giao hàng; ${unread} thông báo đơn chưa đọc`, target: '/admin/sales-orders' };
  }
  const source = { feedbacks: 'feedback', 'return-requests': 'return' }[item.path];
  if (source) {
    const unread = unreadByCategory[source] || 0;
    return { count: unread, unread, label: `${unread} cập nhật ${item.name.toLowerCase()} chưa đọc`, target: `/admin/${item.path}` };
  }
  if (item.id === 'sales') {
    const unread = (unreadByCategory.order || 0) + (unreadByCategory.feedback || 0) + (unreadByCategory.return || 0);
    return { count: Math.max(orderActionCount, unreadByCategory.order || 0) + (unreadByCategory.feedback || 0) + (unreadByCategory.return || 0), unread, label: `${orderActionCount} đơn cần xử lý; ${unread} thông báo bán hàng chưa đọc`, target: orderActionCount || unreadByCategory.order ? '/admin/sales-orders' : unreadByCategory.feedback ? '/admin/feedbacks' : '/admin/return-requests' };
  }
  return { count: 0, unread: 0 };
}

export function AdminAttentionBadge({ attention }) {
  if (!attention.count) return null;
  return <span className={`admin-attention-badge ${attention.unread ? 'has-unread' : ''}`} title={attention.label}>
    {attention.unread > 0 && <span className="admin-attention-dot motion-safe:animate-pulse" aria-hidden="true" />}
    <span aria-hidden="true">{attention.count > 99 ? '99+' : attention.count}</span><span className="sr-only">{attention.label}</span>
  </span>;
}
