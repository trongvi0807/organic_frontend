// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import PurchaseRequisitionForm from './forms/PurchaseRequisitionForm';
import PurchaseOrderPrintForm from './forms/PurchaseOrderPrintForm';
import { DottedField, PrintCheckbox, PrintFormTable } from './PrintFormLayout';
import { purchaseOrderPrintData, purchaseRequisitionPrintData } from '@/lib/purchasePrintForms';
import { PurchasePrintPreview } from '@/components/procurement/PurchasePrintPreview';
vi.mock('@/services/admin/purchasePrintService', () => ({ loadPurchasePrintContext: vi.fn(async () => ({ products: { product: { productCode: 'SP01' } }, warnings: [] })), loadPhysicalStock: vi.fn(async () => ({ actualStock: { variant: 25 }, warnings: [] })) }));
import { loadPhysicalStock } from '@/services/admin/purchasePrintService';

const parse = (component) => { const div = document.createElement('div'); div.innerHTML = renderToStaticMarkup(component); return div; };
const twoProducts = [{ id: '1', productCode: 'SP01', productName: 'Cải bó xôi hữu cơ', unit: 'Gói 500g', actualStock: 0, requestedQuantity: 12, quantity: 12, unitPrice: 35000, amount: 420000, reason: 'Bổ sung tồn kho', note: 'Hàng mới' }, { id: '2', productCode: 'SP02', productName: 'Cà rốt hữu cơ', unit: 'Túi 1kg', actualStock: 15, requestedQuantity: 10, quantity: 10, unitPrice: 40000, amount: 400000 }];
const order = { id: 'po', orderCode: 'PO-01', orderDate: '2026-10-27', expectedDeliveryDate: '2026-11-02', status: 'pending_approval', supplier: { id: 'supplier', supplierCode: 'NCC01', supplierName: 'Trang trại xanh' }, createdByEmployee: { fullName: 'Nhân viên mua hàng' }, totalAmount: 120000, items: [{ id: 'line', quantityOrdered: 3, unitPrice: 40000, lineAmount: 120000, variant: { id: 'variant', productId: 'product', productName: 'Rau hữu cơ', variantName: 'Gói 1kg', sku: 'SKU-OTHER', unitId: 'kg' } }] };
let root, host;
afterEach(async () => { if (root) { await act(async () => root.unmount()); root = null; host.remove(); } vi.clearAllMocks(); });

