import { expect, it } from 'vitest';
import { validateRewardPoints } from './rewardPoints';
it('allows opting out without rewards data; rejects positive points before the balance is verified', () => {
  expect(validateRewardPoints('0',null)).toBe(0);
  expect(() => validateRewardPoints('1',null)).toThrow('Chưa kiểm tra');
});
it('blocks customers with no earned/available points, including a fully reserved balance', () => {
  expect(() => validateRewardPoints('1',{balance:0,reserved:0,available:0,redeemLimit:50})).toThrow('chưa có điểm');
  expect(() => validateRewardPoints('1',{balance:5,reserved:5,available:0,redeemLimit:50})).toThrow('chưa có điểm');
});
it('uses available points rather than total balance and respects the server redemption limit', () => {
  const rewards = {balance:10,reserved:8,available:2,redeemLimit:50};
  expect(validateRewardPoints('2',rewards)).toBe(2);
  expect(() => validateRewardPoints('3',rewards)).toThrow('2 điểm khả dụng');
  expect(() => validateRewardPoints('51',{available:100,redeemLimit:50})).toThrow('50');
  expect(() => validateRewardPoints('11',{available:100,redeemLimit:10})).toThrow('10');
});
it('rejects negative, fractional, empty, non-numeric and unsafe values without clamping', () => {
  for(const value of ['-1','1.5','','foo','9007199254740992']) expect(() => validateRewardPoints(value,{available:100,redeemLimit:50})).toThrow('số nguyên');
});
