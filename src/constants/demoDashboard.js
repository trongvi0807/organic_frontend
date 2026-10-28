import { shiftDay } from '@/lib/adminDashboard';
import { today as localToday } from '@/lib/apiData';

export function createDashboardDemo(day = localToday()) {
  const products = [
    { id: 'demo-carrot', productCode: 'SP01', productName: 'Cà rốt hữu cơ Đà Lạt', categoryId: 'rau', categoryName: 'Rau củ', defaultVariantId: 'demo-v1' },
    { id: 'demo-avocado', productCode: 'SP02', productName: 'Bơ sáp hữu cơ', categoryId: 'trai-cay', categoryName: 'Trái cây', defaultVariantId: 'demo-v2' },
    { id: 'demo-rice', productCode: 'SP03', productName: 'Gạo lứt hữu cơ', categoryId: 'kho', categoryName: 'Thực phẩm khô', defaultVariantId: 'demo-v3' },
    { id: 'demo-tea', productCode: 'SP04', productName: 'Trà thảo mộc an lành', categoryId: 'tra', categoryName: 'Trà & thảo mộc', defaultVariantId: 'demo-v4' },
  ];
  const variants = products.map((p, i) => ({ id: p.defaultVariantId, productId: p.id, productName: p.productName, sku: `${p.productCode}-GOI`, variantName: i === 1 ? 'Hộp 1 kg' : 'Gói 500 g', unitId: 'g', netQuantity: i === 1 ? 1000 : 500 }));
  const stock = variants.map((variant, i) => ({ variant, availableQuantity: [8, 24, 5, 36][i], reorderLevel: 10, lowStock: i === 0 || i === 2 }));
  const orders = [];
  for (let offset = 0; offset < 60; offset++) for (let i = 0; i < 3 + offset % 3; i++) {
    const date = shiftDay(day, -offset), product = products[(offset + i) % 4], quantity = i + 1, unitPrice = [32000, 85000, 58000, 96000][(offset + i) % 4];
    const shipping = offset > 1 ? { id: `demo-shipment-${offset}-${i}`, status: i === 2 && offset % 4 === 0 ? 'failed' : 'delivered', bookedAt: `${date}T10:00:00+07:00`, shippedAt: `${date}T11:00:00+07:00`, deliveredAt: i === 2 && offset % 4 === 0 ? null : `${date}T16:00:00+07:00` } : null;
    const status = offset === 0 ? ['pending_confirmation', 'confirmed', 'preparing'][i % 3] : offset === 1 ? 'shipping' : shipping.status === 'failed' ? 'shipping' : 'completed';
    orders.push({ id: `demo-sale-${offset}-${i}`, orderCode: `OM${date.replaceAll('-', '').slice(2)}${i + 1}`, receiverName: ['Nguyễn An Nhiên', 'Trần Thanh Thảo', 'Lê Minh Anh', 'Phạm Ngọc Lan'][i % 4],
      status, paymentStatus: i === 0 && offset === 0 ? 'pending' : shipping?.status === 'failed' ? 'unpaid' : 'paid', paymentMethod: 'vnpay', orderedAt: `${date}T0${8 + i % 2}:${i % 2 ? '35' : '10'}:00+07:00`,
      pricing: { currency: 'VND', subtotal: unitPrice * quantity, promotionDiscount: 5000, pointsUsed: 0, pointsDiscount: 0, shippingFee: 15000, totalAmount: unitPrice * quantity + 10000,
        items: [{ variantId: product.defaultVariantId, productName: product.productName, variantName: variants[(offset + i) % 4].variantName, quantity, unitPrice, lineAmount: unitPrice * quantity, discountAmount: 5000 }] }, shipments: shipping ? [shipping] : [],
    });
  }
  const batches = [-2, 0, 2, 6, 10, 28].map((remaining, i) => ({ id: `demo-lot-${i}`, batchCode: `HC-${day.replaceAll('-', '').slice(2)}-${String(i + 1).padStart(2, '0')}`, variant: variants[i % 4],
    expiryDate: shiftDay(day, remaining), quantityOnHand: [4, 12, 8, 22, 19, 40][i], quantityReserved: 0, confirmed: true, expired: remaining < 0 }));
  const author = { id: 'demo-employee-1', fullName: 'Nguyễn Minh Quân' }, manager = { id: 'demo-manager', fullName: 'Trần Bảo Ngọc' };
  const purchases = [0, 1, 2, 3].map((i) => ({ id: `demo-po-${i}`, orderCode: `PO-${day.replaceAll('-', '').slice(2)}-${i + 1}`, supplier: { supplierName: ['Nông trại Xanh Đà Lạt', 'Hợp tác xã An Lành'][i % 2] },
    status: i < 2 ? 'pending_approval' : 'approved', orderDate: `${shiftDay(day, -i)}T09:20:00+07:00`, createdByEmployee: author,
    approvedByEmployee: i >= 2 ? manager : null, approvedAt: i >= 2 ? `${shiftDay(day, -i)}T10:20:00+07:00` : null, totalAmount: 450000 + i * 120000, currency: 'VND', items: [] }));
  const receipts = [0, 1, 2].map((i) => ({ id: `demo-gr-${i}`, receiptCode: `PN-${day.replaceAll('-', '').slice(2)}-${i + 1}`, purchaseOrderCode: purchases[i].orderCode,
    status: i === 0 ? 'pending_approval' : 'confirmed', receiptDate: `${shiftDay(day, -i)}T13:15:00+07:00`, receivedByEmployee: author,
    confirmedAt: i ? `${shiftDay(day, -i)}T14:10:00+07:00` : null, confirmedByEmployee: i ? manager : null, acceptedTotalAmount: 420000, currency: 'VND', items: [] }));
  const returns = [0, 1, 2].map((i) => ({ id: `demo-return-${i}`, requestCode: `DT-${day.replaceAll('-', '').slice(2)}-${i + 1}`, status: i === 2 ? 'approved' : i ? 'reviewing' : 'pending',
    requestType: 'return_refund', reason: 'quality_issue', customer: { fullName: ['Nguyễn An Nhiên', 'Lê Minh Anh'][i % 2] }, order: { id: orders[12 + i].id, orderCode: orders[12 + i].orderCode },
    requestedAt: `${shiftDay(day, -i)}T10:40:00+07:00`, description: 'Sản phẩm bị dập khi giao. Nội dung minh họa để thử giao diện.', items: [{ productName: products[i].productName, variantName: variants[i].variantName, requestedQuantity: 1 }] }));
  return { orders, products, stock, batches, purchases, receipts, returns };
}
