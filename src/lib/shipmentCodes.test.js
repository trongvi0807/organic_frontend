import { expect, it, vi } from 'vitest';
import { createShipmentCode } from './shipmentCodes';
it('creates a readable shipment reference and avoids codes already on the order', () => {
  const uuid = vi.spyOn(crypto, 'randomUUID').mockReturnValueOnce('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa').mockReturnValueOnce('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
  try { expect(createShipmentCode([{ trackingCode: 'VC-20261029-AAAAAAAAAAAA' }], '2026-10-29')).toBe('VC-20261029-BBBBBBBBBBBB'); }
  finally { uuid.mockRestore(); }
});
