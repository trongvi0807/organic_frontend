import { it, expect } from 'vitest';
import { promotionPayload } from './checkout';
const values = { promotionCode: '', name: 'Combo rau', description: '', discountType: 'percentage', discountValue: '10', minOrderValue: 0, maxDiscountAmount: '', usageLimit: '', perUserLimit: '', status: 'draft', startDate: '2026-11-04T08:00', endDate: '2026-11-10T08:00', productIds: ['a', 'b'], batchIds: ['legacy'], pointsCost: '', voucherValidDays: '', promotionType: 'combo', requiredQuantities: { a: '2', b: '1', removed: 99 } };
it('sends product requirements and never sends lot targets', () => {
  const result = promotionPayload(values, { automaticCode: true });
  expect(result.requiredQuantities).toEqual({ a: 2, b: 1 }); expect(result.batchIds).toEqual([]); expect(result.promotionType).toBe('combo');
});
it('rejects incomplete or fractional combo requirements before submitting', () => {
  expect(() => promotionPayload({ ...values, productIds: ['a'] }, { automaticCode: true })).toThrow('Combo');
  expect(() => promotionPayload({ ...values, requiredQuantities: { a: 1.5, b: 1 } }, { automaticCode: true })).toThrow('Combo');
});
