import {
  ChartNoAxesCombined, Bell, Boxes, FileInput, FileText, Home, LayoutDashboard, Link2, MapPin, MessageCircle, MessageSquare, RotateCcw,
  Package, Settings2, Shapes, ShieldCheck, ShoppingBag, Sprout, Tag, Truck, Users, WalletCards, Warehouse,
} from 'lucide-react';
import { can } from '@/lib/permissions';

const navigation = [
  { id: 'dashboard', name: 'Tổng quan', path: 'dashboard', icon: LayoutDashboard },
  { id: 'reports', name: 'Thống kê & Báo cáo', icon: ChartNoAxesCombined, permission: 'reports.read', children: [
    { path: 'revenue-report', name: 'Báo cáo doanh thu', icon: WalletCards, permission: 'reports.read' },
    { path: 'best-selling-products', name: 'Sản phẩm bán chạy', icon: ChartNoAxesCombined, permission: 'reports.read' },
  ] },
  { id: 'transparency', name: 'Nguồn gốc & Minh bạch', icon: Sprout, permission: 'catalog.read', children: [
    { path: 'origins', name: 'Xuất xứ', icon: MapPin, permission: 'source.read' },
    { path: 'certifications', name: 'Chứng nhận', icon: ShieldCheck, permission: 'source.read' },
    { path: 'traceability', name: 'Truy xuất sản phẩm', icon: Link2, permission: 'source.read' },
  ] },
  { id: 'catalog', name: 'Sản phẩm', icon: Package, permission: 'catalog.read', children: [
    { path: 'products', name: 'Sản phẩm', icon: Package, permission: 'catalog.read' },
    { path: 'categories', name: 'Loại sản phẩm', icon: Shapes, permission: 'catalog.read' },
  ] },
  { id: 'sales', name: 'Bán hàng & Khách hàng', icon: ShoppingBag, permission: 'order.read', children: [
    { path: 'sales-orders', name: 'Đơn bán & Giao hàng', icon: Truck, permission: 'order.read' },
    { path: 'payment-review', name: 'Đối soát thanh toán', icon: WalletCards, permission: 'payment.read' },
    { path: 'promotions', name: 'Khuyến mãi', icon: Tag, permission: 'promotion.read' },
    { path: 'customers', name: 'Khách hàng', icon: Users, permission: 'customer.read' },
    { path: 'reviews', name: 'Đánh giá sản phẩm', icon: MessageSquare, permission: 'review.read' },
    { path: 'feedbacks', name: 'Phản hồi', icon: MessageCircle, permission: 'feedback.read' },
    { path: 'purchase-orders', name: 'Lịch sử đơn mua', icon: FileText, permission: 'purchase.read', excludePermission: 'inventory.read' },
    { path: 'return-requests', name: 'Đổi trả', icon: RotateCcw, permission: 'return.read' },
    { path: 'return-receipts', name: 'Hàng thu hồi & Giao hàng đổi', icon: FileInput, permission: 'return.warehouse.read', excludePermission: 'return.warehouse.write' },
  ] },
  { id: 'supply-chain', name: 'Kho vận & Mua hàng', icon: Warehouse, permission: 'inventory.read', children: [
    { path: 'suppliers', name: 'Nhà cung cấp', icon: Truck, permission: 'source.read' },
    { path: 'purchase-orders', name: 'Đơn mua & Duyệt đơn', icon: ShoppingBag, aliases: ['order-approvals'], permission: 'purchase.read' },
    { path: 'goods-receipts', name: 'Phiếu nhập & Duyệt nhập', icon: FileInput, aliases: ['receipt-approvals'], permission: 'receipt.read' },
    { path: 'inventory', name: 'Tồn kho / Lô', icon: Boxes, permission: 'inventory.read' },
    { path: 'liquidations', name: 'Thanh lý & xử lý hàng', icon: FileText, permission: 'liquidation.read' },
    { path: 'return-receipts', name: 'Hàng thu hồi', icon: RotateCcw, permission: 'return.warehouse.write' },
  ] },
  { id: 'system', name: 'Hệ thống', icon: Settings2, permission: 'system.manage', children: [
    { path: 'notifications', name: 'Thông báo', icon: Bell, permission: 'inventory.read' },
    { path: 'employees', name: 'Nhân viên & Phân quyền', icon: Users },
    { path: 'delivery-settings', name: 'Cấu hình giao hàng', icon: Truck },
    { path: 'business-forms', name: 'Biểu mẫu & Bản in', icon: FileText },
    { path: 'home', name: 'Nội dung trang chủ', icon: Home },
  ] },
];

export function getAdminNavigation(user) {
  if (!can(user, 'staff.read')) return [];
  return navigation.flatMap(group => {
    if (group.permission && !can(user, group.permission)) return [];
    if (!group.children) return [group];
    const children = group.children.filter(item => (!item.permission || can(user, item.permission)) && (!item.excludePermission || !can(user, item.excludePermission)));
    return children.length ? [{ ...group, children }] : [];
  });
}
export const flattenAdminLinks = items => items.flatMap(item => item.children ? flattenAdminLinks(item.children) : [item]);
export const isAdminItemActive = (item, pathname) => item.children
  ? item.children.some(child => isAdminItemActive(child, pathname))
  : [item.path, ...(item.aliases || [])].some(path => pathname === `/admin/${path}` || pathname.startsWith(`/admin/${path}/`));
export const adminGroupPath = group => `/admin/${group.path || group.children[0].path}`;
export const activeAdminGroup = (user, pathname) => getAdminNavigation(user).find(group => isAdminItemActive(group, pathname));
