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
  it('uses product-level eligibility and does not load purchases when already reviewed', async () => {
    api.get.mockResolvedValue({ data: { data: { canReview: false, message: 'Bạn đã đánh giá sản phẩm này.' } } });
    expect((await reviewService.eligibility('p')).canReview).toBe(false);
    expect(api.get).toHaveBeenCalledExactlyOnceWith('/reviews/eligibility', { params: { productId: 'p' } });
    expect(publicApi.get).not.toHaveBeenCalled();
  });
  it('only offers received order lines for the requested product and no active review', async () => {
    api.get.mockResolvedValueOnce({ data: { data: { canReview: true } } })
      .mockResolvedValueOnce({ data: { data: { content: [{ productId: 'p', orderDetailId: 'a', reviewCount: 0 }, { productId: 'other', reviewCount: 0 }], totalPages: 2 } } })
      .mockResolvedValueOnce({ data: { data: { content: [{ productId: 'p', orderDetailId: 'b', reviewCount: 0 }], totalPages: 2 } } });
    expect((await reviewService.eligibility('p')).purchases.map((p) => p.orderDetailId)).toEqual(['a', 'b']);
    expect(api.get).toHaveBeenLastCalledWith('/reviews/eligible-items', { params: { productId: 'p', page: 1, size: 50 } });
  });
  it('submits text without images and leaves title/ownership to backend', async () => {
    api.post.mockResolvedValue({ data: { data: { id: 'review-id' } } });
    await reviewService.submit('p', { rating: '5', title: 'forged', content: '  Sản phẩm rất tươi  ', orderDetailId: 'own-line', customerId: 'forged' });
    const [url, data, config] = api.post.mock.calls[0];
    expect(url).toBe('/reviews/submission');
    expect(JSON.parse(await data.get('review').text())).toEqual({ productId: 'p', orderDetailId: 'own-line', rating: 5, content: 'Sản phẩm rất tươi' });
    expect(data.getAll('files')).toHaveLength(0);
    expect(config.headers['Content-Type']).toBeUndefined();
  });
  it('sends optional media with initial review in a single submission', async () => {
    api.post.mockResolvedValue({ data: { data: { id: 'review-id' } } });
    const image = new Blob(['image'], { type: 'image/png' });
    await reviewService.submit('p', { rating: 5, content: 'Sản phẩm rất tươi', orderDetailId: 'line', files: [image] });
    expect(api.post).toHaveBeenCalledTimes(1);
    expect(api.post.mock.calls[0][1].getAll('files')[0].size).toBe(image.size);
  });
  it('preserves rejection so the form cannot report false success', async () => {
    const error = { response: { status: 409, data: { message: 'Bạn đã đánh giá sản phẩm này.' } } };
    api.post.mockRejectedValue(error);
    await expect(reviewService.submit('p', { rating: 5, content: 'Sản phẩm rất tươi', orderDetailId: 'line' })).rejects.toBe(error);
  });
});
