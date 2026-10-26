import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./api', () => ({ default: { request: vi.fn(), get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn(), put: vi.fn() }, publicApi: { request: vi.fn() }, DEMO_MODE: false, unwrap: (r) => r.data.data }));
import api, { publicApi } from './api';
import { createCartService } from './client/cartService';
import { checkoutService } from './client/checkoutService';
import { orderService } from './admin/orderService';
import { reviewService } from './client/reviewService';
beforeEach(() => { vi.clearAllMocks(); for (const method of [...Object.values(api), ...Object.values(publicApi)]) method.mockResolvedValue({ data: { data: { content: [], items: [], totalElements: 0 } } }); });
it('uses cookie credentials and no private transport for guest carts', async () => {
  await createCartService(false).add('v', 2);
  expect(publicApi.request).toHaveBeenCalledWith({ method: 'post', url: '/cart/items', data: { variantId: 'v', quantity: 2 }, withCredentials: true }); expect(api.request).not.toHaveBeenCalled();
});
it('uses authenticated cart transport; PATCH is absolute and DELETE removes lines', async () => {
  await createCartService(true).quantity('v', 5); await createCartService(true).remove('v');
  expect(api.request).toHaveBeenCalledWith({ method: 'patch', url: '/cart/items/v', data: { quantity: 5 }, withCredentials: true });
  expect(api.request).toHaveBeenCalledWith(expect.objectContaining({ method: 'delete', url: '/cart/items/v' }));
});
it('sends order idempotency header and distinct preview/initiate/capture endpoints', async () => {
  const payload = { items: [{ variantId: 'v', quantity: 1 }] };
  await checkoutService.preview(payload); await checkoutService.create(payload, 'key-once'); await checkoutService.initiate('o', 'paypal'); await checkoutService.capture('p');
  expect(api.post).toHaveBeenCalledWith('/orders', payload, { headers: { 'Idempotency-Key': 'key-once' }, timeout: 30000 });
  expect(api.post).toHaveBeenCalledWith('/payments/initiate', { orderId: 'o', gateway: 'paypal' }, { timeout: 60000 });
  expect(api.post).toHaveBeenCalledWith('/payments/p/paypal/capture', undefined, { timeout: 60000 });
});
it('reads reward history as a list and keeps COD reconciliation separate from collection', async () => {
  api.get.mockResolvedValue({ data: { data: [{ id: 'tx' }] } });
  expect(await checkoutService.transactions({ page: 0, size: 20 })).toEqual([{ id: 'tx' }]);
  await orderService.collect('o'); await orderService.reconcile('o');
  expect(api.post).toHaveBeenCalledWith('/management/orders/o/cod/collect', undefined); expect(api.post).toHaveBeenCalledWith('/management/orders/o/cod/reconcile', undefined);
});
it('writes review media metadata without leaking ownership fields', async () => {
  await reviewService.updateMedia('r', 'm', { altText: '  Tươi  ', sortOrder: '0', customerId: 'other' });
  expect(api.patch).toHaveBeenCalledWith('/reviews/r/media/m', { altText: 'Tươi', sortOrder: 0 });
});
it('reads the documented authenticated payment endpoint without submitting browser parameters to IPN', async () => {
  api.get.mockResolvedValue({data:{data:{id:'p',status:'pending'}}});
  expect((await checkoutService.payment('payment-id')).status).toBe('pending');
  expect(api.get).toHaveBeenCalledWith('/payments/payment-id',{params:undefined});
});
