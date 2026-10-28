import { describe, expect, it } from 'vitest';
import { adminDate, parseAdminDate, inDateRange, orderCreator, matchesSearch } from './adminFormat';
import { filterDocuments, rejectionNote } from './adminOperations';

const filters = { search: '', status: '', supplierId: '', from: '', to: '', person: '', paymentStatus: '', minAmount: '', maxAmount: '' };
describe('Admin dates and identity', () => {
  it.each([
    ['2026-10-26', '26-10-2026'], ['2026-10-26T22:17:00.144385', '26-10-2026'],
    ['2026-10-26T19:02:56Z', '27-10-2026'], ['2026-10-26T23:30:00-03:00', '27-10-2026'],
    ['', '—'], ['not-a-date', '—'], ['2026-02-30', '—'],
  ])('formats %s as %s in Vietnam', (value, result) => expect(adminDate(value)).toBe(result));
  it('keeps local timestamps and converts offset timestamps once', () => {
    expect(adminDate('2026-10-26T22:17:00.144385', true)).toBe('26-10-2026 22:17');
    expect(adminDate('2026-10-26T19:02:56Z', true)).toBe('27-10-2026 02:02');
    expect(adminDate('2026-10-26', true)).toBe('26-10-2026');
  });
  it.each(['1-10-2026', '2026-10-26', '31-04-2026', '29-02-2025', '00-01-2026', '01-13-2026', '01-01-1899'])('rejects invalid date %s', (value) => expect(parseAdminDate(value)).toBe(''));
  it('accepts leap days and rejects invalid time without silently rolling dates', () => {
    expect(parseAdminDate('29-02-2024')).toBe('2024-02-29');
    expect(parseAdminDate('26-10-2026 23:59', true)).toBe('2026-10-26T23:59');
    expect(parseAdminDate('26-10-2026 24:00', true)).toBe('');
    expect(parseAdminDate('26-10-2026 22:60', true)).toBe('');
  });
  it('includes both boundaries using the Vietnam day of a UTC timestamp', () => {
    expect(inDateRange('2026-10-26T18:00:00Z', '2026-10-27', '2026-10-27')).toBe(true);
    expect(inDateRange('2026-10-26T16:59:59Z', '2026-10-27', '')).toBe(false);
    expect(inDateRange(null, '2026-10-26', '')).toBe(false);
  });
  it('never presents the recipient or assigned employee as the order author', () => {
    expect(orderCreator({ receiverName: 'Khách A', assignedEmployeeName: 'Nhân viên B' })).toBe('Chưa có thông tin người lập');
    expect(orderCreator({ createdByEmployee: { fullName: 'Người tạo' } })).toBe('Người tạo');
  });
  it('supports accent-free multiword searches', () => {
    expect(matchesSearch('Cà rốt Đà Lạt · Hộp 500g', 'ca rot da lat')).toBe(true);
    expect(matchesSearch('Cà rốt Đà Lạt', 'ca rot ha noi')).toBe(false);
  });
});
describe('Operational filtering before pagination', () => {
  const purchase = { id: 'po', orderCode: 'PO-01', orderDate: '2026-10-26', supplier: { id: 's1', supplierName: 'Nông trại Đà Lạt' }, status: 'approved', totalAmount: 150000, createdByEmployee: { fullName: 'Trọng Vi' }, items: [{ variant: { productName: 'Cà rốt', variantName: 'Gói 1kg' } }] };
  it('combines supplier, status, date, author, product and amount bounds', () => {
    const query = { ...filters, supplierId: 's1', status: 'approved', from: '2026-10-26', to: '2026-10-26', person: 'trong vi', search: 'ca rot', minAmount: '150000', maxAmount: '150000' };
    expect(filterDocuments([purchase], query)).toEqual([purchase]);
    expect(filterDocuments([purchase], { ...query, supplierId: 's2' })).toEqual([]);
    expect(filterDocuments([purchase], { ...query, from: '2026-10-27' })).toEqual([]);
  });
  it('joins receipt suppliers through purchaseOrderId instead of inventing receipt fields', () => {
    const receipt = { id: 'r', purchaseOrderId: 'po', receiptCode: 'GR-01', receiptDate: '2026-10-26', acceptedTotalAmount: 100000, status: 'draft', receivedByEmployee: { fullName: 'Kho A' }, items: [{ variant: { productName: 'Cà rốt' }, batch: { batchCode: 'LOT-2026' } }] };
    const settings = { receipt: true, orders: new Map([['po', purchase]]) };
    expect(filterDocuments([receipt], { ...filters, supplierId: 's1', search: 'da lat LOT-2026', person: 'kho a' }, settings)).toEqual([receipt]);
    expect(filterDocuments([receipt], { ...filters, supplierId: 's1' }, { receipt: true })).toEqual([]);
  });
  it('filters sales by recipient/phone/payment and quoted total', () => {
    const order = { id: 'sale', orderCode: 'SO-1', orderedAt: '2026-10-25T18:30:00Z', receiverName: 'Nguyễn An', receiverPhone: '0344855913', status: 'preparing', paymentStatus: 'paid', pricing: { totalAmount: 60000, items: [{ productName: 'Táo organic', variantName: 'Hộp 500g' }] } };
    expect(filterDocuments([order], { ...filters, search: 'tao', person: '0344855913', paymentStatus: 'paid', from: '2026-10-26', maxAmount: '60000' }, { sales: true })).toEqual([order]);
    expect(filterDocuments([order], { ...filters, paymentStatus: 'pending' }, { sales: true })).toEqual([]);
  });
  it('finds results beyond the first visible page', () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({ ...purchase, id: `${i}`, orderCode: `PO-${i}` }));
    expect(filterDocuments(rows, { ...filters, search: 'PO-24' }).map((row) => row.id)).toEqual(['24']);
  });
  it('rejects inverted dates and amount ranges', () => {
    expect(filterDocuments([purchase], { ...filters, from: '2026-11-01', to: '2026-10-01' })).toEqual([]);
    expect(filterDocuments([purchase], { ...filters, minAmount: '200000', maxAmount: '100000' })).toEqual([]);
  });
});
describe('Reject decision payload', () => {
  it('requires a dropdown choice and a specific explanation for Other', () => {
    expect(() => rejectionNote('', '')).toThrow('chọn lý do');
    expect(() => rejectionNote('forged', '')).toThrow('chọn lý do');
    expect(() => rejectionNote('other', '  ')).toThrow('lý do cụ thể');
    expect(rejectionNote('quality', '')).toBe('Sản phẩm không đạt chất lượng');
    expect(rejectionNote('other', '  Hàng giao sai  ')).toBe('Khác: Hàng giao sai');
  });
});
