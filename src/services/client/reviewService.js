import api, { publicApi, DEMO_MODE, unwrap } from '../api';
import { normalizePage } from '@/lib/apiData';
import { requireBackend } from '../backendGuard';

export const REVIEW_WRITE_AVAILABLE = true;
export const reviewService = {
  async mine(params) { requireBackend(); return normalizePage(unwrap(await api.get('/reviews/me', { params }))); },
  async eligibleItems(params) { requireBackend(); return normalizePage(unwrap(await api.get('/reviews/eligible-items', { params }))); },
  async get(id) { requireBackend(); return unwrap(await api.get(`/reviews/${encodeURIComponent(id)}`)); },
  async remove(id) { requireBackend(); return unwrap(await api.delete(`/reviews/${encodeURIComponent(id)}`)); },
  async list(productId, params) {
    if (DEMO_MODE) return { summary: { totalReviews: 0, averageRating: null, distribution: [5,4,3,2,1].map((rating) => ({ rating, count: 0 })) }, reviews: normalizePage({ content: [], page: params.page || 0, size: params.size || 6, totalElements: 0, totalPages: 0 }) };
    const data = unwrap(await publicApi.get(`/products/${encodeURIComponent(productId)}/reviews`, { params }));
    return { ...data, reviews: normalizePage(data.reviews) };
  },
  async eligibility(productId) {
    requireBackend();
    const eligibility = unwrap(await api.get('/reviews/eligibility', { params: { productId } }));
    if (!eligibility.canReview) return { ...eligibility, purchases: [] };
    const purchases = [];
    for (let page = 0; ; page++) {
      const result = await this.eligibleItems({ productId, page, size: 50 });
      purchases.push(...result.items.filter((item) => item.productId === productId && Number(item.reviewCount || 0) === 0));
      if (page + 1 >= (result.totalPages || 1)) break;
    }
    return { ...eligibility, canReview: purchases.length > 0, purchases };
  },
  async submit(productId, { rating, content, orderDetailId, files = [] }) {
    requireBackend();
    const data = new FormData();
    data.append('review', new Blob([JSON.stringify({ productId, orderDetailId, rating: Number(rating), content: content.trim() })], { type: 'application/json' }));
    files.forEach((file) => data.append('files', file));
    return unwrap(await api.post('/reviews/submission', data, { timeout: 180000, headers: { 'Content-Type': undefined } }));
  },
};
