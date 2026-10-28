import api, { unwrap } from '../api';
import { requireBackend } from '../backendGuard';
import { checkoutService } from './checkoutService';
import { allPages, normalizePage } from '@/lib/apiData';
import { cancellationEligibility, isCompleted } from '@/lib/customerOrders';
import { createDemoOrders } from '@/constants/demoOrders';

const key = 'moc.customer-orders.demo.v1';
const clone = (value) => JSON.parse(JSON.stringify(value));
let memory;
function demoOrders() {
  if (memory) return clone(memory);
  try { const saved = JSON.parse(sessionStorage.getItem(key)); if (Array.isArray(saved) && saved.length) memory = saved; } catch { /* In-memory demo works without browser storage. */ }
  memory ||= createDemoOrders();
  return clone(memory);
}
function saveDemo(orders) {
  memory = clone(orders);
  // Never store or log the bank-account form, even in demo mode.
  try { sessionStorage.setItem(key, JSON.stringify(orders)); } catch { /* Keep the demo in memory. */ }
}
const get = async (path, params) => { requireBackend(); return unwrap(await api.get(path, { params })); };
const returnPage = async (params) => normalizePage(await get('/return-requests/me', params));
async function returnsFor(params) {
  try { return { requests: await allPages(returnPage, params), warning: '' }; }
  catch { return { requests: [], warning: 'Chưa tải được yêu cầu đổi trả/hoàn tiền. Danh sách đơn hàng vẫn được hiển thị; vui lòng tải lại để kiểm tra yêu cầu sau bán.' }; }
}
export function resetDemoOrders() { memory = createDemoOrders(); saveDemo(memory); }
export const customerOrderService = {
  async list(demo = false) {
    if (demo) return { orders: demoOrders(), warning: '' };
    const [orders, returns] = await Promise.all([allPages(checkoutService.orders), returnsFor({})]);
    return { orders: orders.map((order) => ({ ...order, returnRequests: returns.requests.filter((request) => request.order?.id === order.id) })), warning: returns.warning };
  },
  async detail(id, demo = false) {
    if (demo) {
      const order = demoOrders().find((item) => item.id === id);
      if (!order) throw new Error('Không tìm thấy đơn hàng mô phỏng.');
      return { order, warning: '' };
    }
    const [order, returns] = await Promise.all([checkoutService.order(id), returnsFor({ orderId: id })]);
    return { order: { ...order, returnRequests: returns.requests }, warning: returns.warning };
  },
  async cancel(order, payload, demo = false) {
    const eligibility = cancellationEligibility(order, demo);
    if (!eligibility.visible || !eligibility.allowed) throw new Error(eligibility.limitation || 'Đơn không còn đủ điều kiện tự hủy. Vui lòng tải lại trạng thái hoặc liên hệ cửa hàng.');
    if (!demo) return checkoutService.cancel(order.id); // Actual controller has no @RequestBody. Do not invent an API.
    const orders = demoOrders(), index = orders.findIndex((item) => item.id === order.id);
    if (index < 0 || !cancellationEligibility(orders[index], true).allowed) throw new Error('Đơn hàng đã thay đổi, vui lòng tải lại.');
    orders[index] = { ...orders[index], status: 'cancelled', paymentStatus: eligibility.paid ? 'paid' : 'cancelled',
      ...(eligibility.paid ? { refundStatus: 'pending' } : {}),
      cancellation: { reason: payload.reason, cancelledAt: new Date().toISOString() } };
    saveDemo(orders); return clone(orders[index]);
  },
  async eligible(order, demo = false) {
    if (!demo) return get('/return-requests/eligible-items', { orderId: order.id });
    return { canSubmit: isCompleted(order), items: order.pricing.items.map((item) => ({ ...item, availableQuantity: item.quantity })) };
  },
  async requestReturn(order, payload, idempotencyKey, demo = false) {
    if (!demo) { requireBackend(); return unwrap(await api.post('/return-requests', payload, { headers: { 'Idempotency-Key': idempotencyKey } })); }
    const orders = demoOrders(), stored = orders.find((item) => item.id === order.id);
    if (!isCompleted(stored)) throw new Error('Chỉ gửi yêu cầu sau khi đơn đã hoàn tất.');
    const request = { id: `demo-return-${Date.now()}`, requestCode: 'DT-MOCPHONG', status: 'submitted', requestType: payload.requestType, requestedAt: new Date().toISOString() };
    stored.returnRequests = [...(stored.returnRequests || []), request]; saveDemo(orders); return { request };
  },
};
