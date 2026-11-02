import { catalogService } from './catalogService';
import { normalizeHomeProduct } from '@/lib/apiData';
import { sellableVariants } from '@/lib/productDetail';

// Reuse public product data; never store prices or product snapshots in the wishlist.
export async function loadFavoriteProducts(ids) {
  const results = new Array(ids.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(4, ids.length) }, async () => {
    while (cursor < ids.length) {
      const index = cursor++, id = ids[index];
      try {
        const detail = await catalogService.product(id);
        const variants = sellableVariants(detail);
        const first = variants.find((item) => item.id === detail.defaultVariantId) || variants[0];
        const image = detail.images?.find((item) => item.isPrimary) || detail.images?.[0];
        results[index] = { product: normalizeHomeProduct({ ...detail, imageUrl: image?.imageUrl,
          defaultVariantId: first?.id, defaultVariantName: first?.variantName, defaultPrice: first?.sellingPrice,
          compareAtPrice: first?.compareAtPrice }) };
      } catch (error) { results[index] = { id, unavailable: error.response?.status === 404 }; }
    }
  }));
  return {
    products: results.filter((item) => item.product).map((item) => item.product),
    unavailable: results.filter((item) => item.unavailable).map((item) => item.id),
    failed: results.filter((item) => !item.product && !item.unavailable).length,
  };
}
