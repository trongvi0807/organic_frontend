import api, { DEMO_MODE, unwrap } from '../api';
import { demoList, demoPage, demoSave, demoDelete } from '../demoStore';
import { normalizePage } from '@/lib/apiData';
import { categoryIdentityErrors, cleanCategoryName } from '@/lib/categoryRules';
import { invalidateCategoryTree } from '../client/catalogService';

export const categoryService = {
  async get(id) { return DEMO_MODE ? demoList('categories').find((item) => item.id === id) : unwrap(await api.get(`/admin/categories/${encodeURIComponent(id)}`)); },
  async list(params) { return DEMO_MODE ? demoPage('categories', params) : normalizePage(unwrap(await api.get('/admin/categories', { params }))); },
  async save(id, values) {
    const { categoryCode, categoryName, description, status, parentId } = values;
    const payload = { categoryCode: String(categoryCode ?? '').trim().toUpperCase(), categoryName: cleanCategoryName(categoryName), description, status, parentId: parentId || null };
    if (DEMO_MODE) {
      if (!payload.categoryName || !payload.categoryCode) throw new Error('Vui lòng nhập tên và cấp mã loại sản phẩm.');
      const issues = categoryIdentityErrors(demoList('categories'), payload, id);
      if (Object.keys(issues).length) throw new Error(Object.values(issues)[0]);
      const saved = demoSave('categories', id, payload); invalidateCategoryTree(); return saved;
    }
    const saved = unwrap(await (id ? api.put(`/admin/categories/${id}`, payload) : api.post('/admin/categories', payload)));
    invalidateCategoryTree(); return saved;
  },
  async remove(id) { const result = DEMO_MODE ? demoDelete('categories', id) : unwrap(await api.delete(`/admin/categories/${id}`)); invalidateCategoryTree(); return result; },
};
