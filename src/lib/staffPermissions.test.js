import { describe, expect, it } from 'vitest';
import { can, STAFF_ROLES, STAFF_ROLE_NAMES, roleLabel, roleSummary, roleNames } from './permissions';
import { flattenAdminLinks, getAdminNavigation } from '@/constants/adminNavigation';

const user = (...roles) => ({ roles });
const paths = role => flattenAdminLinks(getAdminNavigation(user(role))).map(link => link.path);

describe('Staff business permissions', () => {
  it('exposes sales ranking only to roles allowed to read sales reports', () => {
    for(const role of ['ADMIN','EXECUTIVE_DIRECTOR','STORE_MANAGER','SALES_STAFF','BUSINESS_STAFF'])expect(can(user(role),'reports.read')).toBe(true);
    for(const role of ['CUSTOMER','WAREHOUSE_STAFF','PROCUREMENT_STAFF'])expect(can(user(role),'reports.read')).toBe(false);
    expect(paths('SALES_STAFF')).toContain('best-selling-products');
    expect(paths('WAREHOUSE_STAFF')).not.toContain('best-selling-products');
  });
  it('separates liquidation approval from warehouse execution and read-only oversight', () => {
    expect(can(user('WAREHOUSE_STAFF'),'liquidation.write')).toBe(true);
    expect(can(user('WAREHOUSE_STAFF'),'liquidation.execute')).toBe(true);
    expect(can(user('WAREHOUSE_STAFF'),'liquidation.approve')).toBe(false);
    expect(can(user('STORE_MANAGER'),'liquidation.approve')).toBe(true);
    expect(can(user('EXECUTIVE_DIRECTOR'),'liquidation.read')).toBe(true);
    expect(can(user('EXECUTIVE_DIRECTOR'),'liquidation.execute')).toBe(false);
    expect(can(user('CUSTOMER'),'liquidation.read')).toBe(false);
    expect(paths('WAREHOUSE_STAFF')).toContain('liquidations');
  });
  it('summarizes multiple roles without changing their permissions', () => {
    const combined = user(...STAFF_ROLES);
    expect(roleSummary(combined)).toBe('Quản trị viên tổng hợp');
    expect(roleNames(combined)).toHaveLength(8);
    expect(roleSummary(user('ROLE_WAREHOUSE_STAFF'))).toBe('Nhân viên kho');
    expect(roleSummary(user('WAREHOUSE_STAFF', 'SALES_STAFF'))).toBe('Nhân viên kho +1');
    expect(roleSummary(user('WAREHOUSE_STAFF', 'ROLE_WAREHOUSE_STAFF'))).toBe('Nhân viên kho');
    expect(roleSummary(user('CUSTOMER'))).toBe('Khách hàng');
    expect(can(combined, 'purchase.approve')).toBe(true);
  });
  it('supports seven business roles and a separate system administrator', () => {
    expect(STAFF_ROLES).toHaveLength(8);
    expect(STAFF_ROLE_NAMES.WAREHOUSE_STAFF).toBe('Nhân viên kho');
    expect(STAFF_ROLE_NAMES.SALES_STAFF).toBe('Nhân viên bán hàng');
    expect(roleLabel(user('BUSINESS_STAFF'))).toBe('Nhân viên kinh doanh');
    expect(getAdminNavigation(user('CUSTOMER'))).toEqual([]);
  });

  it('separates creating purchases, receiving goods and approving documents', () => {
    expect(can(user('PROCUREMENT_STAFF'), 'purchase.write')).toBe(true);
    expect(can(user('PROCUREMENT_STAFF'), 'purchase.approve')).toBe(false);
    expect(can(user('WAREHOUSE_STAFF'), 'receipt.write')).toBe(true);
    expect(can(user('WAREHOUSE_STAFF'), 'purchase.write')).toBe(false);
    expect(can(user('PROCUREMENT_MANAGER'), 'purchase.approve')).toBe(true);
    expect(can(user('STORE_MANAGER'), 'receipt.approve')).toBe(true);
    expect(can(user('STORE_MANAGER'), 'return.approve')).toBe(true);
    expect(can(user('SALES_STAFF'), 'return.approve')).toBe(false);
  });

  it('keeps executive views read only and employee history available', () => {
    expect(paths('EXECUTIVE_DIRECTOR')).toEqual(expect.arrayContaining(['inventory', 'sales-orders', 'purchase-orders']));
    expect(can(user('EXECUTIVE_DIRECTOR'), 'catalog.write')).toBe(false);
    expect(can(user('EXECUTIVE_DIRECTOR'), 'payment.write')).toBe(false);
    for (const role of STAFF_ROLES) expect(paths(role)).toContain('purchase-orders');
  });

  it('shows business staff delivery tasks without feedback or promotion editing', () => {
    expect(paths('BUSINESS_STAFF')).toEqual(expect.arrayContaining(['sales-orders', 'payment-review']));
    expect(paths('BUSINESS_STAFF')).not.toContain('promotions');
    expect(paths('BUSINESS_STAFF')).not.toContain('feedbacks');
    expect(can(user('BUSINESS_STAFF'), 'shipment.write')).toBe(true);
    expect(can(user('BUSINESS_STAFF'), 'order.prepare')).toBe(false);
    expect(can(user('ADMIN'), 'purchase.approve')).toBe(false);
    expect(can(user('ADMIN', 'PROCUREMENT_MANAGER'), 'purchase.approve')).toBe(true);
  });
});
