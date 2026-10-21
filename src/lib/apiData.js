// Support both existing catalog items and the new management PageResponse.content.
export function normalizePage(data) {
  return { ...data, items: data?.content ?? data?.items ?? [] };
}
export async function allPages(list, params = {}) {
  const first = normalizePage(await list({ ...params, page: 0, size: 100 }));
  const items = [...first.items];
  for (let page = 1; page < (first.totalPages || 0); page++) {
    const next = normalizePage(await list({ ...params, page, size: 100 }));
    items.push(...next.items);
  }
  return items;
}
export function normalizeHomeProduct(item) {
  const price = item.defaultPrice ?? item.minPrice;
  return { ...item, productName: item.name, minPrice: price, unit: item.defaultVariantName,
    compareAtPrice: price != null && item.compareAtPrice > price ? item.compareAtPrice : null,
    badge: item.featured ? 'Nổi bật' : undefined };
}
export function internalHref(value, fallback = '/san-pham') {
  if (typeof value !== 'string' || !/^\/(?!\/)[^\s\\]*$/.test(value)) return fallback;
  return value.replace(/^\/products(?=[?#]|$)/, '/san-pham');
}
export const optional = (value) => value == null || String(value).trim() === '' ? null : String(value).trim();
export const dateText = (value) => value ? new Intl.DateTimeFormat('vi-VN').format(new Date(`${value.slice(0, 10)}T12:00:00`)) : 'Không đặt';
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function validateUpload(file, document = false) {
  const types = ['image/jpeg', 'image/png', 'image/webp', ...(document ? ['application/pdf'] : [])];
  if (!file || !types.includes(file.type)) throw new Error(document ? 'Chọn tệp PDF, JPEG, PNG hoặc WebP.' : 'Chọn ảnh JPEG, PNG hoặc WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Tệp không được vượt quá 5 MB.');
}
