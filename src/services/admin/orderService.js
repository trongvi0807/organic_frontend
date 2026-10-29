import api, { unwrap } from '../api';
import { normalizePage } from '@/lib/apiData';
import { requireBackend } from '../backendGuard';
const get = async (url, params) => { requireBackend(); return unwrap(await api.get(url, { params })); };
const post = async (url, data) => { requireBackend(); return unwrap(await api.post(url, data)); };
export const orderService = {
  list: async (params) => normalizePage(await get('/management/orders', params)),
  get: (id) => get(`/management/orders/${encodeURIComponent(id)}`),
  prepare: (id) => post(`/management/orders/${encodeURIComponent(id)}/prepare`),
  complete: (id) => post(`/management/orders/${encodeURIComponent(id)}/complete`),
  collect: (id) => post(`/management/orders/${encodeURIComponent(id)}/cod/collect`),
  reconcile: (id) => post(`/management/orders/${encodeURIComponent(id)}/cod/reconcile`),
  book: (id, data) => post(`/management/orders/${encodeURIComponent(id)}/shipments`, data),
  shipment: async (id, data) => { requireBackend(); return unwrap(await api.patch(`/management/shipments/${encodeURIComponent(id)}/status`, data)); },
  reviewPayments: async (params) => normalizePage(await get('/management/payments/requires-review', params)),
};
export const promotionService = {
  nextCode: () => get('/admin/promotions/next-code'),
  products: async (params) => normalizePage(await get('/admin/promotions/products', params)),
  batches: async (params) => normalizePage(await get('/admin/promotions/batches', params)),
  list: async (params) => normalizePage(await get('/admin/promotions', params)),
  get: (id) => get(`/admin/promotions/${encodeURIComponent(id)}`),
  save: async (id, data) => { requireBackend(); return unwrap(await (id ? api.put(`/admin/promotions/${encodeURIComponent(id)}`, data) : api.post('/admin/promotions', data))); },
  deactivate: async (id) => { requireBackend(); return unwrap(await api.delete(`/admin/promotions/${encodeURIComponent(id)}`)); },
};
