export const STAFF_ROLES = ['ADMIN', 'SALES_STAFF', 'WAREHOUSE_STAFF'];
export const roleCodes = (user) => (user?.roles || []).map((role) => role.replace(/^ROLE_/, ''));
export const hasRole = (user, ...roles) => roleCodes(user).some((role) => roles.includes(role));
export function dashboardPath(user) {
  if (hasRole(user, 'ADMIN')) return '/admin/products';
  if (hasRole(user, 'SALES_STAFF')) return '/admin/customers';
  if (hasRole(user, 'WAREHOUSE_STAFF')) return '/admin/suppliers';
  return '/tai-khoan';
}
export function loginPath(user) {
  if (hasRole(user, ...STAFF_ROLES)) return dashboardPath(user);
  return hasRole(user, 'CUSTOMER') ? '/' : dashboardPath(user);
}
export const mayEdit = (user, module) => hasRole(user, 'ADMIN', module === 'customers' ? 'SALES_STAFF' : 'WAREHOUSE_STAFF');
export const mayRead = (user, module) => module === 'customers' ? hasRole(user, 'ADMIN', 'SALES_STAFF') : hasRole(user, ...STAFF_ROLES);
