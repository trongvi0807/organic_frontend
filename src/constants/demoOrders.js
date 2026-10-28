// Completely fictional fixtures. These IDs never reach the backend.
const products = [
  { variantId: 'demo-carrot', sku: 'SP01', productName: 'Cà rốt hữu cơ Đà Lạt', variantName: 'Túi 500 g', imageUrl: '/images/carrots.jpg', unitPrice: 32000 },
  { variantId: 'demo-avocado', sku: 'SP02', productName: 'Bơ sáp hữu cơ Đắk Lắk', variantName: 'Hộp 1 kg', imageUrl: '/images/avocado.jpg', unitPrice: 85000 },
  { variantId: 'demo-tea', sku: 'SP03', productName: 'Trà thảo mộc an lành', variantName: 'Hộp 20 túi lọc', imageUrl: '/images/tea.jpg', unitPrice: 96000 },
  { variantId: 'demo-strawberry', sku: 'SP04', productName: 'Dâu tây hữu cơ', variantName: 'Hộp 250 g', imageUrl: '/images/strawberries.jpg', unitPrice: 78000 },
];
function makeOrder(index, status, paymentStatus, extra = {}) {
  const day = 28 - index;
  const items = [products[index % products.length], products[(index + 1) % products.length]].map((product, i) => ({ ...product,
    orderDetailId: `demo-line-${index}-${i}`, quantity: i + 1, lineAmount: product.unitPrice * (i + 1), discountAmount: 7000,
    ...(['shipping', 'delivered', 'completed', 'failed'].includes(status) ? { batches: [{ batchCode: `HC-2610${String(day).padStart(2, '0')}-${i + 1}`, quantity: i + 1 }] } : {}),
  }));
  const subtotal = items.reduce((sum, item) => sum + item.lineAmount, 0);
  const orderedAt = `2026-10-${String(day).padStart(2, '0')}T08:30:00+07:00`;
  return { id: `demo-order-${index + 1}`, orderCode: `OM2610${String(day).padStart(2, '0')}`, status, paymentStatus,
    paymentMethod: paymentStatus === 'paid' ? 'vnpay' : 'cod', orderedAt,
    receiverName: 'Nguyễn An Nhiên (mô phỏng)', receiverPhone: '0900000000',
    shippingAddress: '36 Trịnh Đình Trọng, Phường Tân Phú, Thành phố Hồ Chí Minh',
    address: { province: 'Thành phố Hồ Chí Minh', ward: 'Phường Tân Phú', street: '36 Trịnh Đình Trọng' },
    pricing: { items, subtotal, promotionDiscount: 10000, pointsUsed: 2, pointsDiscount: 4000, shippingFee: 15000, totalAmount: subtotal + 1000, currency: 'VND' },
    shipments: [], payments: [], ...extra };
}
export function createDemoOrders() {
  return [
    makeOrder(0, 'pending_payment', 'pending', { paymentMethod: 'vnpay' }),
    makeOrder(1, 'pending_confirmation', 'unpaid'),
    makeOrder(2, 'confirmed', 'paid', { confirmedAt: '2026-10-26T09:15:00+07:00' }),
    makeOrder(3, 'preparing', 'unpaid', { confirmedAt: '2026-10-25T09:00:00+07:00', preparingAt: '2026-10-25T09:30:00+07:00' }),
    makeOrder(4, 'shipping', 'unpaid', { confirmedAt: '2026-10-24T09:00:00+07:00', preparingAt: '2026-10-24T10:00:00+07:00', shipments: [{
      id: 'demo-shipment-5', status: 'in_transit', carrier: 'Giao hàng xanh (mô phỏng)', trackingCode: 'MOCPHONG0005',
      driverName: 'Trần Minh (mô phỏng)', driverPhone: '0900000000', licensePlate: 'MÔ PHỎNG', bookedAt: '2026-10-24T10:30:00+07:00',
      shippedAt: '2026-10-24T11:00:00+07:00', estimatedDeliveryAt: '2026-10-28T17:00:00+07:00', note: 'Gọi trước khi giao hàng.',
    }] }),
    makeOrder(5, 'completed', 'paid', { confirmedAt: '2026-10-23T09:00:00+07:00', preparingAt: '2026-10-23T09:30:00+07:00', shipments: [{
      id: 'demo-shipment-6', status: 'delivered', carrier: 'Giao hàng xanh (mô phỏng)', trackingCode: 'MOCPHONG0006', bookedAt: '2026-10-23T10:00:00+07:00',
      shippedAt: '2026-10-23T11:00:00+07:00', deliveredAt: '2026-10-23T15:20:00+07:00',
    }] }),
    makeOrder(6, 'cancelled', 'cancelled', { cancellation: { reason: 'Tôi muốn thay đổi địa chỉ nhận hàng', cancelledAt: '2026-10-22T09:00:00+07:00' } }),
    makeOrder(7, 'cancelled', 'paid', { refundStatus: 'pending', cancellation: { reason: 'Thời gian giao hàng chưa phù hợp', cancelledAt: '2026-10-21T09:00:00+07:00' } }),
    makeOrder(8, 'completed', 'paid', { returnRequests: [{ id: 'demo-return-9', requestCode: 'DT-MOCPHONG09', status: 'submitted', requestType: 'return_refund', approvedRefundAmount: 0 }] }),
    makeOrder(9, 'failed', 'unpaid', { shipments: [{ id: 'demo-shipment-10', bookedAt: '2026-10-19T09:00:00+07:00', shippedAt: '2026-10-19T10:00:00+07:00', status: 'failed', failureReason: 'Không liên hệ được người nhận (mô phỏng).' }] }),
    makeOrder(10, 'delivered', 'paid', { shipments: [{ id: 'demo-shipment-11', bookedAt: '2026-10-18T09:00:00+07:00', shippedAt: '2026-10-18T10:00:00+07:00', deliveredAt: '2026-10-18T14:00:00+07:00', status: 'delivered' }] }),
    makeOrder(11, 'confirmed', 'unpaid', { confirmedAt: '2026-10-17T09:00:00+07:00' }),
  ];
}
