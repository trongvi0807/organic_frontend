import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { StoreLayout } from '@/layouts/StoreLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { STAFF_ROLES, PRODUCT_MANAGERS, PROMOTION_MANAGERS } from '@/lib/permissions';
import HomePage from '@/pages/client/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ResourceState } from '@/components/common/ResourceState';
import { useStoreScrollRestoration } from '@/hooks/useStoreScrollRestoration';
import { POLICY_PAGES, policyPath } from '@/constants/policies';

const FavoritesPage = lazy(() => import('@/pages/client/FavoritesPage'));
const ProductsPage = lazy(() => import('@/pages/client/ProductsPage'));
const ProductDetailPage = lazy(() => import('@/pages/client/ProductDetailPage'));
const CartPage = lazy(() => import('@/pages/client/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/client/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@/pages/client/OrderSuccessPage'));
const AboutStorePage = lazy(() => import('@/pages/client/TraceabilityPage'));
const HighlightsPage = lazy(() => import('@/pages/client/HighlightsPage'));
const PolicyPage = lazy(() => import('@/pages/client/PolicyPage'));
const AccountPage = lazy(() => import('@/pages/client/AccountPage'));
const AuthPage = lazy(() => import('@/pages/auth/AuthPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const LogoutPage = lazy(() => import('@/pages/auth/LogoutPage'));
const StaffAccountsPage = lazy(() => import('@/pages/admin/StaffAccountsPage'));
const DeliverySettingsPage = lazy(() => import('@/pages/admin/DeliverySettingsPage'));
const ManagementPage = lazy(() => import('@/pages/admin/ManagementPage'));
const RecordsPage = lazy(() => import('@/pages/admin/RecordsPage'));
const TraceabilityPage = lazy(() => import('@/pages/admin/TraceabilityPage'));
const HomeManagementPage = lazy(() => import('@/pages/admin/HomeManagementPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const ProcurementPage = lazy(() => import('@/pages/admin/ProcurementPage'));
const BusinessFormsPage = lazy(() => import('@/pages/admin/BusinessFormsPage'));
const RevenueReportPage = lazy(() => import('@/pages/admin/RevenueReportPage'));
const BestSellingProductsPage = lazy(() => import('@/pages/admin/BestSellingProductsPage'));
const LiquidationsPage = lazy(() => import('@/pages/admin/LiquidationsPage'));
const InventoryPage = lazy(() => import('@/pages/admin/InventoryPage'));
const NotificationsPage = lazy(() => import('@/pages/admin/NotificationsPage'));
const OrdersPage = lazy(() => import('@/pages/client/OrderHistoryPage'));
const OrderPage = lazy(() => import('@/pages/client/OrderTrackingPage'));
const RewardsPage = lazy(() => import('@/pages/client/RewardsPage'));
const PaymentResultPage = lazy(() => import('@/pages/client/PaymentResultPage'));
const MyReviewsPage = lazy(() => import('@/pages/client/MyReviewsPage'));
const SalesOrdersPage = lazy(() => import('@/pages/admin/SalesOrdersPage'));
const PromotionsPage = lazy(() => import('@/pages/admin/PromotionsPage'));
const ReviewManagementPage = lazy(() => import('@/pages/admin/ReviewManagementPage'));
const PaymentReviewPage = lazy(() => import('@/pages/admin/PaymentReviewPage'));
const FeedbackPage = lazy(() => import('@/pages/shared/FeedbackPage'));
const ReturnRequestsPage = lazy(() => import('@/pages/shared/ReturnRequestsPage'));
const ReturnWarehousePage = lazy(() => import('@/pages/admin/ReturnWarehousePage'));
function DashboardRedirect() { return <Navigate to="/admin/dashboard" replace />; }
function CatalogRedirect() { const { search } = useLocation(); const params = new URLSearchParams(search); if (params.has('categoryId') && !params.has('category')) { params.set('category', params.get('categoryId')); params.delete('categoryId'); } return <Navigate to={`/san-pham${params.size ? `?${params}` : ''}`} replace />; }
function ProductRedirect() { const { slug } = useParams(); const { hash } = useLocation(); return <Navigate to={`/san-pham/${encodeURIComponent(slug)}${hash}`} replace />; }

export function AppRoutes() {
  useStoreScrollRestoration();
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const names = { '/diem-noi-bat': 'Điểm nổi bật', '/ve-cua-hang': 'Về cửa hàng', '/gio-hang': 'Giỏ hàng', '/thanh-toan': 'Thanh toán', '/': 'Trang chủ', '/san-pham': 'Sản phẩm', '/dang-nhap': 'Đăng nhập', '/quen-mat-khau': 'Quên mật khẩu', '/dat-lai-mat-khau': 'Đặt mật khẩu mới', '/doi-mat-khau': 'Đổi mật khẩu', '/dang-ky': 'Đăng ký', '/dang-xuat': 'Đăng xuất', '/admin/products': 'Quản lý sản phẩm', '/admin/categories': 'Quản lý loại sản phẩm', '/tai-khoan': 'Tài khoản', '/admin/customers': 'Quản lý khách hàng', '/admin/suppliers': 'Quản lý nhà cung cấp', '/admin/origins': 'Xuất xứ organic', '/admin/certifications': 'Chứng nhận organic', '/admin/traceability': 'Truy xuất sản phẩm', '/admin/home': 'Quản lý trang chủ' };
    document.title = `${names[pathname] || (/^\/(san-pham|products)\//.test(pathname) ? 'Chi tiết sản phẩm' : 'Trang không tồn tại')} | organicfood.vn`;
    const operations = { 'purchase-orders': 'Đơn đặt mua', 'order-approvals': 'Duyệt đơn mua', 'goods-receipts': 'Phiếu nhập', 'receipt-approvals': 'Duyệt nhập', 'revenue-report': 'Báo cáo doanh thu', 'best-selling-products': 'Sản phẩm bán chạy', liquidations: 'Thanh lý & xử lý hàng', inventory: 'Tồn kho / lô', notifications: 'Thông báo' };
    if (operations[pathname.replace('/admin/', '')]) document.title = `${operations[pathname.replace('/admin/', '')]} | organicfood.vn`;
    const commerce = { '/don-hang': 'Đơn hàng', '/yeu-thich': 'Sản phẩm yêu thích', '/diem-thuong': 'Điểm thưởng', '/danh-gia-cua-toi': 'Đánh giá của tôi', '/payment/result': 'Kết quả thanh toán', '/payment/cancel': 'Quay lại từ thanh toán', '/admin/sales-orders': 'Đơn bán & giao hàng', '/admin/promotions': 'Khuyến mãi', '/admin/payment-review': 'Đối soát thanh toán' };
    if (commerce[pathname] || pathname.startsWith('/don-hang/')) document.title = `${commerce[pathname] || 'Chi tiết đơn hàng'} | organicfood.vn`;
    if (pathname.startsWith('/dat-hang-thanh-cong/')) document.title = 'Đơn hàng đã ghi nhận | organicfood.vn';
    if (pathname === '/admin/business-forms') document.title = 'Biểu mẫu & bản in | organicfood.vn';
    if (pathname === '/admin/dashboard') document.title = 'Trang tổng quan | organicfood.vn';
    const support = { '/admin/reviews': 'Đánh giá sản phẩm', '/phan-hoi': 'Phản hồi & hỗ trợ', '/doi-tra': 'Đổi trả & hỗ trợ sau mua', '/admin/feedbacks': 'Phản hồi khách hàng', '/admin/return-requests': 'Yêu cầu đổi trả', '/admin/return-receipts': 'Hàng thu hồi' };
    if (support[pathname]) document.title = `${support[pathname]} | organicfood.vn`;
    const policy = POLICY_PAGES.find(page => policyPath(page.slug) === pathname);
    if (policy) document.title = `${policy.title} | organicfood.vn`;
  }, [pathname]);
  return <Suspense fallback={<ResourceState loading />}><Routes>
    <Route element={<StoreLayout />}>
      <Route index element={<HomePage />} />
      <Route path="san-pham" element={<ProductsPage />} />
      <Route path="san-pham/:slug" element={<ProductDetailPage />} />
      <Route path="san-pham/id/:productId" element={<ProductDetailPage />} />
      <Route path="gio-hang" element={<CartPage />} />
      <Route path="yeu-thich" element={<FavoritesPage />} />
      <Route path="thanh-toan" element={<CheckoutPage />} />
      <Route path="demo/don-hang" element={<Navigate to="/don-hang" replace />} />
      <Route path="demo/don-hang/:id" element={<Navigate to="/don-hang" replace />} />
      <Route element={<ProtectedRoute roles={['CUSTOMER']} />}>
        <Route path="dat-hang-thanh-cong/:id" element={<OrderSuccessPage />} />
        <Route path="don-hang" element={<OrdersPage />} />
        <Route path="don-hang/:id" element={<OrderPage />} />
        <Route path="diem-thuong" element={<RewardsPage />} />
        <Route path="danh-gia-cua-toi" element={<MyReviewsPage />} />
        <Route path="phan-hoi" element={<FeedbackPage />} />
        <Route path="doi-tra" element={<ReturnRequestsPage />} />
        <Route path="payment/result" element={<PaymentResultPage />} />
        <Route path="payment/cancel" element={<PaymentResultPage cancelled />} />
      </Route>
      <Route path="ve-cua-hang" element={<AboutStorePage />} />
      <Route path="diem-noi-bat" element={<HighlightsPage />} />
      {POLICY_PAGES.map(page => <Route key={page.slug} path={page.slug} element={<PolicyPage slug={page.slug} />} />)}
      {POLICY_PAGES.map(page => <Route key={`legacy-${page.slug}`} path={`pages/${page.slug}`} element={<Navigate to={policyPath(page.slug)} replace />} />)}
      <Route path="pages/chinh-sach-doi-tra-1" element={<Navigate to="/chinh-sach-doi-tra" replace />} />
      <Route path="products" element={<CatalogRedirect />} />
      <Route path="products/:slug" element={<ProductRedirect />} />
      <Route element={<ProtectedRoute />}><Route path="tai-khoan" element={<AccountPage />} /></Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>
    <Route path="quen-mat-khau" element={<ForgotPasswordPage />} /><Route path="dat-lai-mat-khau" element={<ResetPasswordPage purpose="forgot" />} /><Route path="doi-mat-khau" element={<ResetPasswordPage purpose="change" />} />
    <Route path="dang-nhap" element={<AuthPage />} /><Route path="dang-ky" element={<AuthPage mode="register" />} /><Route path="dang-xuat" element={<LogoutPage />} />
    <Route element={<ProtectedRoute roles={STAFF_ROLES} />}>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<DashboardRedirect />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="business-forms" element={<BusinessFormsPage />} />
        <Route element={<ProtectedRoute permission="system.manage" />}><Route path="employees" element={<StaffAccountsPage />} /></Route>
        <Route element={<ProtectedRoute permission="system.manage" />}><Route path="delivery-settings" element={<DeliverySettingsPage />} /></Route>
        <Route element={<ProtectedRoute permission="system.manage" />}><Route path="home" element={<HomeManagementPage />} /></Route>
        <Route element={<ProtectedRoute permission="purchase.approve" />}><Route path="order-approvals" element={<ProcurementPage key="order-approvals" approval />} /></Route>
        <Route element={<ProtectedRoute permission="receipt.approve" />}><Route path="receipt-approvals" element={<ProcurementPage key="receipt-approvals" kind="receipts" approval />} /></Route>
        <Route element={<ProtectedRoute permission="catalog.read" />}><Route path="categories" element={<ManagementPage key="categories" type="categories" />} /></Route>
        <Route element={<ProtectedRoute permission="catalog.read" />}><Route path="products" element={<ManagementPage key="products" type="products" />} /></Route>
        <Route element={<ProtectedRoute permission="promotion.read" />}><Route path="promotions" element={<PromotionsPage />} /></Route>
        <Route element={<ProtectedRoute permission="purchase.read" />}><Route path="purchase-orders" element={<ProcurementPage key="purchase-orders" />} /></Route>
        <Route element={<ProtectedRoute permission="receipt.read" />}><Route path="goods-receipts" element={<ProcurementPage key="goods-receipts" kind="receipts" />} /></Route>
        <Route element={<ProtectedRoute permission="reports.read" />}><Route path="revenue-report" element={<RevenueReportPage />} /><Route path="best-selling-products" element={<BestSellingProductsPage />} /></Route>
        <Route element={<ProtectedRoute permission="liquidation.read" />}><Route path="liquidations" element={<LiquidationsPage />} /></Route>
      <Route element={<ProtectedRoute permission="inventory.read" />}><Route path="inventory" element={<InventoryPage />} /></Route>
        <Route element={<ProtectedRoute permission="inventory.read" />}><Route path="notifications" element={<NotificationsPage />} /></Route>
        <Route element={<ProtectedRoute permission="order.read" />}><Route path="sales-orders" element={<SalesOrdersPage />} /></Route>
        <Route element={<ProtectedRoute permission="customer.read" />}><Route path="customers" element={<RecordsPage key="customers" module="customers" />} /></Route>
        <Route element={<ProtectedRoute permission="payment.read" />}><Route path="payment-review" element={<PaymentReviewPage />} /></Route>
        <Route element={<ProtectedRoute permission="review.read" />}><Route path="reviews" element={<ReviewManagementPage />} /></Route>
        <Route element={<ProtectedRoute permission="feedback.read" />}><Route path="feedbacks" element={<FeedbackPage management />} /></Route>
        <Route element={<ProtectedRoute permission="return.read" />}><Route path="return-requests" element={<ReturnRequestsPage management />} /></Route>
        <Route element={<ProtectedRoute permission="return.warehouse.read" />}><Route path="return-receipts" element={<ReturnWarehousePage />} /></Route>
        <Route element={<ProtectedRoute permission="source.read" />}><Route path="suppliers" element={<RecordsPage key="suppliers" module="suppliers" />} /></Route>
        <Route element={<ProtectedRoute permission="source.read" />}><Route path="origins" element={<RecordsPage key="origins" module="origins" />} /></Route>
        <Route element={<ProtectedRoute permission="source.read" />}><Route path="certifications" element={<RecordsPage key="certifications" module="certifications" />} /></Route>
        <Route element={<ProtectedRoute permission="source.read" />}><Route path="traceability" element={<TraceabilityPage />} /></Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes></Suspense>;
}
