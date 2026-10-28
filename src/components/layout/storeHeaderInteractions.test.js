// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ user: undefined, logout: vi.fn(), shop: { cart: [], cartAdded: null, favorites: [], toggleFavorite: vi.fn(), addToCart: vi.fn() }, inbox: { items: [], unread: 0, reloadInbox: vi.fn(), markRead: vi.fn(), inboxLoading: false } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user, logout: state.logout }) }));
vi.mock('@/contexts/ShopContext', () => ({ useShop: () => state.shop }));
vi.mock('@/contexts/NotificationContext', () => ({ useNotifications: () => state.inbox }));
vi.mock('@/services/client/catalogService', () => ({ catalogService: { products: vi.fn() } }));
import { catalogService } from '@/services/client/catalogService';
import { StoreSearch } from './StoreSearch';
import { StoreAccountMenu } from './StoreAccountMenu';
import { StoreCartButton } from './StoreCartButton';
import { NotificationBell } from './NotificationBell';
import { ProductCard } from '@/components/products/ProductCard';

let container, root;
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; vi.clearAllMocks(); state.user = undefined; state.shop.cart = []; state.shop.cartAdded = null; state.inbox.items = []; state.inbox.unread = 0; state.inbox.markRead.mockResolvedValue(); state.logout.mockResolvedValue(); container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.useRealTimers(); });
const render = async (element) => { await act(async () => root.render(h(MemoryRouter, {}, element, h(Location)))); };
function Location() { const location = useLocation(); return h('output', { 'data-location': true }, location.pathname + location.search); }
const click = async (element) => { expect(element).toBeTruthy(); await act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true }))); };
const type = async (input, value) => { await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); }); };
const waitSearch = async () => { await act(async () => { await vi.advanceTimersByTimeAsync(260); }); };
const button = (text) => [...container.querySelectorAll('button')].find((item) => item.textContent.trim() === text);
const product = { id: 'technical-uuid', productCode: 'SP01', productName: 'Cà rốt hữu cơ', slug: 'ca-rot', minPrice: 32000, stock: 10, imageUrl: '/images/carrots.jpg' };

