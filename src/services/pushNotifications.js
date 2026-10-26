import { notificationService } from './admin/notificationService';
import { getSession } from './api';
import { firebaseConfig, firebaseConfigured, defaultVapidKey } from '@/constants/firebase';
import { readStorage, writeStorage } from '@/lib/storage';

const TOKEN_KEY = 'moc.push.device';
const preferenceKey = (user) => `moc.push.enabled.${user.username}`;
let clientPromise;
let currentDevice = null;
const device = () => readStorage(TOKEN_KEY, null) || currentDevice;
export const ownsPushDevice = (user) => device()?.username === user?.username;
let queue = Promise.resolve();
const serialize = (task) => { const result = queue.catch(() => {}).then(task); queue = result.catch(() => {}); return result; };
export const pushOptedIn = (user) => readStorage(preferenceKey(user), false) === true;
export function pushAvailability() {
  if (!window.isSecureContext) return 'Thông báo đẩy cần HTTPS hoặc localhost.';
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'Trình duyệt này chưa hỗ trợ thông báo đẩy.';
  if (Notification.permission === 'denied') return 'Quyền thông báo đã bị chặn. Mở cài đặt trang web của trình duyệt để cho phép.';
  if (!firebaseConfigured(firebaseConfig(window.__MOC_CONFIG__ || {}, import.meta.env))) return 'Thông báo đẩy chưa được cửa hàng cấu hình. Bạn vẫn có thể xem thông báo trong hệ thống.';
  return '';
}
async function client() {
  if (!clientPromise) clientPromise = (async () => {
    const runtime = window.__MOC_CONFIG__ || {};
    const config = firebaseConfig(runtime, import.meta.env);
    if (!firebaseConfigured(config)) throw new Error('Thông báo đẩy chưa được cửa hàng cấu hình.');
    const [{ initializeApp, getApps }, sdk] = await Promise.all([import('firebase/app'), import('firebase/messaging')]);
    if (!await sdk.isSupported()) throw new Error('Trình duyệt không hỗ trợ Firebase Messaging hoặc bộ nhớ IndexedDB đang bị chặn.');
    const app = getApps().find((item) => item.name === 'moc-push') || initializeApp(config, 'moc-push');
    return { sdk, messaging: sdk.getMessaging(app), vapidKey: runtime.VITE_FIREBASE_VAPID_KEY || import.meta.env.VITE_FIREBASE_VAPID_KEY || defaultVapidKey };
  })().catch((err) => { clientPromise = null; throw err; });
  return clientPromise;
}
export function enablePush(user, askPermission = false) {
  // Permission must be requested directly from a user gesture, before asynchronous setup.
  const reason = pushAvailability();
  if (reason) return Promise.reject(new Error(reason));
  const permission = Notification.permission === 'default' && askPermission ? Notification.requestPermission() : Promise.resolve(Notification.permission);
  const session = getSession();
  return serialize(async () => {
    if (await permission !== 'granted') throw new Error('Bạn chưa cho phép trình duyệt nhận thông báo. Hộp thư trong ứng dụng vẫn hoạt động.');
    const { sdk, messaging, vapidKey } = await client();
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    // Wait for this exact registration, rather than another worker's ready promise.
    await waitForWorker(registration);
    const token = await sdk.getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!token) throw new Error('Firebase chưa cấp mã thiết bị. Kiểm tra cấu hình Web Push.');
    if (!session || getSession()?.accessToken !== session.accessToken) { await sdk.deleteToken(messaging); throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng bật thông báo lại.'); }
    try { await notificationService.register(token); }
    catch (err) { await sdk.deleteToken(messaging).catch(() => {}); throw err; }
    currentDevice = { token, username: user.username };
    writeStorage(TOKEN_KEY, currentDevice);
    writeStorage(preferenceKey(user), true);
  });
}
export function waitForWorker(registration) {
  if (registration.active) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const worker = registration.installing || registration.waiting;
    if (!worker) return reject(new Error('Service worker chưa sẵn sàng. Tải lại trang và thử lại.'));
    const timer = setTimeout(() => done(new Error('Không thể khởi động service worker thông báo.')), 15000);
    function done(error) { clearTimeout(timer); worker.removeEventListener('statechange', check); error ? reject(error) : resolve(); }
    function check() { if (worker.state === 'activated') done(); else if (worker.state === 'redundant') done(new Error('Service worker thông báo bị lỗi cài đặt.')); }
    worker.addEventListener('statechange', check); check();
  });
}
export function disablePush(user, forget = true) {
  return serialize(async () => {
    const registered = device();
    if (forget && user) writeStorage(preferenceKey(user), false);
    const errors = [];
    if (registered) {
      try { await notificationService.unregister(registered.token); } catch (err) { errors.push(err); }
    }
    // Also revoke locally so a stale backend token cannot keep delivering after logout.
    if (registered || clientPromise) {
      try { const { sdk, messaging } = await client(); await sdk.deleteToken(messaging); } catch (err) { errors.push(err); }
    }
    if (!errors.length) { currentDevice = null; writeStorage(TOKEN_KEY, null); }
    if (errors.length) throw new Error('Chưa gỡ hoàn toàn thiết bị thông báo. Kiểm tra mạng và thử lại.');
  });
}
export async function listenToPush(callback) {
  if (pushAvailability()) return () => {};
  const { sdk, messaging } = await client();
  return sdk.onMessage(messaging, callback);
}
export function revokeLocalPush() {
  return serialize(async () => {
    if (!device() && !clientPromise) return;
    const { sdk, messaging } = await client();
    await sdk.deleteToken(messaging);
    currentDevice = null;
    writeStorage(TOKEN_KEY, null);
  });
}
