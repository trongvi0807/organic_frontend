import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AdminDateInput, AdminForm, validationMessage } from './AdminForm';
import { SearchSelect } from './SearchSelect';
import { StructuredAddressFields } from './AdminAddressFields';
import { OrderContents } from '@/components/checkout/OrderUI';

describe('Admin form markup and localized validation', () => {
  it('shows dd-mm-yyyy but keeps ISO in the submitted hidden field', () => {
    const html = renderToStaticMarkup(h(AdminDateInput, { name: 'issuedAt', value: '2026-10-26', required: true }));
    expect(html).toContain('value="26-10-2026"');
    expect(html).toContain('type="hidden" name="issuedAt" value="2026-10-26"');
    expect(html).not.toContain('type="date"');
  });
  it('renders a controlled selection, meaningful combobox label and the correct submitted ID', () => {
    const html = renderToStaticMarkup(h(SearchSelect, { name: 'supplierId', 'aria-label': 'Nhà cung cấp', options: [{ value: 's1', label: 'Nông trại A' }], value: 's1', onChange() {} }));
    expect(html).toContain('role="combobox"');
    expect(html).toContain('value="Nông trại A"');
    expect(html).toContain('type="hidden" name="supplierId" value="s1"');
  });
  it('renders only Province, Ward and Street for an address', () => {
    const html = renderToStaticMarkup(h(AdminForm, {}, h(StructuredAddressFields, { data: { provinces: [], wards: [] }, value: { provinceCode: '', wardCode: '', street: '' }, onChange() {} })));
    expect(html).toContain('Tỉnh / Thành phố'); expect(html).toContain('Xã / Phường / Thị trấn'); expect(html).toContain('Số nhà - Tên đường');
    expect(html).not.toContain('Quận'); expect(html).not.toContain('Huyện');
    expect((html.match(/role="combobox"/g) || []).length).toBe(2);
  });
  it.each([
    [{ valueMissing: true }, 'text', 'Vui lòng nhập hoặc chọn số lượng.'],
    [{ typeMismatch: true }, 'email', 'Địa chỉ email chưa đúng định dạng.'],
    [{ rangeUnderflow: true }, 'number', 'Số lượng phải từ 1 trở lên.'],
    [{ rangeOverflow: true }, 'number', 'Số lượng không được vượt 10.'],
    [{ stepMismatch: true }, 'number', 'Số lượng cần đúng đơn vị nhập (1).'],
    [{ badInput: true }, 'number', 'Số lượng chưa đúng định dạng. Vui lòng kiểm tra lại.'],
  ])('uses Vietnamese for native invalid inputs %j', (validity, type, message) => {
    expect(validationMessage({ closest: () => null, getAttribute: () => 'Số lượng', validity, type, min: '1', max: '10', step: '1' })).toBe(message);
  });
  it('keeps business-specific validation errors and returns no error for valid fields', () => {
    expect(validationMessage({ closest: () => null, getAttribute: () => '', validity: { customError: true }, validationMessage: 'Mã lô đã tồn tại.' })).toBe('Mã lô đã tồn tại.');
    expect(validationMessage({ closest: () => null, getAttribute: () => '', validity: { valid: true } })).toBe('');
  });
  it('rejects whitespace-only required text even when native required validation accepts it', () => {
    expect(validationMessage({ closest: () => null, getAttribute: () => 'Tên sản phẩm', required: true, value: '   ', validity: { valid: true } })).toBe('Vui lòng nhập hoặc chọn tên sản phẩm.');
  });
  it('renders sales line numbering, measures and payment deadline without inventing missing weight', () => {
    const order = { status: 'preparing', paymentStatus: 'paid', paymentMethod: 'cod', pricing: { items: [{ variantId: 'v', productName: 'Cà rốt', variantName: 'Gói 1kg', quantity: 1, unitPrice: 60000, discountAmount: 0, lineAmount: 60000 }] }, paymentDueAt: '2026-10-26T22:17:00' };
    const html = renderToStaticMarkup(h(OrderContents, { order, showMeasures: true }));
    expect(html).toContain('<th>STT</th>'); expect(html).toContain('Đơn vị tính'); expect(html).toContain('Chưa công bố'); expect(html).toContain('26-10-2026 22:17');
  });
});
