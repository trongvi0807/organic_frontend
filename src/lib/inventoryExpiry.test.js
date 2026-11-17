import { expect, it } from 'vitest';
import { expiryPolicyPayload, remainingDaysText } from './inventoryExpiry';

it('distinguishes today, remaining and expired dates without negative zero', () => {
  expect(remainingDaysText(0)).toBe('Hết hạn hôm nay');
  expect(remainingDaysText(-0)).toBe('Hết hạn hôm nay');
  expect(remainingDaysText(3)).toBe('Còn 3 ngày');
  expect(remainingDaysText(-2)).toBe('Đã hết hạn 2 ngày');
  expect(remainingDaysText(null)).toBe('Chưa xác định');
});
it('validates a policy as a pair and clears both fields when restoring defaults', () => {
  expect(expiryPolicyPayload(false, 3, 10)).toEqual({ warningDays: null, clearanceDays: null });
  expect(expiryPolicyPayload(true, '7', '3')).toEqual({ warningDays: 7, clearanceDays: 3 });
  expect(expiryPolicyPayload(true, '0', '0')).toEqual({ warningDays: 0, clearanceDays: 0 });
  for (const [warning, clearance] of [['', 1], [3, ''], [3, 4], [-1, 0], [1.5, 1], [3651, 1]]) {
    expect(() => expiryPolicyPayload(true, warning, clearance)).toThrow();
  }
});
