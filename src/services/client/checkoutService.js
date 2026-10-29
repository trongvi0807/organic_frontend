import api, { unwrap } from '../api';
import { normalizePage } from '@/lib/apiData';
import { requireBackend } from '../backendGuard';
const get = async (url, params) => { requireBackend(); return unwrap(await api.get(url, { params })); };
const post = async (url, data, config) => { requireBackend(); return unwrap(await api.post(url, data, config)); };
export const checkoutService = {
  methods: () => get('/payments/methods'),
  preview: (data) => post('/checkout/preview', data),
  create: (data, key) => post('/orders', data, { headers: { 'Idempotency-Key': key }, timeout: 30000 }),
  orders: async (params) => normalizePage(await get('/orders', params)),
  order: (id) => get(`/orders/${encodeURIComponent(id)}`),
  cancel: (id) => post(`/orders/${encodeURIComponent(id)}/cancel`),
  initiate: (orderId, gateway) => post('/payments/initiate', { orderId, gateway }, { timeout: 60000 }),
  payment: (id) => get(`/payments/${encodeURIComponent(id)}`),
  vnpayByReference: (reference) => get(`/payments/vnpay/reference/${encodeURIComponent(reference)}`),
  confirmVnpayReturn: (queryString) => post('/payments/vnpay/return', { queryString }),
  sync: (id) => post(`/payments/${encodeURIComponent(id)}/sync`, undefined, { timeout: 60000 }),
  capture: (id) => post(`/payments/${encodeURIComponent(id)}/paypal/capture`, undefined, { timeout: 60000 }),
  rewards: () => get('/customers/me/rewards'),
  transactions: (params) => get('/customers/me/reward-transactions', params),
  promotions: async (params) => normalizePage(await get('/promotions', params)),
};
