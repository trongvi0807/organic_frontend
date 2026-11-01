import { expect, it } from 'vitest';
import { currency } from './utils';

it('displays zero without a minus, including negative values rounded to zero', () => {
  for (const value of [0, -0, '0', '-0', -0.1]) expect(currency(value)).toBe(currency(0));
  expect(currency(-10000)).toContain('-10.000');
  expect(currency(10000)).not.toMatch(/^[+−-]/);
  expect(currency(null)).toBe('Liên hệ');
});
