import { allPages } from '@/lib/apiData';
import { supplierService, traceabilityService } from './managementService';
import { inventoryService } from './procurementService';

// Reads only. Product code is not the SKU, and physical stock is not available stock.
export async function loadPurchasePrintContext(order) {
  const context = { products: {}, supplier: order.supplier, warnings: [] };
  const tasks = [];
  if (order.supplier?.id) tasks.push(async () => { context.supplier = await supplierService.get(order.supplier.id); });
  for (const id of new Set((order.items || []).map((line) => line.variant?.productId).filter(Boolean))) {
    tasks.push(async () => { context.products[id] = await traceabilityService.get(id); });
  }
  for (let offset = 0; offset < tasks.length; offset += 4) {
    const results = await Promise.allSettled(tasks.slice(offset, offset + 4).map((task) => task()));
    if (results.some((result) => result.status === 'rejected')) context.warnings.push('Chưa tải đủ thông tin nhà cung cấp hoặc mã sản phẩm. Các thông tin thiếu được để trống.');
  }
  context.warnings = [...new Set(context.warnings)];
  return context;
}

export async function loadPhysicalStock(order) {
  const actualStock = {}, warnings = [];
  const ids = [...new Set((order.items || []).map((line) => line.variant?.id).filter(Boolean))];
  for (let offset = 0; offset < ids.length; offset += 4) {
    const results = await Promise.allSettled(ids.slice(offset, offset + 4).map(async (id) => {
      const batches = await allPages(inventoryService.batches, { variantId: id });
      const confirmed = batches.filter((batch) => batch.confirmed === true);
      if (confirmed.some((batch) => batch.quantityOnHand == null || !Number.isFinite(Number(batch.quantityOnHand)))) throw new Error('Thiếu số tồn lô');
      actualStock[id] = confirmed.reduce((sum, batch) => sum + Number(batch.quantityOnHand), 0);
    }));
    if (results.some((result) => result.status === 'rejected')) warnings.push('Không tải được một số tồn thực tế; các ô đó được để trống, không mặc định bằng 0.');
  }
  return { actualStock, warnings: [...new Set(warnings)] };
}
