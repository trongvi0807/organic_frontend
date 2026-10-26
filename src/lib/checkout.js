export const paymentNames = { cod: 'Thanh toán khi nhận hàng (COD)', stripe: 'Thẻ quốc tế · Stripe', paypal: 'PayPal', vnpay: 'VNPay' };
export const orderLabels = { pending_payment: 'Chờ thanh toán', confirmed: 'Đã xác nhận', paid: 'Đã thanh toán', preparing: 'Đang chuẩn bị', shipping: 'Đang giao', delivered: 'Đã giao', completed: 'Hoàn tất', cancelled: 'Đã hủy', expired: 'Hết hạn', returned: 'Đã trả hàng', requires_review: 'Cần đối soát' };
export const paymentLabels = { pending: 'Chờ thanh toán', creating: 'Đang tạo phiên', capturing: 'Đang xác nhận', closing: 'Đang đóng phiên', paid: 'Đã thanh toán', failed: 'Không thành công', expired: 'Hết hạn', cancelled: 'Đã hủy', requires_review: 'Cần đối soát', unpaid: 'Chưa thanh toán' };
export const shipmentLabels = { pending: 'Chờ lấy hàng', picked_up: 'Đã lấy hàng', in_transit: 'Đang vận chuyển', delivered: 'Giao thành công', failed: 'Giao thất bại', returned: 'Đã trả về', cancelled: 'Đã hủy chuyến' };
export const shipmentNext = { pending: ['picked_up', 'cancelled'], picked_up: ['in_transit', 'delivered', 'failed'], in_transit: ['delivered', 'failed'], failed: ['returned'] };
export function cartFromServer(data, previous = []) {
  const selected = new Map(previous.map((item) => [item.variantId, item.selected !== false]));
  return (data.items || []).map((item) => ({ ...item, serverCart: true, id: item.productId, cartKey: `${item.productId}:${item.variantId}`, minPrice: item.unitPrice, unit: item.variantName,
    maxQuantity: Math.min(data.limits?.maxQuantityPerLine || 999, 999), selected: selected.get(item.variantId) ?? true }));
}
export function checkoutPayload(values, items) {
  if (!items.length || items.length > 100) throw new Error('Chọn từ 1 đến 100 quy cách sản phẩm.');
  const ids = new Set();
  const lines = items.map((item) => {
    if (!item.variantId || ids.has(item.variantId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) throw new Error('Quy cách hoặc số lượng không hợp lệ. Vui lòng kiểm tra lại giỏ hàng.');
    ids.add(item.variantId); return { variantId: item.variantId, quantity: item.quantity };
  });
  const receiverName = values.receiverName.trim(), receiverPhone = values.receiverPhone.trim(), shippingAddress = values.shippingAddress.trim();
  if (!receiverName || receiverName.length > 100 || !/^[+0-9 ()-]{8,20}$/.test(receiverPhone) || !shippingAddress || shippingAddress.length > 500) throw new Error('Kiểm tra tên, số điện thoại và địa chỉ nhận hàng.');
  const points = Number(values.points);
  if (!Number.isInteger(points) || points < 0 || points > 50) throw new Error('Điểm sử dụng phải là số nguyên từ 0 đến 50.');
  if (!paymentNames[values.paymentMethod]) throw new Error('Chọn phương thức thanh toán hợp lệ.');
  return { items: lines, receiverName, receiverPhone, shippingAddress, note: values.note.trim() || null, paymentMethod: values.paymentMethod, promotionCode: values.promotionCode.trim().toUpperCase() || null, points };
}
// Only backend-issued HTTPS links to the selected gateway can leave the application.
export function paymentRedirect(payment) {
  const hosts = { stripe: ['checkout.stripe.com'], paypal: ['www.paypal.com', 'www.sandbox.paypal.com', 'paypal.com', 'sandbox.paypal.com'], vnpay: ['sandbox.vnpayment.vn', 'pay.vnpay.vn', 'vnpayment.vn'] };
  try {
    const url = new URL(payment.paymentUrl);
    if (payment.status !== 'pending' || url.protocol !== 'https:' || url.username || url.password || !hosts[payment.gateway]?.includes(url.hostname)) throw new Error();
    return url.href;
  } catch { throw new Error('Backend chưa trả đường dẫn thanh toán hợp lệ. Mở đơn hàng để kiểm tra lại.'); }
}
export const canCancelOrder = (order) => ['pending_payment', 'confirmed'].includes(order.status) && !['paid', 'requires_review'].includes(order.paymentStatus);
export const canPayOrder = (order) => order.status === 'pending_payment' && !['paid', 'requires_review'].includes(order.paymentStatus);
export const quoteFingerprint = (quote) => JSON.stringify({ subtotal: quote.subtotal, promotionDiscount: quote.promotionDiscount, pointsUsed: quote.pointsUsed, pointsDiscount: quote.pointsDiscount, shippingFee: quote.shippingFee, totalAmount: quote.totalAmount, items: quote.items.map(({ variantId, quantity, unitPrice, discountAmount }) => ({ variantId, quantity, unitPrice, discountAmount })) });
export function promotionPayload(values) {
  const payload = { ...values, promotionCode: values.promotionCode.trim().toUpperCase(), name: values.name.trim(), description: values.description.trim() || null,
    discountValue: Number(values.discountValue), minOrderValue: Number(values.minOrderValue), maxDiscountAmount: values.maxDiscountAmount === '' ? null : Number(values.maxDiscountAmount), usageLimit: values.usageLimit === '' ? null : Number(values.usageLimit), perUserLimit: values.perUserLimit === '' ? null : Number(values.perUserLimit) };
  if (!/^[A-Z0-9_-]{1,50}$/.test(payload.promotionCode) || !payload.name) throw new Error('Kiểm tra mã khuyến mãi và tên chương trình.');
  if (!(payload.discountValue > 0) || (payload.discountType === 'percentage' && payload.discountValue > 100)) throw new Error('Giá trị giảm phải dương, phần trăm tối đa 100.');
  if (!payload.startDate || !payload.endDate || payload.endDate <= payload.startDate) throw new Error('Ngày kết thúc phải sau ngày bắt đầu.');
  if (payload.status === 'active' && !payload.productIds.length && !payload.batchIds.length) throw new Error('Mã hoạt động cần ít nhất một sản phẩm hoặc lô áp dụng.');
  return payload;
}
