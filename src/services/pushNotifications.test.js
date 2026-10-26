import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./api', () => ({ getSession: vi.fn() }));
vi.mock('./admin/notificationService', () => ({ notificationService: { register: vi.fn(), unregister: vi.fn() } }));
vi.mock('firebase/app', () => ({ getApps: () => [], initializeApp: vi.fn(() => ({})) }));
vi.mock('firebase/messaging', () => ({ isSupported: vi.fn(async () => true), getMessaging: vi.fn(() => ({})), getToken: vi.fn(async () => 'fcm-device'), deleteToken: vi.fn(async () => true), onMessage: vi.fn(() => () => {}) }));
import { getSession } from './api';
import { notificationService } from './admin/notificationService';
import { getToken, deleteToken } from 'firebase/messaging';
import { enablePush, disablePush, pushAvailability } from './pushNotifications';
import { notificationTarget } from '@/lib/notificationTarget';
import { firebaseConfig } from '@/constants/firebase';
beforeEach(() => {
  vi.clearAllMocks(); const storage = new Map();
  vi.stubGlobal('localStorage', { getItem: (k) => storage.get(k), setItem: (k, v) => storage.set(k, v) });
  vi.stubGlobal('window', { isSecureContext: true, Notification: {}, PushManager: {}, __MOC_CONFIG__: {} });
  vi.stubGlobal('navigator', { serviceWorker: { register: vi.fn(async () => ({ active: {} })) } });
  vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn(async () => 'granted') });
  getSession.mockReturnValue({ accessToken: 'session-1' });
  notificationService.register.mockResolvedValue(); notificationService.unregister.mockResolvedValue();
});
it('registers with explicit worker and VAPID, then unregisters and revokes on logout', async () => {
  await enablePush({ username: 'warehouse' });
  expect(getToken).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ vapidKey: expect.stringMatching(/^BOBE/), serviceWorkerRegistration: { active: {} } }));
  expect(notificationService.register).toHaveBeenCalledWith('fcm-device');
  await disablePush({ username: 'warehouse' }, false);
  expect(notificationService.unregister).toHaveBeenCalledWith('fcm-device'); expect(deleteToken).toHaveBeenCalled();
  expect(Notification.requestPermission).not.toHaveBeenCalled();
});
it('does not silently prompt default permission during login', async () => {
  Notification.permission = 'default';
  await expect(enablePush({ username: 'w' })).rejects.toThrow('chưa cho phép');
  expect(Notification.requestPermission).not.toHaveBeenCalled(); expect(notificationService.register).not.toHaveBeenCalled();
});
it('revokes an unregistered token when backend device registration fails', async () => {
  notificationService.register.mockRejectedValueOnce(new Error('backend unavailable'));
  await expect(enablePush({ username: 'w' })).rejects.toThrow('backend unavailable');
  expect(deleteToken).toHaveBeenCalled();
});
it('still revokes Firebase token when backend removal is unavailable', async () => {
  await enablePush({ username: 'warehouse' });
  notificationService.unregister.mockRejectedValueOnce(new Error('offline'));
  await expect(disablePush({ username: 'warehouse' })).rejects.toThrow('Chưa gỡ');
  expect(deleteToken).toHaveBeenCalled();
  await disablePush({ username: 'warehouse' });
});
it('refuses registering a token when the authenticated session changes mid-flight', async () => {
  getSession.mockReturnValueOnce({ accessToken: 'old' }).mockReturnValue({ accessToken: 'new' });
  await expect(enablePush({ username: 'w' })).rejects.toThrow('đã thay đổi');
  expect(notificationService.register).not.toHaveBeenCalled(); expect(deleteToken).toHaveBeenCalled();
});
it('rejects unsupported/blocked notifications and keeps safe internal navigation', () => {
  window.isSecureContext = false; expect(pushAvailability()).toContain('HTTPS');
  window.isSecureContext = true; Notification.permission = 'denied'; expect(pushAvailability()).toContain('chặn');
  expect(notificationTarget({ variantId: 'x&admin=true' })).toBe('/admin/inventory?variantId=x%26admin%3Dtrue');
  expect(notificationTarget({ url: 'https://evil.example' })).toBe('/admin/notifications');
});
it('resolves matching public project config for page and worker; runtime takes precedence', () => {
  expect(firebaseConfig({ VITE_FIREBASE_PROJECT_ID: 'runtime' }, { VITE_FIREBASE_PROJECT_ID: 'build' }).projectId).toBe('runtime');
  expect(firebaseConfig().projectId).toBe('backend-organic');
});
