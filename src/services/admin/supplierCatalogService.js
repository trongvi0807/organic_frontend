import { allPages } from '@/lib/apiData';
import { originService } from './managementService';

// The API has no /suppliers/{id}/products. Products belong to a supplier
// through their origin; use only the documented origin endpoints.
export async function supplierProducts(supplierId) {
  if (!supplierId) return [];
  const origins = await allPages(originService.list, { supplierId });
  const products = new Map();
  for (const origin of origins) {
    const rows = await allPages((params) => originService.products(origin.id, params));
    for (const product of rows) products.set(product.id, product);
  }
  return [...products.values()];
}
