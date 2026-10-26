import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import api, { publicApi, getSession, setSession } from './api';
const session={accessToken:'old-token',refreshToken:'refresh-1',sessionId:'login-1',user:{username:'customer',roles:['CUSTOMER']}};
const response=(config,data={})=>({config,data,status:200,statusText:'OK',headers:{}});
const unauthorized=config=>({config,response:{status:401},message:'unauthorized'});
beforeEach(()=>{const values=new Map();vi.stubGlobal('sessionStorage',{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)});vi.stubGlobal('window',{dispatchEvent:vi.fn()});setSession(session);});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
it('refreshes once for simultaneous expired requests and preserves order body/idempotency on retry',async()=>{
  const refresh=vi.spyOn(publicApi,'post').mockResolvedValue({data:{data:{accessToken:'new-token',refreshToken:'refresh-2',tokenType:'Bearer'}}});
  const adapter=vi.fn(async config=>{if(config.headers.Authorization==='Bearer old-token') throw unauthorized(config);return response(config,{ok:true});});
  await Promise.all([api.get('/customers/me',{adapter}),api.post('/orders',{items:[{variantId:'v',quantity:2}]},{adapter,headers:{'Idempotency-Key':'same-key'}})]);
  expect(refresh).toHaveBeenCalledTimes(1);expect(refresh).toHaveBeenCalledWith('/auth/refresh-token',{refreshToken:'refresh-1'});
  expect(getSession()).toEqual({...session,accessToken:'new-token',refreshToken:'refresh-2',tokenType:'Bearer'});
  const order=adapter.mock.calls.map(([c])=>c).filter(c=>c.url==='/orders').at(-1);
  expect(order.headers['Idempotency-Key']).toBe('same-key');expect(JSON.parse(order.data)).toEqual({items:[{variantId:'v',quantity:2}]});
  expect(window.dispatchEvent.mock.calls.map(([e])=>e.type)).toEqual(['moc:session-refreshed']);
});
it('does not destroy the session for a temporary refresh API outage',async()=>{
  const outage={response:{status:503}};vi.spyOn(publicApi,'post').mockRejectedValue(outage);
  await expect(api.get('/payments/payment-id',{adapter:async c=>{throw unauthorized(c);}})).rejects.toBe(outage);
  expect(getSession()).toEqual(session);expect(window.dispatchEvent).not.toHaveBeenCalled();
});
it('expires the session when refresh credentials are rejected, without retry loops',async()=>{
  vi.spyOn(publicApi,'post').mockRejectedValue({response:{status:401}});const adapter=vi.fn(async c=>{throw unauthorized(c);});
  await expect(api.get('/customers/me',{adapter})).rejects.toBeDefined();expect(adapter).toHaveBeenCalledTimes(1);expect(getSession()).toBe(null);
  expect(window.dispatchEvent.mock.calls[0][0].type).toBe('moc:session-expired');
});
it('does not replace a newer login when an earlier refresh completes',async()=>{
  let finish;const started=new Promise(resolve=>{vi.spyOn(publicApi,'post').mockImplementation(()=>{resolve();return new Promise(r=>{finish=r;});});});
  const request=api.get('/customers/me',{adapter:async c=>{throw unauthorized(c);}});await started;
  const other={...session,accessToken:'other-token',sessionId:'login-2',user:{username:'other'}};setSession(other);
  finish({data:{data:{accessToken:'new-token',refreshToken:'refresh-2'}}});await expect(request).rejects.toThrow('thay đổi');expect(getSession()).toEqual(other);
});
