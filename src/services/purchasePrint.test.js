import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./admin/managementService', () => ({ supplierService: { get: vi.fn() }, traceabilityService: { get: vi.fn() } }));
vi.mock('./admin/procurementService', () => ({ inventoryService: { batches: vi.fn() } }));
import { supplierService, traceabilityService } from './admin/managementService';
import { inventoryService } from './admin/procurementService';
import { loadPhysicalStock, loadPurchasePrintContext } from './admin/purchasePrintService';
const order = { supplier: { id: 'supplier', supplierName: 'NCC từ đơn' }, items: [{ variant: { id: 'variant', productId: 'product' } }, { variant: { id: 'variant', productId: 'product' } }] };
beforeEach(() => vi.clearAllMocks());
it('loads full supplier info and the product code through existing staff-accessible traceability, deduplicating product IDs', async () => {
  supplierService.get.mockResolvedValue({ id: 'supplier', supplierName: 'NCC', address: 'Địa chỉ NCC' }); traceabilityService.get.mockResolvedValue({ productId: 'product', productCode: 'SP01' });
  const context = await loadPurchasePrintContext(order);
  expect(context.supplier.address).toBe('Địa chỉ NCC'); expect(context.products.product.productCode).toBe('SP01'); expect(traceabilityService.get).toHaveBeenCalledTimes(1); expect(context.warnings).toEqual([]);
});
it('preserves known supplier data and reports missing fields without replacing them with invented codes/addresses', async () => {
  supplierService.get.mockRejectedValue(new Error('403')); traceabilityService.get.mockRejectedValue(new Error('404'));
  const context = await loadPurchasePrintContext(order); expect(context.supplier).toEqual(order.supplier); expect(context.products).toEqual({}); expect(context.warnings).toHaveLength(1);
});
it('sums physical on-hand across all confirmed batches and pages, including expired and reserved stock', async () => {
  inventoryService.batches.mockResolvedValueOnce({ items: [{ confirmed: true, quantityOnHand: 20, quantityReserved: 9, availableQuantity: 11, expired: false }, { confirmed: false, quantityOnHand: 1000 }], totalPages: 2 }).mockResolvedValueOnce({ items: [{ confirmed: true, quantityOnHand: 5, expired: true }], totalPages: 2 });
  const result = await loadPhysicalStock(order); expect(result.actualStock.variant).toBe(25); expect(result.warnings).toEqual([]); expect(inventoryService.batches).toHaveBeenCalledTimes(2);
  expect(inventoryService.batches).toHaveBeenNthCalledWith(2, { variantId: 'variant', page: 1, size: 50 });
});
it('does not turn an unavailable stock API into a zero stock figure', async () => {
  inventoryService.batches.mockRejectedValue(new Error('503')); const result = await loadPhysicalStock(order); expect(result.actualStock.variant).toBeUndefined(); expect(result.warnings).toHaveLength(1);
});
it('returns a real zero for an empty confirmed warehouse and leaves malformed figures blank', async () => {
  inventoryService.batches.mockResolvedValueOnce({ items: [], totalPages: 0 }); expect((await loadPhysicalStock(order)).actualStock.variant).toBe(0);
  inventoryService.batches.mockResolvedValueOnce({ items: [{ confirmed: true, quantityOnHand: null }], totalPages: 1 }); expect((await loadPhysicalStock(order)).actualStock.variant).toBeUndefined();
});
