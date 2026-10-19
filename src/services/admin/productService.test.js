import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../api', () => ({ default: { post: vi.fn(), put: vi.fn(), get: vi.fn(), delete: vi.fn() }, DEMO_MODE: false, unwrap: (response) => response.data.data }));
import api from '../api';
import { productService } from './productService';
import { categoryService } from './categoryService';
beforeEach(() => vi.clearAllMocks());

describe('Backend API contract', () => {
  it('sends only ProductRequest fields; preserves brand and certifications', async () => {
    api.put.mockResolvedValue({ data: { data: { id: 'p1' } } });
    await productService.save('p1', { productName: 'Rau', productCode: 'RAU', slug: 'rau', categoryId: 'c1', brandId: 'brand', certificationIds: ['cert'], description: 'Mô tả', status: 'active', organicClaimStatus: 'verified', minPrice: 999, stock: 20, imageUrl: 'photo.jpg' });
    expect(api.put).toHaveBeenCalledWith('/admin/products/p1', { productName: 'Rau', productCode: 'RAU', slug: 'rau', categoryId: 'c1', brandId: 'brand', certificationIds: ['cert'], description: 'Mô tả', status: 'active', organicClaimStatus: 'verified' });
  });
  it('unwraps the paginated API envelope without inventing stock', async () => {
    const data = { items: [{ id: 'p1', minPrice: 50000 }], page: 0, totalElements: 1 };
    api.get.mockResolvedValue({ data: { data } });
    const result = await productService.list({ categoryId: 'c1', page: 0 });
    expect(api.get).toHaveBeenCalledWith('/admin/products', { params: { categoryId: 'c1', page: 0 } });
    expect(result).toEqual(data);
    expect(result.items[0].stock).toBeUndefined();
  });
  it('sends null for an empty parent ID in CategoryRequest', async () => {
    api.post.mockResolvedValue({ data: { data: { id: 'c2' } } });
    await categoryService.save(null, { categoryCode: 'NEW', categoryName: 'Mới', description: '', status: 'active', parentId: '', image: 'demo-only' });
    expect(api.post).toHaveBeenCalledWith('/admin/categories', { categoryCode: 'NEW', categoryName: 'Mới', description: '', status: 'active', parentId: null });
  });
});
