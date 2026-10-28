import { adminDate } from './adminFormat';
// Support both existing catalog items and the new management PageResponse.content.
export function normalizePage(data) {
  return { ...data, items: data?.content ?? data?.items ?? [] };
}
export async function allPages(list, params = {}) {
  // Orders enforce a maximum of 50; shared admin loaders must respect that contract.
  const size = Number.isInteger(params.size) && params.size > 0 ? Math.min(params.size, 50) : 50;
  const first = normalizePage(await list({ ...params, page: 0, size }));
  const items = [...first.items];
  for (let page = 1; page < (first.totalPages || 0); page++) {
    const next = normalizePage(await list({ ...params, page, size }));
    items.push(...next.items);
  }
  return items;
}
export function normalizeHomeProduct(item) {
  const price = item.defaultPrice ?? item.minPrice;
  return { ...item, productName: item.name ?? item.productName, minPrice: price, unit: item.defaultVariantName ?? item.unit,
    organicVerified: item.organicVerified ?? item.organicClaimStatus === 'verified',
    compareAtPrice: price != null && item.compareAtPrice > price ? item.compareAtPrice : null,
    badge: item.featured ? 'Nổi bật' : undefined };
}
// Compatibility for an older catalog DTO which omits both the variant and compare-at price.
// A complete current catalog response remains authoritative, including a removed discount.
export function withHomePricing(product, home) {
  if (product.defaultVariantId != null || product.defaultPrice != null) return product;
  const card = [...(home?.featuredProducts || []), ...(home?.newProducts || []), ...(home?.certifiedProducts || [])].find((p) => p.id === product.id);
  return card ? { ...product, minPrice: card.minPrice, compareAtPrice: card.compareAtPrice, unit: card.unit,
    defaultVariantId: card.defaultVariantId, defaultPrice: card.defaultPrice, defaultVariantName: card.defaultVariantName } : product;
}
export function internalHref(value, fallback = '/san-pham') {
  if (typeof value !== 'string' || !/^\/(?!\/)[^\s\\]*$/.test(value)) return fallback;
  return value.replace(/^\/products(?=[?#]|$)/, '/san-pham');
}
export const optional = (value) => value == null || String(value).trim() === '' ? null : String(value).trim();
export const dateText = (value) => value ? adminDate(value) : 'Không đặt';
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function validateUpload(file, document = false) {
  const types = ['image/jpeg', 'image/png', 'image/webp', ...(document ? ['application/pdf'] : [])];
  if (!file || !types.includes(file.type)) throw new Error(document ? 'Chọn tệp PDF, JPEG, PNG hoặc WebP.' : 'Chọn ảnh JPEG, PNG hoặc WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Tệp không được vượt quá 5 MB.');
}
