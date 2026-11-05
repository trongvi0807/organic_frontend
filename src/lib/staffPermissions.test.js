import { describe, expect, it } from 'vitest';
import { can, STAFF_ROLES, STAFF_ROLE_NAMES, roleLabel } from './permissions';
import { flattenAdminLinks, getAdminNavigation } from '@/constants/adminNavigation';

const user = (...roles) => ({ roles });
const paths = role => flattenAdminLinks(getAdminNavigation(user(role))).map(link => link.path);

describe('Staff business permissions', () => {
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
