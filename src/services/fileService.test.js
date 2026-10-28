import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('./api', () => ({ default: { get: vi.fn(), post: vi.fn() }, DEMO_MODE: false, getSession: vi.fn(() => ({ user: { id: 'user-1' } })), unwrap: (r) => r.data.data }));
import api, { getSession } from './api';
import { documentExportService, downloadFile, excelImportService, importAttempt } from './admin/fileService';

const sha = 'a'.repeat(64), file = new File(['xlsx'], 'don-mua.xlsx');
const response = (data) => ({ data: { data } });
let anchor;
beforeEach(() => {
  vi.clearAllMocks(); vi.useFakeTimers();
  anchor = { click: vi.fn(), remove: vi.fn() };
  vi.stubGlobal('document', { createElement: () => anchor, body: { append: vi.fn() } });
  vi.stubGlobal('sessionStorage', (() => { const data = new Map(); return { getItem: (k) => data.get(k), setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k) }; })());
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:document'); vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  api.get.mockResolvedValue({ data: new Blob(['file']), headers: {} });
});
afterEach(() => { vi.runOnlyPendingTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it.each([['products', '/admin/products'], ['purchase_orders', '/purchase-orders'], ['goods_receipts', '/goods-receipts']])('previews and confirms %s with the documented multipart contract', async (kind, path) => {
  api.post.mockResolvedValue(response({ fileSha256: sha, canImport: true }));
  await excelImportService.preview(kind, file);
  let [url, body, config] = api.post.mock.calls[0];
  expect(url).toBe(`${path}/import/preview`); expect([...body.keys()]).toEqual(['file']); expect(body.get('file')).toBe(file); expect(config.headers['Content-Type']).toBeUndefined();
  await excelImportService.execute(kind, file, sha, 'retry-key');
  [url, body, config] = api.post.mock.calls[1];
  expect(url).toBe(`${path}/import`); expect([...body.keys()]).toEqual(['file', 'fileSha256']); expect(body.get('fileSha256')).toBe(sha); expect(config.headers).toEqual({ 'Content-Type': undefined, 'Idempotency-Key': 'retry-key' });
});
it.each([['products', '/admin/products/import-template', undefined], ['purchase_orders', '/purchase-orders/import-template', undefined], ['goods_receipts', '/goods-receipts/import-template', { purchaseOrderId: 'po-1' }]])('downloads current %s templates with JWT-capable Axios and binary response', async (kind, path, params) => {
  await excelImportService.template(kind, params?.purchaseOrderId);
  expect(api.get).toHaveBeenCalledWith(path, { params, responseType: 'blob', timeout: 60000 });
  expect(anchor.click).toHaveBeenCalledTimes(1); expect(anchor.download).toBe(`${kind}-template.xlsx`);
});
it.each([['purchase', '/purchase-orders/id/pdf'], ['receipt', '/goods-receipts/id/pdf'], ['managementSale', '/management/orders/id/invoice'], ['customerSale', '/orders/id/invoice']])('downloads %s through the exact PDF endpoint', async (kind, path) => {
  await documentExportService[kind]('id'); expect(api.get).toHaveBeenCalledWith(path, expect.objectContaining({ responseType: 'blob' }));
  expect(URL.revokeObjectURL).not.toHaveBeenCalled(); vi.advanceTimersByTime(60000); expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:document');
});
it('rejects invalid files, missing receipt selection and confirmation without preview before any request', async () => {
  await expect(excelImportService.preview('purchase_orders', new File(['data'], 'data.xls'))).rejects.toThrow('.xlsx');
  await expect(excelImportService.preview('purchase_orders', new File([new Uint8Array(5242881)], 'big.xlsx'))).rejects.toThrow('5 MB');
  await expect(excelImportService.execute('purchase_orders', file, '', 'key')).rejects.toThrow('kiểm tra');
  expect(() => excelImportService.template('goods_receipts')).toThrow('Chọn đơn'); expect(api.post).not.toHaveBeenCalled(); expect(api.get).not.toHaveBeenCalled();
});
it('parses JSON errors received as blobs instead of downloading a corrupt document', async () => {
  const failure = { response: { status: 403, data: new Blob([JSON.stringify({ message: 'Không đủ quyền tải chứng từ.' })]) } };
  api.get.mockRejectedValue(failure); await expect(downloadFile('/orders/id/invoice', 'test.pdf')).rejects.toBe(failure);
  expect(failure.response.data.message).toBe('Không đủ quyền tải chứng từ.'); expect(anchor.click).not.toHaveBeenCalled();
});
it('uses server filenames and strips path separators', async () => {
  api.get.mockResolvedValue({ data: new Blob(['pdf']), headers: { 'content-disposition': "attachment; filename*=UTF-8''phieu%2Fnhap.pdf" } });
  await downloadFile('/goods-receipts/id/pdf', 'file.pdf'); expect(anchor.download).toBe('phieu_nhap.pdf');
});
it('keeps retry keys per account, kind and checksum, clearing only successful or rejected attempts', () => {
  importAttempt('purchase_orders', sha, { key: 'same-key' }); expect(importAttempt('purchase_orders', sha)).toEqual({ key: 'same-key' }); expect(importAttempt('goods_receipts', sha)).toBeNull();
  getSession.mockReturnValueOnce({ user: { id: 'user-2' } }); expect(importAttempt('purchase_orders', sha)).toBeNull();
  importAttempt('purchase_orders', sha, null); expect(importAttempt('purchase_orders', sha)).toBeNull();
});
