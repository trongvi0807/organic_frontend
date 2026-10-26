import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./api', () => ({ default: { get: vi.fn(), post: vi.fn() }, publicApi: { get: vi.fn() }, DEMO_MODE: false, unwrap: (response) => response.data.data }));
import api, { publicApi } from './api';
import { catalogService } from './client/catalogService';
import { reviewService, REVIEW_WRITE_AVAILABLE } from './client/reviewService';

beforeEach(() => vi.clearAllMocks());
describe('Public product-detail API contracts', () => {
  it('preserves catalog discounts and normalizes the default variant exactly like Home cards', async () => {
    publicApi.get.mockResolvedValue({data:{data:{content:[{id:'p',productName:'Rau',defaultVariantId:'v',defaultVariantName:'Gói 500g',defaultPrice:28000,minPrice:28000,compareAtPrice:32000}],totalElements:1}}});
    const result=await catalogService.products({page:0,size:8});
    expect(result.items[0]).toMatchObject({minPrice:28000,compareAtPrice:32000,unit:'Gói 500g',defaultVariantId:'v'});
    expect(result.totalElements).toBe(1);
  });
  it('reads the full detail DTO through the slug endpoint', async () => {
    publicApi.get.mockResolvedValue({ data: { data: { id: 'p', images: [], variants: [] } } });
    expect((await catalogService.productBySlug('ca-rot')).id).toBe('p');
    expect(publicApi.get).toHaveBeenCalledWith('/products/slug/ca-rot');
  });
  it('adapts related Home cards without discarding public verification', async () => {
    publicApi.get.mockResolvedValue({ data: { data: [{ id: 'r', name: 'Rau', defaultPrice: 28000, organicVerified: true }] } });
    expect((await catalogService.related('p'))[0]).toMatchObject({ productName: 'Rau', minPrice: 28000, organicVerified: true });
    expect(publicApi.get).toHaveBeenCalledWith('/products/p/related');
  });
  it('keeps summary separate from filtered pagination and sends the exact rating/sort parameters', async () => {
    const summary = { totalReviews: 18, averageRating: 4.2 };
    publicApi.get.mockResolvedValue({ data: { data: { summary, reviews: { content: [{ id: 'r', rating: 5 }], totalElements: 1 } } } });
    const params = { page: 0, size: 6, rating: 5, sort: 'highest' };
    const data = await reviewService.list('p', params);
    expect(data.summary).toEqual(summary);
    expect(data.reviews.items).toHaveLength(1);
    expect(publicApi.get).toHaveBeenCalledWith('/products/p/reviews', { params });
    expect(REVIEW_WRITE_AVAILABLE).toBe(true);
  });
  it('checks purchase eligibility through the authenticated client', async () => {
    api.get.mockResolvedValue({ data: { data: { content:[], totalPages:0 } } });
    expect((await reviewService.eligibility('p')).canReview).toBe(false);
    expect(api.get).toHaveBeenCalledWith('/reviews/eligible-items', { params: { page:0, size:100 } });
    expect(publicApi.get).not.toHaveBeenCalled();
  });
  it('uses the eligible order detail from backend, ignoring forged ownership fields', async () => {
    api.get.mockResolvedValue({ data:{data:{content:[{orderDetailId:'own-order-detail',productId:'p',reviewCount:0}],totalPages:1}} });
    api.post.mockResolvedValue({ data: { data: { id: 'review-id', productId: 'p' } } });
    expect(await reviewService.submit('p', { rating: 5, title: '  Tươi  ', content: '  Sản phẩm rất tươi  ', customerId: 'forged', verifiedPurchase: true, orderDetailId: 'other-order' }))
      .toEqual({ id: 'review-id', productId: 'p' });
    expect(api.post).toHaveBeenCalledWith('/reviews', { orderDetailId: 'own-order-detail', rating: 5, title: 'Tươi', content: 'Sản phẩm rất tươi' });
  });
  it('preserves a forbidden response and its message for the form instead of fabricating success', async () => {
    api.get.mockResolvedValue({ data:{data:{content:[{orderDetailId:'own-order-detail',productId:'p',reviewCount:0}],totalPages:1}} });
    const error = { response: { status: 403, data: { message: 'Bạn cần mua và nhận sản phẩm này trước khi có thể đánh giá' } } };
    api.post.mockRejectedValue(error);
    await expect(reviewService.submit('p', { rating: 5, content: 'Chưa mua sản phẩm' })).rejects.toBe(error);
  });
  it('uploads attachments with the authenticated client without setting a multipart boundary', async () => {
    api.post.mockResolvedValue({ data: { data: { id: 'review-id', media: [{ id: 'image-id' }] } } });
    const image = new Blob(['image'], { type: 'image/png' });
    expect((await reviewService.uploadMedia('review-id', image)).media).toHaveLength(1);
    const [url, body, config] = api.post.mock.calls[0];
    expect(url).toBe('/reviews/review-id/media');
    expect(body.get('file').size).toBe(image.size);
    expect(config).toEqual({ timeout: 120000, headers: { 'Content-Type': undefined } });
  });
});
