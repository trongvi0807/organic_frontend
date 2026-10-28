import { describe, expect, it } from 'vitest';
import { importCell, importHeaders, mapImportRows, prepareProductImport } from './productImport';
import { defaultProductRules } from './productRules';
const row = ['Cà rốt', 'RAU', 'NCC01', 'XX01', 'Gói 1kg', '1', 'kg', '60000', '70000', 'Đóng gói mới'];
const refs = { categories: [{ id: 'c', categoryCode: 'RAU', status: 'active', categoryName: 'Rau củ' }], suppliers: [{ id: 's', supplierCode: 'NCC01', status: 'active', supplierName: 'Nông trại A' }], origins: [{ id: 'o', originCode: 'XX01', supplierId: 's', status: 'active' }], existing: [], rules: defaultProductRules };
describe('Excel input validation', () => {
  it('accepts numeric/rich text but rejects formulas and cell errors', () => {
    expect(importCell(60000)).toBe('60000');
    expect(importCell({ richText: [{ text: 'Cà ' }, { text: 'rốt' }] })).toBe('Cà rốt');
    expect(() => importCell({ formula: 'SUM(A1:A2)', result: 2 })).toThrow('công thức');
    expect(() => importCell({ error: '#VALUE!' })).toThrow();
  });
  it('maps reordered headers without losing row numbers and rejects missing/duplicate headers', () => {
    const mapped = mapImportRows([[...importHeaders].reverse(), [...row].reverse(), [], row]);
    expect(mapped[0]).toEqual({ row: 2, cells: row }); expect(mapped[1].row).toBe(4);
    expect(() => mapImportRows([['Tên sản phẩm'], row])).toThrow('Thiếu cột');
    expect(() => mapImportRows([[...importHeaders, importHeaders[0]], row])).toThrow('trùng');
    expect(() => mapImportRows([importHeaders])).toThrow('Chưa có sản phẩm');
    expect(() => mapImportRows([importHeaders, ...Array.from({ length: 201 }, () => row)])).toThrow('200');
  });
  it('records a formula error on the affected row rather than accepting a cached result', () => {
    const parsed = mapImportRows([importHeaders, [...row.slice(0, 7), { formula: '100*2', result: 200 }, '', '']]);
    expect(parsed[0].errors[0]).toContain('công thức');
  });
  it('previews draft products with unique sequential codes and only documented fields', () => {
    const rows = prepareProductImport(mapImportRows([importHeaders, row, ['Táo', ...row.slice(1)]]), refs);
    expect(rows.map((item) => item.values.productCode)).toEqual(['SP01', 'SP02']);
    expect(rows[0].values).toMatchObject({ status: 'draft', organicClaimStatus: 'pending', categoryId: 'c' });
    expect(rows[0].values).not.toHaveProperty('supplierId'); expect(rows[0].originId).toBe('o');
    expect(rows[0].price).toMatchObject({ sellingPrice: 60000, netQuantity: 1, unitId: 'kg' });
  });
  it.each([
    [0, '', 'Tên sản phẩm'], [1, 'missing', 'Loại sản phẩm'], [2, 'missing', 'Nhà cung cấp'],
    [3, 'missing', 'Xuất xứ'], [5, '-1', 'Khối lượng'], [7, '-10', 'Giá bán'], [8, '50000', 'Giá gốc'],
  ])('identifies invalid input in column %s', (column, value, message) => {
    const values = [...row]; values[column] = value;
    expect(prepareProductImport(mapImportRows([importHeaders, values]), refs)[0].errors[0]).toContain(message);
  });
  it('rejects cross-supplier origins, inactive records and duplicate product names', () => {
    expect(prepareProductImport(mapImportRows([importHeaders, row]), { ...refs, origins: [{ ...refs.origins[0], supplierId: 'other' }] })[0].errors[0]).toContain('không thuộc');
    expect(prepareProductImport(mapImportRows([importHeaders, row]), { ...refs, suppliers: [{ ...refs.suppliers[0], status: 'inactive' }] })[0].errors[0]).toContain('chưa hoạt động');
    const duplicates = prepareProductImport(mapImportRows([importHeaders, row, [...row]]), refs);
    expect(duplicates[0].errors).toEqual([]); expect(duplicates[1].errors[0]).toContain('trùng');
  });
});
