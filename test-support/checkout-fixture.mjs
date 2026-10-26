// Non-production QA: RAM only, no gateways, email, Firebase, PostgreSQL or Redis.
import { randomUUID } from 'node:crypto';
export function checkoutFixture(db) {
  const orders = [], attempts = new Map(), payments = [], promotions = [{ id: 'qa-promo', promotionCode: 'ORGANIC10', name: 'Ưu đãi kiểm thử 10%', description: 'Dữ liệu QA', discountType: 'percentage', discountValue: 10, maxDiscountAmount: 50000, minOrderValue: 0, startDate: '2026-01-01T00:00', endDate: '2027-12-31T00:00', usageLimit: 100, usageCount: 0, perUserLimit: 10, status: 'active', productIds: [db.products[0].id], batchIds: [] }];
  const guest = new Map(), account = new Map(), reviews = [], history = [];
  let balance = 10, reserved = 0;
  const product = db.products[0];
  const page = (rows, q) => { const p = Number(q.get('page') || 0), s = Number(q.get('size') || 20); return { content: rows.slice(p * s, (p + 1) * s), page: p, size: s, totalElements: rows.length, totalPages: Math.ceil(rows.length / s) }; };
  const variant = (id) => ({ variantId: id, productId: product.id, productName: product.productName, slug: product.slug, sku: id.endsWith('large') ? 'QA-1000' : 'QA-500', variantName: id.endsWith('large') ? 'Gói 1kg' : 'Gói 500g', unitPrice: id.endsWith('large') ? 50000 : 28000,availableQuantity:id.endsWith('large')?4:12 });
  const cart = (rows, authenticated, mergeStatus = 'NONE') => ({ ownerType: authenticated ? 'CUSTOMER' : 'GUEST', items: [...rows].map(([id, quantity]) => ({ ...variant(id), quantity, available: true, imageUrl: '/images/carrots.jpg', lineTotal: variant(id).unitPrice * quantity })), totalQuantity: [...rows.values()].reduce((s, q) => s + q, 0), lineCount: rows.size, mergeStatus, limits: { maxLines: 100, maxQuantityPerLine: 999 } });
  function quote(body) {
    const lines = body.items.map((l) => ({ ...variant(l.variantId), quantity: l.quantity, lineAmount: variant(l.variantId).unitPrice * l.quantity, discountAmount: 0 }));
    const subtotal = lines.reduce((s, l) => s + l.lineAmount, 0), promotionDiscount = body.promotionCode ? Math.min(50000, Math.round(subtotal * .1)) : 0, pointsDiscount = body.points * 2000;
    return { items: lines, subtotal, promotionDiscount, pointsUsed: body.points || 0, pointsDiscount, totalAmount: subtotal - promotionDiscount - pointsDiscount, currency: 'VND', promotionCode: body.promotionCode, shippingFee: 0, vatIncluded: true, estimatedEarnedPoints: Math.floor((subtotal - promotionDiscount - pointsDiscount) / 100000) };
  }
  return function handle({ parts, method, body, query, role, send, req, res }) {
    const [module, id, action, child] = parts, customer = role === 'CUSTOMER', staff = ['ADMIN', 'SALES_STAFF', 'WAREHOUSE_STAFF'].includes(role);
    const fail = (message, status = 409) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ code: status, message })); return true; };
    if (module === '__qa' && id === 'rewards' && method === 'POST' && role === 'ADMIN' && process.env.QA_VNPAY === 'true') {
      if (!Number.isInteger(body.balance) || body.balance < 0 || !Number.isInteger(body.reserved) || body.reserved < 0 || body.reserved > body.balance) return fail('Invalid QA point balance',400);
      balance=body.balance;reserved=body.reserved;send({balance,reserved,available:balance-reserved});return true;
    }
    if (module === '__qa' && id === 'payments' && method === 'POST' && role === 'ADMIN' && process.env.QA_VNPAY === 'true') {
      const p = payments.find((p) => p.id === action); if (!p) return fail('Không có thanh toán',404);
      if (body.amount !== p.amount) return fail('Số tiền không khớp',409);
      p.status='paid'; const o=orders.find((o)=>o.id===p.orderId);o.paymentStatus='paid';o.status='paid'; send(p);return true;
    }
    if (module === 'cart') {
      if (role && !customer) return fail('Giỏ hàng dành cho khách hàng', 403);
      const rows = customer ? account : guest; let mergeStatus = 'NONE';
      if ((method === 'GET' || id === 'merge') && customer && req.headers.cookie?.includes('organic_cart=qa-guest') && guest.size) { for (const [key, q] of guest) account.set(key, (account.get(key) || 0) + q); guest.clear(); mergeStatus = 'MERGED'; }
      if (method === 'DELETE') { if (id === 'items') rows.delete(action); else rows.clear(); }
      if (['POST', 'PATCH'].includes(method) && id === 'items') { const key = method === 'POST' ? body.variantId : action, quantity = method === 'POST' ? (rows.get(key) || 0) + body.quantity : body.quantity; if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) return fail('Số lượng không hợp lệ', 400); rows.set(key, quantity); }
      if (!customer && method !== 'GET') res.setHeader('Set-Cookie', 'organic_cart=qa-guest; Path=/api/v1; HttpOnly; SameSite=Lax');
      send(cart(rows, customer, mergeStatus)); return true;
    }
    if (module === 'customers' && id === 'me' && ['rewards', 'reward-transactions'].includes(action)) { if (!customer) return fail('Sai quyền', 403); send(action === 'rewards' ? { balance, reserved, available: balance - reserved, redeemLimit: 50, redeemValue: 2000, earnPerVnd: 100000 } : history.slice(Number(query.get('page') || 0) * Number(query.get('size') || 20), (Number(query.get('page') || 0) + 1) * Number(query.get('size') || 20))); return true; }
    if (module === 'promotions' || module === 'admin' && id === 'promotions') {
      if (module === 'admin' && role !== 'ADMIN' || module === 'promotions' && !customer) return fail('Sai quyền', 403);
      const actualId = module === 'admin' ? action : id; let item = promotions.find((p) => p.id === actualId);
      if (method === 'POST' || method === 'PUT') { item = { ...body, id: actualId || randomUUID(), usageCount: item?.usageCount || 0 }; const index = promotions.findIndex((p) => p.id === actualId); if (index < 0) promotions.unshift(item); else promotions[index] = item; }
      if (method === 'DELETE') item.status = 'inactive';
      send(actualId || ['POST', 'PUT'].includes(method) ? item : page(promotions, query)); return true;
    }
    if (module === 'reviews') {
      if (!customer) return fail('Sai quyền', 403);
      if (id === 'eligibility') { send({ productId: query.get('productId'), canReview: orders.some((o) => ['delivered', 'completed'].includes(o.status)), message: 'Bạn cần mua và nhận sản phẩm này trước khi đánh giá.' }); return true; }
      if (id === 'me') { send(page(reviews, query)); return true; }
      if (id === 'eligible-items') { send(page(orders.filter((o) => ['delivered', 'completed'].includes(o.status)).map((o) => ({ orderDetailId: o.id, orderCode: o.orderCode, orderStatus: o.status, productId: product.id, productName: product.productName, productSlug: product.slug, variantName: 'Gói 500g', reviewCount: reviews.length })), query)); return true; }
      let review = reviews.find((r) => r.id === id);
      if (!id && method === 'POST') { if (!orders.some((o) => ['delivered', 'completed'].includes(o.status))) return fail('Cần mua và nhận hàng', 403); review = { ...body, id: randomUUID(), productId: product.id, productName: product.productName, variantName: 'Gói 500g', published: true, media: [] }; reviews.unshift(review); }
      if (!review) return fail('Không có đánh giá', 404);
      if (method === 'DELETE' && !action) reviews.splice(reviews.indexOf(review), 1);
      if (method === 'PUT') Object.assign(review, body);
      send(review); return true;
    }
    const management = module === 'management';
    if (!['checkout', 'orders', 'payments', 'management'].includes(module)) return false;
    if (management ? !staff : !customer) return fail('Sai quyền', 403);
    if (module === 'payments' && id === 'methods') { send({ cod: true, stripe: true, paypal: false, vnpay: process.env.QA_VNPAY === 'true' }); return true; }
    if (module === 'checkout' || module === 'orders' && !id && method === 'POST') {
      if (body.promotionCode && body.promotionCode !== 'ORGANIC10') return fail('Mã ưu đãi không hợp lệ');
      if (body.points > balance - reserved || body.points * 2000 > quote({ ...body, points: 0 }).totalAmount) return fail('Điểm khả dụng không đủ');
      if (body.items.some((l) => l.quantity > 200)) return fail('Không đủ tồn kho');
      if (module === 'checkout') { send(quote(body)); return true; }
      const key = req.headers['idempotency-key']; if (!key) return fail('Thiếu khóa chống đặt trùng', 400);
      if (attempts.has(key)) { send(attempts.get(key), 201); return true; }
      const order = { id: randomUUID(), orderCode: `OD-QA-${orders.length + 1}`, status: body.paymentMethod === 'cod' ? 'confirmed' : 'pending_payment', paymentStatus: 'pending', paymentMethod: body.paymentMethod, receiverName: body.receiverName, receiverPhone: body.receiverPhone, shippingAddress: body.shippingAddress, note: body.note, pricing: quote(body), orderedAt: new Date().toISOString(), pointsEarned: 0, cashCollectedAt: null, cashReconciledAt: null, payments: [], shipments: [] };
      if (order.pricing.totalAmount === 0) { order.status = 'confirmed'; order.paymentStatus = 'paid'; }
      orders.unshift(order); attempts.set(key, order); reserved += body.points;
      if (body.note === 'QA_LOST_REPLY') return fail('QA: phản hồi gián đoạn sau khi đã ghi đơn', 503);
      send(order, 201); return true;
    }
    if (module === 'payments') {
      if (id === 'vnpay' && action === 'reference') { const p = payments.find((p) => p.merchantReference === child); if (!p) return fail('Không có tham chiếu',404); send(p);return true; }
      if (id === 'initiate') { const o = orders.find((o) => o.id === body.orderId); if (!o) return fail('Không có đơn', 404); const reference=randomUUID().replaceAll('-',''); const p = { id: randomUUID(), orderId: o.id, gateway: body.gateway, status: 'pending', amount: o.pricing.totalAmount, currency: 'VND', merchantReference:reference, paymentUrl: body.gateway === 'vnpay' ? `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=${reference}` : 'https://checkout.stripe.com/c/pay/qa-do-not-follow' }; payments.push(p); o.payments.push(p); send(p); return true; }
      const p = payments.find((p) => p.id === id); if (!p) return fail('Không có thanh toán', 404);
      if (action === 'sync') { p.status = 'paid'; const o = orders.find((o) => o.id === p.orderId); o.paymentStatus = 'paid'; o.status = 'paid'; }
      send(p); return true;
    }
    if (management && id === 'payments') { send(page([], query)); return true; }
    if (management && id === 'shipments') {
      const o = orders.find((o) => o.shipments.some((s) => s.id === action)); const s = o?.shipments.find((s) => s.id === action); if (!s) return fail('Không có chuyến', 404);
      s.status = body.status; if (s.status === 'picked_up') o.status = 'shipping'; if (s.status === 'delivered') o.status = 'delivered'; send(s); return true;
    }
    const orderId = management ? action : id, operation = management ? child : action;
    if (!orderId) { send(page(orders, query)); return true; }
    const o = orders.find((o) => o.id === orderId); if (!o) return fail('Không có đơn', 404);
    if (operation === 'cancel') o.status = 'cancelled';
    if (operation === 'prepare') o.status = 'preparing';
    if (operation === 'shipments') { const s = { ...body, id: randomUUID(), status: 'pending' }; o.shipments.push(s); send(s, 201); return true; }
    if (operation === 'cod') { if (!['ADMIN', 'SALES_STAFF'].includes(role)) return fail('Sai quyền', 403); if (parts[4] === 'collect') { o.cashCollectedAt = new Date().toISOString(); o.paymentStatus = 'paid'; balance -= o.pricing.pointsUsed; reserved -= o.pricing.pointsUsed; } else o.cashReconciledAt = new Date().toISOString(); }
    if (operation === 'complete') { o.status = 'completed'; if (!o.pointsEarned) { o.pointsEarned = o.pricing.estimatedEarnedPoints; balance += o.pointsEarned; history.unshift({ id: randomUUID(), type: 'earn', pointsDelta: o.pointsEarned, reservedDelta: 0, createdAt: new Date().toISOString(), note: o.orderCode }); } }
    send(o); return true;
  };
}
