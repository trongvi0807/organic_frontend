import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { StoreLayout } from '@/layouts/StoreLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ProtectedRoute } from './ProtectedRoute';
import HomePage from '@/pages/client/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import { ResourceState } from '@/components/common/ResourceState';

const ProductsPage = lazy(() => import('@/pages/client/ProductsPage'));
const AccountPage = lazy(() => import('@/pages/client/AccountPage'));
const AuthPage = lazy(() => import('@/pages/auth/AuthPage'));
const LogoutPage = lazy(() => import('@/pages/auth/LogoutPage'));
const ManagementPage = lazy(() => import('@/pages/admin/ManagementPage'));

export function AppRoutes() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (hash) requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })); else window.scrollTo(0, 0); }, [pathname, hash]);
  useEffect(() => { const names = { '/': 'Lành từ đất, tốt cho bạn', '/san-pham': 'Sản phẩm tươi lành', '/dang-nhap': 'Đăng nhập', '/dang-ky': 'Đăng ký', '/dang-xuat': 'Đăng xuất', '/admin/products': 'Quản lý sản phẩm', '/admin/categories': 'Quản lý loại sản phẩm', '/tai-khoan': 'Tài khoản' }; document.title = `${names[pathname] || 'Trang không tồn tại'} | Mộc Organic`; }, [pathname]);
  return <Suspense fallback={<ResourceState loading />}><Routes><Route element={<StoreLayout />}><Route index element={<HomePage />} /><Route path="san-pham" element={<ProductsPage />} /><Route element={<ProtectedRoute />}><Route path="tai-khoan" element={<AccountPage />} /></Route><Route path="*" element={<NotFoundPage />} /></Route><Route path="dang-nhap" element={<AuthPage />} /><Route path="dang-ky" element={<AuthPage mode="register" />} /><Route path="dang-xuat" element={<LogoutPage />} /><Route element={<ProtectedRoute admin />}><Route path="admin" element={<AdminLayout />}><Route index element={<Navigate to="products" replace />} /><Route path="products" element={<ManagementPage key="products" type="products" />} /><Route path="categories" element={<ManagementPage key="categories" type="categories" />} /></Route></Route></Routes></Suspense>;
}
