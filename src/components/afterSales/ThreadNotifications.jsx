import { useEffect, useRef } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { inboxNotifications } from '@/services/inboxNotifications';

function matchesThread(item, kind, id) {
  if (!id) return false;
  if (kind === 'order') return item.source === 'order' && item.orderId === id;
  return kind === 'return' ? item.returnRequestId === id : item.feedbackId === id;
}

export function ThreadUnreadBadge({ kind, id }) {
  const { items } = useNotifications();
  const unread = items.some(item => item.persistent && !item.read && matchesThread(item, kind, id));
  return unread ? <span className="!mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-900"><span className="size-1.5 rounded-full bg-emerald-600 motion-safe:animate-pulse" />Có cập nhật chưa đọc</span> : null;
}
export function useReadThread(kind, id, resource) {
  const { items, reloadInbox } = useNotifications();
  const pending = useRef(null);
  const unreadIds = items.filter(item => item.persistent && !item.read && matchesThread(item, kind, id)).map(item => item.id).sort().join(',');
  useEffect(() => {
    if (!resource.data || resource.loading || resource.error || !unreadIds) return;
    if (!pending.current || pending.current.key !== unreadIds) {
      pending.current = { key: unreadIds, data: resource.data, ids: unreadIds.split(','), reading: false };
      resource.reload({ background: true });
      return;
    }
    const batch = pending.current;
    // Fetch the new conversation first. Mark only the notifications that were
    // visible before that fetch, so a message arriving meanwhile stays unread.
    if (resource.data === batch.data || batch.reading) return;
    batch.reading = true;
    Promise.all(batch.ids.map(notificationId => inboxNotifications.read(notificationId)))
      .then(() => { pending.current = null; reloadInbox({ background: true }); })
      .catch(() => { batch.reading = false; batch.data = resource.data; });
  }, [kind, id, resource.data, resource.loading, resource.error, resource.reload, unreadIds, reloadInbox]);
}
