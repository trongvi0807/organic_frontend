// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/services/admin/fileService', async (original) => ({ ...await original(), excelImportService: { preview: vi.fn(), execute: vi.fn(), template: vi.fn() } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
import { excelImportService, importAttempt } from '@/services/admin/fileService';
import { ExcelImportPanel } from './ExcelImportPanel';
import { OrderForm } from '@/components/procurement/OrderForm';
import { ReceiptForm } from '@/components/procurement/ReceiptForm';
import { ProductImportDialog } from './ProductImportDialog';
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { fullName: 'Nhân viên kho' } }) }));
vi.mock('@/services/admin/procurementService', () => ({ inventoryService: { list: vi.fn(async () => ({ items: [], totalPages: 1 })), batches: vi.fn(async () => ({ items: [], totalPages: 1 })) }, purchaseOrderService: { save: vi.fn(), list: vi.fn(async () => ({ items: [{ id: 'po-1', orderCode: 'PO-1', status: 'approved', supplier: { supplierName: 'NCC01' } }], totalPages: 1 })), get: vi.fn(async () => ({ id: 'po-1', status: 'approved', items: [] })) }, goodsReceiptService: { save: vi.fn() } }));
vi.mock('@/services/admin/managementService', () => ({ supplierService: { list: vi.fn(async () => ({ items: [], totalPages: 1 })) } }));
vi.mock('@/services/admin/supplierCatalogService', () => ({ supplierProducts: vi.fn(async () => []) }));
import { purchaseOrderService } from '@/services/admin/procurementService';

