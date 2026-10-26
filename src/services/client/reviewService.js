import api, { publicApi, DEMO_MODE, unwrap } from '../api';
import { normalizePage } from '@/lib/apiData';
import { requireBackend } from '../backendGuard';

export const REVIEW_WRITE_AVAILABLE = true;
export const reviewService = {
  async mine(params) { requireBackend(); return normalizePage(unwrap(await api.get('/reviews/me', { params }))); },
  async eligibleItems(params) { requireBackend(); return normalizePage(unwrap(await api.get('/reviews/eligible-items', { params }))); },
  async get(id) { requireBackend(); return unwrap(await api.get(`/reviews/${encodeURIComponent(id)}`)); },
  async update(id, values) { requireBackend(); return unwrap(await api.put(`/reviews/${encodeURIComponent(id)}`, { rating: Number(values.rating), title: values.title.trim() || null, content: values.content.trim() || null })); },
  async remove(id) { requireBackend(); return unwrap(await api.delete(`/reviews/${encodeURIComponent(id)}`)); },
  async updateMedia(id, mediaId, values) { requireBackend(); return unwrap(await api.patch(`/reviews/${encodeURIComponent(id)}/media/${encodeURIComponent(mediaId)}`, { altText: values.altText.trim() || null, sortOrder: Number(values.sortOrder) })); },
  async removeMedia(id, mediaId) { requireBackend(); return unwrap(await api.delete(`/reviews/${encodeURIComponent(id)}/media/${encodeURIComponent(mediaId)}`)); },
  async list(productId, params) {
    if (DEMO_MODE) return { summary: { totalReviews: 0, averageRating: null, distribution: [5,4,3,2,1].map((rating) => ({ rating, count: 0 })) }, reviews: normalizePage({ content: [], page: params.page || 0, size: params.size || 6, totalElements: 0, totalPages: 0 }) };
    const data = unwrap(await publicApi.get(`/products/${encodeURIComponent(productId)}/reviews`, { params }));
    return { ...data, reviews: normalizePage(data.reviews) };
  },
  async eligibility(productId) {
    requireBackend();
    // The PDF exposes eligible-items, not a product-level eligibility endpoint.
    for (let page = 0; ; page++) {
      const result = await this.eligibleItems({ page, size: 100 });
      const purchase = result.items.find((item) => item.productId === productId && Number(item.reviewCount || 0) === 0);
      if (purchase) return { canReview: true, purchase };
      if (page + 1 >= (result.totalPages || 1)) return { canReview: false, message: 'Chưa có sản phẩm đã nhận đủ điều kiện đánh giá. Xem các đánh giá đã gửi tại Đánh giá của tôi.' };
    }
  },
  async submit(productId, { rating, title, content }) {
    requireBackend();
    const eligibility = await this.eligibility(productId);
    if (!eligibility.canReview || !eligibility.purchase?.orderDetailId) throw new Error(eligibility.message || 'Chưa có chi tiết đơn hàng đủ điều kiện đánh giá.');
    return unwrap(await api.post('/reviews', { orderDetailId: eligibility.purchase.orderDetailId, rating: Number(rating), title: title?.trim() || null, content: content?.trim() || null }));
  },
  async uploadMedia(reviewId, file) {
    requireBackend();
    const data = new FormData(); data.append('file', file);
    return unwrap(await api.post(`/reviews/${encodeURIComponent(reviewId)}/media`, data,
      { timeout: 120000, headers: { 'Content-Type': undefined } }));
  },
};
