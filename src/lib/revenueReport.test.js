import { expect, it } from 'vitest';
import { revenueChartRows, revenueCsv } from './revenueReport';
import { revenueFixture } from '../test/revenueFixture';
it('uses net revenue, successful refunds and liquidation values without recomputing gross revenue',()=>{
  const data=revenueFixture('2026-10-22','2026-10-28');const rows=revenueChartRows(data);
  expect(rows[0]).toMatchObject({revenue:160000,refunds:50000,liquidation:10000,orders:1});expect(rows).toHaveLength(7);
});
it('exports every period and warnings with UTF-8 BOM and spreadsheet formula escaping',()=>{
  const data=revenueFixture('2026-10-01','2026-10-30');data.warnings=['=UNTRUSTED("value")'];const csv=revenueCsv(data);
  expect(csv.startsWith('\uFEFF')).toBe(true);expect(csv).toContain('2026-10-30');expect(csv).toContain('TỔNG');expect(csv).toContain("'=UNTRUSTED");expect(csv).toContain('160000');
});
