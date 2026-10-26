import api, { unwrap } from '../api';
import { normalizePage } from '@/lib/apiData';
import { requireBackend } from '../backendGuard';

const get = async (url, params) => { requireBackend(); return unwrap(await api.get(url, { params })); };
const post = async (url, data) => { requireBackend(); return unwrap(await api.post(url, data)); };
function documents(base) {
  return {
    list: async (params) => normalizePage(await get(base, params)),
    get: (id) => get(`${base}/${id}`),
    save: async (id, data) => { requireBackend(); return id ? unwrap(await api.put(`${base}/${id}`, data)) : post(base, data); },
    decide: (id, action, note) => post(`${base}/${id}/${action}`, { note: note?.trim() || null }),
  };
}
export const purchaseOrderService = documents('/purchase-orders');
export const goodsReceiptService = {
  ...documents('/goods-receipts'),
  submit: (id) => post(`/goods-receipts/${id}/submit`),
};
export const inventoryService = {
  list: async (params) => normalizePage(await get('/inventory/variants', params)),
  get: (id) => get(`/inventory/variants/${id}`),
  batches: async (params) => normalizePage(await get('/product-batches', params)),
  batch: (id) => get(`/product-batches/${id}`),
  threshold: async (id, reorderLevel) => { requireBackend(); return unwrap(await api.patch(`/inventory/variants/${id}/reorder-level`, { reorderLevel })); },
};