describe('Storefront inline search', () => {
  it('suggests by keyword/code without a modal or navigation, then opens the chosen product', async () => {
    vi.useFakeTimers(); catalogService.products.mockResolvedValue({ items: [product] });
    await render(h(StoreSearch)); await click(container.querySelector('[aria-label="Mở ô tìm sản phẩm"]'));
    const input = container.querySelector('[role="combobox"]'); await type(input, 'SP01'); await waitSearch();
    expect(catalogService.products).toHaveBeenCalledWith({ page: 0, size: 6, keyword: 'SP01' });
    expect(container.textContent).toContain('Cà rốt hữu cơ'); expect(container.textContent).toContain('Mã SP01'); expect(container.textContent).not.toContain('technical-uuid');
    expect(container.querySelector('[role="dialog"]')).toBeNull(); expect(container.querySelector('output').textContent).toBe('/');
    await click(container.querySelector('[role="option"] button')); expect(container.querySelector('output').textContent).toBe('/san-pham/ca-rot');
  });
  it('ignores old search responses and supports keyboard selection', async () => {
    vi.useFakeTimers(); let old;
    catalogService.products.mockImplementation(({ keyword }) => keyword === 'cu' ? new Promise((resolve) => { old = resolve; }) : Promise.resolve({ items: [product] }));
    await render(h(StoreSearch)); await click(container.querySelector('[aria-label="Mở ô tìm sản phẩm"]')); const input = container.querySelector('input');
    await type(input, 'cu'); await waitSearch(); await type(input, 'SP01'); await waitSearch();
    await act(async () => old({ items: [{ ...product, productName: 'Kết quả cũ', slug: 'cu' }] }));
    expect(container.textContent).not.toContain('Kết quả cũ'); expect(container.textContent).toContain('Cà rốt hữu cơ');
    await act(async () => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })));
    expect(container.querySelector('[role="option"]').getAttribute('aria-selected')).toBe('true');
    await act(async () => container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(container.querySelector('output').textContent).toBe('/san-pham/ca-rot');
  });
  it('shows a readable error and retries without stale product cards', async () => {
    vi.useFakeTimers(); catalogService.products.mockRejectedValueOnce(new Error('Offline')).mockResolvedValue({ items: [] });
    await render(h(StoreSearch)); await click(container.querySelector('[aria-label="Mở ô tìm sản phẩm"]')); await type(container.querySelector('input'), 'khong co'); await waitSearch();
    expect(container.textContent).toContain('Chưa tải được gợi ý'); await click(button('Thử lại')); await waitSearch(); expect(container.textContent).toContain('Chưa tìm thấy sản phẩm');
  });
});
describe('Account, cart and notification controls', () => {
  it('opens login/register on hover for guests, and customer orders/logout after login', async () => {
    await render(h(StoreAccountMenu));
    await act(async () => container.querySelector('.store-account').dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
    expect(container.querySelector('a[href="/dang-nhap"]')).toBeTruthy(); expect(container.querySelector('a[href="/dang-ky"]')).toBeTruthy(); expect(button('Đăng xuất')).toBeUndefined();
    state.user = { username: 'quanquan', fullName: 'Nguyễn Quân', roles: ['CUSTOMER'] }; await render(h(StoreAccountMenu));
    await click(container.querySelector('[aria-label="Mở menu tài khoản"]')); expect(container.querySelector('a[href="/don-hang"]')).toBeTruthy(); expect(container.querySelector('a[href="/dang-ky"]')).toBeNull();
    await click(button('Đăng xuất')); expect(state.logout).toHaveBeenCalledTimes(1); expect(container.querySelector('output').textContent).toBe('/');
  });
  it('marks a genuine cart addition prominently but does not animate an initial loaded cart', async () => {
    state.shop.cart = [{ quantity: 3 }]; await render(h(StoreCartButton, { onClick: vi.fn() })); expect(container.querySelector('.cart-just-added')).toBeNull();
    state.shop.cartAdded = { sequence: 1, productName: 'Cà rốt hữu cơ' }; await render(h(StoreCartButton, { onClick: vi.fn() }));
    expect(container.querySelector('.cart-just-added')).toBeTruthy(); expect(container.querySelector('[role="status"]').textContent).toContain('Cà rốt hữu cơ'); expect(container.querySelector('button').getAttribute('aria-label')).toBe('Giỏ hàng, 3 sản phẩm');
    state.shop.cartAdded = null; await render(h(StoreCartButton, { onClick: vi.fn() })); expect(container.querySelector('.cart-just-added')).toBeNull(); expect(container.querySelector('[role="status"]').textContent).toBe('');
  });
  it('prevents duplicate add requests and never shows Added when the request fails', async () => {
    let finish; state.shop.addToCart.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    await render(h(ProductCard, { product })); const add = container.querySelector('.product-add-cta');
    await click(add); await click(add); expect(state.shop.addToCart).toHaveBeenCalledTimes(1); expect(container.textContent).toContain('Đang thêm');
    await act(async () => finish(false)); expect(container.textContent).not.toContain('Đã thêm vào giỏ');
    state.shop.addToCart.mockResolvedValue(true); await click(add); expect(container.textContent).toContain('Đã thêm vào giỏ');
  });
  it('filters notifications, preserves pending order labels and marks the chosen item read before navigation', async () => {
    state.user = { username: 'an', roles: ['CUSTOMER'] };
    state.inbox.items = [{ key: 'a', source: 'order', title: 'Đơn #OM01', message: 'Chờ thanh toán', target: '/don-hang/order-uuid', read: false }, { key: 'b', source: 'promotion', title: 'Ưu đãi XANH10', message: 'Giảm 10%', promotionCode: 'XANH10', target: '/gio-hang', read: false }]; state.inbox.unread = 2;
    await render(h(NotificationBell, { storefront: true })); await click(container.querySelector('[aria-haspopup="dialog"]')); expect(container.textContent).toContain('Chờ thanh toán');
    await click(button('Ưu đãi')); expect(container.textContent).not.toContain('Đơn #OM01'); expect(container.textContent).toContain('XANH10');
    await click([...container.querySelectorAll('li button')].find((item) => item.textContent.includes('Ưu đãi XANH10')));
    expect(state.inbox.markRead).toHaveBeenCalledWith(state.inbox.items[1]); expect(container.querySelector('output').textContent).toBe('/gio-hang');
  });
});
