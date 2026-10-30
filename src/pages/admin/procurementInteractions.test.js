// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ isAdmin: true, user: { fullName: 'Người duyệt', roles: ['ADMIN'] } }) }));
vi.mock('@/services/admin/procurementService', () => ({ purchaseOrderService: { list: vi.fn(), get: vi.fn(), decide: vi.fn() }, goodsReceiptService: { list: vi.fn() }, inventoryService: {} }));
vi.mock('@/services/admin/managementService', () => ({ supplierService: { list: vi.fn() }, originService: {} }));
import { purchaseOrderService, goodsReceiptService } from '@/services/admin/procurementService';
import { supplierService } from '@/services/admin/managementService';
import ProcurementPage from './ProcurementPage';
let root, container;
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; vi.clearAllMocks(); container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function clickText(text) {
  const button = [...document.querySelectorAll('button')].find((node) => node.textContent.trim() === text);
  expect(button, text).toBeTruthy();
  await act(async () => button.click());
}
it('approves with no reason and closes both decision popup and purchase detail after server success', async () => {
  const order = { id: 'po', orderCode: 'PO-1', orderDate: '2026-10-27T09:00:00', status: 'pending_approval', supplier: { id: 'supplier', supplierName: 'Nông trại A' }, createdByEmployee: { fullName: 'Kho A' }, totalAmount: 120000, items: [{ id: 'line', variant: { id: 'v', productName: 'Cà rốt', variantName: 'Gói 1kg', sku: 'SP01-01', netQuantity: 1, unitId: 'kg' }, quantityOrdered: 2, unitPrice: 60000, lineAmount: 120000 }] };
  purchaseOrderService.list.mockResolvedValue({ items: [order], totalPages: 1 });
  purchaseOrderService.get.mockResolvedValue(order);
  purchaseOrderService.decide.mockResolvedValue({ ...order, status: 'approved' });
  supplierService.list.mockResolvedValue({ items: [{ id: 'supplier', supplierName: 'Nông trại A' }], totalPages: 1 });
  goodsReceiptService.list.mockResolvedValue({ items: [], totalPages: 1 });
  await act(async () => root.render(h(MemoryRouter, {}, h(ProcurementPage, { approval: true }))));
  await clickText('Xem'); await clickText('Duyệt đơn');
  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2);
  expect(document.querySelector('textarea')).toBeNull();
  await clickText('Xác nhận');
  expect(purchaseOrderService.decide).toHaveBeenCalledWith('po', 'approve', '');
  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(0);
});
