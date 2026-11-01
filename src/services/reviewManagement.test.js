import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./api', () => ({ default: { get: vi.fn() }, unwrap: (r) => r.data.data }));
import api from './api';
import { reviewManagementService } from './admin/reviewManagementService';
beforeEach(() => vi.clearAllMocks());
it('sends ranking/date/sample filters to server instead of ranking one local page', async () => {
  api.get.mockResolvedValue({ data: { data: { content: [{ productCode: 'SP01', totalReviews: 80 }], totalElements: 90 } } });
  const params = { search: 'Chuối', sort: 'negative-rate', minReviews: 5, from: '2026-11-01', to: '2026-11-10', page: 2, size: 10 };
  const result = await reviewManagementService.products(params);
  expect(api.get).toHaveBeenCalledWith('/management/reviews/products', { params });
  expect(result.totalElements).toBe(90);
  expect(result.items[0].productCode).toBe('SP01');
});
it('combines star, sentiment and search filters in product detail', async () => {
  api.get.mockResolvedValue({ data: { data: { content: [] } } });
  const params = { rating: 2, sentiment: 'negative', search: 'giao hàng', page: 0, size: 10 };
  await reviewManagementService.reviews('p', params);
  expect(api.get).toHaveBeenCalledWith('/management/reviews/products/p/reviews', { params });
});
