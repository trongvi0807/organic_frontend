import { beforeEach, expect, it, vi } from 'vitest';
const ring = [[0,0],[5,0],[5,5],[0,5],[0,0]];
beforeEach(() => { vi.resetModules(); vi.stubGlobal('fetch',vi.fn()); });
it('resolves GPS locally using province/ward boundaries; never puts coordinates in a request URL', async () => {
  fetch.mockImplementation(async (url) => ({ ok:true, json:async () => url.endsWith('vietnam.json') ? { provinces:[{code:'79',name:'Thành phố Hồ Chí Minh'}], wards:[{code:'w',name:'Phường A',provinceCode:'79',aliases:[]}] } : {features:[{properties:{code:url.includes('provinces.geojson')?'79':'w'},geometry:{type:'Polygon',coordinates:[ring]}}]} }));
  const { addressAtCoordinates } = await import('./client/addressService');
  expect((await addressAtCoordinates(1.12345,1.54321)).code).toBe('w');
  const urls=fetch.mock.calls.map((c)=>c[0]); expect(urls.some((u)=>u.includes('wards-79.geojson'))).toBe(true);
  expect(urls.every((u)=>!u.includes('1.12345')&&!u.includes('1.54321'))).toBe(true);
});
it('refuses ambiguous boundary overlap instead of silently selecting the nearest ward', async () => {
  fetch.mockImplementation(async (url) => ({ok:true,json:async()=>url.endsWith('vietnam.json')?{provinces:[{code:'79',name:'TP'}],wards:[{code:'w',name:'A',provinceCode:'79',aliases:[]}]}:{features:(url.includes('provinces.geojson')?['79']:['w','other']).map((code)=>({properties:{code},geometry:{type:'Polygon',coordinates:[ring]}}))}}));
  const { addressAtCoordinates } = await import('./client/addressService');
  await expect(addressAtCoordinates(1,1)).rejects.toThrow('ranh giới');
});
