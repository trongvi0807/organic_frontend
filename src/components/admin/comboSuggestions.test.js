// @vitest-environment jsdom
import { createElement as h, act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
const auth = vi.hoisted(() => ({ roles: ['ADMIN'] }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { roles: auth.roles } }) }));
vi.mock('@/services/admin/orderService', () => ({ promotionService: { comboSuggestions: vi.fn() } }));
import { promotionService } from '@/services/admin/orderService';
import { ComboSuggestions } from './ComboSuggestions';
let root, container;
beforeEach(() => { auth.roles = ['ADMIN']; vi.clearAllMocks(); globalThis.IS_REACT_ACT_ENVIRONMENT = true; container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const button = text => [...document.querySelectorAll('button')].find(node => node.textContent.includes(text));
it('opens a draft from historical evidence without creating or activating a promotion', async () => {
  const choose = vi.fn();
  promotionService.comboSuggestions.mockResolvedValue({ generatedAt: '2026-11-04T10:00:00', eligibleOrders: 12, costedOrders: 10, excludedCostOrders: 2, message: 'Dữ liệu đơn hoàn tất', combos: [{ products: [{ id: 'a', productCode: 'SP01', productName: 'Rau' }, { id: 'b', productCode: 'SP02', productName: 'Dầu' }], estimatedGrossProfit: 120000, orderCount: 4 }] });
  await act(async () => root.render(h(ComboSuggestions, { onChoose: choose })));
  expect(promotionService.comboSuggestions).not.toHaveBeenCalled();
  await act(async () => button('Đề xuất combo').click());
  expect(document.body.textContent).toContain('4 đơn'); expect(document.body.textContent).toContain('2 đơn thiếu giá vốn');
  await act(async () => button('Tạo bản nháp từ combo').click());
  expect(choose).toHaveBeenCalledWith(expect.objectContaining({ promotionType: 'combo', status: 'draft', productIds: ['a', 'b'], requiredQuantities: { a: 1, b: 1 } }));
});
it('shows a useful empty state instead of manufacturing suggestions', async () => {
  promotionService.comboSuggestions.mockResolvedValue({ combos: [], eligibleOrders: 0, costedOrders: 0, message: 'Chưa đủ đơn hoàn tất' });
  await act(async () => root.render(h(ComboSuggestions, { onChoose: vi.fn() })));
  await act(async () => button('Đề xuất combo').click());
  expect(document.body.textContent).toContain('Chưa đủ đơn hoàn tất'); expect(document.body.textContent).toContain('tạo combo thủ công');
});
it('does not request private suggestions for sales staff', async () => {
  auth.roles = ['SALES_STAFF']; await act(async () => root.render(h(ComboSuggestions, { onChoose: vi.fn() })));
  expect(container.textContent).toBe(''); expect(promotionService.comboSuggestions).not.toHaveBeenCalled();
});
