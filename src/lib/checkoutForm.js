import { checkoutPayload } from './checkout';
import { formatShippingAddress } from './address';
import { DEFAULT_STORE_LOCATION } from '@/constants/store';
export const PICKUP_STORE = { name: 'organicfood.vn · Quận 1', address: DEFAULT_STORE_LOCATION.address, phone: '0969421088' };
export function checkoutFormPayload(values, items, address, data, fulfillment) {
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) throw new Error('Vui lòng nhập email hợp lệ.');
  const note = [fulfillment === 'pickup' ? '[Yêu cầu nhận tại cửa hàng] Cần cửa hàng xác nhận lịch nhận.' : null, values.email.trim() ? `Email nhận hóa đơn (yêu cầu): ${values.email.trim()}` : null, values.note.trim()].filter(Boolean).join('\n');
  if (note.length > 5000) throw new Error('Ghi chú và thông tin bổ sung tối đa 5.000 ký tự.');
  return checkoutPayload({ ...values, shippingAddress: fulfillment === 'pickup' ? PICKUP_STORE.address : formatShippingAddress(address, data), note }, items);
}
