import { adminDate, inDateRange, matchesSearch } from './adminFormat';

export const ORDER_TABS = [
  ['all', 'Tất cả'], ['waiting', 'Chờ xác nhận'], ['preparing', 'Đang chuẩn bị'],
  ['shipping', 'Đang giao hàng'], ['completed', 'Hoàn tất'], ['cancelled', 'Đã hủy'], ['returns', 'Đổi trả / Hoàn tiền'],
];
const ORDER_STATES = {
  pending_payment: ['Chờ thanh toán', 'amber'], pending_confirmation: ['Chờ xác nhận', 'amber'],
  confirmed: ['Chờ chuẩn bị hàng', 'green'], preparing: ['Đang chuẩn bị', 'blue'],
  shipping: ['Đang giao hàng', 'blue'], delivered: ['Đã giao hàng', 'green'], completed: ['Hoàn tất', 'green'],
  cancelled: ['Đã hủy', 'red'], expired: ['Đơn hết hạn', 'gray'], failed: ['Giao không thành công', 'red'],
  returned: ['Đã trả hàng', 'gray'], requires_review: ['Cần đối soát', 'amber'],
};
const PAYMENT_STATES = {
  pending: ['Chờ thanh toán', 'amber'], unpaid: ['Chưa thanh toán', 'amber'], creating: ['Đang tạo phiên thanh toán', 'amber'],
  capturing: ['Chờ xác nhận thanh toán', 'amber'], closing: ['Đang đóng phiên thanh toán', 'amber'],
  paid: ['Đã thanh toán', 'green'], requires_review: ['Chờ đối soát thanh toán', 'amber'],
  partially_refunded: ['Đã hoàn tiền một phần', 'amber'], failed: ['Thanh toán không thành công', 'red'], expired: ['Phiên thanh toán hết hạn', 'gray'],
  cancelled: ['Đã hủy phiên thanh toán', 'gray'], refund_pending: ['Chờ hoàn tiền', 'amber'], refunded: ['Đã hoàn tiền', 'green'],
};
export const CANCEL_REASONS = [
  ['address', 'Tôi muốn thay đổi địa chỉ hoặc số điện thoại nhận hàng'],
  ['products', 'Tôi muốn thêm/đổi sản phẩm hoặc áp dụng mã khuyến mãi khác'],
  ['delivery_time', 'Thời gian giao hàng dự kiến chưa phù hợp'],
  ['alternative', 'Tôi tìm thấy sản phẩm khác phù hợp hơn'], ['other', 'Lý do khác'],
];
// A searchable convenience list, not a bank account verification service.
export const REFUND_BANKS = ['Vietcombank', 'BIDV', 'VietinBank', 'Agribank', 'Techcombank', 'MB Bank', 'ACB', 'VPBank', 'TPBank', 'Sacombank', 'HDBank', 'VIB', 'SHB', 'OCB', 'NCB', 'MSB', 'SeABank', 'Eximbank', 'LPBank', 'Nam A Bank', 'Bac A Bank', 'Khác'];
export const RETURN_STATES = {
  submitted: 'Chờ tiếp nhận', pending: 'Chờ xét duyệt', under_review: 'Đang xét duyệt', reviewing: 'Đang xét duyệt',
  awaiting_customer: 'Chờ xác nhận phương án', awaiting_information: 'Chờ bổ sung thông tin', approved: 'Chờ khách xác nhận phương án',
  waiting_customer: 'Chờ bổ sung thông tin', accepted: 'Chờ thực hiện phương án', processing: 'Đã đồng ý · Chờ thực hiện', completed: 'Đã xử lý yêu cầu', rejected: 'Đã từ chối', cancelled: 'Đã hủy yêu cầu',
};
export const orderDateTime = (value) => adminDate(value, true).replace(/ (\d{2}:\d{2})$/, ' • $1');
export const orderItems = (order) => order?.pricing?.items || [];
export const isCompleted = (order) => order?.status === 'completed';
export const mayRequestReturn = (order) => order?.paymentMethod !== 'exchange' && (['delivered', 'completed'].includes(order?.status) || order?.status === 'cancelled' && ['paid', 'partially_refunded'].includes(order?.paymentStatus));
export const prepaid = (order) => ['paid', 'partially_refunded'].includes(order?.paymentStatus);
export const latestShipment = (order) => [...(order?.shipments || [])].sort((a, b) => String(b.bookedAt || '').localeCompare(String(a.bookedAt || '')))[0];
export function orderBadge(order) {
  if (order?.status === 'cancelled' && order?.refundStatus === 'pending') return ['Đã hủy · Chờ hoàn tiền', 'amber'];
  if (latestShipment(order)?.status === 'failed') return ['Giao không thành công', 'red'];
  return ORDER_STATES[order?.status] || ['Chưa xác định trạng thái', 'gray'];
}
export function paymentBadge(order) {
  if (order?.paymentMethod === 'exchange') return ['Hàng đổi · Không thu thêm tiền', 'green'];
  if (order?.refundStatus === 'pending') return PAYMENT_STATES.refund_pending;
  if (order?.refundStatus === 'refunded') return PAYMENT_STATES.refunded;
  if (order?.paymentMethod === 'cod' && ['pending', 'unpaid'].includes(order?.paymentStatus)) return ['Chưa thu tiền · COD', 'amber'];
  return PAYMENT_STATES[order?.paymentStatus] || ['Chưa xác định thanh toán', 'gray'];
}
export function cancellationEligibility(order, demo = false) {
  const shipment = latestShipment(order);
  if (!order || order.paymentMethod === 'exchange' || !['pending_payment', 'pending_confirmation', 'confirmed'].includes(order.status)
    || order.dispatchedAt || (order.shipments || []).some((s) => s.shippedAt || ['picked_up', 'in_transit', 'delivered'].includes(s.status))
    || shipment?.status === 'failed') return { visible: false, allowed: false };
  if (order.paymentStatus === 'requires_review') return { visible: false, allowed: false };
  const paid = prepaid(order);
  return { visible: true, allowed: demo || !paid, paid,
    limitation: paid && !demo ? 'Đơn đã thanh toán cần cửa hàng hỗ trợ hủy và hoàn tiền. Hiện chưa thể gửi thông tin hoàn tiền trực tuyến.' : '' };
}
export function matchesOrderTab(order, tab) {
  if (tab === 'all') return true;
  if (tab === 'waiting') return ['pending_payment', 'pending_confirmation'].includes(order.status);
  if (tab === 'preparing') return ['confirmed', 'preparing'].includes(order.status);
  if (tab === 'shipping') return order.status === 'shipping' && latestShipment(order)?.status !== 'failed';
  if (tab === 'completed') return isCompleted(order);
  if (tab === 'cancelled') return ['cancelled', 'expired', 'failed'].includes(order.status) || latestShipment(order)?.status === 'failed';
  if (tab === 'returns') return !!order.refundStatus || order.status === 'returned' || !!order.returnRequests?.length;
  return false;
}
export function filterOrders(orders, { tab = 'all', search = '', from = '', to = '' } = {}) {
  return orders.filter((order) => matchesOrderTab(order, tab)
    && matchesSearch(`${order.orderCode || ''} ${orderItems(order).map((item) => item.productName).join(' ')}`.replace(/#/g, ''), search.replace(/#/g, ''))
    && inDateRange(order.orderedAt, from, to)).sort((a, b) => String(b.orderedAt || '').localeCompare(String(a.orderedAt || '')));
}
export function orderProgress(order) {
  const shipment = latestShipment(order);
  const stage = { confirmed: 0, preparing: 1, shipping: 2, delivered: 2, completed: 3 }[order.status] ?? -1;
  const stopped = ['cancelled', 'expired', 'failed', 'returned'].includes(order.status) || shipment?.status === 'failed';
  // Never substitute the order creation date for confirmation/preparation timestamps.
  return { stage, stopped, reason: order.cancellation?.reason || shipment?.failureReason || order.failureReason,
    steps: [
      { label: 'Đã xác nhận', date: order.confirmedAt }, { label: 'Đang chuẩn bị', date: order.preparingAt },
      { label: 'Đang giao hàng', date: shipment?.shippedAt }, { label: 'Hoàn tất', date: shipment?.deliveredAt || order.completedAt },
    ] };
}
export function validateCancellation(values, paid) {
  const errors = {};
  if (!CANCEL_REASONS.some(([key]) => key === values.reason)) errors.reason = 'Vui lòng chọn lý do hủy đơn.';
  if (values.reason === 'other' && !values.otherReason?.trim()) errors.otherReason = 'Vui lòng nhập lý do hủy cụ thể.';
  if (values.otherReason?.length > 1000) errors.otherReason = 'Lý do không được quá 1.000 ký tự.';
  if (paid) {
    if (!values.accountHolder?.trim()) errors.accountHolder = 'Vui lòng nhập tên chủ tài khoản.';
    if (!/^\d{6,30}$/.test(values.accountNumber || '')) errors.accountNumber = 'Số tài khoản phải gồm 6–30 chữ số.';
    if (!REFUND_BANKS.includes(values.bank)) errors.bank = 'Vui lòng chọn ngân hàng trong danh sách.';
    if (values.bank === 'Khác' && !values.otherBank?.trim()) errors.otherBank = 'Vui lòng nhập tên ngân hàng.';
    if (!values.branch?.trim()) errors.branch = 'Vui lòng nhập chi nhánh ngân hàng.';
    if (!/^(0\d{9}|\+84\d{9})$/.test((values.phone || '').replace(/[\s.-]/g, ''))) errors.phone = 'Vui lòng nhập số điện thoại Việt Nam hợp lệ.';
  }
  return errors;
}
export function cancellationPayload(values, paid) {
  const reason = values.reason === 'other' ? values.otherReason.trim() : CANCEL_REASONS.find(([id]) => id === values.reason)?.[1];
  return { reasonCode: values.reason, reason, ...(paid ? { refundAccount: {
    accountHolder: values.accountHolder.trim(), accountNumber: values.accountNumber.trim(),
    bank: values.bank === 'Khác' ? values.otherBank.trim() : values.bank, branch: values.branch.trim(), phone: values.phone.trim(),
  } } : {}) };
}
export function customerOrderError(error) {
  const message = error?.response?.data?.message || error?.message;
  if (message && /[À-ỹđĐ]/.test(message)) return message;
  if ([401, 403].includes(error?.response?.status)) return 'Phiên đăng nhập không hợp lệ hoặc bạn không có quyền xem đơn hàng này. Vui lòng đăng nhập lại.';
  if (error?.response?.status === 404) return 'Không tìm thấy đơn hàng hoặc chức năng được yêu cầu.';
  if ([400, 409, 422].includes(error?.response?.status)) return 'Đơn hàng đã thay đổi hoặc thông tin chưa hợp lệ. Vui lòng tải lại trạng thái và kiểm tra thông tin.';
  return 'Chưa thể xử lý yêu cầu. Vui lòng kiểm tra kết nối và thử lại.';
}
