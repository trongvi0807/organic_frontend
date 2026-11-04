import { expect, it } from 'vitest';
import { comboAdditions, comboEstimate, comboProgress, offerActive } from './storeOffers';
export const offer = () => ({ id: 'offer', promotionType: 'combo', promotionCode: 'TESTCOMBO10', name: 'Combo rau',
  discountType: 'percentage', discountValue: 10, minOrderValue: 0, maxDiscountAmount: 20000,
  startsAt: new Date(Date.now() - 60000).toISOString(), endsAt: new Date(Date.now() + 60000).toISOString(),
  productCount: 2, products: [
    { productId: 'a', productName: 'Cải bó xôi', slug: 'cai', requiredQuantity: 1, variants: [{ id: 'a250', variantName: '250g', price: 25000, availableQuantity: 20 }, { id: 'a500', variantName: '500g', price: 40000, availableQuantity: 2 }] },
    { productId: 'b', productName: 'Cà rốt', slug: 'ca-rot', requiredQuantity: 1, variants: [{ id: 'b1', variantName: '1kg', price: 30000, availableQuantity: 3 }] },
  ] });
export const row = (id, variantId, quantity = 1, extra = {}) => ({ id, variantId, quantity, minPrice: 40000, stock: 20, ...extra });

it('aggregates selected SKUs by product and ignores unselected or unsellable rows', () => {
  const combo = offer(); combo.products[0].requiredQuantity = 2;
  const rows = [row('a', 'a250'), row('a', 'a500'), row('b', 'b1', 1, { selected: false })];
  expect(comboProgress(combo, rows).missing.map(p => [p.productId, p.missingQuantity])).toEqual([['b', 1]]);
  expect(comboProgress(combo, [...rows, row('b', 'b2', 1, { available: false, serverCart: true })]).sets).toBe(0);
  expect(comboProgress(combo, [row('a', 'a250', 4), row('b', 'b1', 2)]).sets).toBe(2);
});
it('completes a set without duplicating products already selected in the cart', () => {
  expect(comboAdditions(offer(), [row('a', 'a500')], {}, true)).toEqual([{ variantId: 'b1', quantity: 1 }]);
  expect(comboAdditions(offer(), [row('a', 'a500'), row('b', 'b1')], {}, true)).toEqual([]);
});
it('checks cart quantities against stock and can choose an alternative package', () => {
  const rows = [row('a', 'a500', 2)];
  expect(comboAdditions(offer(), rows)).toEqual([{ variantId: 'a250', quantity: 1 }, { variantId: 'b1', quantity: 1 }]);
  expect(() => comboAdditions(offer(), rows, { a: 'a500' })).toThrow('chưa đủ hàng');
});
it('estimates one complete set with rounding, minimum spend and the order discount cap', () => {
  expect(comboEstimate(offer())).toEqual({ subtotal: 55000, discount: 5500, total: 49500 });
  expect(comboEstimate(offer(), { a: 'a500' }).total).toBe(63000);
  const fixed = { ...offer(), discountType: 'fixed_amount', discountValue: 90000 };
  expect(comboEstimate(fixed).discount).toBe(20000);
  expect(comboEstimate({ ...fixed, minOrderValue: 100000 }).discount).toBe(0);
});
it('hides a program exactly at its end and does not show future programs', () => {
  const combo = offer();
  expect(offerActive(combo, Date.parse(combo.endsAt))).toBe(false);
  expect(offerActive(combo, Date.parse(combo.startsAt) - 1)).toBe(false);
  expect(offerActive(combo, Date.parse(combo.startsAt))).toBe(true);
});
