import api, { unwrap } from './api';

export const inboxNotifications = {
  async list() { return unwrap(await api.get('/inbox', { params: { page: 0, size: 100 } })); },
  async read(id) { await api.patch(`/inbox/${encodeURIComponent(id)}/read`); },
  async readThread(kind, id) { await api.patch('/inbox/read-thread', null, { params: kind === 'return' ? { returnRequestId: id } : { feedbackId: id } }); },
};
