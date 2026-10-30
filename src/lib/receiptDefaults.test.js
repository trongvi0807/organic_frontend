import { expect, it, vi } from 'vitest';
vi.mock('./apiData', () => ({ today: () => '2026-10-29' }));
import { addReceiptDays, applyReceiptOrigins, changeReceiptLine, receiptOriginText } from './receiptDefaults';
import { receiptLines, receiptPayload } from './procurement';

it('defaults manufacturing to the document day and adds ten calendar days across month/year boundaries', () => {
  const order = { items: [{ id: 'line', variant: { productId: 'carrot' }, quantityOrdered: 2 }] };
  const [line] = receiptLines(order, null, '2026-10-29');
  expect(line.manufactureDate).toBe('2026-10-29'); expect(line.expiryDate).toBe('2026-11-08');
  expect(addReceiptDays('2026-12-27')).toBe('2027-01-06');
  expect(addReceiptDays('2028-02-25')).toBe('2028-03-06');
  expect(addReceiptDays('2026-02-30')).toBe(''); expect(addReceiptDays('')).toBe('');
});
it('recalculates automatic shelf life when manufacturing changes but respects a manually chosen expiry', () => {
  const automatic = { manufactureDate: '2026-10-29', expiryDate: '2026-11-08', expiryDateAutomatic: true };
  const changed = changeReceiptLine(automatic, 'manufactureDate', '2026-10-28');
  expect(changed.expiryDate).toBe('2026-11-07');
  const manual = changeReceiptLine(changed, 'expiryDate', '2027-01-01');
  expect(changeReceiptLine(manual, 'manufactureDate', '2026-10-27').expiryDate).toBe('2027-01-01');
});
it('preserves already saved batch dates and origin instead of replacing them with new defaults', () => {
  const order = { items: [{ id: 'line', variant: { productId: 'carrot' }, quantityOrdered: 2 }] };
  const receipt = { items: [{ purchaseOrderDetailId: 'line', quantityReceived: 2, quantityRejected: 0, batch: { manufactureDate: '2026-10-20', expiryDate: '2026-12-20', originDescription: 'Nguồn gốc đã ghi trên lô' } }] };
  const [line] = receiptLines(order, receipt, '2026-10-29');
  expect(line.manufactureDate).toBe('2026-10-20'); expect(line.expiryDate).toBe('2026-12-20');
  expect(applyReceiptOrigins([line], { carrot: 'Xuất xứ mới trong hồ sơ' })[0].originDescription).toBe('Nguồn gốc đã ghi trên lô');
});
it('does not overwrite an origin the user edited while its lookup was still in flight', () => {
  const item = { variant: { productId: 'carrot' }, originDescription: '' };
  expect(applyReceiptOrigins([item], { carrot: 'Đà Lạt · Việt Nam' })[0].originDescription).toBe('Đà Lạt · Việt Nam');
  const edited = changeReceiptLine(item, 'originDescription', 'Nhà sản xuất ghi trên nhãn');
  expect(applyReceiptOrigins([edited], { carrot: 'Đà Lạt · Việt Nam' })[0]).toBe(edited);
  expect(applyReceiptOrigins([changeReceiptLine(item, 'originDescription', '')], { carrot: 'Đà Lạt' })[0].originDescription).toBe('');
  expect(receiptOriginText({ originName: 'Đà Lạt', region: 'Đà Lạt', country: 'Việt Nam', producerName: 'Nông trại xanh' })).toBe('Đà Lạt · Nông trại xanh · Việt Nam');
});
it('keeps UI automatic/edit flags out of the receipt API payload', () => {
  const [line] = receiptLines({ items: [{ id: 'line', variant: { productId: 'carrot' }, quantityOrdered: 2 }] }, null, '2026-10-29');
  const body = receiptPayload({ purchaseOrderId: 'po', note: '', items: [{ ...line, batchCode: 'LO-01' }] });
  expect(body.items[0].manufactureDate).toBe('2026-10-29');
  expect(body.items[0]).not.toHaveProperty('expiryDateAutomatic'); expect(body.items[0]).not.toHaveProperty('originEdited');
});
