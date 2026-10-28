// @vitest-environment jsdom
import { act, createElement as h, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import PrintFormLayout, { PrintFormSection, PrintFormTable, printDate, printNumber } from './PrintFormLayout';
import PurchaseOrderPrintForm from './forms/PurchaseOrderPrintForm';
import { purchaseOrderPrintData } from '@/lib/purchasePrintForms';

let root, container, print;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); container.id = 'admin-root'; document.body.append(container); root = createRoot(container);
  print = vi.spyOn(window, 'print').mockImplementation(() => {});
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); document.getElementById('organic-print-root')?.remove(); document.body.classList.remove('organic-print-active'); vi.restoreAllMocks(); });
const props = { title: 'Phiếu nhập kho', formCode: 'BM-NV09', documentNumber: 'PN-001', createdAt: '2026-10-27T09:15:00', time: '09:15' };
async function render(extra = {}, children) { await act(async () => root.render(h(PrintFormLayout, { ...props, ...extra }, children))); }
async function click(text) { const button = [...document.querySelectorAll('button')].find((node) => node.textContent === text); expect(button).toBeTruthy(); await act(async () => button.click()); }

it('formats form dates and numbers without inventing missing values', () => {
  expect(printDate('2026-10-27')).toBe('27/10/2026'); expect(printDate('2026-10-26T18:15:00Z')).toBe('27/10/2026');
  expect(printDate(null)).toBe('—'); expect(printDate('2026-02-30')).toBe('—');
  expect(printNumber(1234567)).toBe('1.234.567'); expect(printNumber('1234.56', 2)).toBe('1.234,56'); expect(printNumber(0)).toBe('0'); expect(printNumber(null)).toBe('—'); expect(printNumber('NaN')).toBe('—');
});
it('renders the three-column identity, actual metadata and footer without a generated stamp', async () => {
  await render({}, h(PrintFormSection, { title: 'Thông tin sản phẩm' }, 'Rau hữu cơ'));
  const header = container.querySelector('.print-form-header'); expect(header.children).toHaveLength(3);
  expect(header.textContent).toContain('Healthy Food – Better Life'); expect(header.textContent).toContain('BM-NV09'); expect(header.textContent).toContain('27/10/2026'); expect(header.textContent).toContain('09:15');
  expect(container.querySelector('h1').textContent).toBe('Phiếu nhập kho'); expect(container.querySelectorAll('.print-form-stamp')).toHaveLength(0);
  expect(container.textContent).toContain('KHÔNG CÓ GIÁ TRỊ PHÁP LÝ'); expect(container.textContent).toContain('Vì một cuộc sống xanh và khỏe mạnh hơn!');
});
it.each([2, 3, 4])('supports %i signers and leaves signing/stamping space empty', async (count) => {
  const signatures = Array.from({ length: count }, (_, i) => ({ title: i === count - 1 ? 'Người xác nhận' : `Người ký ${i + 1}`, name: `Tên ${i + 1}` }));
  await render({ signatures });
  const cells = container.querySelectorAll('.print-form-signatures tbody td'); expect(cells).toHaveLength(count);
  expect(cells[count - 1].querySelector('.print-form-stamp')).toBeNull(); expect([...cells].every((cell) => cell.querySelector('.print-signature-space').textContent === '')).toBe(true); expect(cells[0].querySelector('.print-form-stamp')).toBeNull(); expect(cells[count - 1].textContent).toContain(`Tên ${count}`);
});
it('prints only a static copy of the selected form, cleans up after cancelling/finishing, and leaves Admin mounted', async () => {
  await render({}, h('div', {}, h('p', {}, 'Dữ liệu chứng từ'), h('button', { 'data-print-hide': true }, 'Nút không in')));
  await click('In biểu mẫu');
  expect(print).toHaveBeenCalledTimes(1); const copy = document.querySelector('#organic-print-root .print-form-sheet');
  expect(copy.querySelector('.print-form-stamp')).toBeNull(); expect(copy.textContent).not.toContain('DẤU MINH HỌA'); expect(copy.textContent).toContain('Dữ liệu chứng từ'); expect(copy.textContent).not.toContain('Nút không in'); expect(document.body.classList.contains('organic-print-active')).toBe(true);
  expect(container.querySelector('.print-form-sheet')).toBeTruthy(); expect(document.querySelector('#organic-print-root .print-form-toolbar')).toBeNull();
  window.dispatchEvent(new Event('afterprint')); expect(document.getElementById('organic-print-root')).toBeNull(); expect(document.body.classList.contains('organic-print-active')).toBe(false);
});
it('uses browser Save as PDF without claiming to have downloaded a server PDF', async () => {
  await render(); expect(container.textContent).toContain('Save as PDF'); await click('Lưu PDF'); expect(print).toHaveBeenCalledTimes(1);
});
it('handles Ctrl+P and removes the print-only copy if the preview unmounts', async () => {
  await render(); window.dispatchEvent(new Event('beforeprint')); expect(document.getElementById('organic-print-root')).toBeTruthy();
  await act(async () => root.render(null)); expect(document.getElementById('organic-print-root')).toBeNull(); expect(document.body.classList.contains('organic-print-active')).toBe(false);
});
it('selects the requested document when multiple previews are mounted', async () => {
  const selected = createRef(); await act(async () => root.render(h('div', {}, h(PrintFormLayout, { ...props, title: 'Biểu mẫu A' }), h(PrintFormLayout, { ...props, title: 'Biểu mẫu B', ref: selected }))));
  await act(async () => selected.current.print()); window.dispatchEvent(new Event('beforeprint'));
  expect(document.querySelector('#organic-print-root h1').textContent).toBe('Biểu mẫu B'); expect(selected.current.getElement().querySelector('h1').textContent).toBe('Biểu mẫu B');
});
it('waits for preparation, blocks double clicks and reports preparation failure without printing', async () => {
  let finish; const preparing = vi.fn(() => new Promise((resolve) => { finish = resolve; }));
  await render({ onBeforePrint: preparing }); await click('In biểu mẫu'); await click('In biểu mẫu'); expect(preparing).toHaveBeenCalledTimes(1); expect(print).not.toHaveBeenCalled();
  await act(async () => finish()); expect(print).toHaveBeenCalledTimes(1);
  window.dispatchEvent(new Event('afterprint')); print.mockClear();
  await render({ onBeforePrint: async () => { throw new Error('Không tải được dữ liệu chứng từ.'); } }); await click('In biểu mẫu');
  expect(print).not.toHaveBeenCalled(); expect(container.querySelector('[role="alert"]').textContent).toContain('Không tải được'); expect(document.getElementById('organic-print-root')).toBeNull();
});
it('renders numeric tables with repeating headings, empty state, custom cells and real totals', () => {
  const html = renderToStaticMarkup(h(PrintFormTable, { caption: 'Chi tiết', columns: [{ key: 'name', label: 'Tên' }, { key: 'amount', label: 'Thành tiền', numeric: true }], rows: [{ id: 'a', name: 'Táo <script>', amount: 125000 }] }));
  expect(html).toContain('<thead>'); expect(html).toContain('class="print-numeric">125.000'); expect(html).toContain('Táo &lt;script&gt;');
  expect((renderToStaticMarkup(h(PrintFormTable, { columns: [{ key: 'id', label: 'STT' }] })).match(/print-empty-row/g) || []).length).toBe(8);
  const css = readFileSync('src/components/print/print-forms.css', 'utf8');
  expect(css).toContain('size: A4 portrait'); expect(css).toContain('table-header-group'); expect(css).toContain('body.organic-print-active > :not(#organic-print-root)'); expect(css).toContain('print-color-adjust: exact'); expect(css).toContain('min-height: 0 !important');
});
it('uses real purchase data and truthful statuses in a consumer of the common layout', () => {
  const html = renderToStaticMarkup(h(PurchaseOrderPrintForm, { data: purchaseOrderPrintData({ orderCode: 'PO01', orderDate: '2026-10-27', status: 'pending_approval', supplier: { supplierName: 'Nhà cung cấp A' }, createdByEmployee: { fullName: 'Người lập A' }, totalAmount: 100000, items: [{ id: 'item', quantityOrdered: 2, unitPrice: 50000, lineAmount: 100000, variant: { productName: 'Cải hữu cơ', variantName: 'Gói 500g', sku: 'SP01', netQuantity: 500, unitId: 'g' } }] }) }));
  expect(html).toContain('Chờ duyệt'); expect(html).toContain('Người lập A'); expect(html).toContain('100.000'); expect(html).toContain('Cải hữu cơ');
});
