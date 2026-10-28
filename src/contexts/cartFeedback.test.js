// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ get: vi.fn(), add: vi.fn(), success: vi.fn(), error: vi.fn(), session: { user: { username: 'an', roles: ['CUSTOMER'] }, accessToken: 'test-only', sessionId: 'test-session' } }));
vi.mock('./AuthContext', () => ({ useAuth: () => ({ user: mocks.session.user }) }));
vi.mock('@/services/api', () => ({ DEMO_MODE: false, getSession: () => mocks.session }));
vi.mock('@/services/client/cartService', () => ({ createCartService: () => ({ get: mocks.get, add: mocks.add }) }));
vi.mock('@/services/client/catalogService', () => ({ catalogService: {} }));
vi.mock('sonner', () => ({ toast: { success: mocks.success, error: mocks.error, dismiss: vi.fn() } }));
import { ShopProvider, useShop } from './ShopContext';
let root, container, shop;
function Probe() { shop = useShop(); return h('output', {}, shop.cartAdded ? shop.cartAdded.productName : 'Chưa thêm'); }
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; vi.clearAllMocks(); localStorage.clear(); mocks.get.mockResolvedValue({ items: [{ productId: 'p', variantId: 'v', quantity: 2, unitPrice: 32000, available: true }] }); container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
it('emits prominent cart feedback only after successful add, with a view-cart action preserving the browsing position', async () => {
  await act(async () => root.render(h(MemoryRouter, { initialEntries: ['/san-pham?q=rau'] }, h(ShopProvider, {}, h(Probe)))));
  expect(shop.cart).toHaveLength(1); expect(shop.cartAdded).toBeNull(); expect(mocks.success).not.toHaveBeenCalled();
  mocks.add.mockResolvedValue({ items: [{ productId: 'p', variantId: 'v', quantity: 3, unitPrice: 32000, available: true }] });
  await act(async () => expect(await shop.addToCart({ id: 'p', defaultVariantId: 'v', productName: 'Cà rốt' })).toBe(true));
  expect(shop.cartAdded.productName).toBe('Cà rốt'); expect(shop.cart[0].quantity).toBe(3);
  expect(mocks.success).toHaveBeenCalledExactlyOnceWith('Đã thêm vào giỏ hàng!', expect.objectContaining({ action: { label: 'Xem giỏ hàng', onClick: expect.any(Function) }, position: 'top-right' }));
});
it('does not announce success after a failed add, even if the recovery read refreshed the cart', async () => {
  await act(async () => root.render(h(MemoryRouter, {}, h(ShopProvider, {}, h(Probe)))));
  mocks.add.mockRejectedValue({ response: { status: 409, data: { message: 'Không đủ tồn kho' } } });
  await act(async () => expect(await shop.addToCart({ id: 'p', defaultVariantId: 'v', productName: 'Cà rốt' })).toBe(false));
  expect(shop.cartAdded).toBeNull(); expect(mocks.success).not.toHaveBeenCalled(); expect(mocks.error).toHaveBeenCalledWith('Không đủ tồn kho');
});
