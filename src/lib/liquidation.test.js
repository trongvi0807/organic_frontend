import { expect, it } from 'vitest';
import { liquidationPayload, liquidationTotal } from './liquidation';
const row={batchId:'b',quantity:'2.5',unitPrice:'10000',available:7};
it('preserves batch quantities and computes liquidation value without any conversion',()=>{
  const payload=liquidationPayload({method:'sale',reason:' Hàng cận hạn ',items:[row]});
  expect(payload).toEqual({method:'sale',reasonType:'clearance',reason:'Hàng cận hạn',note:null,items:[{batchId:'b',quantity:2.5,unitPrice:10000}]});
  expect(liquidationTotal([row],'sale')).toBe(25000);
});
it('prevents duplicate batches, use of held stock and sales of expired goods',()=>{
  const input={method:'sale',reason:'Test',items:[row]};
  expect(()=>liquidationPayload({...input,items:[row,row]})).toThrow('lặp');
  expect(()=>liquidationPayload({...input,items:[{...row,available:2}]})).toThrow('không đủ');
  expect(()=>liquidationPayload({...input,items:[{...row,expired:true}]})).toThrow('hết hạn');
});
it('requires positive sale prices and a reason; disposal always has zero proceeds',()=>{
  expect(()=>liquidationPayload({method:'sale',reason:'',items:[row]})).toThrow('lý do');
  expect(()=>liquidationPayload({method:'sale',reason:'Test',items:[{...row,unitPrice:0}]})).toThrow('Giá');
  expect(liquidationPayload({method:'dispose',reason:'Hết hạn',items:[{...row,expired:true}]}).items[0].unitPrice).toBe(0);
  expect(liquidationTotal([row],'dispose')).toBe(0);
});

it('requires disposal for damaged and expired classifications',()=>{
  expect(()=>liquidationPayload({method:'sale',reason:'Hỏng',reasonType:'damaged',items:[row]})).toThrow('tiêu hủy');
  expect(liquidationPayload({method:'dispose',reason:'Hỏng',reasonType:'damaged',items:[row]})).toMatchObject({reasonType:'damaged',method:'dispose',items:[{batchId:row.batchId,quantity:2.5,unitPrice:0}]});
});
