import api, { unwrap } from '../api';
import { normalizePage } from '@/lib/apiData';
const root = '/liquidations';
export const liquidationService = {
  list: async params => normalizePage(unwrap(await api.get(root, { params }))),
  get: async id => unwrap(await api.get(`${root}/${encodeURIComponent(id)}`)),
  nextCode: async () => unwrap(await api.get(`${root}/next-code`)),
  batches: async params => normalizePage(unwrap(await api.get(`${root}/batches`, { params }))),
  history: async (id, params) => normalizePage(unwrap(await api.get(`${root}/${encodeURIComponent(id)}/history`, { params }))),
  save: async (id, payload) => unwrap(await (id ? api.put(`${root}/${encodeURIComponent(id)}`, payload) : api.post(root, payload))),
  act: async (id, action, payload = {}) => {
    if (!['submit', 'approve', 'reject', 'cancel', 'complete'].includes(action)) throw new Error('Thao tác thanh lý không hợp lệ.');
    return unwrap(await api.post(`${root}/${encodeURIComponent(id)}/${action}`, payload));
  },
};
