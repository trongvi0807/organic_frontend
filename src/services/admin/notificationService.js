import api, { unwrap } from '../api';
import { normalizePage } from '@/lib/apiData';
import { requireBackend } from '../backendGuard';

export const notificationService = {
  async list(params) { requireBackend(); return normalizePage(unwrap(await api.get('/notifications', { params }))); },
  async read(id) { requireBackend(); return unwrap(await api.patch(`/notifications/${id}/read`)); },
  async retry(id) { requireBackend(); return unwrap(await api.post(`/notifications/${id}/retry`)); },
  async register(token) { requireBackend(); await api.put('/notifications/devices', { token }); },
  async unregister(token) { requireBackend(); await api.delete('/notifications/devices', { data: { token } }); },
};
