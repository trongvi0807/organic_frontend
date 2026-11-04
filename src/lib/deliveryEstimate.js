import { orderDateTime } from './customerOrders';

const stopped = new Set(['delivered', 'failed', 'returned', 'cancelled']);
export const hasRouteEstimate = shipment => shipment?.estimateStatus === 'estimated' && !!shipment.estimatedArrivalAt;

export function deliveryEstimateText(shipment) {
  if (!shipment) return 'Chưa có chuyến giao hàng.';
  if (shipment.status === 'delivered') return shipment.deliveredAt ? `Đã giao: ${orderDateTime(shipment.deliveredAt)}` : 'Đã giao hàng.';
  if (stopped.has(shipment.status)) return 'Chuyến giao đã dừng.';
  if (hasRouteEstimate(shipment)) return orderDateTime(shipment.estimatedArrivalAt);
  if (shipment.status === 'pending') return 'Sẽ tính giờ đến dự kiến khi xác nhận đã lấy hàng.';
  if (shipment.estimateStatus === 'location_required') return 'Cửa hàng cần xác nhận vị trí nhận hàng để tính giờ đến.';
  if (['store_location_required', 'service_not_configured'].includes(shipment.estimateStatus)) return 'Cửa hàng đang cập nhật thông tin tính thời gian giao.';
  if (shipment.estimateStatus === 'service_auth_error') return 'Dịch vụ bản đồ chưa xác thực được. Cửa hàng đang kiểm tra kết nối.';
  if (shipment.estimateStatus === 'rate_limited') return 'Dịch vụ bản đồ đang giới hạn lượt truy cập. Vui lòng thử lại sau.';
  return shipment.estimateStatus === 'calculating' ? 'Đang tính giờ đến dự kiến từ bản đồ…' : 'Chưa tính được giờ đến dự kiến. Cửa hàng sẽ kiểm tra lại.';
}

// Server timestamps without an offset use the store's Vietnam time zone.
export function deliveryDeadline(value) {
  if (!value) return NaN;
  const text = String(value);
  return Date.parse(/Z$|[+-]\d{2}:\d{2}$/.test(text) ? text : `${text}+07:00`);
}

export function deliveryCountdown(deadline, now) {
  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  if (!Number.isFinite(seconds)) return null;
  const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds % 3600 / 60);
  return { seconds, text: `${hours ? `${String(hours).padStart(2, '0')}:` : ''}${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}` };
}
