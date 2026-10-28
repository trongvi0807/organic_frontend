// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AdminSidebar from './AdminSidebar';
import AdminSectionTabs from './AdminSectionTabs';
import { activeAdminGroup } from '@/constants/adminNavigation';
import { useAdminPageState } from '@/hooks/useAdminPageState';
import { useAdminUnsavedChanges } from '@/hooks/useAdminUnsavedChanges';
const admin = { roles: ['ADMIN'], username: 'admin' };
let root, container;
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; sessionStorage.clear(); container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.restoreAllMocks(); });
async function render(node, path='/admin/purchase-orders') { await act(async () => root.render(h(MemoryRouter, { initialEntries: [path] }, node))); }
function Tabs() { const { pathname } = useLocation(); return h(AdminSectionTabs, { group: activeAdminGroup(admin, pathname) }); }
it('renders six parent links instead of all nested functions and highlights the whole group', async () => {
  await render(h(AdminSidebar, { user: admin, mobile: false }));
  const links = container.querySelectorAll('nav a');
  expect(links).toHaveLength(6);
  expect(container.querySelector('nav a[aria-current="page"]').textContent).toBe('Kho vận & Mua hàng');
  expect([...links].some((a) => a.textContent === 'Duyệt đơn mua')).toBe(false);
});
it('renders four route tabs and follows links without losing the active group', async () => {
  await render(h(Tabs));
  const nav = container.querySelector('nav'); expect(nav.querySelectorAll('a')).toHaveLength(4);
  expect(nav.querySelector('[aria-current="page"]').textContent).toBe('Đơn mua & Duyệt đơn');
  await act(async () => nav.querySelector('a[href="/admin/goods-receipts"]').click());
  expect(container.querySelector('[aria-current="page"]').textContent).toBe('Phiếu nhập & Duyệt nhập');
});
it('highlights the receipt tab for existing approval URLs and keeps mobile drawer inert when closed', async () => {
  await render(h('div', {}, h(Tabs), h(AdminSidebar, { user: admin, mobile: true, open: false })), '/admin/receipt-approvals');
  expect(container.querySelector('.admin-section-tabs [aria-current="page"]').textContent).toBe('Phiếu nhập & Duyệt nhập');
  expect(container.querySelector('aside').getAttribute('aria-hidden')).toBe('true');
  expect(container.querySelector('aside').hasAttribute('inert')).toBe(true);
});
it('preserves table filters across unmount but isolates them between login sessions', async () => {
  function Filter() { const [value, setValue] = useAdminPageState('qa:filter',''); return h('button', { onClick: () => setValue('Cà rốt') },value || 'Trống'); }
  sessionStorage.setItem('moc.session', JSON.stringify({ sessionId:'one',user:admin }));
  await render(h(Filter)); await act(async () => container.querySelector('button').click());
  await act(async () => root.render(h('div'))); await act(async () => root.render(h(Filter)));
  expect(container.textContent).toBe('Cà rốt');
  sessionStorage.setItem('moc.session', JSON.stringify({ sessionId:'two',user:admin }));
  await act(async () => root.render(h(Filter))); expect(container.textContent).toBe('Trống');
});
it('warns before discarding a dirty modal form and ignores filters outside dialogs', async () => {
  function Screen() { useAdminUnsavedChanges('qa'); return h('div', {}, h('input', { id:'filter' }), h('div', { role:'dialog' },h('form',{},h('input',{id:'form'}))),h('a',{href:'/admin/products'},'Sản phẩm')); }
  const confirm = vi.spyOn(window,'confirm').mockReturnValue(false);
  await render(h(Screen));
  container.querySelector('#filter').dispatchEvent(new Event('input',{bubbles:true}));
  const unloadClean = new Event('beforeunload',{cancelable:true}); window.dispatchEvent(unloadClean); expect(unloadClean.defaultPrevented).toBe(false);
  container.querySelector('#form').dispatchEvent(new Event('input',{bubbles:true}));
  const click = new MouseEvent('click',{bubbles:true,cancelable:true}); container.querySelector('a').dispatchEvent(click);
  expect(confirm).toHaveBeenCalledOnce(); expect(click.defaultPrevented).toBe(true);
});
