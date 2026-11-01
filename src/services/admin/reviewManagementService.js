import api, { unwrap } from '../api';
import { normalizePage } from '@/lib/apiData';

const base = '/management/reviews/products';
export const reviewManagementService = {
  async products(params) { return normalizePage(unwrap(await api.get(base, { params }))); },
  async product(id, params) { return unwrap(await api.get(`${base}/${encodeURIComponent(id)}`, { params })); },
  async reviews(id, params) { return normalizePage(unwrap(await api.get(`${base}/${encodeURIComponent(id)}/reviews`, { params }))); },
};
