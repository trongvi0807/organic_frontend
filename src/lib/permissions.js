import matrix from '@/constants/staffPermissions.json';

export const STAFF_ROLE_NAMES = matrix.roles;
export const STAFF_ROLES = Object.keys(STAFF_ROLE_NAMES);
export const rolesFor = permission => matrix.permissions[permission] || [];
export const roleCodes = user => (user?.roles || []).map(role => role.replace(/^ROLE_/, ''));
export const hasRole = (user, ...roles) => roleCodes(user).some(role => roles.includes(role));
export const can = (user, permission) => hasRole(user, ...rolesFor(permission));
export const roleLabel = user => roleCodes(user).map(role => STAFF_ROLE_NAMES[role]).filter(Boolean).join(' · ') || 'Khách hàng';
export const roleNames = user => [...new Set(roleCodes(user).map(role => STAFF_ROLE_NAMES[role]).filter(Boolean))];
export function roleSummary(user) {
  const names = roleNames(user);
  if (names.length <= 1) return names[0] || 'Khách hàng';
  if (hasRole(user, 'ADMIN')) return 'Quản trị viên tổng hợp';
  return `${names[0]} +${names.length - 1}`;
}
export const PRODUCT_MANAGERS = rolesFor('catalog.read');
export const PROMOTION_MANAGERS = rolesFor('promotion.read');

export function dashboardPath(user) {
  return hasRole(user, ...STAFF_ROLES) ? '/admin/dashboard' : '/tai-khoan';
}
export function loginPath(user) {
  return hasRole(user, ...STAFF_ROLES) ? dashboardPath(user) : hasRole(user, 'CUSTOMER') ? '/' : '/tai-khoan';
}
export const mayEdit = (user, module) => can(user, module === 'customers' ? 'customer.write' : 'source.write');
export const mayRead = (user, module) => can(user, module === 'customers' ? 'customer.read' : 'source.read');
