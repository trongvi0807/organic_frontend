import { publicApi as api, DEMO_MODE, unwrap } from '../api';
import { demoPage, demoList } from '../demoStore';
import { normalizePage } from '@/lib/apiData';
import { normalizeHomeProduct } from '@/lib/apiData';

function demoDetail(item) {
  if (!item) { const error = new Error('Sản phẩm không tồn tại hoặc đã ngừng bán.'); error.response = { status: 404 }; throw error; }
  const variantId = `${item.id}-default`;
  return { ...item, images: item.images || [{ id: `${item.id}-photo`, imageUrl: item.imageUrl, altText: item.productName, isPrimary: true, sortOrder: 0 }],
    variants: [{ id: variantId, variantName: item.unit || 'Một gói', sku: item.productCode, netQuantity: 1, sellingPrice: item.minPrice, compareAtPrice: item.compareAtPrice, status: 'active' }],
    defaultVariantId: variantId, canAddToCart: item.stock !== 0, checkoutAvailable: false, organicVerified: item.organicClaimStatus === 'verified',
    certifications: [], quantityRule: { mode: 'whole_package', minimum: 1, step: 1 }, reviewSummary: { totalReviews: 0, averageRating: null, distribution: [5,4,3,2,1].map((rating) => ({ rating, count: 0 })) },
    relatedProducts: demoPage('products', { categoryId: item.categoryId, size: 100 }, true).items.filter((other) => other.id !== item.id).slice(0, 8) };
}

export const catalogService = {
  async products(params) {
    const result = DEMO_MODE ? demoPage('products', params, true) : normalizePage(unwrap(await api.get('/products', { params })));
    return { ...result, items: result.items.map(normalizeHomeProduct) };
  },
  async product(id) { return DEMO_MODE ? demoDetail(demoList('products').find((item) => item.id === id && item.status === 'active')) : unwrap(await api.get(`/products/${encodeURIComponent(id)}`)); },
  async productBySlug(slug) { return DEMO_MODE ? demoDetail(demoList('products').find((item) => item.slug === slug && item.status === 'active')) : unwrap(await api.get(`/products/slug/${encodeURIComponent(slug)}`)); },
  async category(id) { return DEMO_MODE ? demoList('categories').find((item) => item.id === id) : unwrap(await api.get(`/categories/${encodeURIComponent(id)}`)); },
  async related(id) {
    if (DEMO_MODE) return (await this.product(id)).relatedProducts;
    return unwrap(await api.get(`/products/${encodeURIComponent(id)}/related`)).map(normalizeHomeProduct);
  },
  async categories(params) { return DEMO_MODE ? demoPage('categories', params, true) : normalizePage(unwrap(await api.get('/categories', { params }))); },
};
