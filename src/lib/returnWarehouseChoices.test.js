import { expect, it } from 'vitest';
import { conditionCounts, warehouseChoicePayload } from './returnWarehouseChoices';

const item = { version: 8, uninspectedQuantity: 5, passedHeldQuantity: 3, failedHeldQuantity: 2, restockedQuantity: 4, disposedQuantity: 1 };
it('requires a real inspection choice and keeps mixed totals balanced', () => {
  expect(() => conditionCounts('', 5, '')).toThrow('chọn tình trạng');
  for (const damaged of ['', 0, 5, -1, 1.5]) expect(() => conditionCounts('mixed', 5, damaged)).toThrow();
  expect(conditionCounts('mixed', 5, 2)).toEqual({ good: 3, damaged: 2 });
  expect(() => conditionCounts('mixed', 1, 1)).toThrow('một sản phẩm');
});
it('maps a single damaged item without asking the employee for zeros', () => {
  expect(warehouseChoicePayload('inspect', { condition: 'damaged' }, { ...item, uninspectedQuantity: 1 })).toEqual(expect.objectContaining({
    expectedVersion: 8, passedQuantity: 0, failedQuantity: 1,
  }));
});
it('corrects only held goods by the difference instead of recounting already processed goods', () => {
  expect(warehouseChoicePayload('reinspect', { condition: 'mixed', damagedQuantity: 4 }, item)).toEqual(expect.objectContaining({ from: 'passed', quantity: 2 }));
  expect(warehouseChoicePayload('reinspect', { condition: 'good' }, item)).toEqual(expect.objectContaining({ from: 'failed', quantity: 2 }));
  expect(() => warehouseChoicePayload('reinspect', { condition: 'mixed', damagedQuantity: 2 }, item)).toThrow('giống kết quả');
});
it('disposes the selected group without accidentally including good stock', () => {
  expect(warehouseChoicePayload('dispose', { disposalGroup: 'damaged' }, item)).toEqual(expect.objectContaining({ passedQuantity: 0, failedQuantity: 2 }));
  expect(warehouseChoicePayload('dispose', { disposalGroup: 'damaged', partial: true, quantity: 1 }, item)).toEqual(expect.objectContaining({ passedQuantity: 0, failedQuantity: 1 }));
  expect(warehouseChoicePayload('dispose', { disposalGroup: 'all' }, item)).toEqual(expect.objectContaining({ passedQuantity: 3, failedQuantity: 2 }));
  expect(() => warehouseChoicePayload('dispose', { disposalGroup: 'all', partial: true, quantity: 1 }, item)).toThrow('một nhóm hàng');
  expect(() => warehouseChoicePayload('dispose', { disposalGroup: 'damaged' }, { ...item, failedHeldQuantity: 0 })).toThrow('Không còn hàng');
});
it('defaults restock to the remaining good stock and validates partial quantities', () => {
  expect(warehouseChoicePayload('restock', {}, item)).toEqual(expect.objectContaining({ quantity: 3, expectedVersion: 8 }));
  expect(warehouseChoicePayload('restock', { partial: true, quantity: 1 }, item).quantity).toBe(1);
  for (const quantity of [0, 4, -1, 1.5, '']) expect(() => warehouseChoicePayload('restock', { partial: true, quantity }, item)).toThrow();
});
