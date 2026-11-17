// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ user: { roles: ['SALES_STAFF'] } }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('@/services/admin/clearanceService', () => ({ clearanceService: {
  list: vi.fn(), options: vi.fn(), create: vi.fn(), update: vi.fn(), action: vi.fn(), crossSell: vi.fn(),
} }));
import { clearanceService as service } from '@/services/admin/clearanceService';
import { ClearanceOffers } from './ClearanceOffers';

let root, container;
const line = { batchId: 'batch-a', productId: 'product-a', variantId: 'variant-a', productName: 'Đậu hữu cơ',
  variantName: 'Gói 500 g', expiryDate: '2026-12-20', latestSaleEnd: '2026-12-20T00:00', availableQuantity: 8, regularPrice: 50000 };
const button = text => [...document.querySelectorAll('button')].find(item => item.textContent === text);
async function click(text) { await act(async () => button(text).click()); }
async function enter(label, value) {
  const field = [...document.querySelectorAll('label.field')].find(item => item.querySelector(':scope > span')?.textContent === label);
  const input = field.querySelector('input:not([type=hidden])');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.clearAllMocks(); state.user = { roles: ['SALES_STAFF'] };
  service.list.mockResolvedValue([]); service.options.mockResolvedValue([line]);
  service.crossSell.mockResolvedValue([]); service.create.mockResolvedValue({ id: 'new' }); service.action.mockResolvedValue({});
  container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function render() { await act(async () => root.render(h(MemoryRouter, {}, h(ClearanceOffers)))); }

it('requires quality confirmation and a review before saving selected expiry stock', async () => {
  await render(); await click('Lập ưu đãi / combo');
  const selection = document.querySelector('input[type=checkbox]');
  await act(async () => selection.click());
  await enter('Tên chương trình *', 'Ưu đãi đậu hữu cơ');
  await enter('Phần trăm giảm *', '25');
  await enter('Bắt đầu bán *', '16-11-2026 08:00');
  await enter('Ngừng nhận đơn *', '19-11-2026 20:00');
  await click('Xem lại chương trình');
  expect(service.create).not.toHaveBeenCalled();
  expect(button('Lưu bản nháp')).toBeUndefined();
  const quality = [...document.querySelectorAll('input[type=checkbox]')].find(input => input.required);
  await act(async () => quality.click());
  await click('Xem lại chương trình');
  expect(button('Lưu bản nháp')).toBeDefined();
  expect(service.create).not.toHaveBeenCalled();
  await click('Lưu bản nháp');
  expect(service.create).toHaveBeenCalledWith(expect.objectContaining({
    name: 'Ưu đãi đậu hữu cơ', discountPercent: 25, qualityConfirmed: true,
    items: [{ batchId: 'batch-a', quantity: 1, requiredQuantity: 1, expiresAt: null, sellUntilAt: null }],
  }));
});

it('shows approval only for the store manager and submits the versioned proposal', async () => {
  const proposal = { id: 'offer-a', version: 2, name: 'Ưu đãi đậu', status: 'pending_approval',
    promotionType: 'product', discountPercent: 25, items: [{ ...line, quantity: 2, requiredQuantity: 1 }] };
  service.list.mockResolvedValue([proposal]);
  await render(); expect(button('Duyệt')).toBeUndefined();
  state.user = { roles: ['STORE_MANAGER'] };
  await act(async () => root.render(h(MemoryRouter, {}, h(ClearanceOffers))));
  await click('Duyệt');
  expect(document.body.textContent).toContain('Hàng được dành cho chương trình sau khi duyệt');
  await click('Xác nhận');
  expect(service.action).toHaveBeenCalledWith(proposal, 'approve', '');
});
