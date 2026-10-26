import api, { DEMO_MODE, unwrap } from '../api';
import { demoPage, demoSave, demoDelete } from '../demoStore';
import { normalizePage } from '@/lib/apiData';

export const categoryService = {
  async get(id) { return DEMO_MODE ? demoPage('categories', {size:100}).items.find((item) => item.id === id) : unwrap(await api.get(`/admin/categories/${encodeURIComponent(id)}`)); },
  async list(params) { return DEMO_MODE ? demoPage('categories', params) : normalizePage(unwrap(await api.get('/admin/categories', { params }))); },
  async save(id, values) {
    if (DEMO_MODE) return demoSave('categories', id, values);
    const { categoryCode, categoryName, description, status, parentId } = values;
    const payload = { categoryCode, categoryName, description, status, parentId: parentId || null };
    return unwrap(await (id ? api.put(`/admin/categories/${id}`, payload) : api.post('/admin/categories', payload)));
  },
  async remove(id) { return DEMO_MODE ? demoDelete('categories', id) : unwrap(await api.delete(`/admin/categories/${id}`)); },
};
