import api, { unwrap } from '../api';
import { normalizePage } from '@/lib/apiData';
import { requireBackend } from '../backendGuard';

export const homeAdminService = {
  async content() { requireBackend(); return unwrap(await api.get('/admin/home/content')); },
  async saveContent(values) { requireBackend(); return unwrap(await api.put('/admin/home/content', values)); },
  async products(params) { requireBackend(); return normalizePage(unwrap(await api.get('/admin/home/products', { params }))); },
  async featured(id, featured, featuredOrder) { requireBackend(); return unwrap(await api.patch(`/admin/home/products/${id}/featured`, { featured, featuredOrder: Number(featuredOrder) })); },
  async refresh() { requireBackend(); return unwrap(await api.post('/admin/home/cache/refresh')); },
};
