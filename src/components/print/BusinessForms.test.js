// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync, existsSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { businessForms } from '@/constants/businessForms';
import BusinessFormDocument from './BusinessFormDocument';
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { roles: ['WAREHOUSE_STAFF'] } }) }));
vi.mock('@/services/admin/businessFormService', () => ({ canReadFormSource: vi.fn((_, source) => source === 'receipt'), listFormSources: vi.fn(async () => [{ value: 'receipt-1', label: 'NK-001' }]), loadFormData: vi.fn(async () => ({ data: { documentNumber: 'NK-001' }, warnings: [] })) }));
import { listFormSources, loadFormData } from '@/services/admin/businessFormService';
import BusinessFormsPage from '@/pages/admin/BusinessFormsPage';
const parse = (html) => { const node = document.createElement('div'); node.innerHTML = html; return node; };
let root, host;
afterEach(async () => { if (root) { await act(async () => root.unmount()); root = null; host.remove(); } vi.clearAllMocks(); });

it('registers the full 16-form set and the exact six landscape templates visible in the reference', () => {
  expect(businessForms).toHaveLength(16); expect(new Set(businessForms.map((form) => form.code)).size).toBe(16);
  expect(businessForms.filter((form) => form.orientation === 'landscape').map((form) => form.code)).toEqual(['BM-NV02-01', 'BM-NV02-02', 'BM-NV03-02', 'BM-NV03-03', 'BM-NV05-01', 'BM-NV06-03']);
});
it.each(businessForms.map((form) => [form.code, form]))('renders %s with numbered identity, its own table/sections and no generated stamp', (_, form) => {
  const html = renderToStaticMarkup(h(BusinessFormDocument, { formId: form.id })), node = parse(html);
  expect(node.querySelector('article').textContent).toContain(form.code); expect(node.querySelector('h1')).toBeTruthy();
  expect(node.querySelector('article').dataset.orientation).toBe(form.orientation || 'portrait');
  expect(node.querySelectorAll('.print-form-signatures th').length).toBeGreaterThanOrEqual(2);
  expect(node.querySelector('.print-form-stamp')).toBeNull(); expect(html).not.toContain('DẤU MINH HỌA'); expect(html).not.toContain('RedMockStamp');
  expect(node.querySelector('input')).toBeNull();
  node.querySelectorAll('.print-form-table tbody').forEach((body) => expect(body.children.length).toBeGreaterThanOrEqual(6));
});
it('keeps the warehouse inspection, receiving and stocktake tables distinct', () => {
  const headers = (id) => [...parse(renderToStaticMarkup(h(BusinessFormDocument, { formId: id }))).querySelectorAll('.print-form-table thead th')].map((node) => node.textContent);
  expect(headers('receiving_inspection')).toContain('SL thực nhận'); expect(headers('receiving_inspection')).toHaveLength(13);
  expect(headers('goods_receipt')).toContain('Vị trí bảo quản'); expect(headers('goods_receipt')).toHaveLength(12);
  expect(headers('stocktake')).toContain('SL thực tế (kiểm đếm)'); expect(headers('stock_card')).toEqual(['Ngày', 'Chứng từ', 'Diễn giải', 'Nhập', 'Xuất', 'Tồn', 'Người ghi', 'Ghi chú']);
});
it('formats quantities/dates, pads rows, and only ticks options explicitly present in the form data', () => {
  const node = parse(renderToStaticMarkup(h(BusinessFormDocument, { formId: 'stock_disposal', data: { actions: ['Hủy'], items: [{ productCode: 'SP01', productName: 'Rau', expiryDate: '2026-10-28', onHand: 1250, handlingQuantity: 0 }] } })));
  expect(node.textContent).toContain('28/10/2026'); expect(node.textContent).toContain('1.250');
  expect([...node.querySelectorAll('.print-checkbox-box')].filter((box) => box.textContent === '✓')).toHaveLength(1);
  expect(node.querySelectorAll('.print-empty-row')).toHaveLength(5);
});
it('ships licensed local Vietnamese fonts and print page sizes without stamp styles', () => {
  const css = readFileSync('src/components/print/print-forms.css', 'utf8'); expect(css).toContain("font-family: 'Organic Print'"); expect(css).toContain('size: A4 landscape'); expect(css).toContain('size: A4 portrait'); expect(css).not.toContain('.print-form-stamp');
  for (const name of ['NotoSans-Regular.ttf', 'NotoSans-Bold.ttf', 'OFL.txt']) expect(existsSync(`public/fonts/noto-sans/${name}`)).toBe(true);
});
it('opens all templates as blanks but never requests restricted after-sales data for warehouse staff', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(h(MemoryRouter, { initialEntries: ['/admin/business-forms?form=customer_feedback&sourceId=ticket-1'] }, h(BusinessFormsPage))));
  expect(listFormSources).not.toHaveBeenCalled(); expect(loadFormData).not.toHaveBeenCalled(); expect(host.textContent).toContain('vai trò'.replace('vai', 'Vai'));
  expect(host.querySelector('[data-print-form]').textContent).toContain('BM-NV06-01'); expect(host.querySelectorAll('.business-form-catalog button')).toHaveLength(16);
});
it('loads the selected existing receipt into the matching form', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true; host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  await act(async () => root.render(h(MemoryRouter, { initialEntries: ['/admin/business-forms?form=goods_receipt&sourceId=receipt-1'] }, h(BusinessFormsPage))));
  expect(listFormSources).toHaveBeenCalledWith('receipt'); expect(loadFormData).toHaveBeenCalledWith(expect.objectContaining({ id: 'goods_receipt' }), 'receipt-1', ''); expect(host.querySelector('article').textContent).toContain('NK-001');
});
