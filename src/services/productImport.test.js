import { readFileSync } from 'node:fs';
import ExcelJS from 'exceljs';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./api', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() }, DEMO_MODE: false, unwrap: (r) => r.data.data }));
import api from './api';
import { readProductWorkbook, importProductRow } from './admin/productImportService';
import { importHeaders } from '@/lib/productImport';
const response = (data) => ({ data: { data } });
beforeEach(() => vi.clearAllMocks());
it('reads a real Excel workbook using the shipped template, preserving typed prices and UTF-8 labels', async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(readFileSync('public/templates/moc-san-pham-mau.xlsx'));
  expect(workbook.getWorksheet('SanPham').getRow(1).values.slice(1)).toEqual(importHeaders);
  workbook.getWorksheet('SanPham').getRow(2).values = ['Cà rốt', 'RAU', 'NCC01', 'XX01', 'Gói 1kg', 1, 'kg', 60000, null, 'Nguồn gốc rõ ràng'];
  const file = new File([await workbook.xlsx.writeBuffer()], 'san-pham.xlsx');
  const rows = await readProductWorkbook(file);
  expect(rows).toHaveLength(1); expect(rows[0].cells).toEqual(['Cà rốt', 'RAU', 'NCC01', 'XX01', 'Gói 1kg', '1', 'kg', '60000', '', 'Nguồn gốc rõ ràng']);
});
it('rejects wrong type, oversized or corrupt files before mutation', async () => {
  await expect(readProductWorkbook(new File(['bad'], 'old.xls'))).rejects.toThrow('.xlsx');
  await expect(readProductWorkbook(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.xlsx'))).rejects.toThrow('5 MB');
  await expect(readProductWorkbook(new File(['corrupt'], 'bad.xlsx'))).rejects.toThrow('Excel');
  expect(api.post).not.toHaveBeenCalled();
});
it('imports through existing APIs, allocates the next code from current data and never writes stock', async () => {
  api.get.mockResolvedValue(response({ content: [{ id: 'other', productCode: 'SP08', productName: 'Táo' }], totalPages: 1 }));
  api.post.mockImplementation(async (url) => response(url.endsWith('/variants') ? { id: 'v' } : { id: 'p', status: 'draft', variants: [] }));
  api.put.mockResolvedValue(response({}));
  const row = { values: { productCode: 'SP01', productName: 'Cà rốt', slug: 'ca-rot', categoryId: 'c', brandId: null, description: '', status: 'draft', organicClaimStatus: 'pending', certificationIds: [] }, price: { sku: 'SP01-01', variantName: 'Gói 1kg', netQuantity: 1, unitId: 'kg', sellingPrice: 60000 }, originId: 'origin', state: { productId: null, variantId: null, currentStatus: 'draft' } };
  await importProductRow(row);
  expect(api.post).toHaveBeenCalledWith('/admin/products', expect.objectContaining({ productCode: 'SP09', status: 'draft' }));
  expect(api.post).toHaveBeenCalledWith('/admin/products/p/variants', expect.objectContaining({ sku: 'SP09-01', sellingPrice: 60000 }));
  expect(api.put).toHaveBeenCalledWith('/products/p/origin', { originId: 'origin' });
  expect([...api.post.mock.calls, ...api.put.mock.calls].some(([url]) => /inventory|batches|receipts/.test(url))).toBe(false);
  expect(row.state).toMatchObject({ productId: 'p', variantId: 'v' });
});