const sha = 'b'.repeat(64), file = new File(['excel'], 'don-mua.xlsx');
const checked = { fileSha256: sha, rowCount: 1, valid: true, canImport: true, errors: [], warnings: ['Chưa tăng tồn kho'], rows: [{ row: 2, values: { supplierCode: 'NCC01', expectedDeliveryDate: '2026-11-05', sku: 'SP01-01', quantity: '10', unitPrice: '30000', note: '' } }] };
let root, container;
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; vi.clearAllMocks(); sessionStorage.clear(); container = document.createElement('div'); document.body.append(container); root = createRoot(container); excelImportService.preview.mockResolvedValue(checked); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
async function click(text) { const button = [...document.querySelectorAll('button')].find((node) => node.textContent.trim() === text); expect(button, text).toBeTruthy(); await act(async () => button.click()); return button; }
async function choose() { const input = document.querySelector('input[type="file"]'); Object.defineProperty(input, 'files', { configurable: true, value: [file] }); await act(async () => input.dispatchEvent(new Event('change', { bubbles: true }))); }
async function panel(props) { await act(async () => root.render(h(ExcelImportPanel, { kind: 'purchase_orders', ...props }))); }
it('offers Excel directly in the purchase creation form, creates only through the Excel API and closes after success', async () => {
  const saved = vi.fn(); excelImportService.execute.mockResolvedValue({ purchaseOrderId: 'new-po', purchaseOrderCode: 'PO-1', purchaseOrderStatus: 'pending_approval' });
  await act(async () => root.render(h(OrderForm, { onSaved: saved, onClose: vi.fn() })));
  await click('Nhập từ Excel'); await click('Tải Excel mẫu'); expect(excelImportService.template).toHaveBeenCalledWith('purchase_orders', undefined);
  await choose(); expect(document.body.textContent).toContain('05-11-2026'); expect(document.body.textContent).toContain('NCC01'); expect(excelImportService.execute).not.toHaveBeenCalled();
  await click('Tạo đơn mua chờ duyệt'); expect(saved).toHaveBeenCalledWith(expect.objectContaining({ purchaseOrderId: 'new-po' })); expect(purchaseOrderService.save).not.toHaveBeenCalled();
});
it('shows row/column errors and blocks confirmation when backend says canImport=false', async () => {
  excelImportService.preview.mockResolvedValue({ ...checked, valid: false, canImport: false, errors: [{ row: 2, column: 'quantity', message: 'must be greater than or equal to 1' }] });
  await panel(); await choose(); expect(document.body.textContent).toContain('Dòng 2: Số lượng: Phải lớn hơn hoặc bằng 1.');
  expect([...document.querySelectorAll('button')].find((b) => b.textContent === 'Tạo đơn mua chờ duyệt').disabled).toBe(true); expect(excelImportService.execute).not.toHaveBeenCalled();
});
it('retries an ambiguous result with exactly the same file, checksum and idempotency key', async () => {
  const saved = vi.fn(); excelImportService.execute.mockRejectedValueOnce({ code: 'ERR_NETWORK' }).mockResolvedValueOnce({ purchaseOrderId: 'po', purchaseOrderCode: 'PO-1' });
  await panel({ onSaved: saved }); await choose(); await click('Tạo đơn mua chờ duyệt');
  expect(document.body.textContent).toContain('chưa nhận được kết quả rõ ràng'); const args = excelImportService.execute.mock.calls[0];
  await click('Kiểm tra / thử lại lần nhập trước'); expect(excelImportService.execute.mock.calls[1]).toEqual(args); expect(args.slice(0, 3)).toEqual(['purchase_orders', file, sha]); expect(saved).toHaveBeenCalledTimes(1);
  expect(importAttempt('purchase_orders', sha)).toBeNull();
});
it('recovers an earlier request after reopening even if fresh preview rejects rows already committed', async () => {
  importAttempt('purchase_orders', sha, { key: 'earlier-key' }); excelImportService.preview.mockResolvedValue({ ...checked, canImport: false, valid: false, errors: [{ row: 2, column: 'sku', message: 'Đã có phiếu nhập' }] });
  excelImportService.execute.mockResolvedValue({ purchaseOrderId: 'old-po' });
  await panel(); await choose(); await click('Kiểm tra / thử lại lần nhập trước'); expect(excelImportService.execute).toHaveBeenCalledWith('purchase_orders', file, sha, 'earlier-key');
});
it('renders commit-time 422 errors and prevents another confirmation until the file is fixed', async () => {
  excelImportService.execute.mockRejectedValue({ response: { status: 422, data: { message: 'Chưa nhập dòng nào', data: { ...checked, canImport: false, errors: [{ row: 2, column: 'sku', message: 'Sản phẩm ngừng hoạt động' }] } } } });
  await panel(); await choose(); await click('Tạo đơn mua chờ duyệt'); expect(document.body.textContent).toContain('Sản phẩm ngừng hoạt động');
  expect([...document.querySelectorAll('button')].find((b) => b.textContent === 'Tạo đơn mua chờ duyệt').disabled).toBe(true); expect(importAttempt('purchase_orders', sha)).toBeNull();
});
it('prevents duplicate confirmation while the first request is pending', async () => {
  let finish; excelImportService.execute.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  await panel(); await choose(); await click('Tạo đơn mua chờ duyệt'); await click('Tạo đơn mua chờ duyệt'); expect(excelImportService.execute).toHaveBeenCalledTimes(1);
  await act(async () => finish({ purchaseOrderId: 'po' }));
});
it('uses the server product import rather than the retired per-row CRUD path and closes the dialog on success', async () => {
  const changed = vi.fn(); excelImportService.execute.mockResolvedValue({ products: [{ id: 'p-1', productCode: 'SP01' }] });
  await act(async () => root.render(h(ProductImportDialog, { onChanged: changed })));
  await click('Nhập Excel'); await choose(); await click('Nhập sản phẩm');
  expect(excelImportService.execute).toHaveBeenCalledWith('products', file, sha, expect.any(String)); expect(changed).toHaveBeenCalledTimes(1); expect(document.querySelector('[role="dialog"]')).toBeNull();
});
it('downloads a receipt template for the selected purchase and creates only a draft receipt via Excel', async () => {
  const saved = vi.fn(); excelImportService.execute.mockResolvedValue({ goodsReceiptId: 'receipt-1', goodsReceiptStatus: 'draft', purchaseOrderId: 'po-1' });
  await act(async () => root.render(h(ReceiptForm, { initialOrderId: 'po-1', onSaved: saved, onClose: vi.fn() })));
  await click('Nhập từ Excel'); await click('Tải Excel mẫu'); expect(excelImportService.template).toHaveBeenCalledWith('goods_receipts', 'po-1');
  await choose(); await click('Tạo phiếu nhập nháp'); expect(excelImportService.execute).toHaveBeenCalledWith('goods_receipts', file, sha, expect.any(String)); expect(saved).toHaveBeenCalledWith(expect.objectContaining({ goodsReceiptStatus: 'draft' }));
});
