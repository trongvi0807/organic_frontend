import { describe, it, expect } from 'vitest';
import { orderPayload, receiptLines, receiptPayload } from './procurement';
import { numberInputDisplay, numberInputValue, purchaseMoney, purchaseUnit, purchaseProductChoices } from './purchaseDocuments';
describe('purchase document units and Vietnamese amounts', () => {
  it('keeps never-purchased catalogue items while prioritizing previously purchased variants and removing selected rows', () => {
    const rows=[{variant:{id:'new',productName:'Cải',sku:'A'},purchasedBefore:false},{variant:{id:'old',productName:'Táo',sku:'B'},purchasedBefore:true},{variant:{id:'selected',productName:'Xoài',sku:'C'},purchasedBefore:false}];
    expect(purchaseProductChoices(rows,['selected']).map(v=>v.id)).toEqual(['old','new']);
  });
  it('sends selected kg and raw quantity/price without package conversion', () => {
    const payload=orderPayload({ supplierId:'s', note:'', items:[{variantId:'v',purchaseUnit:'kg',quantity:'2.5',unitPrice:'50000'}] });
    expect(payload.items[0]).toEqual({variantId:'v',purchaseUnit:'kg',quantity:2.5,unitPrice:50000});
    expect(purchaseMoney(payload.items[0].quantity*payload.items[0].unitPrice)).toBe('125.000 VNĐ');
  });
  it('keeps the purchase unit on receipt lines and allows decimal accepted/rejected measurements', () => {
    const items=receiptLines({items:[{id:'l',variant:{variantName:'Hộp 500g'},purchaseUnit:'kg',quantityOrdered:2.5,quantityAvailableToReceive:2.5,unitPrice:50000}]},null,'2026-11-05');
    expect(purchaseUnit(items[0])).toBe('kg');
    const payload=receiptPayload({purchaseOrderId:'p',note:'',items:items.map(x=>({...x,quantityReceived:2,quantityRejected:0.5,discrepancyReason:'Hàng dập',batchCode:'B',expiryDate:'2099-01-01'}))});
    expect(payload.items[0].quantityReceived).toBe(2);expect(payload.items[0].quantityRejected).toBe(0.5);
  });
  it('formats grouped input without turning a thousand separator into a decimal', () => {
    expect(numberInputDisplay('1250000.50')).toBe('1.250.000,50');
    expect(numberInputValue('1.250.000,50',2)).toBe('1250000.50');
    expect(numberInputValue('1.250,5')).toBe('1250.5');
    expect(numberInputValue('1,2345',3)).toBeNull();
  });
});
