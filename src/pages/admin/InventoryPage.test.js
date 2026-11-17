// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn(), batches: vi.fn(), batch: vi.fn(), threshold: vi.fn(), expiryPolicy: vi.fn() }));
const auth = vi.hoisted(() => ({ user: { roles: ['WAREHOUSE_STAFF'] } }));
vi.mock('@/services/admin/procurementService', () => ({ inventoryService: api }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('@/components/procurement/ReorderExportDialog', () => ({ ReorderExportDialog: () => null }));
vi.mock('@/components/ui/field', async original => ({ ...await original(), Select: ({ children, ...props }) => h('select', props, children) }));
import InventoryPage from './InventoryPage';

const row = { variant: { id: 'variant', productId: 'product', productName: 'Cà rốt', sku: 'SKU1', variantName: 'Túi', netQuantity: 1, unitId: 'kg' },
  availableQuantity: 15, reorderLevel: 3, lowStock: false,
  expiry: { onHand: 20, reserved: 3, quarantined: 2, nearestExpiryDate: '2026-11-10', daysRemaining: 2,
    nearExpiryQuantity: 5, clearanceQuantity: 3, expiredQuantity: 1, unknownQuantity: 0, warningDays: null, clearanceDays: null } };
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true; vi.clearAllMocks(); auth.user = { roles: ['WAREHOUSE_STAFF'] };
  api.list.mockResolvedValue({ items: [row], totalPages: 1, totalElements: 1 }); api.get.mockResolvedValue(row);
  api.batches.mockResolvedValue({ items: [], totalPages: 0, totalElements: 0 }); api.expiryPolicy.mockResolvedValue({});
});
async function render(work) {
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  try { await act(async () => root.render(h(MemoryRouter, null, h(InventoryPage)))); await work(host); }
  finally { await act(async () => root.unmount()); host.remove(); }
}
const button = (scope, text) => [...scope.querySelectorAll('button')].find(b => b.textContent === text);
async function enter(element, value) {
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); });
}
it('shows product expiry and quantities, then opens only the relevant lots from a warning', async () => {
  await render(async host => {
    expect(host.textContent).toContain('Hạn gần nhất còn bán được'); expect(host.textContent).toContain('Còn 2 ngày');
    expect(host.textContent).toContain('Đang cách ly');
    await act(async () => button(host, '5 cận hạn').click());
    expect(api.batches).toHaveBeenLastCalledWith(expect.objectContaining({ variantId: 'variant', expiryStatus: 'near_expiry', page: 0 }));
    expect(document.querySelector('[role=dialog]').textContent).toContain('Lô hàng của sản phẩm');
  });
});
it('sends expiry filtering to the server instead of filtering only the visible page', async () => {
  await render(async host => {
    await act(async () => button(host, 'Đã hết hạn').click());
    expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ expiryStatus: 'expired', page: 0 }));
    expect(button(host, 'Đã hết hạn').getAttribute('aria-pressed')).toBe('true');
    await act(async () => button(host, 'Tất cả hạn dùng').click());
    expect(api.list).toHaveBeenLastCalledWith(expect.objectContaining({ expiryStatus: undefined }));
  });
});
it('does not save invalid thresholds and persists custom thresholds against the product', async () => {
  await render(async host => {
    await act(async () => button(host, 'Cảnh báo hạn dùng').click());
    const dialog = document.querySelector('[role=dialog]');
    await act(async () => dialog.querySelector('input[type=checkbox]').click());
    await enter(dialog.querySelector('[aria-label="Số ngày cảnh báo cận hạn"]'), '3');
    await enter(dialog.querySelector('[aria-label="Số ngày đề xuất thanh lý"]'), '7');
    await act(async () => dialog.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(api.expiryPolicy).not.toHaveBeenCalled(); expect(dialog.textContent).toContain('không được vượt 3');
    await enter(dialog.querySelector('[aria-label="Số ngày cảnh báo cận hạn"]'), '7');
    await enter(dialog.querySelector('[aria-label="Số ngày đề xuất thanh lý"]'), '3');
    await act(async () => dialog.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    expect(api.expiryPolicy).toHaveBeenCalledWith('product', { warningDays: 7, clearanceDays: 3 });
    expect(document.querySelector('[role=dialog]')).toBeNull();
  });
});
it('keeps expiry visible but hides configuration from read-only staff', async () => {
  auth.user = { roles: ['EXECUTIVE_DIRECTOR'] };
  await render(async host => { expect(host.textContent).toContain('Còn 2 ngày'); expect(button(host, 'Cảnh báo hạn dùng')).toBeUndefined(); });
});
