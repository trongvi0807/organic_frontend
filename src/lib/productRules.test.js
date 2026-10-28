import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultProductRules, duplicateProduct, generateProductCode, readProductRules, receiptLineErrors, saveProductRules } from './productRules';

describe('Category-first codes and duplicate detection', () => {
  it('requires a category, embeds an identifiable prefix and fits the API code limit', () => {
    expect(generateProductCode(null)).toBe('');
    const code = generateProductCode({ id: 'c', categoryName: 'Rau củ' });
    expect(code).toBe('SP01');
    expect(code.length).toBeLessThanOrEqual(64);
    expect(generateProductCode({ id: 'c', categoryName: 'Rau củ' }, defaultProductRules, [{ productCode: 'SP01' }, { productCode: 'SP09' }])).toBe('SP10');
  });
  it('finds duplicate names/codes with accents, case, whitespace and ignores the edited ID', () => {
    const row = { id: '1', productName: 'Cà rốt hữu cơ', productCode: 'MOC-RAU-1' };
    expect(duplicateProduct([row], { productName: '  CA  ROT HUU CO ', productCode: 'new' })).toBe(row);
    expect(duplicateProduct([row], { productName: 'Tên khác', productCode: 'moc-rau-1' })).toBe(row);
    expect(duplicateProduct([row], row, '1')).toBeUndefined();
  });
});
describe('Local product conventions', () => {
  beforeEach(() => {
    const storage = new Map();
    vi.stubGlobal('localStorage', { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) });
  });
  afterEach(() => vi.unstubAllGlobals());
  it('persists valid defaults for subsequent forms', () => {
    saveProductRules({ ...defaultProductRules, codePrefix: 'OC', defaultQuantity: '0.5' });
    expect(readProductRules()).toEqual({ ...defaultProductRules, codePrefix: 'OC', defaultQuantity: 0.5 });
  });
  it.each([
    { units: 'kg' }, { defaultUnit: 'oz' }, { defaultPackage: 'Không có' },
    { defaultQuantity: '0' }, { defaultQuantity: '0.0001' }, { defaultQuantity: '1000000000' },
    { units: ['x'.repeat(21)] }, { codePrefix: 'Mã sai' }, { packages: [null] },
  ])('rejects invalid conventions instead of breaking forms: %j', (invalid) => {
    expect(() => saveProductRules({ ...defaultProductRules, ...invalid })).toThrow();
  });
  it('recovers from corrupted or incompatible local storage', () => {
    localStorage.setItem('moc.admin.product-rules.v2', '{broken');
    expect(readProductRules()).toEqual(defaultProductRules);
    localStorage.setItem('moc.admin.product-rules.v2', JSON.stringify({ units: 'broken' }));
    expect(readProductRules()).toEqual(defaultProductRules);
  });
});
describe('Immediate receipt and batch errors', () => {
  const good = { quantityOrdered: 10, quantityReceived: 10, quantityRejected: 0, discrepancyReason: '', batchCode: 'LOT-1', manufactureDate: '2026-10-25', expiryDate: '2026-11-25' };
  const day = '2026-10-26';
  it('accepts a valid full receipt', () => expect(receiptLineErrors(good, day)).toEqual({}));
  it.each(['', '-1', '1.5', 'abc'])('flags invalid quantity %s immediately', (quantityReceived) => {
    expect(receiptLineErrors({ ...good, quantityReceived }, day).quantityReceived).toBeTruthy();
  });
  it('rejects received + rejected over the ordered amount and requires discrepancy reasons', () => {
    expect(receiptLineErrors({ ...good, quantityRejected: 1 }, day).quantityReceived).toContain('vượt');
    expect(receiptLineErrors({ ...good, quantityReceived: 8, quantityRejected: 2 }, day).discrepancyReason).toBeTruthy();
    expect(receiptLineErrors({ ...good, quantityReceived: 8, quantityRejected: 2, discrepancyReason: 'Hai gói hỏng' }, day)).toEqual({});
  });
  it('flags missing lot, expired lot, future production and production after expiry', () => {
    expect(receiptLineErrors({ ...good, batchCode: '' }, day).batchCode).toBeTruthy();
    expect(receiptLineErrors({ ...good, expiryDate: '2026-10-25' }, day).expiryDate).toBeTruthy();
    expect(receiptLineErrors({ ...good, manufactureDate: '2026-10-27' }, day).manufactureDate).toBeTruthy();
    expect(receiptLineErrors({ ...good, manufactureDate: '2026-10-25', expiryDate: '2026-10-24' }, day).manufactureDate).toBeTruthy();
  });
  it('does not require a batch for completely rejected goods', () => {
    expect(receiptLineErrors({ ...good, quantityReceived: 0, quantityRejected: 10, discrepancyReason: 'Hỏng', batchCode: '', expiryDate: '', manufactureDate: '' }, day)).toEqual({});
  });
});
