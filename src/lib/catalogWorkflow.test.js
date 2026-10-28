import { describe, expect, it, vi } from 'vitest';
import { saveCatalogWorkflow } from './catalogWorkflow';

const values = { productName: 'Cà rốt', productCode: 'MOC-RAU-ABC', categoryId: 'category', status: 'active' };
const price = { sku: 'MOC-RAU-ABC-01', variantName: 'Gói 1kg', unitId: 'kg', netQuantity: 1, sellingPrice: 60000 };
function services() {
  const calls = [];
  return {
    calls,
    products: {
      save: vi.fn(async (id, body) => { calls.push(['product', id, body.status]); return { id: id || 'p', status: body.status, variants: [] }; }),
      saveVariant: vi.fn(async (pid, id) => { calls.push(['price', pid, id]); return { id: id || 'v' }; }),
    },
    traceability: { setOrigin: vi.fn(async (pid, originId) => { calls.push(['origin', pid, originId]); }) },
  };
}
describe('Catalog multi-step save using documented APIs', () => {
  it('creates draft, price and supplier origin before activating a new product', async () => {
    const api = services(), state = { productId: null, variantId: null };
    await saveCatalogWorkflow({ values, price, originId: 'origin', state }, api);
    expect(api.calls).toEqual([['product', null, 'draft'], ['price', 'p', null], ['origin', 'p', 'origin'], ['product', 'p', 'active']]);
    expect(state).toEqual({ productId: 'p', variantId: 'v', currentStatus: 'active' });
  });
  it('does not activate a draft when the user requested draft', async () => {
    const api = services();
    await saveCatalogWorkflow({ values: { ...values, status: 'draft' }, price, originId: 'origin', state: {} }, api);
    expect(api.products.save).toHaveBeenCalledTimes(1);
  });
  it('retains confirmed IDs and reuses them after an origin failure', async () => {
    const api = services(), state = { productId: null, variantId: null };
    api.traceability.setOrigin.mockRejectedValueOnce(new Error('Gián đoạn kết nối'));
    await expect(saveCatalogWorkflow({ values, price, originId: 'origin', state }, api)).rejects.toThrow('Gián đoạn');
    expect(api.products.save).toHaveBeenCalledTimes(1);
    await saveCatalogWorkflow({ values, price, originId: 'origin', state }, api);
    expect(api.products.save.mock.calls.filter(([id]) => id == null)).toHaveLength(1);
    expect(api.products.saveVariant.mock.calls.map(([, id]) => id)).toEqual([null, 'v']);
    expect(api.products.save.mock.calls[1][1].status).toBe('draft');
  });
  it('recovers a variant whose POST succeeded but response was interrupted', async () => {
    const api = services(), state = { productId: null, variantId: null };
    api.products.saveVariant.mockRejectedValueOnce(new Error('Mất phản hồi'));
    await expect(saveCatalogWorkflow({ values, price, originId: 'origin', state }, api)).rejects.toThrow('Mất phản hồi');
    api.products.save.mockResolvedValueOnce({ id: 'p', status: 'draft', variants: [{ id: 'persisted-v', sku: price.sku }] });
    await saveCatalogWorkflow({ values, price, originId: 'origin', state }, api);
    expect(api.products.saveVariant).toHaveBeenLastCalledWith('p', 'persisted-v', price);
  });
  it('stops subsequent writes when an API omits a required ID', async () => {
    const api = services(); api.products.save.mockResolvedValue({ status: 'draft' });
    await expect(saveCatalogWorkflow({ values, price, originId: 'origin', state: {} }, api)).rejects.toThrow('mã định danh');
    expect(api.products.saveVariant).not.toHaveBeenCalled();
    expect(api.traceability.setOrigin).not.toHaveBeenCalled();
  });
});
