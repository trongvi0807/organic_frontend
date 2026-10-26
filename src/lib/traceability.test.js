import { describe, expect, it } from 'vitest';
import { certificateState, comparisonVariants, traceabilityDate, variantMeasurement } from './traceability';

const small = { id: 'small', variantName: 'Hộp 250g', netQuantity: 250, unitId: 'g', sellingPrice: 30000, status: 'active' };
const large = { id: 'large', variantName: 'Gói 1kg', netQuantity: 1, unitId: 'kg', sellingPrice: 100000, status: 'active' };

describe('Published package comparisons', () => {
  it('converts grams, kilograms and milligrams to a comparable VND/kg price', () => {
    expect(variantMeasurement(small)).toMatchObject({ baseQuantity: 0.25, unitPrice: 120000, base: 'kg', dimension: 'mass' });
    expect(variantMeasurement(large).unitPrice).toBe(100000);
    expect(variantMeasurement({ ...small, netQuantity: 250000, unitId: 'MG' }).unitPrice).toBe(120000);
  });
  it('compares ml and l separately from weight', () => {
    expect(variantMeasurement({ ...small, netQuantity: 500, unitId: 'ml', sellingPrice: 45000 })).toMatchObject({ base: 'lít', dimension: 'volume', unitPrice: 90000 });
    expect(variantMeasurement({ ...small, netQuantity: 1, unitId: 'l' }).unitPrice).toBe(30000);
  });
  it('does not infer weight from names or unknown unit IDs, and rejects invalid quantities/prices', () => {
    for (const item of [{ ...small, unitId: 'unit-uuid' }, { ...small, unitId: null }, { ...small, netQuantity: 0 }, { ...small, sellingPrice: -1 }, { ...small, netQuantity: 'bad' }]) expect(variantMeasurement(item)).toBeNull();
  });
  it('highlights the cheapest available comparable package without treating netQuantity as stock', () => {
    const rows = comparisonVariants({ canAddToCart: true, variants: [small, large, { ...small, id: 'volume', unitId: 'ml' }] });
    expect(rows.map((row) => row.available)).toEqual([true, true, true]);
    expect(rows.map((row) => row.bestUnitPrice)).toEqual([false, true, false]);
    expect(comparisonVariants({ variants: [small] })[0].bestUnitPrice).toBe(false);
  });
  it('blocks inactive, out-of-stock, invalid-price and server-disabled packages', () => {
    expect(comparisonVariants({ variants: [{ ...small, status: 'inactive' }, { ...large, stock: 0 }, { ...small, id: 'invalid', sellingPrice: null }] }).map((row) => row.available)).toEqual([false, false, false]);
    expect(comparisonVariants({ canAddToCart: false, variants: [small] })[0].available).toBe(false);
    expect(comparisonVariants({ stock: 0, variants: [small] })[0].available).toBe(false);
  });
});

describe('Certificate validity and date presentation', () => {
  const certificate = { currentlyValid: true, status: 'verified', issuedAt: '2026-01-01', expiresAt: '2026-10-22' };
  it('keeps a certificate valid through its expiration day but marks it expired afterward', () => {
    expect(certificateState(certificate, '2026-10-22').tone).toBe('valid');
    expect(certificateState(certificate, '2026-10-23').tone).toBe('expired');
  });
  it('does not claim validity for pending, future-issued or explicitly unverified certificates', () => {
    expect(certificateState({ ...certificate, status: 'pending' }, '2026-10-22').tone).toBe('pending');
    expect(certificateState({ ...certificate, currentlyValid: false }, '2026-10-22').tone).toBe('pending');
    expect(certificateState({ ...certificate, issuedAt: '2027-01-01', expiresAt: null }, '2026-10-22').tone).toBe('pending');
  });
  it('shows missing expiration honestly and rejects malformed or impossible dates', () => {
    expect(traceabilityDate(null)).toBe('Chưa công bố');
    expect(traceabilityDate('2026-02-30')).toBe('Chưa công bố');
    expect(traceabilityDate('not-a-date')).toBe('Chưa công bố');
    expect(traceabilityDate('2026-10-22')).toBe('22/10/2026');
    expect(certificateState({ ...certificate, expiresAt: 'invalid' }, '2026-10-22').tone).toBe('pending');
  });
});
