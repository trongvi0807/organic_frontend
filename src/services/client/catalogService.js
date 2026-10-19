import api, { DEMO_MODE, unwrap } from '../api';
import { demoPage, demoList } from '../demoStore';

export const catalogService = {
  async products(params) { return DEMO_MODE ? demoPage('products', params, true) : unwrap(await api.get('/products', { params })); },
  async product(id) { return DEMO_MODE ? demoList('products').find((item) => item.id === id && item.status === 'active') : unwrap(await api.get(`/products/${id}`)); },
  async categories(params) { return DEMO_MODE ? demoPage('categories', params, true) : unwrap(await api.get('/categories', { params })); },
};
