import api, { unwrap } from '../api';
import { normalizePage } from '@/lib/apiData';
import { requireBackend } from '../backendGuard';
const get = async (url, params) => { requireBackend(); return unwrap(await api.get(url, { params })); };
const post = async (url, data, config) => { requireBackend(); return unwrap(await api.post(url, data, config)); };
export const checkoutService = {
  deliveryLocations: address => get('/checkout/delivery-locations', { address }),
  deliveryLocationFromMap: url => post('/checkout/delivery-location-from-map', { url }, { timeout: 15000 }),
  methods: () => get('/payments/methods'),
  preview: async (data) => {
    const quote = await post('/checkout/preview', data);
    const voucherCode = String(data.voucherCode || '').trim().toUpperCase();
    if (voucherCode && (quote.voucherCode !== voucherCode || !(Number(quote.voucherDiscount) > 0)))
      throw new Error('Chưa xác nhận được tiền giảm từ voucher. Vui lòng thử lại hoặc liên hệ cửa hàng trước khi thanh toán.');
    return quote;
  },
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
  voucherOffers: async (params) => normalizePage(await get('/customers/me/voucher-offers', params)),
  vouchers: async (params) => normalizePage(await get('/customers/me/vouchers', params)),
  exchangeVoucher: (data, key) => post('/customers/me/vouchers/exchange', data, { headers: { 'Idempotency-Key': key }, timeout: 30000 }),
  promotions: async (params) => normalizePage(await get('/promotions', params)),
};
