import { traceabilityService } from './managementService';
import { receiptOriginText } from '@/lib/receiptDefaults';

// Fetch each product once, including multiple package sizes, without requesting an entire catalog.
export async function loadReceiptOrigins(items = []) {
  const products = [...new Map(items.filter((item) => item.variant?.productId)
    .map((item) => [item.variant.productId, item.variant.productName])).entries()];
  const byProductId = {}, failed = [];
  let index = 0;
  await Promise.all(Array.from({ length: Math.min(4, products.length) }, async () => {
    while (index < products.length) {
      const [id, name] = products[index++];
      try { byProductId[id] = receiptOriginText((await traceabilityService.get(id)).origin); }
      catch { failed.push(name || 'Sản phẩm chưa có tên'); }
    }
  }));
  return { byProductId, failed };
}
