// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ shop: {}, source: {}, toast: vi.fn() }));
vi.mock('@/contexts/ShopContext', () => ({ useShop: () => mocks.shop }));
vi.mock('@/hooks/useStoreOffers', () => ({ useStoreOffers: () => mocks.source }));
vi.mock('sonner', () => ({ toast: { success: mocks.toast } }));
import { PromotionCard, PromotionBanners } from './PromotionBanners';
const fixture = () => ({ id:'promo', name:'Combo rau', promotionCode:'TESTCOMBO10', promotionType:'combo', discountType:'percentage', discountValue:10,
  minOrderValue:0, startsAt:new Date(Date.now()-60000).toISOString(), endsAt:new Date(Date.now()+60000).toISOString(), productCount:2,
  products:[{ productId:'a',productName:'Cải',slug:'cai',requiredQuantity:1,variants:[{id:'va',price:40000,availableQuantity:5,variantName:'500g'}]},
    {productId:'b',productName:'Cà rốt',slug:'ca-rot',requiredQuantity:1,variants:[{id:'vb',price:30000,availableQuantity:5,variantName:'1kg'}]}] });
let root,container;
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT=true; vi.clearAllMocks(); mocks.shop={cart:[],cartAllowed:true,cartBusy:false,cartLoading:false,addComboToCart:vi.fn().mockResolvedValue(true),setPromoCode:vi.fn()}; mocks.source={offers:[fixture()],now:Date.now(),reload:vi.fn()};container=document.createElement('div');document.body.append(container);root=createRoot(container); });
afterEach(async()=>{await act(async()=>root.unmount());container.remove();});
const render = async (props={}) => act(async()=>root.render(h(MemoryRouter,{},h(PromotionCard,{offer:fixture(),...props}))));
const click = async text => act(async()=>[...container.querySelectorAll('button')].find(b=>b.textContent===text).click());
it('adds the selected variants in one call and prevents a second click while pending',async()=>{
  let complete;mocks.shop.addComboToCart.mockImplementation(()=>new Promise(resolve=>{complete=resolve;}));
  await render();expect(container.textContent).toContain('63.000');
  await click('Thêm combo vào giỏ');await click('Đang thêm…');
  expect(mocks.shop.addComboToCart).toHaveBeenCalledTimes(1);
  expect(mocks.shop.addComboToCart).toHaveBeenCalledWith(expect.objectContaining({promotionCode:'TESTCOMBO10'}),[{variantId:'va',quantity:1},{variantId:'vb',quantity:1}]);
  await act(async()=>complete(true));
});
it('tells the shopper which item is missing and adds only that item',async()=>{
  mocks.shop.cart=[{id:'a',variantId:'va',quantity:1,minPrice:40000,stock:5}];await render({mode:'cart'});
  expect(container.textContent).toContain('Thêm 1 × Cà rốt');await click('Thêm món còn thiếu');
  expect(mocks.shop.addComboToCart).toHaveBeenCalledWith(expect.anything(),[{variantId:'vb',quantity:1}]);
});
it('lets an already complete cart choose the code without adding more items',async()=>{
  mocks.shop.cart=[{id:'a',variantId:'va',quantity:1,minPrice:40000,stock:5},{id:'b',variantId:'vb',quantity:1,minPrice:30000,stock:5}];
  await render({mode:'cart'});await click('Chọn mã TESTCOMBO10');
  expect(mocks.shop.setPromoCode).toHaveBeenCalledWith('TESTCOMBO10');expect(mocks.shop.addComboToCart).not.toHaveBeenCalled();
});
it('shows the relevant buy-together message on a product and no unrelated cart offer',async()=>{
  await render({mode:'product',productId:'a'});expect(container.textContent).toContain('Mua cùng Cà rốt để được giảm 10%');
  await act(async()=>root.render(h(MemoryRouter,{},h(PromotionBanners,{mode:'cart'}))));expect(container.textContent).toBe('');
});
it('disables adding when stock is insufficient and surfaces a failed request without claiming success',async()=>{
  const expired=fixture();expired.products[1].variants[0].availableQuantity=0;
  await render({offer:expired});expect(container.querySelector('.store-offer-action').disabled).toBe(true);
  mocks.shop.addComboToCart.mockResolvedValue(false);await render();await click('Thêm combo vào giỏ');
  expect(container.querySelector('[role="alert"]').textContent).toContain('Chưa thêm được combo');expect(mocks.shop.setPromoCode).not.toHaveBeenCalled();
});
it('uses a carousel only for combos and leaves ordinary promotions out of the banner',async()=>{
  mocks.source.offers=[fixture(),{...fixture(),id:'normal',promotionType:'normal',name:'Mã giảm giá thông thường'}];
  await act(async()=>root.render(h(MemoryRouter,{},h(PromotionBanners))));
  expect(container.querySelectorAll('.combo-carousel-slide')).toHaveLength(1);
  expect(container.textContent).not.toContain('Mã giảm giá thông thường');
});
