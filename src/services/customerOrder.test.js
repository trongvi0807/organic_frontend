// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./api', () => ({ default: { get: vi.fn(), post: vi.fn() }, DEMO_MODE: false, unwrap: (response) => response.data.data }));
import api from './api';
import { customerOrderService, resetDemoOrders } from './client/customerOrderService';
const reply = (data) => ({ data: { data } });
beforeEach(() => { vi.clearAllMocks(); sessionStorage.clear(); resetDemoOrders(); });

describe('Customer order API boundary', () => {
  it('loads every owned order page, then joins after-sales using IDs internally', async () => {
    api.get.mockImplementation((path, { params }) => Promise.resolve(reply(path === '/orders' ? { content: [{ id: params.page ? 'b' : 'a', orderCode: params.page ? 'OM02' : 'OM01' }], totalPages: 2 } : { content: [{ id: 'request-uuid', requestCode: 'DT01', order: { id: 'b' }, status: 'approved' }], totalPages: 1 })));
    const result = await customerOrderService.list();
    expect(api.get).toHaveBeenCalledWith('/orders', { params: { page: 0, size: 50 } });
    expect(api.get).toHaveBeenCalledWith('/orders', { params: { page: 1, size: 50 } });
    expect(result.orders[0].returnRequests).toHaveLength(0);
    expect(result.orders[1].returnRequests[0].requestCode).toBe('DT01');
  });
  it('keeps real orders available and warns when after-sales fails', async () => {
    api.get.mockImplementation((path) => path === '/orders' ? Promise.resolve(reply({ content: [{ id: 'a' }], totalPages: 1 })) : Promise.reject(new Error('Offline')));
    const result = await customerOrderService.list(); expect(result.orders).toHaveLength(1); expect(result.warning).toContain('Chưa tải được');
  });
  it('honors the no-body cancel endpoint; does not invent a paid refund call', async () => {
    api.post.mockResolvedValue(reply({ id: 'uuid', status: 'cancelled' }));
    const order = { id: 'uuid', status: 'confirmed', paymentStatus: 'pending', paymentMethod: 'cod' };
    await customerOrderService.cancel(order, { reason: 'Thay đổi địa chỉ' });
    expect(api.post).toHaveBeenCalledExactlyOnceWith('/orders/uuid/cancel', undefined, undefined);
    await expect(customerOrderService.cancel({ ...order, paymentStatus: 'paid' }, { reason: 'Khác' })).rejects.toThrow('hoàn tiền');
    expect(api.post).toHaveBeenCalledTimes(1);
  });
  it('uses exact return eligibility and idempotent create contracts', async () => {
    api.get.mockResolvedValue(reply({ canSubmit: true })); api.post.mockResolvedValue(reply({ request: { requestCode: 'DT001' } }));
    const order = { id: 'order-uuid' }, payload = { orderId: order.id, requestType: 'return_refund', reason: 'damaged', description: 'Hàng hỏng', items: [{ orderDetailId: 'line-uuid', quantity: 1, reason: 'damaged' }] };
    await customerOrderService.eligible(order); await customerOrderService.requestReturn(order, payload, 'idempotent');
    expect(api.get).toHaveBeenCalledWith('/return-requests/eligible-items', { params: { orderId: order.id } });
    expect(api.post).toHaveBeenCalledWith('/return-requests', payload, { headers: { 'Idempotency-Key': 'idempotent' } });
  });
  it('cancels prepaid mocks as refund-pending without any real API or stored bank data', async () => {
    const { orders } = await customerOrderService.list(true), order = orders.find((item) => item.id === 'demo-order-3');
    const cancelled = await customerOrderService.cancel(order, { reason: 'Thay đổi kế hoạch', refundAccount: { accountNumber: '112233445566', accountHolder: 'DO NOT STORE' } }, true);
    expect(cancelled.status).toBe('cancelled'); expect(cancelled.paymentStatus).toBe('paid'); expect(cancelled.refundStatus).toBe('pending');
    expect((await customerOrderService.detail(order.id, true)).order.cancellation.reason).toBe('Thay đổi kế hoạch');
    expect(JSON.stringify(sessionStorage)).not.toContain('112233445566'); expect(JSON.stringify(sessionStorage)).not.toContain('DO NOT STORE');
    expect(api.get).not.toHaveBeenCalled(); expect(api.post).not.toHaveBeenCalled();
    await expect(customerOrderService.cancel(order, { reason: 'Lần hai' }, true)).rejects.toThrow('đã thay đổi');
  });
  it('does not turn a rejected real cancellation into a local success', async () => {
    api.post.mockRejectedValue({ response: { status: 409, data: { message: 'Đơn đã bàn giao' } } });
    const order = { id: 'uuid', status: 'confirmed', paymentStatus: 'pending' };
    await expect(customerOrderService.cancel(order, {})).rejects.toMatchObject({ response: { status: 409 } });
    expect(order.status).toBe('confirmed');
  });
});
