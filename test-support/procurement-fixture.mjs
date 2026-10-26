// Isolated browser QA only: never writes to PostgreSQL or sends Firebase/email messages.
import { randomUUID } from 'node:crypto';
export function procurementFixture(supplier) {
  const variants = [
    { id: 'qa-v1', productId: 'qa-p1', productName: 'Cà rốt hữu cơ Đà Lạt', sku: 'CR-500', variantName: 'Gói 500g', unitId: 'g', netQuantity: 500 },
    { id: 'qa-v2', productId: 'qa-p2', productName: 'Bơ sáp hữu cơ', sku: 'BO-1000', variantName: 'Hộp 1kg', unitId: 'kg', netQuantity: 1 },
  ];
  const employee = { id: 'qa-employee', fullName: 'Nhân viên Mộc QA' };
  const orders = [], receipts = [], batches = [], levels = { 'qa-v1': 10, 'qa-v2': 5 };
  const notifications = [{ id: 'qa-n1', title: 'Cần nhập thêm Cà rốt hữu cơ Đà Lạt', message: 'CR-500 · Gói 500g: tồn có thể bán 0 gói, ngưỡng nhập lại 10 gói.', variantId: 'qa-v1', createdAt: new Date().toISOString(), readAt: null, emailStatus: 'sent', firebaseStatus: 'pending', emailAttempts: 1, firebaseAttempts: 0 }];
  const page = (rows, q) => { const p = Number(q.get('page') || 0), size = Number(q.get('size') || 20); return { content: rows.slice(p * size, (p + 1) * size), totalElements: rows.length, totalPages: Math.ceil(rows.length / size), page: p, size }; };
  function newOrder(body) {
    const o = { id: randomUUID(), orderCode: `PO-QA-${String(orders.length + 1).padStart(3, '0')}`, supplier, status: 'pending_approval', orderDate: new Date().toISOString(), expectedDeliveryDate: body.expectedDeliveryDate, note: body.note, createdByEmployee: employee, approvedByEmployee: null, approvedAt: null, approvalNote: null, goodsReceiptId: null, currency: 'VND', items: body.items.map((l) => ({ id: randomUUID(), variant: variants.find((v) => v.id === l.variantId), quantityOrdered: l.quantity, unitPrice: l.unitPrice, lineAmount: l.quantity * l.unitPrice })) };
    o.totalAmount = o.items.reduce((s, l) => s + l.lineAmount, 0); return o;
  }
  orders.push(newOrder({ note: 'Đã chốt giá với nhà cung cấp · dữ liệu kiểm thử', items: [{ variantId: 'qa-v1', quantity: 50, unitPrice: 22000 }, { variantId: 'qa-v2', quantity: 20, unitPrice: 65000 }] }));
  return function handle({ parts, method, body, query, role, send }) {
    const [module, id, action] = parts;
    if (!['purchase-orders', 'goods-receipts', 'inventory', 'product-batches', 'notifications'].includes(module)) return false;
    const fail = (message, status = 409) => { send({ message }, status); return true; };
    if (!['ADMIN', 'WAREHOUSE_STAFF'].includes(role)) return fail('Không đủ quyền', 403);
    if (module === 'inventory') {
      const stock = (variant) => { const availableQuantity = batches.filter((b) => b.variant.id === variant.id && !b.expired).reduce((s, b) => s + b.availableQuantity, 0); return { variant, availableQuantity, reorderLevel: levels[variant.id], lowStock: availableQuantity <= levels[variant.id] }; };
      if (parts[2]) {
        const v = variants.find((v) => v.id === parts[2]); if (!v) return fail('Không có biến thể', 404);
        if (method === 'PATCH') levels[v.id] = body.reorderLevel;
        send(stock(v)); return true;
      }
      let rows = variants.map(stock);
      if (query.get('search')) rows = rows.filter((s) => JSON.stringify(s.variant).toLowerCase().includes(query.get('search').toLowerCase()));
      if (query.has('lowStock')) rows = rows.filter((s) => s.lowStock === (query.get('lowStock') === 'true'));
      send(page(rows, query)); return true;
    }
    if (module === 'product-batches') {
      let rows = batches.filter((b) => !query.get('variantId') || b.variant.id === query.get('variantId'));
      if (query.has('expired')) rows = rows.filter((b) => b.expired === (query.get('expired') === 'true'));
      send(id ? batches.find((b) => b.id === id) : page(rows, query)); return true;
    }
    if (module === 'notifications') {
      if (id === 'devices') { send(null); return true; }
      if (!id) { send(page(notifications, query)); return true; }
      const n = notifications.find((n) => n.id === id); if (!n) return fail('Không có thông báo', 404);
      if (action === 'read') n.readAt = new Date().toISOString();
      send(n); return true;
    }
    const isReceipt = module === 'goods-receipts', rows = isReceipt ? receipts : orders;
    if (!id && method === 'GET') { send(page(rows.filter((r) => (!query.get('status') || r.status === query.get('status')) && (!query.get('purchaseOrderId') || r.purchaseOrderId === query.get('purchaseOrderId')) && (!query.get('supplierId') || r.supplier?.id === query.get('supplierId'))), query)); return true; }
    let item = rows.find((r) => r.id === id);
    if (!id && method === 'POST') {
      if (!isReceipt) item = newOrder(body);
      else {
        const order = orders.find((o) => o.id === body.purchaseOrderId);
        if (!order || order.status !== 'approved' || order.goodsReceiptId) return fail('Đơn chưa duyệt hoặc đã có phiếu');
        item = { id: randomUUID(), receiptCode: `GR-QA-${receipts.length + 1}`, purchaseOrderId: order.id, purchaseOrderCode: order.orderCode, status: 'draft', receiptDate: new Date().toISOString(), receivedByEmployee: employee, confirmedByEmployee: null, currency: 'VND' };
        order.goodsReceiptId = item.id;
      }
      rows.unshift(item);
    }
    if (!item) return fail('Không tìm thấy chứng từ', 404);
    if (method === 'GET') { send(item); return true; }
    if (!action && (method === 'POST' || method === 'PUT')) {
      if (!isReceipt && method === 'PUT') { if (item.goodsReceiptId) return fail('Đơn đã có phiếu'); Object.assign(item, newOrder(body), { id, status: 'pending_approval' }); }
      if (isReceipt) {
        if (!['draft', 'rejected'].includes(item.status)) return fail('Phiếu đã khóa');
        const order = orders.find((o) => o.id === item.purchaseOrderId);
        item.note = body.note; item.status = 'draft';
        item.items = body.items.map((l) => { const ol = order.items.find((o) => o.id === l.purchaseOrderDetailId); return { ...l, id: randomUUID(), variant: ol.variant, quantityOrdered: ol.quantityOrdered, quantityMissing: ol.quantityOrdered - l.quantityReceived - l.quantityRejected, unitPrice: ol.unitPrice, acceptedAmount: l.quantityReceived * ol.unitPrice, batch: l.quantityReceived ? { id: randomUUID(), batchCode: l.batchCode, variant: ol.variant, manufactureDate: l.manufactureDate, expiryDate: l.expiryDate, originDescription: l.originDescription, quantityOnHand: 0, quantityReserved: 0, availableQuantity: 0, expired: false, confirmed: false } : null }; });
        item.acceptedTotalAmount = item.items.reduce((s, l) => s + l.acceptedAmount, 0);
      }
    }
    if (action === 'submit') { if (!['draft', 'rejected'].includes(item.status)) return fail('Sai trạng thái'); item.status = 'pending_approval'; }
    if (['approve', 'reject'].includes(action)) {
      if (role !== 'ADMIN') return fail('Chỉ Admin được duyệt', 403);
      if (item.status !== 'pending_approval') return fail('Sai trạng thái');
      item.status = action === 'reject' ? 'rejected' : isReceipt ? 'confirmed' : 'approved'; item.approvalNote = body.note;
      if (isReceipt) { item.confirmedByEmployee = employee; item.confirmedAt = new Date().toISOString(); }
      else { item.approvedByEmployee = employee; item.approvedAt = new Date().toISOString(); }
      if (isReceipt && action === 'approve') {
        orders.find((o) => o.id === item.purchaseOrderId).status = 'received';
        item.items.filter((l) => l.batch).forEach((l) => { Object.assign(l.batch, { confirmed: true, quantityOnHand: l.quantityReceived, availableQuantity: l.quantityReceived }); batches.push(l.batch); });
      }
    }
    if (action === 'cancel') { if (item.goodsReceiptId) return fail('Đơn đã có phiếu'); item.status = 'cancelled'; }
    send(item); return true;
  };
}
