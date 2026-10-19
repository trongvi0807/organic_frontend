import api, { DEMO_MODE, unwrap } from '../api';
import { demoList, demoPage, demoSave, demoDelete } from '../demoStore';

// Product metadata is separate from price/stock in the existing backend.
export const productService = {
  async list(params) { return DEMO_MODE ? demoPage('products', params) : unwrap(await api.get('/admin/products', { params })); },
  async get(id) { return DEMO_MODE ? demoList('products').find((item) => item.id === id) : unwrap(await api.get(`/admin/products/${id}`)); },
  async save(id, values) {
    if (DEMO_MODE) return demoSave('products', id, values);
    const { productCode, productName, slug, categoryId, brandId, description, status, organicClaimStatus, certificationIds } = values;
    const payload = { productCode, productName, slug, categoryId, brandId: brandId || null, description, status, organicClaimStatus, certificationIds: certificationIds || [] };
    return unwrap(await (id ? api.put(`/admin/products/${id}`, payload) : api.post('/admin/products', payload)));
  },
  async remove(id) { return DEMO_MODE ? demoDelete('products', id) : unwrap(await api.delete(`/admin/products/${id}`)); },
  async options() { return DEMO_MODE ? { brands: [], certifications: [] } : unwrap(await api.get('/admin/products/options')); },
};
