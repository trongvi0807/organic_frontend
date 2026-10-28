import { describe, expect, it } from 'vitest';
import { getAdminNavigation, flattenAdminLinks, activeAdminGroup, adminGroupPath } from './adminNavigation';
const user = (...roles) => ({ roles });
const groups = (...roles) => getAdminNavigation(user(...roles));
describe('Role-based admin navigation', () => {
  it('gives warehouse exactly four parent links and product management without category mutations', () => {
    const nav = groups('WAREHOUSE_STAFF');
    expect(nav.map((g) => g.id)).toEqual(['dashboard', 'transparency', 'catalog', 'supply-chain']);
    expect(nav.find((g) => g.id === 'catalog').children.map((t) => t.path)).toEqual(['products']);
    expect(flattenAdminLinks(nav).some((t) => t.path === 'promotions')).toBe(false);
  });
  it('gives sales only overview and sales, including authorized promotions', () => {
    const nav = groups('SALES_STAFF');
    expect(nav.map((g) => g.id)).toEqual(['dashboard', 'sales']);
    expect(nav[1].children.map((t) => t.path)).toEqual(['sales-orders', 'payment-review', 'promotions', 'customers']);
  });
  it('gives admin all six groups, four supply tabs and all existing support functions', () => {
    const nav = groups('ADMIN');
    expect(nav).toHaveLength(6);
    expect(nav.find((g) => g.id === 'supply-chain').children).toHaveLength(4);
    expect(flattenAdminLinks(nav).map((t) => t.path)).toEqual(expect.arrayContaining(['categories', 'notifications', 'business-forms', 'home']));
  });
  it('combines roles without duplicate groups and normalizes ROLE_ prefixes', () => {
    expect(groups('ROLE_WAREHOUSE_STAFF', 'ROLE_SALES_STAFF').map((g) => g.id)).toEqual(['dashboard', 'transparency', 'catalog', 'sales', 'supply-chain']);
  });
  it('never grants access to customer, absent or unsupported roles', () => {
    for (const roles of [[], ['CUSTOMER'], ['QUAN_LY_CAO_CAP']]) expect(groups(...roles)).toEqual([]);
  });
  it('maps old approval deep links to the consolidated supply tabs', () => {
    expect(activeAdminGroup(user('ADMIN'), '/admin/order-approvals').id).toBe('supply-chain');
    expect(activeAdminGroup(user('ADMIN'), '/admin/receipt-approvals').id).toBe('supply-chain');
    expect(activeAdminGroup(user('SALES_STAFF'), '/admin/products')).toBeUndefined();
    expect(adminGroupPath(groups('WAREHOUSE_STAFF').at(-1))).toBe('/admin/suppliers');
  });
});
