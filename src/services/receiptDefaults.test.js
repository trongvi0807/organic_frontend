import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./admin/managementService', () => ({ traceabilityService: { get: vi.fn() } }));
import { traceabilityService } from './admin/managementService';
import { loadReceiptOrigins } from './admin/receiptDefaultsService';
beforeEach(() => { vi.resetAllMocks(); });
it('reads the linked origin once per product, including several package sizes', async () => {
  traceabilityService.get.mockResolvedValue({ origin: { originName: 'Nông trại Đà Lạt', region: 'Lâm Đồng', country: 'Việt Nam' } });
  const result = await loadReceiptOrigins([{ variant: { productId: 'p', productName: 'Cà rốt' } }, { variant: { productId: 'p', productName: 'Cà rốt' } }]);
  expect(traceabilityService.get).toHaveBeenCalledTimes(1); expect(traceabilityService.get).toHaveBeenCalledWith('p');
  expect(result.byProductId.p).toBe('Nông trại Đà Lạt · Lâm Đồng · Việt Nam');
});
it('does not invent an origin when the database has none or a lookup fails', async () => {
  traceabilityService.get.mockResolvedValueOnce({ origin: null }).mockRejectedValueOnce(new Error('Mất kết nối'));
  const result = await loadReceiptOrigins([{ variant: { productId: 'p', productName: 'Táo' } }, { variant: { productId: 'q', productName: 'Gạo' } }]);
  expect(result.byProductId).toEqual({ p: '' }); expect(result.failed).toEqual(['Gạo']);
});
