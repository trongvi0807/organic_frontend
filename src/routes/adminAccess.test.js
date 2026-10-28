// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Outlet } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ user: null }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user, isAdmin: state.user?.roles.includes('ADMIN') }) }));
vi.mock('@/layouts/AdminLayout', () => ({ AdminLayout: () => h('div',{},h(Outlet)) }));
vi.mock('@/layouts/StoreLayout', () => ({ StoreLayout: () => h(Outlet) }));
vi.mock('@/hooks/useStoreScrollRestoration', () => ({ useStoreScrollRestoration: () => {} }));
vi.mock('@/pages/client/HomePage', () => ({ default: () => h('p',{},'Cửa hàng') }));
vi.mock('@/pages/admin/ManagementPage', () => ({ default: ({type}) => h('p',{},`Trang ${type}`) }));
vi.mock('@/pages/admin/PromotionsPage', () => ({ default: () => h('p',{},'Trang khuyến mãi') }));
vi.mock('@/pages/admin/AdminDashboardPage', () => ({ default: () => h('p',{},'Trang tổng quan') }));
import { AppRoutes } from './AppRoutes';
let root, container;
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT=true; container=document.createElement('div'); document.body.append(container); root=createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
it.each([
  ['WAREHOUSE_STAFF','/admin/products','Trang products'],
  ['SALES_STAFF','/admin/promotions','Trang khuyến mãi'],
  ['ADMIN','/admin/categories','Trang categories'],
  ['WAREHOUSE_STAFF','/admin/categories','Bạn chưa có quyền truy cập'],
  ['WAREHOUSE_STAFF','/admin/promotions','Bạn chưa có quyền truy cập'],
  ['SALES_STAFF','/admin/products','Bạn chưa có quyền truy cập'],
  ['QUAN_LY_CAO_CAP','/admin/products','Bạn chưa có quyền truy cập'],
  ['CUSTOMER','/admin/dashboard','Bạn chưa có quyền truy cập'],
])('checks actual route guards for %s → %s', async (role,path,expected) => {
  state.user={username:role, roles:[role]};
  await act(async () => { root.render(h(MemoryRouter,{initialEntries:[path]},h(AppRoutes))); await new Promise((resolve)=>setTimeout(resolve,20)); });
  expect(container.textContent).toContain(expected);
});
