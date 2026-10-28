import { describe, expect, it } from 'vitest';
import { convertPurchaseQuantity, purchaseDelivery, receiptCandidates } from './purchaseWorkflow';
import { nextRecordCode } from './recordCodes';
import { calendarDays } from './calendar';

describe('Sequential readable record codes', () => {
  it('starts at 01, handles gaps/old formats and continues past two digits', () => {
    expect(nextRecordCode([], 'code', 'SP')).toBe('SP01');
    expect(nextRecordCode([{ code: 'SP01' }, { code: 'SP09' }, { code: 'MOC-ABC-123' }], 'code', 'SP')).toBe('SP10');
    expect(nextRecordCode([{ code: 'SP99' }], 'code', 'SP')).toBe('SP100');
    expect(nextRecordCode([{ code: 'ncc02' }], 'code', 'NCC')).toBe('NCC03');
    expect(nextRecordCode([{ code: 'SP-09' }], 'code', 'SP-')).toBe('SP-10');
  });
  it('rejects invalid prefixes and exhausted code ranges', () => {
    for (const prefix of ['', '1SP', 'Mã sai', 'x'.repeat(11)]) expect(() => nextRecordCode([], 'code', prefix)).toThrow();
    expect(() => nextRecordCode([{ code: 'SP999999999' }], 'code', 'SP')).toThrow('giới hạn');
  });
});
describe('Receipt eligibility and warehouse quantities', () => {
  it('only offers approved orders with no receipt; editing retains its own receipt', () => {
    const orders = [{ id: 'a', status: 'approved' }, { id: 'b', status: 'approved', goodsReceiptId: 'g' }, { id: 'c', status: 'received' }, { id: 'd', status: 'pending_approval' }, { id: 'e', status: 'cancelled' }];
    expect(receiptCandidates(orders).map((o) => o.id)).toEqual(['a']);
    expect(receiptCandidates(orders, { id: 'g' }).map((o) => o.id)).toEqual(['a', 'b']);
  });
  it('converts cartons to base packages without multiplying prices or fractional stock', () => {
    expect(convertPurchaseQuantity('3', '24')).toBe(72);
    expect(convertPurchaseQuantity('7', '1')).toBe(7);
    for (const [quantity, factor] of [['0', 12], ['-1', 12], ['1.5', 12], ['1', 0], ['1', 1.5], ['', 12], ['1', ''], ['99999999999', 2]]) expect(() => convertPurchaseQuantity(quantity, factor)).toThrow();
  });
  it('counts only confirmed accepted goods, across multiple receipts, for the same purchase', () => {
    const order = { id: 'po', items: [{ id: 'l1', quantityOrdered: 10 }, { id: 'l2', quantityOrdered: 20 }] };
    const receipts = [
      { id: 'g1', purchaseOrderId: 'po', status: 'confirmed', acceptedTotalAmount: 800, items: [{ purchaseOrderDetailId: 'l1', quantityReceived: 4 }, { purchaseOrderDetailId: 'l2', quantityReceived: 10 }] },
      { id: 'g2', purchaseOrderId: 'po', status: 'confirmed', acceptedTotalAmount: 500, items: [{ purchaseOrderDetailId: 'l1', quantityReceived: 3 }, { purchaseOrderDetailId: 'l2', quantityReceived: 5 }] },
      { id: 'draft', purchaseOrderId: 'po', status: 'draft', acceptedTotalAmount: 999, items: [{ purchaseOrderDetailId: 'l1', quantityReceived: 3 }] },
      { id: 'other', purchaseOrderId: 'another', status: 'confirmed', acceptedTotalAmount: 999, items: [{ purchaseOrderDetailId: 'l1', quantityReceived: 50 }] },
    ];
    const result = purchaseDelivery(order, receipts);
    expect(result).toMatchObject({ ordered: 30, received: 22, remaining: 8, receivedValue: 1300 });
    expect(result.pending).toHaveLength(1);
    expect(result.lines.map((line) => line.remaining)).toEqual([3, 5]);
  });
});
describe('Calendar boundaries', () => {
  it('starts weeks on Monday and preserves leap years', () => {
    const days = calendarDays(2024, 1);
    expect(days.filter(Boolean)).toHaveLength(29); expect(days[3]).toBe('2024-02-01');
    expect(days).toContain('2024-02-29'); expect(days.length % 7).toBe(0);
    expect(calendarDays(2025, 1).filter(Boolean)).toHaveLength(28);
    expect(calendarDays(2026, 11).filter(Boolean).at(-1)).toBe('2026-12-31');
  });
});
