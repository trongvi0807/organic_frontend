import api, { unwrap } from './api';
import { requireBackend } from './backendGuard';
import { normalizePage } from '@/lib/apiData';

const id = encodeURIComponent;
const get = async (url, params) => { requireBackend(); return unwrap(await api.get(url, { params })); };
const post = async (url, body, config) => { requireBackend(); return unwrap(await api.post(url, body, config)); };
const patch = async (url, body) => { requireBackend(); return unwrap(await api.patch(url, body)); };
const page = async (url, params) => normalizePage(await get(url, params));
const keyed = (url, body, key) => post(url, body, { headers: { 'Idempotency-Key': key } });

export function feedbackService(management = false) {
  const base = management ? '/management/feedbacks' : '/feedbacks';
  return {
    list: (params) => page(management ? base : `${base}/me`, params),
    get: (key) => get(`${base}/${id(key)}`),
    messages: (key, params) => page(`${base}/${id(key)}/messages`, params),
    create: (body) => post('/feedbacks', body),
    reply: (key, content) => post(`${base}/${id(key)}/messages`, { content }),
    upload: (key, file, messageId) => {
      const body = new FormData(); body.append('file', file);
      if (messageId) body.append('messageId', messageId);
      return post(`${base}/${id(key)}/media`, body, { headers: { 'Content-Type': undefined }, timeout: 120000 });
    },
    removeMedia: async (key, mediaId) => { requireBackend(); return unwrap(await api.delete(`${base}/${id(key)}/media/${id(mediaId)}`)); },
    claim: (key) => post(`${base}/${id(key)}/claim`),
    assignees: (params) => page('/management/feedbacks/assignees', params),
    assign: (key, employeeId, note) => patch(`${base}/${id(key)}/assignment`, { employeeId, note }),
    status: (key, status, note) => patch(`${base}/${id(key)}/status`, { status, note }),
    close: (key, note) => post(`${base}/${id(key)}/close`, { note }),
    reopen: (key, note) => post(`${base}/${id(key)}/reopen`, { note }),
  };
}

export function returnService(management = false) {
  const base = management ? '/management/return-requests' : '/return-requests';
  return {
    list: (params) => page(management ? base : `${base}/me`, params),
    get: (key) => get(`${base}/${id(key)}`),
    histories: (key, params) => page(`${base}/${id(key)}/histories`, params),
    eligible: (orderId) => get('/return-requests/eligible-items', { orderId }),
    create: (body, key) => keyed('/return-requests', body, key),
    claim: (key) => post(`${base}/${id(key)}/claim`),
    preview: (key, body) => post(`${base}/${id(key)}/preview-decision`, body),
    approve: (key, body) => post(`${base}/${id(key)}/approve`, body),
    action: (key, action, body) => {
      const allowed = management ? ['request-information', 'reject'] : ['cancel', 'accept', 'decline', 'submit-information'];
      if (!allowed.includes(action)) throw new Error('Thao tác đổi trả không hợp lệ.');
      return post(`${base}/${id(key)}/${action}`, body);
    },
    progress: (key) => get(`/return-requests/${id(key)}/warehouse-progress`),
    receipts: (key, params) => page(`/return-requests/${id(key)}/receipts`, params),
    execution: (key) => get(`${base}/${id(key)}/execution`),
  };
}

const executionBase = (requestId) => `/management/return-requests/${id(requestId)}`;
export const returnExecutionService = {
  refund: (requestId, body, key) => post(`${executionBase(requestId)}/refunds`, body, { headers: { 'Idempotency-Key': key }, timeout: 60000 }),
  sync: (requestId, refundId) => post(`${executionBase(requestId)}/refunds/${id(refundId)}/sync`, undefined, { timeout: 60000 }),
  reconcile: (requestId, refundId, body, key) => keyed(`${executionBase(requestId)}/refunds/${id(refundId)}/reconcile`, body, key),
  replacement: (requestId, body, key) => keyed(`${executionBase(requestId)}/replacement-order`, body, key),
  prepare: (requestId, body, key) => keyed(`${executionBase(requestId)}/replacement-order/prepare`, body, key),
  book: (requestId, body, key) => keyed(`${executionBase(requestId)}/replacement-order/shipments`, body, key),
  shipmentStatus: (requestId, shipmentId, body, key) => keyed(`${executionBase(requestId)}/replacement-order/shipments/${id(shipmentId)}/status`, body, key),
  complete: (requestId, body, key) => keyed(`${executionBase(requestId)}/complete`, body, key),
};

const warehouse = '/management/return-receipts';
export const returnWarehouseService = {
  queue: (params) => page(`${warehouse}/requests`, params),
  detail: (key) => get(`${warehouse}/requests/${id(key)}`),
  items: (key, params) => page(`${warehouse}/requests/${id(key)}/items`, params),
  histories: (key, params) => page(`${warehouse}/requests/${id(key)}/histories`, params),
  item: (key) => get(`${warehouse}/items/${id(key)}`),
  receive: (key, body, operationKey) => keyed(`${warehouse}/requests/${id(key)}/items`, body, operationKey),
  action: (key, action, body, operationKey) => {
    if (!['identify-batch', 'inspect', 'reinspect', 'restock', 'dispose'].includes(action)) throw new Error('Thao tác hàng thu hồi không hợp lệ.');
    return keyed(`${warehouse}/items/${id(key)}/${action}`, body, operationKey);
  },
};
