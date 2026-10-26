import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import { firebaseConfig, firebaseConfigured } from './constants/firebase';
import { notificationTarget } from './lib/notificationTarget';

// Register before Firebase's listener so custom click routing wins.
self.addEventListener('notificationclick', (event) => {
  event.stopImmediatePropagation();
  event.notification.close();
  const raw = event.notification.data || {};
  const data = raw.FCM_MSG?.data || raw;
  const target = new URL(notificationTarget(data), self.location.origin);
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find((client) => new URL(client.url).origin === target.origin);
    if (existing) { await existing.navigate(target.href); await existing.focus(); }
    else await self.clients.openWindow(target.href);
  })());
});
self.importScripts('/runtime-config.js');
const config = firebaseConfig(self.__MOC_CONFIG__ || {}, import.meta.env);
if (firebaseConfigured(config)) {
const messaging = getMessaging(initializeApp(config));
onBackgroundMessage(messaging, async (payload) => {
  // FCM automatically displays notification payloads; do not display twice.
  if (!payload.notification) await self.registration.showNotification('Mộc · Thông báo kho', {
    body: payload.data?.message || 'Có cập nhật tồn kho mới.',
    tag: payload.data?.notificationId || payload.messageId,
    data: payload.data,
  });
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  windows.forEach((client) => client.postMessage({ type: 'moc:notification', data: payload.data }));
});
}
