import { describe, expect, it } from 'vitest';
import { normalizePage, normalizeHomeProduct, withHomePricing, internalHref, validateUpload } from './apiData';
import { dashboardPath, mayRead, mayEdit, hasRole } from './permissions';
import { modules } from '@/constants/management';

describe('Backend DTO compatibility', () => {
  it('normalizes content pages and preserves page metadata', () => {
    const item = { id: '1' };
    expect(normalizePage({ content: [item], page: 2, totalElements: 18 }).items).toEqual([item]);
    expect(normalizePage({ items: [item], page: 2 }).page).toBe(2);
    expect(normalizePage({ items: [item] }).items).toEqual([item]);
    expect(normalizePage(null).items).toEqual([]);
  });
  it('uses home default variant prices and current verification, without inventing inventory', () => {
    const product = normalizeHomeProduct({ id: 'p', name: 'Rau', defaultPrice: 45000, minPrice: 45000, compareAtPrice: 40000, defaultVariantName: 'Gói 500g', organicVerified: false, organicClaimStatus: 'verified' });
    expect(product.productName).toBe('Rau');
    expect(product.minPrice).toBe(45000);
    expect(product.compareAtPrice).toBeNull();
    expect(product.organicVerified).toBe(false);
    expect(product.stock).toBeUndefined();
    expect(product.unit).toBe('Gói 500g');
    expect(normalizeHomeProduct({ name: 'Chưa có giá', compareAtPrice: 50000 }).compareAtPrice).toBeNull();
  });
  it('rejects external/unsafe banner destinations and maps the backend catalog route', () => {
    for (const path of ['//evil.example', '/\\evil.example', 'javascript:alert(1)', 'https://evil.example', '/with space']) expect(internalHref(path)).toBe('/san-pham');
    expect(internalHref('/products?category=abc')).toBe('/san-pham?category=abc');
    expect(internalHref('/tai-khoan')).toBe('/tai-khoan');
  });
  it('shows the same sale price, original price and variant on Home and Catalog with an older backend DTO', () => {
    const card=normalizeHomeProduct({id:'p',name:'Rau',defaultPrice:28000,compareAtPrice:32000,defaultVariantId:'v',defaultVariantName:'Gói 500g'});
    const merged=withHomePricing({id:'p',productName:'Rau',minPrice:28000}, {featuredProducts:[card]});
    expect(merged).toMatchObject({minPrice:28000,compareAtPrice:32000,unit:'Gói 500g',defaultVariantId:'v'});
    const noSale=normalizeHomeProduct({id:'p',productName:'Rau',defaultPrice:28000,compareAtPrice:null,defaultVariantId:'v'});
    expect(withHomePricing(noSale,{featuredProducts:[card]}).compareAtPrice).toBeNull();
    expect(withHomePricing({id:'other',minPrice:10000},{featuredProducts:[card]})).not.toHaveProperty('compareAtPrice');
  });
  it('validates avatar/document types and the 5 MB limit before upload', () => {
    expect(() => validateUpload(new File(['pdf'], 'proof.pdf', { type: 'application/pdf' }))).toThrow('JPEG');
    expect(() => validateUpload(new File(['pdf'], 'proof.pdf', { type: 'application/pdf' }), true)).not.toThrow();
    expect(() => validateUpload(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }))).toThrow('5 MB');
  });
  it('accepts international and local phone numbers in the customer form', () => {
    const pattern = new RegExp(`^(?:${modules.customers.fields.find((f) => f.name === 'phoneNumber').pattern})$`);
    expect(pattern.test('+84901234567')).toBe(true);
    expect(pattern.test('0901234567')).toBe(true);
    expect(pattern.test('abc')).toBe(false);
  });
});
describe('Management permissions', () => {
  const admin = { roles: ['ADMIN'] }, sales = { roles: ['SALES_STAFF'] }, warehouse = { roles: ['WAREHOUSE_STAFF'] }, customer = { roles: ['CUSTOMER'] };
  it('routes each employee to a permitted dashboard', () => {
    expect(dashboardPath(admin)).toBe('/admin/products');
    expect(dashboardPath(sales)).toBe('/admin/customers');
    expect(dashboardPath(warehouse)).toBe('/admin/suppliers');
    expect(dashboardPath(customer)).toBe('/tai-khoan');
    expect(hasRole({ roles: ['ROLE_ADMIN'] }, 'ADMIN')).toBe(true);
  });
  it('matches the sales/warehouse/customer API access matrix', () => {
    expect(mayRead(warehouse, 'customers')).toBe(false);
    expect(mayEdit(sales, 'customers')).toBe(true);
    expect(mayRead(sales, 'certifications')).toBe(true);
    expect(mayEdit(sales, 'certifications')).toBe(false);
    expect(mayEdit(warehouse, 'certifications')).toBe(true);
    expect(mayRead(customer, 'origins')).toBe(false);
  });
});
