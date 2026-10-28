import {
  Bell, Boxes, FileInput, FileText, Home, LayoutDashboard, Link2, MapPin,
  Package, Settings2, Shapes, ShieldCheck, ShoppingBag, Sprout, Tag, Truck, Users, WalletCards, Warehouse,
} from 'lucide-react';
import { hasRole, STAFF_ROLES, PRODUCT_MANAGERS, PROMOTION_MANAGERS } from '@/lib/permissions';

const ADMIN = ['ADMIN'];
const SALES = ['ADMIN', 'SALES_STAFF'];
const navigation = [
  { id: 'dashboard', name: 'Tổng quan', path: 'dashboard', icon: LayoutDashboard },
  {
    id: 'transparency', name: 'Nguồn gốc & Minh bạch', icon: Sprout, roles: PRODUCT_MANAGERS,
    children: [
      { path: 'origins', name: 'Xuất xứ', icon: MapPin },
      { path: 'certifications', name: 'Chứng nhận', icon: ShieldCheck },
      { path: 'traceability', name: 'Truy xuất sản phẩm', icon: Link2 },
    ],
  },
  {
    id: 'catalog', name: 'Sản phẩm', icon: Package, roles: PRODUCT_MANAGERS,
    children: [
      { path: 'products', name: 'Sản phẩm', icon: Package },
      { path: 'categories', name: 'Loại sản phẩm', icon: Shapes, roles: ADMIN },
    ],
  },
  {
    id: 'sales', name: 'Bán hàng & Khách hàng', icon: ShoppingBag, roles: SALES,
    children: [
      { path: 'sales-orders', name: 'Đơn bán & Giao hàng', icon: Truck },
      { path: 'payment-review', name: 'Đối soát thanh toán', icon: WalletCards },
      { path: 'promotions', name: 'Khuyến mãi', icon: Tag, roles: PROMOTION_MANAGERS },
      { path: 'customers', name: 'Khách hàng', icon: Users },
    ],
  },
  {
    id: 'supply-chain', name: 'Kho vận & Mua hàng', icon: Warehouse, roles: PRODUCT_MANAGERS,
    children: [
      { path: 'suppliers', name: 'Nhà cung cấp', icon: Truck },
      { path: 'purchase-orders', name: 'Đơn mua & Duyệt đơn', icon: ShoppingBag, aliases: ['order-approvals'] },
      { path: 'goods-receipts', name: 'Phiếu nhập & Duyệt nhập', icon: FileInput, aliases: ['receipt-approvals'] },
      { path: 'inventory', name: 'Tồn kho / Lô', icon: Boxes },
    ],
  },
  {
    id: 'system', name: 'Hệ thống', icon: Settings2, roles: ADMIN,
    children: [
      { path: 'notifications', name: 'Thông báo', icon: Bell },
      { path: 'business-forms', name: 'Biểu mẫu & Bản in', icon: FileText },
      { path: 'home', name: 'Nội dung trang chủ', icon: Home },
    ],
  },
];

export function getAdminNavigation(user) {
  if (!hasRole(user, ...STAFF_ROLES)) return [];
  return navigation.flatMap((group) => {
    if (group.roles && !hasRole(user, ...group.roles)) return [];
    if (!group.children) return [group];
    const children = group.children.filter((item) => !item.roles || hasRole(user, ...item.roles));
    return children.length ? [{ ...group, children }] : [];
  });
}

export const flattenAdminLinks = (items) => items.flatMap((item) => item.children ? flattenAdminLinks(item.children) : [item]);
export const isAdminItemActive = (item, pathname) => item.children
  ? item.children.some((child) => isAdminItemActive(child, pathname))
  : [item.path, ...(item.aliases || [])].some((path) => pathname === `/admin/${path}` || pathname.startsWith(`/admin/${path}/`));
export const adminGroupPath = (group) => `/admin/${group.path || group.children[0].path}`;
export const activeAdminGroup = (user, pathname) => getAdminNavigation(user).find((group) => isAdminItemActive(group, pathname));
