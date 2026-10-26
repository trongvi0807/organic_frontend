import { describe, expect, it } from 'vitest';
import { canPurchase, cartItemKey, cartTotals, changeCartQuantity, selectAllCartItems, selectCartItem } from './cart';

const carrot = { id: 'carrot', cartKey: 'carrot:small', minPrice: 40000, quantity: 2, stock: 8 };
const tea = { id: 'tea', cartKey: 'tea:box', minPrice: 160000, quantity: 1, stock: 3 };

describe('Cart selection and quantities', () => {
  it('preserves older carts without selection fields and excludes unavailable products', () => {
    const result = cartTotals([carrot, tea, { ...carrot, id: 'sold-out', stock: 0 }]);
    expect(result.subtotal).toBe(240000);
    expect(result.quantity).toBe(3);
    expect(result.selected).toHaveLength(2);
    expect(canPurchase({ ...carrot, minPrice: null })).toBe(false);
    expect(canPurchase({ ...carrot, quantity: 9 })).toBe(false);
  });
  it('selects one variant independently, selects all and deselects all', () => {
    const large = { ...carrot, cartKey: 'carrot:large' };
    const items = [carrot, large, { ...tea, stock: 0 }];
    const partial = selectCartItem(items, cartItemKey(carrot), false);
    expect(cartTotals(partial).selected.map(cartItemKey)).toEqual(['carrot:large']);
    expect(cartTotals(selectAllCartItems(partial, true)).selected).toHaveLength(2);
    expect(cartTotals(selectAllCartItems(items, false)).total).toBe(0);
    expect(items[0]).not.toHaveProperty('selected');
  });
  it('caps increments at stock and 99 and never removes an item by decrementing', () => {
    expect(changeCartQuantity([carrot], carrot.cartKey, 50)[0].quantity).toBe(8);
    expect(changeCartQuantity([{ ...carrot, stock: 150 }], carrot.cartKey, 200)[0].quantity).toBe(99);
    expect(changeCartQuantity([carrot], carrot.cartKey, -50)[0].quantity).toBe(1);
    expect(changeCartQuantity([carrot, { ...carrot, cartKey: 'carrot:large' }], carrot.cartKey, 1)[1].quantity).toBe(2);
    expect(changeCartQuantity([carrot], carrot.cartKey, 0.5)).toEqual([carrot]);
  });
});

describe('Preview promotion totals', () => {
  it('normalizes codes, computes percent discounts and caps them', () => {
    expect(cartTotals([carrot, tea], ' moc10 ')).toMatchObject({ subtotal: 240000, discount: 24000, total: 216000, promoError: '' });
    expect(cartTotals([{ ...tea, quantity: 3, minPrice: 200000 }], 'MOC10').discount).toBe(50000);
  });
  it('applies fixed discounts at the exact minimum and rejects unknown or under-minimum codes', () => {
    expect(cartTotals([{ ...tea, minPrice: 300000 }], 'XANH30')).toMatchObject({ discount: 30000, total: 270000 });
    expect(cartTotals([carrot], 'MOC10')).toMatchObject({ discount: 0, total: 80000, offer: null });
    expect(cartTotals([tea], 'UNKNOWN').promoError).toContain('không hợp lệ');
    expect(cartTotals([], 'MOC10')).toMatchObject({ subtotal: 0, discount: 0, total: 0, offer: null });
  });
  it('revalidates promotions as selection or quantities change, without negative totals', () => {
    const all = [carrot, tea];
    const deselected = selectCartItem(all, tea.cartKey, false);
    expect(cartTotals(deselected, 'MOC10')).toMatchObject({ discount: 0, total: 80000, offer: null });
    expect(cartTotals(all, 'MOC10').discount).toBe(24000);
    expect(cartTotals(selectAllCartItems(all, false), 'XANH30').total).toBe(0);
    expect(cartTotals([{ ...carrot, minPrice: -1 }]).total).toBe(0);
  });
});
