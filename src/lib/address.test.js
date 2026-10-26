import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { prepareAddresses, searchAddresses, exactAddress, formatShippingAddress, pointInGeometry, savedAddressToForm } from './address';
import { checkoutFormPayload, PICKUP_STORE } from './checkoutForm';
import { parseCartQuantity } from './cart';
import { paymentReferenceFromUrl } from './paymentReturn';
const data = prepareAddresses(JSON.parse(readFileSync('public/data/address/vietnam.json', 'utf8')));
describe('Current Vietnamese address snapshot and legacy suggestions', () => {
  it('ships a complete attributed snapshot with unique province/ward codes', () => {
    expect(data.provinces).toHaveLength(34); expect(data.wards).toHaveLength(3321);
    expect(new Set(data.wards.map((w) => w.code)).size).toBe(3321);
    expect(data.metadata.license).toBe('CC BY 4.0');
  });
  it('resolves Bến Nghé to current Sài Gòn, including accent-free queries', () => {
    expect(exactAddress(data, 'Phường Bến Nghé, Thành phố Hồ Chí Minh')?.name).toBe('Phường Sài Gòn');
    expect(exactAddress(data, 'Ben Nghe ho chi minh')?.name).toBe('Phường Sài Gòn');
  });
  it('suggests actual wards of old District 1, never wards containing the number 1 elsewhere', () => {
    const results = searchAddresses(data, 'Q.1 TP.HCM', '', 30);
    expect(results.length).toBeGreaterThan(1);
    expect(results.every((w) => w.aliases.some((a) => a[1] === '1'))).toBe(true);
    expect(results.some((w) => w.name === 'Phường Sài Gòn')).toBe(true);
    expect(exactAddress(data, 'Quận 1 Hồ Chí Minh')).toBeNull();
  });
  it('prefers exact current names and resets legacy/ambiguous saved addresses for customer confirmation', () => {
    const ward = exactAddress(data, 'Phường Tân Phú, Thành phố Hồ Chí Minh');
    expect(ward?.name).toBe('Phường Tân Phú');
    const saved = savedAddressToForm({ streetAddress: '36 Đường A', ward: 'Bến Nghé', province: 'Hồ Chí Minh' }, data);
    expect(data.wards.find((w) => w.code === saved.wardCode)?.name).toBe('Phường Sài Gòn');
    expect(savedAddressToForm({ streetAddress: '36 Đường A', ward: 'Không tồn tại', province: 'Hồ Chí Minh' }, data).wardCode).toBe('');
  });
  it('serializes only street/current ward/current province, rejects cross-province combinations', () => {
    const ward = exactAddress(data, 'Bến Nghé Hồ Chí Minh');
    const address = { provinceCode: ward.provinceCode, wardCode: ward.code, street: ' 36 Đường A ' };
    expect(formatShippingAddress(address, data)).toBe('36 Đường A, Phường Sài Gòn, Thành phố Hồ Chí Minh');
    expect(() => formatShippingAddress({ ...address, provinceCode: '01' }, data)).toThrow();
    expect(() => formatShippingAddress({ ...address, street: '' }, data)).toThrow();
  });
  it('matches polygon holes and multipolygons without nearest-centroid guesses', () => {
    const outer = [[0,0],[10,0],[10,10],[0,10],[0,0]], hole = [[3,3],[7,3],[7,7],[3,7],[3,3]];
    expect(pointInGeometry([1,1], { type:'Polygon', coordinates:[outer,hole] })).toBe(true);
    expect(pointInGeometry([5,5], { type:'Polygon', coordinates:[outer,hole] })).toBe(false);
    expect(pointInGeometry([11,1], { type:'MultiPolygon', coordinates:[[outer]] })).toBe(false);
  });
});
describe('Checkout form compatibility and quantity validation', () => {
  it('rejects zero/negative/fractional/blank/non-numeric/excess quantity without clamping', () => {
    for (const v of ['0','-1','1.5','', 'a','1000']) expect(() => parseCartQuantity(v,999)).toThrow();
    expect(parseCartQuantity('12',999)).toBe(12);
    expect(() => parseCartQuantity('100',99)).toThrow('99');
  });
  it('keeps requested pickup/email in backend-supported note fields and never invents a bank-transfer method', () => {
    const values = { receiverName:'An',receiverPhone:'0901234567',email:'a@example.com', note:'Gọi trước', paymentMethod:'cod',promotionCode:'',points:0 };
    const body = checkoutFormPayload(values,[{variantId:'v',quantity:1}],{},data,'pickup');
    expect(body.shippingAddress).toBe(PICKUP_STORE.address); expect(body.note).toContain('a@example.com'); expect(body.note).toContain('Yêu cầu nhận tại cửa hàng');
    expect(body).not.toHaveProperty('email'); expect(body).not.toHaveProperty('fulfillment');
    expect(() => checkoutFormPayload({...values,email:'bad'},[{variantId:'v',quantity:1}],{},data,'pickup')).toThrow('email');
    expect(() => checkoutFormPayload({...values,paymentMethod:'bank_transfer'},[{variantId:'v',quantity:1}],{},data,'pickup')).toThrow('phương thức');
  });
});
describe('VNPay return reference', () => {
  it('extracts only the VNPay transaction reference from the issued link', () => {
    const p={id:'correct',gateway:'vnpay',paymentUrl:'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=abc'};
    expect(paymentReferenceFromUrl(p)).toBe('abc');
    expect(paymentReferenceFromUrl({...p,gateway:'stripe'})).toBe('');
    expect(paymentReferenceFromUrl({...p,paymentUrl:'invalid'})).toBe('');
  });
});
