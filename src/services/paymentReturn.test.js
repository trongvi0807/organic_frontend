import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./client/checkoutService',()=>({checkoutService:{payment:vi.fn(),orders:vi.fn()}}));
import { checkoutService } from './client/checkoutService';
import { rememberPayment } from '@/lib/checkoutAttempt';
import { resolvePaymentReturn } from './client/paymentReturnService';
const ref='1de42a5243284c20b999eb030ad6fee8';
const pending={id:'payment-1',orderId:'order-1',gateway:'vnpay',status:'pending',paymentUrl:`https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=${ref}`};
beforeEach(()=>{vi.clearAllMocks();const values=new Map();vi.stubGlobal('sessionStorage',{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)});});
it('resolves the exact VNPay reference with GET payments/id, including paid payments without paymentUrl',async()=>{
  rememberPayment('customer',pending);
  checkoutService.payment.mockResolvedValue({...pending,status:'paid',paymentUrl:null});
  expect((await resolvePaymentReturn({username:'customer',reference:ref})).status).toBe('paid');
  expect(checkoutService.payment).toHaveBeenCalledWith('payment-1'); expect(checkoutService.orders).not.toHaveBeenCalled();
});
it('recovers a pending reference from own paginated orders when the local mapping is missing',async()=>{
  checkoutService.orders.mockResolvedValueOnce({items:[{payments:[{...pending,id:'wrong',paymentUrl:pending.paymentUrl.replace(ref,'2'.repeat(32))}]}],totalPages:2}).mockResolvedValueOnce({items:[{payments:[pending]}],totalPages:2});
  checkoutService.payment.mockResolvedValue({...pending,status:'paid',paymentUrl:null});
  expect((await resolvePaymentReturn({username:'customer',reference:ref})).id).toBe('payment-1');
  expect(checkoutService.orders).toHaveBeenNthCalledWith(2,{page:1,size:50});
  checkoutService.orders.mockClear();
  await resolvePaymentReturn({username:'customer',reference:ref}); expect(checkoutService.orders).not.toHaveBeenCalled();
});
it('never substitutes the latest payment or a success query flag for an unknown reference',async()=>{
  rememberPayment('customer',pending);checkoutService.orders.mockResolvedValue({items:[],totalPages:0});
  await expect(resolvePaymentReturn({username:'customer',reference:'2'.repeat(32)})).rejects.toThrow('Chưa tìm thấy');
  expect(checkoutService.payment).not.toHaveBeenCalled();
});
it('surfaces a genuine payment API outage and never calls an undocumented reference endpoint',async()=>{
  rememberPayment('customer',pending);const outage={response:{status:500}};checkoutService.payment.mockRejectedValue(outage);
  await expect(resolvePaymentReturn({username:'customer',reference:ref})).rejects.toBe(outage);
  expect(checkoutService.orders).not.toHaveBeenCalled();
});
it('direct payment UUIDs use the documented endpoint and malformed VNPay references make no requests',async()=>{
  checkoutService.payment.mockResolvedValue(pending);await resolvePaymentReturn({username:'customer',paymentId:'payment-1'});
  expect(checkoutService.payment).toHaveBeenCalledWith('payment-1');checkoutService.payment.mockClear();
  await expect(resolvePaymentReturn({username:'customer',reference:'invalid/../reference'})).rejects.toThrow('không hợp lệ');expect(checkoutService.payment).not.toHaveBeenCalled();
});
