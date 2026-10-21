// Isolated, in-memory API for browser QA. Never connects to the real database or Cloudinary.
// Start with: node test-support/backend-fixture.mjs
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
const port = Number(process.env.QA_API_PORT || 19088);
const ids = { product: '11111111-1111-4111-8111-111111111111', category: '22222222-2222-4222-8222-222222222222', supplier: '33333333-3333-4333-8333-333333333333', origin: '44444444-4444-4444-8444-444444444444', certificate: '55555555-5555-4555-8555-555555555555', customer: '66666666-6666-4666-8666-666666666666', account: '77777777-7777-4777-8777-777777777777' };
let content = { siteName: 'Mộc QA', headline: 'Tươi lành từ nguồn gốc rõ ràng.', introduction: 'Dữ liệu kiểm thử giao diện — không kết nối database thật.', banners: [], highlights: [{ title: 'Thông tin nguồn gốc', description: 'Xem vùng sản xuất và hồ sơ chứng nhận được công bố.' }], faqs: [{ question: 'Làm sao xem thông tin sản phẩm?', answer: 'Chọn sản phẩm để xem chi tiết.' }], contactEmail: 'qa@example.com', contactPhone: null, contactAddress: null, openingHours: '08:00–18:00' };
const db = {
  customers: [{ id: ids.customer, customerId: 'QA-KH001', fullName: 'Khách hàng kiểm thử', phoneNumber: '0901234567', email: 'qa@example.com', dateOfBirth: '2000-01-01', membershipStatus: 'REGULAR', registrationDate: '2026-10-20', rewardPoints: 0, status: 'ACTIVE', accountId: ids.account, username: 'customer', roles: ['CUSTOMER'], accountStatus: 'ACTIVE', addresses: [], avatarUrl: null }],
  suppliers: [{ id: ids.supplier, supplierCode: 'QA-NCC001', supplierName: 'Nông trại kiểm thử', taxCode: null, contactPerson: 'Đối tác QA', phoneNumber: null, email: 'farm@example.com', address: 'Địa chỉ minh họa', status: 'active' }],
  origins: [{ id: ids.origin, originCode: 'QA-XX001', originName: 'Vùng trồng kiểm thử', countryCode: 'VN', country: 'Việt Nam', region: 'Lâm Đồng', producerName: 'Cơ sở QA', address: 'Địa chỉ kiểm thử', description: 'Dữ liệu xuất xứ giả lập cho kiểm thử.', supplierId: ids.supplier, supplierName: 'Nông trại kiểm thử', supplierCode: 'QA-NCC001', supplierStatus: 'active', status: 'active', productCount: 1 }],
  certifications: [{ id: ids.certificate, certificateName: 'Chứng nhận QA', certificateNumber: 'QA-CERT001', issuingOrganization: 'Tổ chức kiểm thử', issuedAt: '2026-01-01', expiresAt: '2027-12-31', documentUrl: 'https://example.com/qa-proof.pdf', documentName: 'qa-proof.pdf', documentContentType: 'application/pdf', documentSize: 1024, status: 'verified', archived: false, validityStatus: 'valid', currentlyValid: true, daysUntilExpiry: 437, reviewNote: 'Dữ liệu giả lập', productCount: 1 }],
  categories: [{ id: ids.category, categoryCode: 'QA-CAT001', categoryName: 'Rau củ hữu cơ', status: 'active', description: 'Danh mục kiểm thử' }],
  products: [{ id: ids.product, productCode: 'QA-SP001', productName: 'Cà rốt kiểm thử', slug: 'ca-rot-kiem-thu', categoryId: ids.category, categoryName: 'Rau củ hữu cơ', minPrice: 28000, status: 'active', organicClaimStatus: 'verified', featured: true, featuredOrder: 1, description: 'Sản phẩm dành cho kiểm thử giao diện.', originId: ids.origin, certificateIds: [ids.certificate] }],
};
const record = (name, id) => db[name].find((entry) => entry.id === id);
function page(items, query) {
  const number = Number(query.get('page') || 0), size = Number(query.get('size') || 20);
  return { content: items.slice(number * size, (number + 1) * size), page: number, size, totalElements: items.length, totalPages: Math.ceil(items.length / size), first: number === 0, last: (number + 1) * size >= items.length, hasNext: (number + 1) * size < items.length };
}
function list(name, query) {
  let items = db[name];
  const search = query.get('search') || query.get('keyword');
  if (search) items = items.filter((item) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase()));
  for (const key of ['status','countryCode','supplierId','categoryId']) if (query.get(key)) items = items.filter((item) => String(item[key]).toLowerCase() === query.get(key).toLowerCase());
  if (name === 'certifications') {
    items = items.filter((item) => item.archived === (query.get('archived') === 'true'));
    if (query.get('validity')) items = items.filter((item) => item.validityStatus === query.get('validity'));
  }
  return page(items, query);
}
function certificateValidity(item) { item.currentlyValid = item.status === 'verified' && !item.archived && !!item.documentUrl && item.validityStatus === 'valid'; return item; }
function trace(id) {
  const product = record('products', id);
  const certifications = product.certificateIds.map((cert) => record('certifications',cert)).filter(Boolean).map(certificateValidity);
  return { productId: id, productName: product.productName, productCode: product.productCode, productStatus: product.status, origin: record('origins', product.originId) || null, certifications, effectiveOrganicStatus: certifications.some((cert) => cert.currentlyValid) ? 'verified' : certifications.some((cert) => cert.status === 'pending' && !cert.archived) ? 'pending' : 'unverified' };
}
function home() {
  const products = db.products.filter((p) => p.status === 'active').map((p) => ({ ...p, name: p.productName, minPrice: 28000, defaultPrice: 28000, compareAtPrice: 32000, defaultVariantName: 'Gói 500g', organicVerified: trace(p.id).effectiveOrganicStatus === 'verified', originName: record('origins',p.originId)?.originName, country: 'Việt Nam' }));
  return { content, featuredProducts: products.filter((p) => p.featured), newProducts: products, certifiedProducts: products.filter((p) => p.organicVerified), categories: db.categories.map((c) => ({ id:c.id, code:c.categoryCode, name:c.categoryName, productCount:1 })), origins: db.origins.filter((o) => o.status === 'active').map((o) => ({ ...o, name:o.originName, code:o.originCode })), certifications: db.certifications.filter((c) => certificateValidity(c).currentlyValid).map((c) => ({ id:c.id,name:c.certificateName,number:c.certificateNumber,issuingOrganization:c.issuingOrganization,issuedAt:c.issuedAt,expiresAt:c.expiresAt,productCount:1 })), statistics: { availableProducts:products.length,categories:db.categories.length,growingRegions:db.origins.length,validCertifications:db.certifications.filter((c) => c.currentlyValid).length } };
}
createServer(async (req,res) => {
  const url = new URL(req.url,'http://localhost'), method = req.method;
  const parts = url.pathname.replace(/^\/api\/v1\/?/,'').split('/').filter(Boolean);
  const send = (data, status=200) => { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify({ statusCode:status,name:'QA_RESPONSE',message:'Dữ liệu QA',data })); };
  let raw=''; for await (const chunk of req) raw += chunk.toString();
  const body = req.headers['content-type']?.includes('application/json') && raw ? JSON.parse(raw) : {};
  const role = String(req.headers.authorization || '').replace('Bearer qa-','');
  if (parts[0] === 'auth') {
    if (parts[1] === 'logout') return send({});
    const roles = { admin:'ADMIN',sales:'SALES_STAFF',warehouse:'WAREHOUSE_STAFF',customer:'CUSTOMER' };
    if (!roles[body.username] || body.password !== 'Organic@123') return send(null,401);
    return send({accessToken:`qa-${roles[body.username]}`,user:{ accountId:ids.account,username:body.username,fullName:body.username === 'customer' ? 'Khách hàng kiểm thử' : `QA ${body.username}`,roles:[roles[body.username]] }});
  }
  if (parts[0] === 'home') return send(home());
  if (parts[0] === 'admin' && parts[1] === 'home') {
    if (role !== 'ADMIN') return send(null,403);
    if (parts[2] === 'content') { if (method === 'PUT') content=body; return send(content); }
    if (parts[2] === 'cache') return send(home());
    if (parts[3]) { Object.assign(record('products',parts[3]),body); return send(body); }
    let items=db.products.map((p) => ({id:p.id,code:p.productCode,name:p.productName,status:p.status,featured:p.featured,featuredOrder:p.featuredOrder}));
    if (url.searchParams.has('featured')) items=items.filter((p)=>p.featured === (url.searchParams.get('featured') === 'true'));
    if (url.searchParams.get('search')) items=items.filter((p)=>JSON.stringify(p).toLowerCase().includes(url.searchParams.get('search').toLowerCase()));
    return send(page(items,url.searchParams));
  }
  if (parts[0] === 'admin') parts.shift();
  const [module,id,action,child] = parts;
  if (module === 'products' && id === 'options') return send({brands:[],certifications:db.certifications});
  if (module === 'products' && id === 'traceability-options') return send(list('products',url.searchParams));
  if (module === 'products' && id && action) {
    const product=record('products',id);
    if (action === 'origin') product.originId=method === 'DELETE' ? null : body.originId;
    if (action === 'certifications') product.certificateIds=method === 'DELETE' ? product.certificateIds.filter((c)=>c!==child) : [...new Set([...product.certificateIds,child])];
    return send(trace(id));
  }
  if (module === 'customers' && id === 'me') {
    if (role !== 'CUSTOMER') return send(null,403);
    parts[1]=ids.customer;
  }
  const actualId=parts[1];
  if (!db[module]) return send(null,404);
  if (!actualId) {
    if (method === 'GET') return send(list(module,url.searchParams));
    const item={...body,id:randomUUID(),addresses:[],archived:false,productCount:0};
    if (module === 'certifications') Object.assign(item,{status:'pending',validityStatus:'valid',currentlyValid:false});
    db[module].unshift(item); return send(item,201);
  }
  const item=record(module,actualId); if (!item) return send(null,404);
  if (action === 'products') return send(page(db.products,url.searchParams));
  if (action === 'addresses') {
    if (method === 'DELETE') item.addresses=item.addresses.filter((a)=>a.id!==child);
    else { const address={...body,id:child || randomUUID()}; if (address.isDefault || !item.addresses.length) { item.addresses.forEach((a)=>a.isDefault=false); address.isDefault=true; } if (child) Object.assign(item.addresses.find((a)=>a.id===child),address); else item.addresses.push(address); }
    return send(item);
  }
  if (action === 'avatar') { item.avatarUrl=method === 'DELETE' ? null : '/images/avocado.jpg'; return send(item); }
  if (action === 'document') { Object.assign(item,{documentUrl:method === 'DELETE' ? null : 'https://example.com/qa-proof.pdf',documentName:'qa-proof.pdf',documentContentType:'application/pdf',status:'pending',currentlyValid:false,reviewNote:null}); return send(item); }
  if (action === 'status') { Object.assign(item,{status:body.status,reviewNote:body.note,reviewedAt:'2026-10-20T12:00:00'}); return send(certificateValidity(item)); }
  if (action === 'restore') { Object.assign(item,{archived:false,status:'pending'}); return send(certificateValidity(item)); }
  if (method === 'DELETE') { if (module === 'certifications') {item.archived=true;certificateValidity(item);} else item.status=module === 'customers' ? 'INACTIVE' : 'inactive'; return send(null); }
  if (method === 'PUT') {Object.assign(item,body);if (module === 'certifications') Object.assign(item,{status:'pending',currentlyValid:false});}
  if (module === 'products') return send({...item,variants:[{id:'qa-variant',variantName:'Gói 500g',status:'active',sellingPrice:28000,netQuantity:500}],images:[],certifications:[]});
  return send(item);
}).listen(port,'127.0.0.1',() => console.log(`QA API fixture: http://127.0.0.1:${port}/api/v1 (in-memory only)`));
