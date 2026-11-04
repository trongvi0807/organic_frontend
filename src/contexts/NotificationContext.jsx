import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { hasRole } from '@/lib/permissions';
import { DEMO_MODE } from '@/services/api';
import { enablePush, disablePush, listenToPush, pushOptedIn, ownsPushDevice } from '@/services/pushNotifications';
import { notificationTarget } from '@/lib/notificationTarget';
import { errorMessage } from '@/lib/utils';
import { useResource } from '@/hooks/useResource';
import { loadInbox, readInboxItem } from '@/services/inboxService';

const NotificationContext = createContext(null);
export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const allowed = !DEMO_MODE && hasRole(user, 'ADMIN', 'WAREHOUSE_STAFF');
  const [enabled, setEnabled] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [revision, setRevision] = useState(0);
  const seen = useRef(new Set());
  const inboxSeen = useRef({ owner: null, ids: new Set(), initialized: false });
  const owner = user?.username || 'guest';
  const inbox = useResource(() => loadInbox(user), [owner, revision]);
  const items = inbox.data?.owner === owner ? inbox.data?.items || [] : [];
  useEffect(() => {
    if (inbox.data?.owner !== owner || !inbox.data.inboxLoaded) return;
    if (inboxSeen.current.owner !== owner) inboxSeen.current = { owner, ids: new Set(), initialized: false };
    const state = inboxSeen.current, persistent = items.filter(item => item.persistent);
    const fresh = persistent.filter(item => !item.read && !state.ids.has(item.id));
    if (state.initialized) fresh.slice(0, 3).forEach(item => toast(item.title, { description: item.message, action: { label: 'Xem nội dung', onClick: () => navigate(item.target) } }));
    persistent.forEach(item => state.ids.add(item.id));
    state.initialized = true;
  }, [inbox.data, owner, navigate]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') inbox.reload({ background: true }); };
    const timer = setInterval(refresh, 15000); window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('moc:order-updated', refresh); window.addEventListener('moc:payment-updated', refresh);
    window.addEventListener('moc:after-sales-updated', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('moc:order-updated', refresh); window.removeEventListener('moc:payment-updated', refresh); window.removeEventListener('moc:after-sales-updated', refresh); };
  }, [owner, inbox.reload]);
  async function markRead(item) {
    await readInboxItem(user, item);
    inbox.setData(old => {
      if (old?.owner !== owner) return old;
      const previous = old.items.find(n => n.key === item.key);
      const delta = previous?.persistent && !previous.read ? 1 : 0;
      return { ...old, persistentUnread: Math.max(0, (old.persistentUnread || 0) - delta), unreadByCategory: { ...old.unreadByCategory, [item.source]: Math.max(0, (old.unreadByCategory?.[item.source] || 0) - delta) }, items: old.items.map(n => n.key === item.key ? { ...n, read: true } : n) };
    });
  }
  useEffect(() => {
    let cancelled = false;
    setError(''); setEnabled(false); seen.current.clear();
    if (!allowed) return;
    async function resume() {
      if (!pushOptedIn(user)) return;
      try { await enablePush(user); if (!cancelled) { setEnabled(true); setError(''); } }
      catch (err) { if (!cancelled) setError(errorMessage(err)); }
    }
    resume();
    // Refresh token/registration when returning to an opted-in account.
    window.addEventListener('focus', resume);
    return () => { cancelled = true; window.removeEventListener('focus', resume); };
  }, [allowed, user?.username]);
  useEffect(() => {
    if (!allowed) return;
    let cancelled = false, unsubscribe = () => {};
    function receive(payload, foreground = true) {
      if (cancelled || !ownsPushDevice(user)) return;
      const id = payload.data?.notificationId || payload.messageId;
      if (id && seen.current.has(id)) return;
      if (id) { seen.current.add(id); if (seen.current.size > 200) seen.current.delete(seen.current.values().next().value); }
      setRevision((value) => value + 1);
      if (foreground) toast(payload.notification?.title || 'Cập nhật kho hàng', { description: payload.notification?.body || 'Có thông báo tồn kho mới.', action: { label: 'Xem tồn kho', onClick: () => navigate(notificationTarget(payload.data)) } });
    }
    const background = (event) => { if (event.data?.type === 'moc:notification') receive({ data: event.data.data }, false); };
    navigator.serviceWorker?.addEventListener('message', background);
    if (enabled) listenToPush(receive).then((stop) => { if (cancelled) stop(); else unsubscribe = stop; }).catch((err) => { if (!cancelled) setError(errorMessage(err)); });
    return () => { cancelled = true; unsubscribe(); navigator.serviceWorker?.removeEventListener('message', background); };
  }, [allowed, enabled, user?.username, navigate]);
  async function toggle() {
    if (!allowed || busy) return;
    setBusy(true); setError('');
    try {
      if (enabled) { await disablePush(user); setEnabled(false); }
      else { await enablePush(user, true); setEnabled(true); }
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  return <NotificationContext.Provider value={{ enabled, busy, error, toggle, revision, items, unreadByCategory: inbox.data?.owner === owner ? inbox.data.unreadByCategory || {} : {}, orderActionCount: inbox.data?.owner === owner ? inbox.data.orderActionCount || 0 : 0, unread: (inbox.data?.owner === owner ? inbox.data.persistentUnread || 0 : 0) + items.filter(n => !n.persistent && !n.read).length, inboxLoading: inbox.loading, inboxError: inbox.error || inbox.refreshError || (inbox.data?.partialError ? 'Một nguồn thông báo chưa tải được. Bấm chuông để thử lại.' : ''), reloadInbox: inbox.reload, markRead }}>{children}</NotificationContext.Provider>;
}
export const useNotifications = () => useContext(NotificationContext);
