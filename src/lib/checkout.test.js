import { beforeEach, describe, expect, it, vi } from 'vitest';
import { canCancelOrder, canPayOrder, cartFromServer, checkoutPayload, paymentRedirect, promotionPayload, quoteFingerprint } from './checkout';
import { selectedCartItems } from './cart';
import { clearAttempt, readAttempt, saveAttempt, rememberPayment, paymentByReference } from './checkoutAttempt';
const values = { receiverName: ' An ', receiverPhone: '0901234567', shippingAddress: '36 Đường A, TP.HCM', note: '', paymentMethod: 'cod', promotionCode: ' organic10 ', points: '2' };
const items = [{ variantId: 'v', quantity: 3, unitPrice: 1, customerId: 'fake', selected: true }];
describe('Checkout contracts and safeguards', () => {
  it('only sends variant/quantity, address, method, promotion and points; never client prices or identity', () => {
    expect(checkoutPayload(values, items)).toEqual({ items: [{ variantId: 'v', quantity: 3 }], receiverName: 'An', receiverPhone: values.receiverPhone, shippingAddress: values.shippingAddress, note: null, paymentMethod: 'cod', promotionCode: 'ORGANIC10', points: 2 });
  });
  it('rejects empty/duplicate variants, fractional/excess quantities and invalid points', () => {
    for (const rows of [[], [...items, ...items], [{ variantId: 'v', quantity: 1.5 }], [{ variantId: 'v', quantity: 1000 }]]) expect(() => checkoutPayload(values, rows)).toThrow();
    for (const points of ['-1', '1.5', '51']) expect(() => checkoutPayload({ ...values, points }, items)).toThrow('Điểm');
  });
  it('keeps Redis prices/unavailable status and selection; allows quantities beyond old demo limit 99', () => {
    const cart = cartFromServer({ limits: { maxQuantityPerLine: 999 }, items: [{ productId: 'p', variantId: 'v', quantity: 120, unitPrice: 20000, available: true }, { productId: 'p2', variantId: 'v2', quantity: 1, unitPrice: null, available: false }] });
    expect(selectedCartItems(cart)).toHaveLength(1); expect(cart[0].minPrice).toBe(20000);
    expect(cartFromServer({ items: [{ ...cart[0], unitPrice: 23000 }] }, [{ ...cart[0], selected: false }])[0].selected).toBe(false);
  });
  it('never treats a paid/review-required or preparing order as cancellable/payable', () => {
    expect(canCancelOrder({ status: 'confirmed', paymentStatus: 'pending' })).toBe(true);
    expect(canCancelOrder({ status: 'preparing', paymentStatus: 'pending' })).toBe(false);
    expect(canCancelOrder({ status: 'confirmed', paymentStatus: 'paid' })).toBe(false);
    expect(canPayOrder({ status: 'pending_payment', paymentStatus: 'requires_review' })).toBe(false);
  });
  it('only redirects pending backend payments to HTTPS hosts of the matching gateway', () => {
    expect(paymentRedirect({ gateway: 'stripe', status: 'pending', paymentUrl: 'https://checkout.stripe.com/c/pay/abc' })).toContain('checkout.stripe.com');
    for (const paymentUrl of ['javascript:alert(1)', 'http://checkout.stripe.com/x', 'https://checkout.stripe.com.evil.example/x', 'https://user:pw@checkout.stripe.com/x', 'https://www.paypal.com/x']) expect(() => paymentRedirect({ gateway: 'stripe', status: 'pending', paymentUrl })).toThrow('hợp lệ');
    expect(() => paymentRedirect({ gateway: 'stripe', status: 'paid', paymentUrl: 'https://checkout.stripe.com/x' })).toThrow();
  });
  it('validates dates, percentage cap and active promotion scope', () => {
    const promo = { promotionCode: 'MOC10', name: 'Giảm giá', description: '', discountType: 'percentage', discountValue: '10', minOrderValue: 0, maxDiscountAmount: '', usageLimit: '', perUserLimit: '', startDate: '2026-01-01T00:00', endDate: '2027-01-01T00:00', status: 'active', productIds: ['p'], batchIds: [] };
    expect(promotionPayload(promo).usageLimit).toBeNull();
    expect(() => promotionPayload({ ...promo, productIds: [] })).toThrow('sản phẩm hoặc lô');
    expect(() => promotionPayload({ ...promo, discountValue: 101 })).toThrow('100');
  });
  it('detects monetary changes before order submission without depending on unrelated quote metadata', () => {
    const quote = { subtotal: 100, totalAmount: 90, items: [{ variantId: 'v', quantity: 1, unitPrice: 100, discountAmount: 10 }] };
    expect(quoteFingerprint({ ...quote, estimatedEarnedPoints: 1 })).toBe(quoteFingerprint(quote));
    expect(quoteFingerprint({ ...quote, totalAmount: 95 })).not.toBe(quoteFingerprint(quote));
    expect(quoteFingerprint({ ...quote, items: [{ ...quote.items[0], unitPrice: 105 }] })).not.toBe(quoteFingerprint(quote));
  });
});
describe('Durable order attempt', () => {
  beforeEach(() => { const map = new Map(); vi.stubGlobal('sessionStorage', { getItem: (key) => map.get(key), setItem: (key, value) => map.set(key, value), removeItem: (key) => map.delete(key) }); });
  it('keeps the same key and immutable body for recovery, isolated by account', () => {
    const attempt = { key: 'once', payload: checkoutPayload(values, items) }; saveAttempt('an', attempt);
    expect(readAttempt('an')).toEqual(attempt); expect(readAttempt('binh')).toBeNull(); clearAttempt('an'); expect(readAttempt('an')).toBeNull();
  });
  it('blocks placing before a durable key can be saved', () => {
    sessionStorage.setItem = () => { throw new Error('quota'); };
    expect(() => saveAttempt('an', { key: 'once' })).toThrow('chống đặt trùng');
  });
  it('keeps separate VNPay reference mappings across attempts and accounts', () => {
    rememberPayment('an', { id:'first',orderId:'o1',gateway:'vnpay',paymentUrl:'https://sandbox.vnpayment.vn/?vnp_TxnRef=one' });
    rememberPayment('an', { id:'second',orderId:'o2',gateway:'vnpay',paymentUrl:'https://sandbox.vnpayment.vn/?vnp_TxnRef=two' });
    expect(paymentByReference('an','one')?.id).toBe('first'); expect(paymentByReference('an','two')?.id).toBe('second');
    expect(paymentByReference('other','one')).toBeNull(); expect(paymentByReference('an','missing')).toBeNull();
  });
});
