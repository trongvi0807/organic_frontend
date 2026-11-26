import { describe, expect, it } from 'vitest';
import { getAdminNavigation, flattenAdminLinks, activeAdminGroup, adminGroupPath } from './adminNavigation';
import { can } from '@/lib/permissions';
const user = (...roles) => ({ roles });
const groups = (...roles) => getAdminNavigation(user(...roles));
describe('Role-based admin navigation', () => {
  it('gives warehouse stock, preparation and product management without category mutations', () => {
    const nav = groups('WAREHOUSE_STAFF');
    expect(nav.map((g) => g.id)).toEqual(['dashboard', 'transparency', 'catalog', 'sales', 'supply-chain']);
    expect(nav.find((g) => g.id === 'catalog').children.map((t) => t.path)).toEqual(['products', 'categories']);
    expect(can(user('WAREHOUSE_STAFF'), 'category.write')).toBe(false);
    expect(flattenAdminLinks(nav).some((t) => t.path === 'promotions')).toBe(false);
  });
  it('gives sales overview, reports and sales including purchase history', () => {
    const nav = groups('SALES_STAFF');
    expect(nav.map((g) => g.id)).toEqual(['dashboard', 'reports', 'sales']);
    expect(nav.find(g => g.id === 'sales').children.map((t) => t.path)).toEqual(['sales-orders', 'payment-review', 'promotions', 'customers', 'reviews', 'feedbacks', 'purchase-orders', 'return-requests', 'return-receipts']);
  });
  it('gives admin all seven groups, liquidation lookup and system administration', () => {
    const nav = groups('ADMIN');
    expect(nav).toHaveLength(7);
    expect(nav.find((g) => g.id === 'supply-chain').children.map(t => t.path)).toEqual(['suppliers', 'purchase-orders', 'goods-receipts', 'inventory', 'liquidations']);
    expect(flattenAdminLinks(nav).map((t) => t.path)).toEqual(expect.arrayContaining(['categories', 'notifications', 'business-forms', 'home']));
  });
  it('combines roles without duplicate groups and normalizes ROLE_ prefixes', () => {
    expect(groups('ROLE_WAREHOUSE_STAFF', 'ROLE_SALES_STAFF').map((g) => g.id)).toEqual(['dashboard', 'reports', 'transparency', 'catalog', 'sales', 'supply-chain']);
    for (const roles of [['WAREHOUSE_STAFF'], ['ADMIN', 'WAREHOUSE_STAFF'], ['WAREHOUSE_STAFF', 'SALES_STAFF']]) {
      expect(flattenAdminLinks(groups(...roles)).filter((item) => item.path === 'return-receipts')).toHaveLength(1);
    }
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