it('renders BM-NV01-01 with the exact five sections, eight columns and six blank rows after two products', () => {
  const dom = parse(h(PurchaseRequisitionForm, { data: { documentNumber: 'DN-001', createdAt: '2026-10-27', department: 'Kho', creatorName: 'Người lập A', items: twoProducts, generalNotes: 'Cần hàng trong tuần', requiredDate: '2026-11-02', suggestedSupplier: 'Trang trại xanh' } }));
  expect(dom.querySelector('article').textContent).toContain('BM-NV01-01');
  expect([...dom.querySelectorAll('.print-form-section-title')].map((node) => node.textContent)).toEqual(['1. Thông tin đề nghị', '2. Danh sách sản phẩm đề nghị nhập hàng', '3. Ghi chú chung', '4. Thời gian và Nhà cung cấp', '5. Xác nhận']);
  expect(dom.querySelectorAll('.print-form-table thead th')).toHaveLength(8); expect(dom.querySelectorAll('.print-form-table tbody tr')).toHaveLength(8); expect(dom.querySelectorAll('.print-empty-row')).toHaveLength(6);
  expect(dom.querySelector('.print-form-table tbody tr').children[4].textContent).toBe('0');
  expect(dom.textContent).toContain('02/11/2026'); expect(dom.querySelectorAll('input')).toHaveLength(0);
});
it('accepts the Vietnamese Golden Reference data keys, including zero stock and dotted blank fields', () => {
  const dom = parse(h(PurchaseRequisitionForm, { data: { soPhieu: 'DN-02', ngayLap: '27/10/2026', boPhan: 'Kho', nguoiLap: 'Người lập', nguoiThuMua: 'Purchasing A', nguoiXacNhan: 'Quản lý', thoiGianCan: '28/10/2026', nccDeXuat: 'NCC A', items: [{ maSP: 'SP01', tenSP: 'Rau', dvt: 'Gói', tonThucTe: 0, slDeNghi: 5, lyDo: 'Hết hàng', ghiChu: 'Giao sớm' }] } }));
  for (const text of ['DN-02', '27/10/2026', '28/10/2026', 'Purchasing A', 'NCC A', 'Hết hàng', 'Giao sớm']) expect(dom.textContent).toContain(text);
  const blank = parse(h(PurchaseRequisitionForm)); expect(blank.textContent).not.toContain('2026'); expect(blank.querySelectorAll('.print-empty-row')).toHaveLength(8); expect(blank.querySelector('.print-dotted-value')).toBeTruthy();
});
it('renders BM-NV01-02 with A–F, two-column blocks, expected totals and the order metadata labels', () => {
  const dom = parse(h(PurchaseOrderPrintForm, { data: { documentNumber: 'PO-99', createdAt: '2026-10-27', items: twoProducts, buyer: { contactName: 'Người mua', phone: '0123456789', email: 'buyer@example.test', receivingLocation: 'Kho A' }, supplier: { name: 'NCC A', code: 'NCC-01', contactName: 'Đại diện A', phone: '0987654321', email: 'ncc@example.test', address: 'Địa chỉ NCC' }, productRequirements: 'Chứng nhận còn hiệu lực', delivery: { expectedDate: '2026-11-02', timeWindow: '08:00–10:00', address: 'Kho A', receiverName: 'Người nhận A', receiverPhone: '0123456789', transportMethod: 'Xe lạnh' }, terms: { paymentMethod: 'Chuyển khoản', paymentDeadline: 'Sau 7 ngày', shippingCost: 0, otherNotes: 'Đối chiếu khi nhận' } } }));
  expect(dom.textContent).toContain('BM-NV01-02'); expect(dom.querySelector('.print-form-metadata').textContent).toContain('Số đơn:'); expect(dom.querySelector('.print-form-metadata').textContent).toContain('Ngày đặt:');
  expect(dom.querySelectorAll('.print-two-columns')).toHaveLength(2); expect(dom.querySelectorAll('.print-form-section')).toHaveLength(6); expect(dom.querySelectorAll('.print-form-table thead th')).toHaveLength(8);
  expect(dom.querySelector('.print-po-totals').textContent).toContain('820.000 đồng'); expect(dom.querySelector('.print-po-totals').textContent).toContain('Tổng số mặt hàng: 2');
  for (const text of ['Khung giờ dự kiến:', 'Người nhận hàng:', 'Chi phí vận chuyển:', '0 đồng', 'Chứng nhận còn hiệu lực']) expect(dom.textContent).toContain(text);
});
it('keeps ordering-side confirmation last and leaves it unstamped, preserving supplier confirmation date in the middle', () => {
  const dom = parse(h(PurchaseOrderPrintForm, { data: { supplierRepresentative: 'Đại diện NCC', supplierConfirmedAt: '2026-11-01', confirmerName: 'Người xác nhận' } }));
  const titles = [...dom.querySelectorAll('.print-form-signatures th')].map((node) => node.textContent);
  expect(titles).toEqual(['Người lập đơn (Purchasing)', 'Đại diện nhà cung cấp', 'Người xác nhận bên đặt']);
  const cells = dom.querySelectorAll('.print-form-signatures td'); expect(cells[1].textContent).toContain('01/11/2026'); expect(cells[1].querySelector('.print-form-stamp')).toBeNull(); expect(cells[2].querySelector('.print-form-stamp')).toBeNull(); expect(cells[2].querySelector('.print-signature-space').textContent).toBe(''); expect(dom.textContent).not.toContain('DẤU MINH HỌA');
});
it('uses actual product codes and stored amounts, leaving missing business information and independent requisition identifiers blank', () => {
  const context = { products: { product: { productCode: 'SP-CODE' } }, actualStock: { variant: 0 } };
  const po = purchaseOrderPrintData(order, context); const req = purchaseRequisitionPrintData(order, context);
  expect(po.items[0].productCode).toBe('SP-CODE'); expect(po.items[0].amount).toBe(120000); expect(req.items[0].actualStock).toBe(0);
  expect(po.buyer.phone).toBeUndefined(); expect(req.documentNumber).toBeUndefined(); expect(req.createdAt).toBeUndefined(); expect(req.confirmerName).toBeUndefined();
  expect(purchaseOrderPrintData(order).items[0].productCode).toBeUndefined(); expect(purchaseOrderPrintData(order).items[0].productCode).not.toBe('SKU-OTHER');
});
it('preserves backend totals instead of recomputing taxes or overwriting amounts with quantity × price', () => {
  const dom = parse(h(PurchaseOrderPrintForm, { data: { totalAmount: 999000, items: [{ quantity: 2, unitPrice: 30000, amount: 55000 }] } }));
  expect(dom.querySelector('.print-po-totals').textContent).toContain('999.000 đồng'); expect(dom.querySelector('.print-form-table tbody tr').textContent).toContain('55.000');
});
it('pads blank tables without dropping rows when there are more than eight products', () => {
  const dom = parse(h(PrintFormTable, { columns: [{ key: 'id', label: 'SP' }], rows: Array.from({ length: 25 }, (_, i) => ({ id: i })) }));
  expect(dom.querySelectorAll('tbody tr')).toHaveLength(25); expect(dom.querySelectorAll('.print-empty-row')).toHaveLength(0);
});
it('supports the dotted zero value and checked/unchecked paper options without interactive input controls', () => {
  const dom = parse(h('div', {}, h(DottedField, { label: 'Giá:', value: 0 }), h(PrintCheckbox, { checked: true, label: 'Phương án A' }), h(PrintCheckbox, { checked: false, label: 'Phương án B' })));
  expect(dom.querySelector('.print-dotted-value').textContent).toBe('0'); expect(dom.querySelectorAll('.print-checkbox-box')[0].textContent).toBe('✓'); expect(dom.querySelectorAll('.print-checkbox-box')[1].textContent).toBe(''); expect(dom.querySelector('input')).toBeNull();
});
it('switches live previews between both UC01 forms and prints the selected form only', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(h(PurchasePrintPreview, { order })));
  expect(host.querySelectorAll('[data-print-form]')).toHaveLength(1); expect(host.querySelector('article').textContent).toContain('BM-NV01-02');
  const choose = [...host.querySelectorAll('button')].find((node) => node.textContent.includes('BM-NV01-01'));
  await act(async () => choose.click()); expect(loadPhysicalStock).toHaveBeenCalledWith(order);
  expect(host.querySelectorAll('[data-print-form]')).toHaveLength(1); expect(host.querySelector('article').textContent).toContain('BM-NV01-01'); expect(host.querySelector('article').textContent).toContain('SP01');
});
