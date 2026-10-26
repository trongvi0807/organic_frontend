// Endpoint numbers and request shapes come from the user's PDF, not backend extensions.
import { beforeEach, expect, it, vi } from 'vitest';
import contract from '../../docs/api-contract.json';
vi.mock('./api', () => {
  const transport = () => Object.fromEntries(['get','post','put','patch','delete','request'].map(method=>[method,vi.fn()]));
  const privateApi=transport(),publicApi=transport();
  return {default:privateApi,publicApi,DEMO_MODE:false,unwrap:r=>r.data.data,refreshSession:()=>publicApi.post('/auth/refresh-token',{refreshToken:'qa-refresh'}).then(r=>r.data.data)};
});
import api, {publicApi} from './api';
import {authService} from './auth/authService';
import {homeService} from './client/homeService';
import {homeAdminService} from './admin/homeAdminService';
import {catalogService} from './client/catalogService';
import {productService} from './admin/productService';
import {categoryService} from './admin/categoryService';
import {customerService,supplierService,originService,certificationService,traceabilityService} from './admin/managementService';
import {createProfileService} from './client/profileService';
import {createCartService} from './client/cartService';
import {checkoutService} from './client/checkoutService';
import {orderService,promotionService} from './admin/orderService';
import {purchaseOrderService,goodsReceiptService,inventoryService} from './admin/procurementService';
import {notificationService} from './admin/notificationService';
import {reviewService} from './client/reviewService';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const paging={page:0,size:20};
const profile={fullName:'Khách QA',phoneNumber:'0901234567',email:'qa@example.com',dateOfBirth:'2000-01-01'};
const address={label:'Nhà',receiverName:'Khách QA',receiverPhone:'0901234567',province:'Hồ Chí Minh',ward:'Phường Sài Gòn',streetAddress:'1 đường QA',isDefault:true};
const customer={...profile,customerId:'QA001',membershipStatus:'regular',registrationDate:'2026-10-26',rewardPoints:0,status:'active',accountId:A};
const supplier={supplierCode:'NCC001',supplierName:'NCC QA',taxCode:'1234567890',contactPerson:'QA',phoneNumber:'0901234567',email:'qa@example.com',address:'QA',status:'active'};
const origin={originCode:'QA001',originName:'Vườn QA',countryCode:'VN',country:'Việt Nam',region:'Lâm Đồng',producerName:'QA',address:'QA',description:'QA',supplierId:A,status:'active'};
const cert={certificateName:'Chứng nhận QA',certificateNumber:'QA001',issuingOrganization:'QA',issuedAt:'2026-01-01',expiresAt:'2027-01-01'};
const category={categoryCode:'RAU',categoryName:'Rau QA',description:'QA',status:'active',parentId:null};
const product={productCode:'SP001',productName:'Rau QA',slug:'rau-qa',categoryId:A,brandId:null,description:'QA',status:'draft',organicClaimStatus:'pending',certificationIds:[]};
const variant={sku:'QA-500',variantName:'Gói 500g',netQuantity:'500',unitId:'g',sellingPrice:'28000',compareAtPrice:'32000',barcode:'',reorderLevel:'5',status:'active'};
const image={imageUrl:'https://example.com/qa.png',altText:'Ảnh QA',sortOrder:0,isPrimary:true};
const checkout={items:[{variantId:A,quantity:1}],receiverName:'Khách QA',receiverPhone:'0901234567',shippingAddress:'Địa chỉ QA',note:null,paymentMethod:'vnpay',promotionCode:null,points:0};
const promo={promotionCode:'QA10',name:'QA',description:'QA',discountType:'percentage',discountValue:10,maxDiscountAmount:10000,minOrderValue:0,startDate:'2026-01-01T00:00',endDate:'2027-01-01T00:00',usageLimit:10,perUserLimit:1,status:'active',productIds:[A],batchIds:[]};
const purchase={supplierId:A,expectedDeliveryDate:'2027-01-01',note:'QA',items:[{variantId:A,quantity:1,unitPrice:10000}]};
const receipt={purchaseOrderId:A,receivedAt:'2026-10-26T10:00',note:'QA',items:[{purchaseOrderDetailId:B,batchCode:'QA',manufacturingDate:'2026-10-01',expiryDate:'2027-10-01',acceptedQuantity:1,rejectedQuantity:0,note:null}]};
const file=new File(['qa'],'qa.png',{type:'image/png'});
const cases=[];const add=(number,run)=>cases.push({number,run});
add(1,()=>authService.register({username:'customer',password:'Organic@123',confirmPassword:'Organic@123',...profile}));add(2,()=>authService.verifyOtp({email:profile.email,otp:'123456'}));add(3,()=>authService.resendOtp(profile.email));add(4,()=>authService.refresh());add(5,()=>authService.logout());add(6,()=>authService.login({username:'customer',password:'Organic@123',rememberMe:false}));
add(7,()=>homeService.get());add(8,()=>homeService.content());add(9,()=>homeService.products('featured'));add(10,()=>homeService.categories());add(11,()=>homeService.origins());add(12,()=>homeService.certifications());add(13,()=>homeService.statistics());
add(14,()=>homeAdminService.products(paging));add(15,()=>homeAdminService.content());add(16,()=>homeAdminService.saveContent({siteName:'Mộc QA',headline:'QA',introduction:'QA',contactEmail:profile.email,banners:[],highlights:[],faqs:[]}));add(17,()=>homeAdminService.featured(A,true,1));add(18,()=>homeAdminService.refresh());
add(19,()=>catalogService.categories(paging));add(20,()=>catalogService.category(A));add(21,()=>catalogService.products({...paging,keyword:'rau',categoryId:A,brandId:B,sortBy:'createdAt',direction:'desc'}));add(22,()=>catalogService.product(A));add(23,()=>catalogService.productBySlug('rau-qa'));add(24,()=>catalogService.related(A));add(25,()=>reviewService.list(A,{...paging,rating:5,sort:'newest'}));
add(26,()=>categoryService.list(paging));add(27,()=>categoryService.get(A));add(28,()=>categoryService.save(null,category));add(29,()=>categoryService.save(A,category));add(30,()=>categoryService.remove(A));
add(31,()=>productService.options());add(32,()=>productService.list(paging));add(33,()=>productService.get(A));add(34,()=>productService.save(null,product));add(35,()=>productService.save(A,product));add(36,()=>productService.remove(A));add(37,()=>productService.saveVariant(A,null,variant));add(38,()=>productService.saveVariant(A,B,variant));add(39,()=>productService.removeVariant(A,B));add(40,()=>productService.saveImage(A,null,image));add(41,()=>productService.saveImage(A,B,image));add(42,()=>productService.removeImage(A,B));
add(43,()=>customerService.list(paging));add(44,()=>customerService.get(A));add(45,()=>customerService.save(null,customer));add(46,()=>customerService.save(A,customer));add(47,()=>customerService.archive(A));
for(const [id,start] of [[A,48],['me',55]]){const p=createProfileService(id);add(start,()=>p.uploadAvatar(file));add(start+1,()=>p.deleteAvatar());add(start+2,()=>p.saveAddress(null,address));add(start+3,()=>p.saveAddress(B,address));add(start+4,()=>p.removeAddress(B));}
add(53,()=>createProfileService().get());add(54,()=>createProfileService().save(profile));
for(const [s,values,start] of [[supplierService,supplier,60],[originService,origin,65],[certificationService,cert,71]]){add(start,()=>s.list(paging));add(start+1,()=>s.get(A));add(start+2,()=>s.save(null,values));add(start+3,()=>s.save(A,values));if(start!==71)add(start+4,()=>s.archive(A));}
add(70,()=>originService.products(A,paging));add(75,()=>certificationService.review(A,{status:'approved',note:'QA'}));add(76,()=>certificationService.archive(A));add(77,()=>certificationService.restore(A));add(78,()=>certificationService.upload(A,file));add(79,()=>certificationService.deleteDocument(A));add(80,()=>certificationService.products(A,paging));
add(81,()=>traceabilityService.list(paging));add(82,()=>traceabilityService.get(A));add(83,()=>traceabilityService.setOrigin(A,B));add(84,()=>traceabilityService.removeOrigin(A));add(85,()=>traceabilityService.attach(A,B));add(86,()=>traceabilityService.detach(A,B));
const cart=createCartService(true);add(87,()=>cart.get());add(88,()=>cart.add(A,1));add(89,()=>cart.quantity(A,2));add(90,()=>cart.remove(A));add(91,()=>cart.clear());add(92,()=>cart.merge());
add(93,()=>checkoutService.preview(checkout));add(94,()=>checkoutService.create(checkout,'qa-contract-key'));add(95,()=>checkoutService.orders(paging));add(96,()=>checkoutService.order(A));add(97,()=>checkoutService.cancel(A));add(98,()=>checkoutService.methods());add(99,()=>checkoutService.initiate(A,'vnpay'));add(100,()=>checkoutService.payment(A));add(101,()=>checkoutService.sync(A));add(102,()=>checkoutService.capture(A));add(103,()=>checkoutService.promotions(paging));add(104,()=>checkoutService.rewards());add(105,()=>checkoutService.transactions(paging));
add(106,()=>orderService.reviewPayments(paging));add(107,()=>orderService.list(paging));add(108,()=>orderService.get(A));add(109,()=>orderService.prepare(A));add(110,()=>orderService.complete(A));add(111,()=>orderService.book(A,{carrier:'QA',trackingCode:'QA01',driverName:'QA',driverPhone:'0901234567',shippingCost:0,note:null}));add(112,()=>orderService.shipment(A,{status:'delivered',note:null}));add(113,()=>orderService.collect(A));add(114,()=>orderService.reconcile(A));add(115,()=>promotionService.list(paging));add(116,()=>promotionService.get(A));add(117,()=>promotionService.save(null,promo));add(118,()=>promotionService.save(A,promo));add(119,()=>promotionService.deactivate(A));
add(120,()=>purchaseOrderService.list(paging));add(121,()=>purchaseOrderService.get(A));add(122,()=>purchaseOrderService.save(null,purchase));add(123,()=>purchaseOrderService.save(A,purchase));add(124,()=>purchaseOrderService.decide(A,'approve','QA'));add(125,()=>purchaseOrderService.decide(A,'reject','QA'));add(126,()=>purchaseOrderService.decide(A,'cancel','QA'));
add(127,()=>goodsReceiptService.list(paging));add(128,()=>goodsReceiptService.get(A));add(129,()=>goodsReceiptService.save(null,receipt));add(130,()=>goodsReceiptService.save(A,receipt));add(131,()=>goodsReceiptService.submit(A));add(132,()=>goodsReceiptService.decide(A,'approve','QA'));add(133,()=>goodsReceiptService.decide(A,'reject','QA'));add(134,()=>inventoryService.batches(paging));add(135,()=>inventoryService.batch(A));add(136,()=>inventoryService.list(paging));add(137,()=>inventoryService.get(A));add(138,()=>inventoryService.threshold(A,10));
add(139,()=>notificationService.list(paging));add(140,()=>notificationService.read(A));add(141,()=>notificationService.retry(A));add(142,()=>notificationService.register('qa-device'));add(143,()=>notificationService.unregister('qa-device'));
add(144,()=>reviewService.eligibleItems(paging));add(145,()=>reviewService.mine(paging));add(146,()=>reviewService.get(A));add(147,()=>reviewService.submit(A,{rating:5,title:'QA',content:'Sản phẩm kiểm thử'}));add(148,()=>reviewService.update(A,{rating:5,title:'QA',content:'Sản phẩm kiểm thử'}));add(149,()=>reviewService.remove(A));add(150,()=>reviewService.uploadMedia(A,file));add(151,()=>reviewService.updateMedia(A,B,{altText:'QA',sortOrder:0}));add(152,()=>reviewService.removeMedia(A,B));
const captured=[];
beforeEach(()=>{
  vi.clearAllMocks();captured.length=0;
  for(const [client,transport] of [['private',api],['public',publicApi]]) for(const method of Object.keys(transport)) transport[method].mockImplementation(async (url,data,config)=>{
    const call=method==='request'?{...url,method:url.method.toUpperCase(),client}:{method:method.toUpperCase(),url,data:['get','delete'].includes(method)?data?.data:data,params:['get','delete'].includes(method)?data?.params:config?.params,headers:['get','delete'].includes(method)?data?.headers:config?.headers,client};captured.push(call);
    const list=[{orderDetailId:B,productId:A,reviewCount:0}];
    const payload=call.url==='/reviews/eligible-items'?{content:list,totalPages:1}:/\/home\/(products|categories|origins|certifications)$|\/related$|reward-transactions$/.test(call.url)?[]:{content:[],items:[],totalPages:0,totalElements:0};
    return {data:{statusCode:200,data:payload}};
  });
});
function routePattern(path){return new RegExp('^'+path.replace('/api/v1','').replace(/\{[^}]+\}/g,'[^/]+')+'$');}
it('covers all 152 browser-callable endpoints; provider callbacks stay outside frontend services',()=>{
  expect(cases.map(c=>c.number).sort((a,b)=>a-b)).toEqual(contract.endpoints.filter(e=>e.frontend).map(e=>e.number));
  expect(contract.endpoints.filter(e=>!e.frontend).map(e=>e.number)).toEqual([153,154,155]);
});
for(const testCase of cases) it(`PDF API ${String(testCase.number).padStart(3,'0')}: method/path/input`,async()=>{
  const endpoint=contract.endpoints.find(e=>e.number===testCase.number);await testCase.run();
  const call=captured.find(c=>c.method===endpoint.method&&routePattern(endpoint.path).test(c.url));expect(call,endpoint.path).toBeDefined();
  // Every request emitted by the service must belong to the PDF as well.
  for(const emitted of captured) expect(contract.endpoints.some(e=>e.frontend&&e.method===emitted.method&&routePattern(e.path).test(emitted.url)),`${emitted.method} ${emitted.url}`).toBe(true);
  const queries=endpoint.parameters.filter(p=>p.location==='Query / form').map(p=>p.name);
  expect(Object.entries(call.params||{}).filter(([,v])=>v!==undefined).map(([k])=>k).every(k=>queries.includes(k))).toBe(true);
  if(endpoint.requestShape && !(call.data instanceof FormData)){
    const allowed=Object.keys(endpoint.requestShape);expect(Object.keys(call.data||{}).every(k=>allowed.includes(k)),`Unexpected request fields for API ${endpoint.number}`).toBe(true);
  }
  if(endpoint.parameters.some(p=>p.location==='Part'))expect(call.data.get('file')).toBeDefined();
  if(testCase.number===94)expect(call.headers['Idempotency-Key']).toBe('qa-contract-key');
  if(testCase.number===147){expect(call.data.orderDetailId).toBe(B);expect(call.data).not.toHaveProperty('productId');}
  if(testCase.number>=87&&testCase.number<=92)expect(call.withCredentials).toBe(true);
});
