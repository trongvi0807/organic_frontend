import { publicApi as api, DEMO_MODE, unwrap } from '../api';
import { demoPage, demoList } from '../demoStore';
import { allPages, normalizePage } from '@/lib/apiData';
import { normalizeHomeProduct } from '@/lib/apiData';

const availabilityCache = new Map(), availabilityFlight = new Map();
const availabilityQueue = [];
let runningAvailability = 0, categoryFlight, categoryCache, categoryGeneration = 0;
export function invalidateCategoryTree() { categoryGeneration += 1; categoryCache = null; categoryFlight = null; }
function drainAvailability() {
  while (runningAvailability < 3 && availabilityQueue.length) {
    runningAvailability += 1;
    const { task, resolve, reject } = availabilityQueue.shift();
    Promise.resolve().then(task).then(resolve, reject).finally(() => { runningAvailability -= 1; drainAvailability(); });
  }
}

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
  async categoryTree() {
    if (categoryCache && Date.now() - categoryCache.savedAt < 30000) return categoryCache.items;
    if (!categoryFlight) {
      const generation = categoryGeneration;
      const pending = allPages((params) => catalogService.categories(params)).then((items) => {
        if (generation === categoryGeneration) categoryCache = { items, savedAt: Date.now() };
        return items;
      }).finally(() => { if (categoryFlight === pending) categoryFlight = null; });
      categoryFlight = pending;
    }
    return categoryFlight;
  },
  async availability(id, { fresh = false } = {}) {
    if (DEMO_MODE) {
      const detail = await this.product(id);
      return { productId: id, availableQuantity: { [detail.defaultVariantId]: detail.stock }, checkedAt: null };
    }
    const cached = availabilityCache.get(id);
    if (!fresh && cached && Date.now() - cached.savedAt < 15000) return cached.data;
    if (!availabilityFlight.has(id)) {
      const pending = new Promise((resolve, reject) => { availabilityQueue.push({ resolve, reject, task: async () => {
        const data = unwrap(await api.get(`/products/${encodeURIComponent(id)}/availability`));
        if (data?.productId !== id || !data.availableQuantity || typeof data.availableQuantity !== 'object') throw new Error('Chưa nhận được số lượng khả dụng của sản phẩm.');
        if (availabilityCache.size >= 128) availabilityCache.delete(availabilityCache.keys().next().value);
        availabilityCache.set(id, { data, savedAt: Date.now() }); return data;
      } }); drainAvailability(); });
      availabilityFlight.set(id, pending);
      pending.finally(() => { availabilityFlight.delete(id); }).catch(() => {});
    }
    return availabilityFlight.get(id);
  },
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
