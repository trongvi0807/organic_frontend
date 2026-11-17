import { describe, expect, it } from 'vitest';
import { effectiveSale, saleChoices, saleFields, saleKey } from './saleOptions';
import { cartFromServer, checkoutPayload, quoteFingerprint } from './checkout';
import { comboAdditions, comboProgress } from './storeOffers';

const first = { variantId: 'v', expiryDate: '2026-11-20', promotionId: 'offer', selectionKey: 'v~2026-11-20~offer', availableQuantity: 2, price: 7000, regularPrice: 10000 };
const second = { ...first, expiryDate: '2026-11-30', promotionId: null, selectionKey: 'v~2026-11-30~', price: 10000 };
describe('date-specific stock selection', () => {
  it('keeps same SKU with different expiry dates as separate checkout and cart lines', () => {
    const rows = [first, second].map(o => ({ ...o, ...saleFields(o), quantity: 1 }));
    const payload = checkoutPayload({ receiverName: 'An', receiverPhone: '0901234567', shippingAddress: '123 Street', note: '', points: 0, promotionCode: '', voucherCode: '', paymentMethod: 'cod' }, rows);
    expect(payload.items).toHaveLength(2);
    expect(payload.items[0].salePromotionId).toBe('offer');
    const cart = cartFromServer({ items: rows, limits: {} }, [{ ...rows[0], selected: false }]);
    expect(cart[0].cartKey).not.toBe(cart[1].cartKey);
    expect(cart[0].selected).toBe(false); expect(cart[1].selected).toBe(true);
  });
  it('never substitutes another expiry when the selected option disappears', () => {
    expect(effectiveSale([second], first.selectionKey)).toBeNull();
    expect(effectiveSale([first, second], '')).toBe(first);
    expect(saleChoices({ saleOptions: [first, { ...second, availableQuantity: 0 }] }, 'v')).toEqual([first]);
  });
  it('makes a date change invalidate the confirmed checkout quote', () => {
    const quote = { items: [{ ...first, salePromotionId: 'offer', quantity: 1, unitPrice: 10000, discountAmount: 3000 }] };
    expect(quoteFingerprint(quote)).not.toBe(quoteFingerprint({ ...quote, items: [{ ...quote.items[0], expiryDate: '2026-11-30' }] }));
  });
  it('carries a combo selection into the cart and ignores unrelated normal stock', () => {
    const offer = { id: 'offer', saleScope: 'expiry', products: [{ productId: 'p', productName: 'Milk', requiredQuantity: 2, variants: [{ id: 'v', availableQuantity: 2, expiryDate: first.expiryDate, salePromotionId: 'offer', selectionKey: first.selectionKey }] }] };
    const normal = [{ id: 'p', productId: 'p', variantId: 'v', quantity: 2, selected: true, stock: 10, minPrice: 10000 }];
    expect(comboProgress(offer, normal).sets).toBe(0);
    expect(comboAdditions(offer, normal)).toEqual([{ variantId: 'v', quantity: 2, expiryDate: first.expiryDate, salePromotionId: 'offer' }]);
    expect(saleKey({ variantId: 'v' })).toBe('v');
  });
});
