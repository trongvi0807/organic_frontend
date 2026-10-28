import { beforeEach, expect, it, vi } from 'vitest';
import contract from '../../docs/api-contract.json';
vi.mock('./api', () => ({ default: { get: vi.fn() }, DEMO_MODE: false, unwrap: (r) => r.data.data }));
import api from './api';
import { supplierProducts } from './admin/supplierCatalogService';
const response = (content, totalPages = 1) => ({ data: { data: { content, totalPages } } });
beforeEach(() => vi.clearAllMocks());
it('loads all origin and product pages, deduplicates, and only calls documented routes', async () => {
  api.get.mockImplementation(async (url, { params }) => {
    if (url === '/origins') {
      expect(params.supplierId).toBe('supplier');
      return response(params.page === 0 ? [{ id: 'o1' }] : [{ id: 'o2' }], 2);
    }
    if (url === '/origins/o1/products') return response(params.page === 0 ? [{ id: 'p1' }] : [{ id: 'p2' }], 2);
    if (url === '/origins/o2/products') return response([{ id: 'p2' }, { id: 'p3' }]);
    throw new Error(`Unexpected route: ${url}`);
  });
  expect((await supplierProducts('supplier')).map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
  expect(api.get).toHaveBeenCalledTimes(5);
  for (const [url, { params }] of api.get.mock.calls) {
    const endpoint = contract.endpoints.find((e) => e.method === 'GET' && new RegExp('^' + e.path.replace('/api/v1', '').replace(/\{[^}]+\}/g, '[^/]+') + '$').test(url));
    expect(endpoint, url).toBeTruthy();
    expect(Object.keys(params).filter((key) => !endpoint.parameters.some((p) => p.name === key))).toEqual([]);
    expect(url).not.toContain('/suppliers/');
  }
});
it('makes no request when no supplier is selected', async () => {
  expect(await supplierProducts('')).toEqual([]);
  expect(api.get).not.toHaveBeenCalled();
});
it('treats a supplier without origins as empty, without falling back to unrelated stock', async () => {
  api.get.mockResolvedValue(response([]));
  expect(await supplierProducts('supplier')).toEqual([]);
  expect(api.get).toHaveBeenCalledTimes(1);
});
it('propagates errors instead of silently showing a partial supplier catalog', async () => {
  api.get.mockImplementation(async (url) => {
    if (url === '/origins') return response([{ id: 'o1' }, { id: 'o2' }]);
    if (url === '/origins/o1/products') return response([{ id: 'p1' }]);
    throw new Error('Không tải được xuất xứ thứ hai');
  });
  await expect(supplierProducts('supplier')).rejects.toThrow('Không tải được xuất xứ thứ hai');
});
