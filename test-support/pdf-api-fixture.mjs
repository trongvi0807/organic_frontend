// PDF-shaped API used only for isolated browser/HTTP QA. No database or gateway calls.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const contract=JSON.parse(readFileSync(new URL('../docs/api-contract.json',import.meta.url),'utf8'));
export const qaIds={product:'11111111-1111-4111-8111-111111111111',variant:'22222222-2222-4222-8222-222222222222',order:'33333333-3333-4333-8333-333333333333',payment:'44444444-4444-4444-8444-444444444444',category:'55555555-5555-4555-8555-555555555555'};
export const qaReference='a'.repeat(32);
export function createPdfApiFixture({autoPaid=false}={}){
 const ids=qaIds,requests=[];
 const variant={id:ids.variant,sku:'QA-500',variantName:'Gói 500g',netQuantity:500,unitId:'g',sellingPrice:28000,compareAtPrice:32000,barcode:null,reorderLevel:5,status:'active'};
 const product={id:ids.product,productCode:'QA001',productName:'Cà rốt QA theo tài liệu',slug:'ca-rot-qa',categoryId:ids.category,categoryName:'Rau củ',status:'active',organicClaimStatus:'pending',minPrice:28000,description:'Dữ liệu kiểm thử API theo PDF.',variants:[variant],images:[],certifications:[],canAddToCart:true,relatedProducts:[]};
 const line={variantId:ids.variant,sku:variant.sku,productName:product.productName,variantName:variant.variantName,quantity:1,unitPrice:28000,lineAmount:28000,discountAmount:0};
 const quote={items:[line],subtotal:28000,promotionDiscount:0,pointsUsed:0,pointsDiscount:0,totalAmount:28000,currency:'VND',estimatedEarnedPoints:0,promotionCode:null,shippingFee:0,vatIncluded:true};
 const payment={id:ids.payment,orderId:ids.order,gateway:'vnpay',status:'pending',amount:28000,currency:'VND',exchangeRate:1,paymentUrl:`https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=${qaReference}`,expiresAt:'2026-12-31T12:00:00',failureCode:null,failureMessage:null};
 const order={id:ids.order,orderCode:'OD-PDF-QA',status:'pending_payment',paymentStatus:'pending',paymentMethod:'vnpay',receiverName:'Khách QA',receiverPhone:'0901234567',shippingAddress:'Địa chỉ QA',note:null,pricing:quote,orderedAt:'2026-10-26T12:00:00',paymentDueAt:'2026-12-31T12:00:00',stockReservedUntil:'2026-12-31T12:00:00',pointsEarned:0,payments:[payment],shipments:[]};
 const profile={id:'qa-customer',fullName:'Khách QA',phoneNumber:'0901234567',email:'qa@example.com',addresses:[]};
 const content={siteName:'Mộc QA',headline:'Tươi lành từ nguồn gốc.',introduction:'Phiên kiểm thử theo hợp đồng PDF.',banners:[],highlights:[],faqs:[]};
 const state={requests,payment,order,product,cart:[],paymentReads:0,created:0,initiated:0};
 const page=(items)=>({content:items,page:0,size:20,totalElements:items.length,totalPages:items.length?1:0,first:true,last:true,hasNext:false});
 const server=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost'),chunks=[];for await(const chunk of req)chunks.push(chunk);
  const raw=Buffer.concat(chunks).toString(),body=raw&&req.headers['content-type']?.includes('application/json')?JSON.parse(raw):{};
  requests.push({method:req.method,path:url.pathname,body,headers:req.headers});
  const send=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify({statusCode:status,name:'PDF_QA',data}));};
  const fail=(message,status)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify({code:status,message}));};
  const endpoint=contract.endpoints.find(e=>e.method===req.method&&new RegExp('^'+e.path.replace(/\{[^}]+\}/g,'[^/]+')+'$').test(url.pathname));
  if(!endpoint)return fail('Endpoint không có trong PDF; lỗi reference cũ được tái hiện bằng HTTP 500',500);
  const n=endpoint.number;
  if(n===6)return send({accessToken:`qa-${body.username==='admin'?'ADMIN':'CUSTOMER'}`,refreshToken:'qa-refresh',tokenType:'Bearer',user:{username:body.username,fullName:body.username==='admin'?'QA Admin':'Khách QA',roles:[body.username==='admin'?'ADMIN':'CUSTOMER']}});
  if(n===4)return send({accessToken:'qa-CUSTOMER',refreshToken:'qa-refresh-2',tokenType:'Bearer'});
  if(n===5)return send({requiresLogin:true});
  if(n===7)return send({content,featuredProducts:[],newProducts:[],certifiedProducts:[],categories:[],origins:[],certifications:[],statistics:{}});
  if(n===8)return send(content);if(n===9||n===10||n===11||n===12||n===105)return send([]);if(n===13)return send({availableProducts:1});
  if(n===19||n===26)return send(page([{id:ids.category,categoryCode:'RAU',categoryName:'Rau củ',status:'active'}]));
  if(n===21||n===32)return send(page([product]));if(n===22||n===23||n===33)return send(product);if(n===24)return send([]);if(n===25)return send({summary:{totalReviews:0,averageRating:null,distribution:[]},reviews:page([])});
  if(n===31)return send({brands:[],certifications:[]});
  if(n>=37&&n<=42){const variants=n<=39,rows=variants?product.variants:product.images,last=url.pathname.split('/').at(-1);if(req.method==='DELETE'){const index=rows.findIndex(r=>r.id===last);if(index>=0)rows.splice(index,1);return send(null);}const row={...body,id:req.method==='POST'?`qa-${rows.length+1}`:last},index=rows.findIndex(r=>r.id===last);if(req.method==='POST')rows.push(row);else if(index>=0)rows[index]=row;return send(row,req.method==='POST'?201:200);}
  if(n===53)return send(profile);if(n===54)return send(Object.assign(profile,body));if(n===104)return send({balance:0,reserved:0,available:0,redeemLimit:50,redeemValue:2000,earnPerVnd:100000});
  if(n===87||n===88||n===89||n===90||n===91||n===92){if(n===88)state.cart=[{...line,productId:ids.product,productSlug:product.slug,available:true,lineTotal:28000}];if(n===89&&state.cart[0])state.cart[0].quantity=body.quantity;if(n===90||n===91)state.cart=[];return send({ownerType:'CUSTOMER',items:state.cart,totalQuantity:state.cart.reduce((s,r)=>s+r.quantity,0),lineCount:state.cart.length,mergeStatus:'NONE',limits:{maxLines:100,maxQuantityPerLine:999}});}
  if(n===93)return send(quote);
  if(n===94){state.created++;Object.assign(order,{receiverName:body.receiverName,receiverPhone:body.receiverPhone,shippingAddress:body.shippingAddress,paymentMethod:body.paymentMethod});return send(order,201);}
  if(n===95||n===107)return send(page([order]));if(n===96||n===108)return send(order);
  if(n===98)return send({cod:true,stripe:false,paypal:false,vnpay:true});
  if(n===99){state.initiated++;return send({...payment,paymentUrl:'https://example.invalid/not-a-real-gateway'});}
  if(n===100){state.paymentReads++;if(autoPaid&&state.paymentReads>1){payment.status='paid';payment.paymentUrl=null;order.paymentStatus='paid';order.status='paid';}return send(payment);}
  if(n===103||n===106||n===139||n===144||n===145)return send(page([]));
  return fail('API fixture chưa mô phỏng thao tác này',404);
 });
 return {server,state};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const {server}=createPdfApiFixture({autoPaid:process.env.QA_AUTO_PAID==='true'});const port=Number(process.env.QA_API_PORT||19098);server.listen(port,'127.0.0.1',()=>process.stdout.write(`PDF API fixture http://127.0.0.1:${port}\n`));}
