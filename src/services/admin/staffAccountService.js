import api, { unwrap } from '../api';
import { normalizePage } from '@/lib/apiData';
import { requireBackend } from '../backendGuard';

export const staffAccountService = {
  async list(params) { requireBackend(); return normalizePage(unwrap(await api.get('/admin/employees', { params }))); },
  async save(id, values) {
    requireBackend();
    const request = id ? api.put(`/admin/employees/${encodeURIComponent(id)}`, values) : api.post('/admin/employees', values);
    return unwrap(await request);
  },
};
