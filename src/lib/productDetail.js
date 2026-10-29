export const productHref = (product) => product.slug
  ? `/san-pham/${encodeURIComponent(product.slug)}`
  : `/san-pham/id/${encodeURIComponent(product.id)}`;

export function safeMediaUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  if (/^\/(?!\/)/.test(value) && !/[\\\s]/.test(value)) return value;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function productImages(product) {
  const seen = new Set();
  const images = [...(product.images || [])].sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  if (!images.length && product.imageUrl) images.push({ imageUrl: product.imageUrl, altText: product.productName });
  return images.flatMap((item, index) => {
    const url = safeMediaUrl(item.imageUrl);
    if (!url || seen.has(url)) return [];
    seen.add(url);
    return [{ id: item.id || `photo-${index}`, url, type: 'image', alt: item.altText || `${product.productName} — ảnh ${index + 1}` }];
  });
}

export function sellableVariants(product) {
  return (product.variants || []).filter((item) => item.status === 'active' && Number(item.sellingPrice) > 0 && Number(item.netQuantity) > 0)
    .sort((a, b) => Number(a.sellingPrice) - Number(b.sellingPrice));
}

export function variantDisplayName(variant) {
  if (!variant) return '';
  const name = String(variant.variantName || '').trim();
  const quantity = Number(variant.netQuantity);
  if (!Number.isFinite(quantity) || quantity <= 0 || !variant.unitId || /\d\s*(?:[.,]\d+)?\s*(?:kg|g|ml|l)\b/i.test(name)) return name;
  return `${name}${name ? ' · ' : ''}${quantity.toLocaleString('vi-VN')} ${variant.unitId}`;
}

export function reviewMedia(review) {
  const source = review.media ?? (review.images || []).map((item) => ({ ...item, url: item.imageUrl, type: 'image', alt: item.altText }));
  return source.flatMap((item, index) => {
    const url = safeMediaUrl(item.url ?? item.mediaUrl ?? item.imageUrl);
    const type = item.type ?? item.mediaType;
    if (!url || !['image', 'video'].includes(type)) return [];
    return [{ id: item.id || `media-${index}`, url, type, alt: item.alt || item.altText || 'Tệp đính kèm đánh giá', poster: safeMediaUrl(item.thumbnailUrl) }];
  });
}

// Client limits are deliberately within the backend's upload limits; the server validates files again.
export const REVIEW_UPLOAD_LIMITS = { images: 5, videos: 1, imageBytes: 5 * 1024 ** 2, videoBytes: 50 * 1024 ** 2, totalBytes: 75 * 1024 ** 2 };
const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const videoTypes = ['video/mp4', 'video/webm'];
export function validateReviewFiles(files) {
  let images = 0, videos = 0, total = 0;
  for (const file of files) {
    const image = imageTypes.includes(file.type), video = videoTypes.includes(file.type);
    if (!image && !video) throw new Error('Chỉ chọn ảnh JPEG, PNG, WebP hoặc video MP4, WebM.');
    if (!file.size) throw new Error('Tệp rỗng không thể xem trước.');
    if (file.size > (image ? REVIEW_UPLOAD_LIMITS.imageBytes : REVIEW_UPLOAD_LIMITS.videoBytes)) throw new Error(image ? 'Mỗi ảnh tối đa 5 MB.' : 'Mỗi video tối đa 50 MB.');
    images += Number(image); videos += Number(video); total += file.size;
  }
  if (images > REVIEW_UPLOAD_LIMITS.images || videos > REVIEW_UPLOAD_LIMITS.videos) throw new Error('Tối đa 5 ảnh và 1 video cho một đánh giá.');
  if (total > REVIEW_UPLOAD_LIMITS.totalBytes) throw new Error('Tổng dung lượng tệp tối đa 75 MB.');
}

export const reviewDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date) : '';
};
