import { expect, it } from 'vitest';
import { salesPeriod, validateSalesRange } from './salesReport';
it('builds inclusive date presets across month and year boundaries',()=>{
  expect(salesPeriod('week','2026-01-03')).toEqual({from:'2025-12-28',to:'2026-01-03'});
  expect(salesPeriod('month','2026-11-06')).toEqual({from:'2026-11-01',to:'2026-11-06'});
  expect(salesPeriod('today','2026-11-06')).toEqual({from:'2026-11-06',to:'2026-11-06'});
  expect(salesPeriod('thirty','2026-11-06')).toEqual({from:'2026-10-08',to:'2026-11-06'});
});
it('rejects incomplete, impossible, reversed, future and excessively long periods',()=>{
  expect(validateSalesRange('','2026-11-06','2026-11-06')).toContain('đầy đủ');
  expect(validateSalesRange('2026-02-31','2026-11-06','2026-11-06')).toContain('hợp lệ');
  expect(validateSalesRange('2026-11-06','2026-11-05','2026-11-06')).toContain('sau ngày');
  expect(validateSalesRange('2026-11-06','2026-11-07','2026-11-06')).toContain('hôm nay');
  expect(validateSalesRange('2025-01-01','2026-11-06','2026-11-06')).toContain('366');
  expect(validateSalesRange('2026-11-01','2026-11-06','2026-11-06')).toBe('');
});
