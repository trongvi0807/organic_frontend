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
      uploadImage: vi.fn(async () => { calls.push(['image']); return {id:'photo'}; }),
      saveVariant: vi.fn(async (pid, id) => { calls.push(['price', pid, id]); return { id: id || 'v' }; }),
    },
    traceability: { setOrigin: vi.fn(async (pid, originId) => { calls.push(['origin', pid, originId]); }) },
  };
}
describe('Catalog multi-step save using documented APIs', () => {
  it('creates and activates a product without a supplier origin and never submits an empty origin ID', async () => {
    const api=services();
    await saveCatalogWorkflow({values:{...values},price,originId:'',state:{hasImage:true}},api);
    expect(api.products.save).toHaveBeenCalledTimes(2);
    expect(api.products.save.mock.calls.every(([,body])=>body.originId===null)).toBe(true);
    expect(api.products.saveVariant).toHaveBeenCalledOnce();
    expect(api.traceability.setOrigin).not.toHaveBeenCalled();
  });
  it('creates draft, price and supplier origin before activating a new product', async () => {
    const api = services(), state = { productId: null, variantId: null, hasImage:true };
    await saveCatalogWorkflow({ values, price, originId: 'origin', state }, api);
    expect(api.calls).toEqual([['product', null, 'draft'], ['price', 'p', null], ['origin', 'p', 'origin'], ['product', 'p', 'active']]);
    expect(state).toEqual({ productId: 'p', variantId: 'v', currentStatus: 'active', hasImage:true });
    expect(api.products.save.mock.calls.every(([, body]) => body.originId === 'origin')).toBe(true);
  });
  it('does not activate a draft when the user requested draft', async () => {
    const api = services();
    await saveCatalogWorkflow({ values: { ...values, status: 'draft' }, price, originId: 'origin', state: {hasImage:true} }, api);
    expect(api.products.save).toHaveBeenCalledTimes(1);
  });
  it('retains confirmed IDs and reuses them after an origin failure', async () => {
    const api = services(), state = { productId: null, variantId: null, hasImage:true };
    api.traceability.setOrigin.mockRejectedValueOnce(new Error('Gián đoạn kết nối'));
    await expect(saveCatalogWorkflow({ values, price, originId: 'origin', state }, api)).rejects.toThrow('Gián đoạn');
    expect(api.products.save).toHaveBeenCalledTimes(1);
    await saveCatalogWorkflow({ values, price, originId: 'origin', state }, api);
    expect(api.products.save.mock.calls.filter(([id]) => id == null)).toHaveLength(1);
    expect(api.products.saveVariant.mock.calls.map(([, id]) => id)).toEqual([null, 'v']);
    expect(api.products.save.mock.calls[1][1].status).toBe('draft');
  });
  it('recovers a variant whose POST succeeded but response was interrupted', async () => {
    const api = services(), state = { productId: null, variantId: null, hasImage:true };
    api.products.saveVariant.mockRejectedValueOnce(new Error('Mất phản hồi'));
    await expect(saveCatalogWorkflow({ values, price, originId: 'origin', state }, api)).rejects.toThrow('Mất phản hồi');
    api.products.save.mockResolvedValueOnce({ id: 'p', status: 'draft', variants: [{ id: 'persisted-v', sku: price.sku }] });
    await saveCatalogWorkflow({ values, price, originId: 'origin', state }, api);
    expect(api.products.saveVariant).toHaveBeenLastCalledWith('p', 'persisted-v', price);
  });
  it('stops subsequent writes when an API omits a required ID', async () => {
    const api = services(); api.products.save.mockResolvedValue({ status: 'draft' });
    await expect(saveCatalogWorkflow({ values, price, originId: 'origin', state: {hasImage:true} }, api)).rejects.toThrow('Chưa nhận được kết quả lưu sản phẩm');
    expect(api.products.saveVariant).not.toHaveBeenCalled();
    expect(api.traceability.setOrigin).not.toHaveBeenCalled();
  });
});

it('requires a selected image before creating any product record', async () => {
  const api = services();
  await expect(saveCatalogWorkflow({values, price, state:{}}, api)).rejects.toThrow('Vui lòng chọn ảnh');
  expect(api.products.save).not.toHaveBeenCalled();
});
it('uploads the selected photo before activation and reuses it on retry', async () => {
  const api = services(), state = {}, imageFile = new File(['photo'], 'carrot.png', {type:'image/png'});
  api.traceability.setOrigin.mockRejectedValueOnce(new Error('Mất kết nối'));
  await expect(saveCatalogWorkflow({values,price,imageFile,originId:'o',state},api)).rejects.toThrow();
  expect(api.products.save).toHaveBeenCalledTimes(1);
  expect(state.hasImage).toBe(true);
  await saveCatalogWorkflow({values,price,imageFile,originId:'o',state},api);
  expect(api.products.uploadImage).toHaveBeenCalledOnce();
  expect(api.calls.findIndex(c=>c[0]==='image')).toBeLessThan(api.calls.findIndex(c=>c[2]==='active'));
});
it('does not activate a product when image upload fails', async () => {
  const api=services();api.products.uploadImage.mockRejectedValue(new Error('Lỗi tải ảnh'));
  await expect(saveCatalogWorkflow({values,price,imageFile:{},state:{}},api)).rejects.toThrow('Lỗi tải ảnh');
  expect(api.products.save).toHaveBeenCalledTimes(1);
});
