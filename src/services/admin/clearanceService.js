import api, { publicApi, unwrap } from '../api';
const root = '/admin/clearance-offers';
export const clearanceService = {
  list: () => api.get(root).then(unwrap),
  options: search => api.get(`${root}/options`, { params: { search } }).then(unwrap),
  update: (id, values) => api.put(`${root}/${encodeURIComponent(id)}`, values).then(unwrap),
  create: values => api.post(root, values).then(unwrap),
  action: (row, action, note) => api.post(`${root}/${encodeURIComponent(row.id)}/${action}`, { version: row.version, note: note || null }).then(unwrap),
  crossSell: productId => publicApi.get(`/products/${encodeURIComponent(productId)}/cross-sell`, { params: { k: 3 } }).then(unwrap),
  discounted: () => publicApi.get('/home/discounted-stock').then(unwrap),
};
