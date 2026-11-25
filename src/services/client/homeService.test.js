import { beforeEach, describe, expect, it, vi } from 'vitest';
import { homeService } from './homeService';
import { publicApi } from '../api';
import { catalogService } from './catalogService';

vi.mock('../api', () => ({ DEMO_MODE: false, publicApi: { get: vi.fn() }, unwrap: value => value }));
vi.mock('./catalogService', () => ({ catalogService: { products: vi.fn() } }));

describe('homepage category images', () => {
  beforeEach(() => vi.resetAllMocks());

  it('gets an image for a category absent from the limited homepage product shelves', async () => {
    publicApi.get.mockResolvedValue({ categories: [{ id: 'drinks', name: 'Đồ uống', productCount: 1 }] });
    catalogService.products.mockResolvedValue({ items: [{ imageUrl: 'https://example.com/juice.jpg' }] });
    const home = await homeService.get();
    expect(catalogService.products).toHaveBeenCalledWith({ categoryId: 'drinks', includeDescendants: false, size: 1 });
    expect(home.categories[0].imageUrl).toBe('https://example.com/juice.jpg');
  });

  it('reuses a category or product image without additional requests', async () => {
    publicApi.get.mockResolvedValue({
      categories: [{ id: 'rice', imageUrl: 'https://example.com/rice.jpg' }, { id: 'drinks' }],
      newProducts: [{ id: 'juice', categoryId: 'drinks', imageUrl: 'https://example.com/juice.jpg' }],
    });
    const home = await homeService.get();
    expect(home.categories.map(item => item.imageUrl)).toEqual(['https://example.com/rice.jpg', 'https://example.com/juice.jpg']);
    expect(catalogService.products).not.toHaveBeenCalled();
  });

  it('keeps homepage content available when a category image lookup fails', async () => {
    publicApi.get.mockResolvedValue({ categories: [{ id: 'drinks', name: 'Đồ uống', productCount: 1 }] });
    catalogService.products.mockRejectedValue(new Error('Unavailable'));
    const home = await homeService.get();
    expect(home.categories).toEqual([{ id: 'drinks', name: 'Đồ uống', productCount: 1 }]);
  });
});
