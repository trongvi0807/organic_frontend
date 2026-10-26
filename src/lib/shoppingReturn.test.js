import {expect,it} from 'vitest';
import {validShoppingReturn} from './shoppingReturn';
import {quantityLimit,selectedCartItems} from './cart';
it('keeps catalog filters, product paths and the exact saved scroll position',()=>{
  for(const to of ['/','/san-pham?q=rau&page=2','/san-pham/ca-rot#chung-nhan','/san-pham/id/abc']) expect(validShoppingReturn({to,y:1468})).toEqual({to,y:1468});
});
it('rejects external, account and malformed return locations',()=>{
  for(const to of ['//evil.example','https://evil.example','/tai-khoan','/san-pham/with space','/san-pham\\evil']) expect(validShoppingReturn({to,y:10}).to).toBe('/san-pham');
  expect(validShoppingReturn({to:'/',y:-1}).y).toBe(0);
});
it('caps cart edits at current stock, preserves unknown-stock compatibility and blocks oversold selection',()=>{
  const row={serverCart:true,minPrice:28000,available:true,maxQuantity:999,availableQuantity:3,quantity:2};
  expect(quantityLimit(row)).toBe(3);expect(selectedCartItems([row])).toHaveLength(1);
  expect(selectedCartItems([{...row,quantity:4}])).toHaveLength(0);
  expect(quantityLimit({...row,availableQuantity:0})).toBe(0);
  expect(quantityLimit({...row,availableQuantity:undefined})).toBe(999);
});
