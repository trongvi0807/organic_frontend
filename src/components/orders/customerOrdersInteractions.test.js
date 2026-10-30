// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn() }, DEMO_MODE: false, unwrap: (r) => r.data.data }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { username: 'demo-user' } }) }));
import api from '@/services/api';
import { CancelOrderModal } from './CancelOrderModal';
import { OrderCard, OrderStepper } from './OrderPrimitives';
import { ReturnRequestModal } from './ReturnRequestModal';
import OrderHistoryPage from '@/pages/client/OrderHistoryPage';
import OrderTrackingPage from '@/pages/client/OrderTrackingPage';
import { createDemoOrders } from '@/constants/demoOrders';
import { customerOrderService, resetDemoOrders } from '@/services/client/customerOrderService';

let container, root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true; sessionStorage.clear(); resetDemoOrders();
  Element.prototype.scrollIntoView = vi.fn(); container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); vi.clearAllMocks(); });
const render = async (element) => { await act(async () => root.render(element)); };
const click = async (element) => { expect(element).toBeTruthy(); await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true }))); };
const type = async (input, value) => { expect(input).toBeTruthy(); await act(async () => { Object.getOwnPropertyDescriptor(input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); }); };
const submit = async () => { await act(async () => document.querySelector('[role="dialog"] form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))); };
const labelInput = (text) => [...document.querySelectorAll('[role="dialog"] label')].find((label) => label.textContent.startsWith(text))?.querySelector('input,textarea');
const button = (text, parent = document) => [...parent.querySelectorAll('button')].find((item) => item.textContent.trim() === text);

describe('Cancellation dialog interactions', () => {
  it('requires a reason and shows the Other error immediately; failed requests keep the dialog open', async () => {
    const cancel = vi.spyOn(customerOrderService, 'cancel').mockRejectedValue({ response: { status: 409, data: { message: 'Đơn đã bàn giao vận chuyển.' } } }), close = vi.fn(), reload = vi.fn();
    await render(h(CancelOrderModal, { order: createDemoOrders()[11], onClose: close, onCancelled: vi.fn(), onRefresh: reload }));
    await submit(); expect(document.body.textContent).toContain('Vui lòng chọn lý do'); expect(cancel).not.toHaveBeenCalled();
    await click(document.querySelector('input[value="other"]')); expect(document.body.textContent).toContain('Vui lòng nhập lý do hủy cụ thể');
    await type(document.querySelector('textarea'), ' '); await submit(); expect(cancel).not.toHaveBeenCalled();
    await type(document.querySelector('textarea'), 'Thay đổi kế hoạch nhận hàng'); await submit();
    expect(cancel).toHaveBeenCalledTimes(1); expect(document.body.textContent).toContain('Đơn đã bàn giao'); expect(close).not.toHaveBeenCalled(); expect(reload).toHaveBeenCalledTimes(1);
  });
  it('validates paid mock bank fields, supports bank search and closes after server success', async () => {
    const close = vi.fn(), changed = vi.fn();
    await render(h(CancelOrderModal, { order: createDemoOrders()[2], demo: true, onClose: close, onCancelled: changed }));
    await click(document.querySelector('input[value="address"]')); await submit();
    expect(document.body.textContent).toContain('Vui lòng nhập tên chủ tài khoản'); expect(changed).not.toHaveBeenCalled();
    await type(labelInput('Tên chủ tài khoản'), 'KHACH MO PHONG'); await type(labelInput('Số tài khoản'), '1234567890');
    await type(document.querySelector('[aria-label="Ngân hàng"]'), 'vietcom');
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(1);
    await click(document.querySelector('[role="option"] button'));
    await type(labelInput('Chi nhánh'), 'Tan Phu'); await submit();
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled', paymentStatus: 'paid', refundStatus: 'pending' })); expect(close).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(sessionStorage)).not.toContain('1234567890'); expect(api.post).not.toHaveBeenCalled();
  });
  it('blocks real paid cancellation and explains the support path', async () => {
    const cancel = vi.spyOn(customerOrderService, 'cancel');
    await render(h(CancelOrderModal, { order: createDemoOrders()[2], onClose: vi.fn(), onCancelled: vi.fn() }));
    expect(button('Xác nhận hủy đơn').disabled).toBe(true); expect(document.body.textContent).toContain('chưa thể gửi thông tin hoàn tiền trực tuyến');
    expect(document.querySelector('a[href="tel:0344855913"]')).toBeTruthy(); await submit(); expect(cancel).not.toHaveBeenCalled();
  });
  it('prevents duplicate cancellation and modal dismissal while an update is in progress', async () => {
    let resolve;
    const cancel = vi.spyOn(customerOrderService, 'cancel').mockImplementation(() => new Promise((done) => { resolve = done; })), close = vi.fn();
    const order = createDemoOrders()[11];
    await render(h(CancelOrderModal, { order, demo: true, onClose: close, onCancelled: vi.fn() }));
    await click(document.querySelector('input[value="address"]')); await submit(); await submit(); await click(document.querySelector('[aria-label="Đóng"]'));
    expect(cancel).toHaveBeenCalledTimes(1); expect(close).not.toHaveBeenCalled();
    await act(async () => resolve({ ...order, status: 'cancelled' })); expect(close).toHaveBeenCalledTimes(1);
  });
});
describe('Order cards and full demo pages', () => {
  it('submits only eligible return quantities and keeps the result awaiting review', async () => {
    const create = vi.spyOn(customerOrderService, 'requestReturn'), close = vi.fn(), changed = vi.fn();
    const order = createDemoOrders()[5];
    await render(h(MemoryRouter, {}, h(ReturnRequestModal, { order, demo: true, onClose: close, onChanged: changed })));
    await submit(); expect(create).not.toHaveBeenCalled();
    await type(document.querySelector('[aria-label="Lý do đổi trả"]'), 'hu hong');
    await click(document.querySelector('[role="option"] button'));
    await type(document.querySelector('textarea'), 'Sản phẩm bị dập khi giao.');
    const quantity = document.querySelector('input[type="number"]');
    await type(quantity, '-1'); expect(document.body.textContent).toContain('Số lượng phải là số nguyên'); await submit(); expect(create).not.toHaveBeenCalled();
    await type(quantity, '1'); await submit();
    expect(create).toHaveBeenCalledWith(order, expect.objectContaining({ orderId: order.id, reason: 'damaged', items: [{ orderDetailId: order.pricing.items[0].orderDetailId, quantity: 1, reason: 'damaged' }] }), expect.any(String), true);
    expect(close).toHaveBeenCalledTimes(1); expect(changed).toHaveBeenCalledTimes(1);
    const result = await customerOrderService.detail(order.id, true); expect(result.order.returnRequests[0].status).toBe('submitted'); expect(result.order.paymentStatus).toBe('paid');
  });
  it('shows business codes and never falls back to a UUID in visible text', async () => {
    const order = { ...createDemoOrders()[11], id: 'a1b2c3d4-1111-4222-8333-abcdefabcdef', orderCode: null };
    await render(h(MemoryRouter, {}, h(OrderCard, { order, onCancel: vi.fn() })));
    expect(container.textContent).toContain('Chưa có mã đơn'); expect(container.textContent).not.toContain(order.id);
    expect(container.querySelector('a').getAttribute('href')).toContain(order.id); // Internal routing still uses the stable ID.
  });
  it('only offers review and returns for completed orders, and does not present delivery as completion', async () => {
    await render(h(MemoryRouter, {}, h(OrderCard, { order: createDemoOrders()[10], onCancel: vi.fn() })));
    expect(container.textContent).not.toContain('Yêu cầu Đổi/Trả'); expect(container.textContent).not.toContain('Hủy đơn hàng');
    await render(h(MemoryRouter, {}, h(OrderCard, { order: createDemoOrders()[5], onReturn: vi.fn() })));
    expect(container.textContent).toContain('Yêu cầu Đổi/Trả'); expect(container.textContent).toContain('Đánh giá');
  });
  it('does not fabricate missing timeline timestamps', async () => {
    await render(h(OrderStepper, { order: { ...createDemoOrders()[4], confirmedAt: undefined, preparingAt: undefined } }));
    expect(container.textContent).toContain('Chưa có thời gian cập nhật'); expect(container.textContent).toContain('24-10-2026 • 11:00');
    expect(container.textContent).not.toContain('24-10-2026 • 08:30');
  });
  it('filters demo history, cancels an unpaid order and immediately updates the card without an API write', async () => {
    await render(h(MemoryRouter, { initialEntries: ['/demo/don-hang'] }, h(OrderHistoryPage, { demo: true })));
    const search = container.querySelector('[aria-label="Tìm mã đơn hàng hoặc tên sản phẩm"]');
    await type(search, '#OM261017'); expect(container.querySelectorAll('article')).toHaveLength(1); expect(container.textContent).toContain('#OM261017');
    await click(button('Hủy đơn hàng', container)); await click(document.querySelector('input[value="alternative"]')); await submit();
    expect(document.querySelector('[role="dialog"]')).toBeNull(); expect(container.textContent).toContain('Đã hủy'); expect(button('Hủy đơn hàng', container)).toBeUndefined();
    expect(api.post).not.toHaveBeenCalled();
  });
  it('renders paid demo tracking with package batches, shipping and payment information', async () => {
    await render(h(MemoryRouter, { initialEntries: ['/demo/don-hang/demo-order-6'] }, h(Routes, {}, h(Route, { path: '/demo/don-hang/:id', element: h(OrderTrackingPage, { demo: true }) }))));
    expect(container.textContent).toContain('#OM261023'); expect(container.textContent).toContain('Mã lô HC-261023');
    expect(container.textContent).toContain('Thông tin thanh toán'); expect(container.textContent).toContain('MOCPHONG0006'); expect(container.textContent).not.toContain('demo-order-6');
    expect(api.get).not.toHaveBeenCalled();
  });
});
