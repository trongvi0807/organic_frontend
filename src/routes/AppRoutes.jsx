import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreLayout } from '@/layouts/StoreLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { STAFF_ROLES, dashboardPath } from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';
import HomePage from '@/pages/client/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ResourceState } from '@/components/common/ResourceState';

const ProductsPage = lazy(() => import('@/pages/client/ProductsPage'));
const AccountPage = lazy(() => import('@/pages/client/AccountPage'));
const AuthPage = lazy(() => import('@/pages/auth/AuthPage'));
const LogoutPage = lazy(() => import('@/pages/auth/LogoutPage'));
const ManagementPage = lazy(() => import('@/pages/admin/ManagementPage'));
const RecordsPage = lazy(() => import('@/pages/admin/RecordsPage'));
const TraceabilityPage = lazy(() => import('@/pages/admin/TraceabilityPage'));
const HomeManagementPage = lazy(() => import('@/pages/admin/HomeManagementPage'));
function DashboardRedirect() { const { user } = useAuth(); return <Navigate to={dashboardPath(user)} replace />; }
function CatalogRedirect() { const { search } = useLocation(); return <Navigate to={`/san-pham${search}`} replace />; }

export function AppRoutes() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (hash) requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })); else window.scrollTo(0, 0); }, [pathname, hash]);
  useEffect(() => {
    const names = { '/': 'Trang chủ', '/san-pham': 'Sản phẩm', '/dang-nhap': 'Đăng nhập', '/dang-ky': 'Đăng ký', '/dang-xuat': 'Đăng xuất', '/admin/products': 'Quản lý sản phẩm', '/admin/categories': 'Quản lý loại sản phẩm', '/tai-khoan': 'Tài khoản', '/admin/customers': 'Quản lý khách hàng', '/admin/suppliers': 'Quản lý nhà cung cấp', '/admin/origins': 'Xuất xứ organic', '/admin/certifications': 'Chứng nhận organic', '/admin/traceability': 'Truy xuất sản phẩm', '/admin/home': 'Quản lý trang chủ' };
    document.title = `${names[pathname] || 'Trang không tồn tại'} | Mộc Organic`;
  }, [pathname]);
  return <Suspense fallback={<ResourceState loading />}><Routes>
    <Route element={<StoreLayout />}>
      <Route index element={<HomePage />} />
      <Route path="san-pham" element={<ProductsPage />} />
      <Route path="products" element={<CatalogRedirect />} />
      <Route element={<ProtectedRoute />}><Route path="tai-khoan" element={<AccountPage />} /></Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>
    <Route path="dang-nhap" element={<AuthPage />} /><Route path="dang-ky" element={<AuthPage mode="register" />} /><Route path="dang-xuat" element={<LogoutPage />} />
    <Route element={<ProtectedRoute roles={STAFF_ROLES} />}>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<DashboardRedirect />} />
        <Route element={<ProtectedRoute admin />}>
          <Route path="home" element={<HomeManagementPage />} />
          <Route path="products" element={<ManagementPage key="products" type="products" />} />
          <Route path="categories" element={<ManagementPage key="categories" type="categories" />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN','SALES_STAFF']} />}><Route path="customers" element={<RecordsPage key="customers" module="customers" />} /></Route>
        <Route path="suppliers" element={<RecordsPage key="suppliers" module="suppliers" />} />
        <Route path="origins" element={<RecordsPage key="origins" module="origins" />} />
        <Route path="certifications" element={<RecordsPage key="certifications" module="certifications" />} />
        <Route path="traceability" element={<TraceabilityPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes></Suspense>;
}
