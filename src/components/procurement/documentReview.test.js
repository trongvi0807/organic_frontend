// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{fullName:'Người lập thử'}})}));
vi.mock('sonner',()=>({toast:{success:vi.fn()}}));
vi.mock('@/components/admin/SearchSelect',()=>({SearchSelect:({options,value,onChange,...props})=>h('select',{'aria-label':props['aria-label'],value,onChange:e=>onChange(e.target.value)},h('option',{value:''},'Chọn'),...options.map(o=>h('option',{key:o.value,value:o.value},o.label)))}));
vi.mock('@/services/admin/procurementService',()=>({purchaseOrderService:{nextCode:vi.fn(async()=>({code:'DMH20261105-000001'})),productOptions:vi.fn(async()=>({items:[{variant:{id:'v',productId:'p',productName:'Rau hữu cơ',variantName:'Hàng cân',unitId:'kg',netQuantity:1},purchasedBefore:false,purchaseUnit:'kg'}],totalPages:1})),save:vi.fn(async()=>({}))}}));
vi.mock('@/services/admin/managementService',()=>({supplierService:{list:vi.fn(async()=>({items:[{id:'s',supplierName:'Nông trại',status:'active'}],totalPages:1}))}}));
vi.mock('@/services/admin/supplierCatalogService',()=>({supplierProducts:vi.fn(async()=>[{id:'p'}])}));
import {OrderForm} from './OrderForm';
import {purchaseOrderService} from '@/services/admin/procurementService';
let root,host;
beforeEach(()=>{globalThis.IS_REACT_ACT_ENVIRONMENT=true;vi.clearAllMocks();host=document.createElement('div');document.body.append(host);root=createRoot(host);});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
async function value(label,next){const input=document.querySelector(`[aria-label="${label}"]`);const setter=Object.getOwnPropertyDescriptor(input.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set;await act(async()=>{setter.call(input,next);input.dispatchEvent(new Event(input.tagName==='SELECT'?'change':'input',{bubbles:true}));});}
async function click(text){const button=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);expect(button,text).toBeTruthy();await act(async()=>button.click());}
it('shows full document review before writing and sends unconverted measured quantities only after confirmation',async()=>{
 const saved=vi.fn();await act(async()=>root.render(h(OrderForm,{onSaved:saved,onClose:vi.fn()})));
 expect(document.body.textContent).toContain('DMH20261105-000001');
 await value('Nhà cung cấp','s');await value('Sản phẩm nhập nhanh','v');await value('Đơn vị tính nhập nhanh','kg');
 await value('Số lượng nhập nhanh','2,5');await value('Giá nhập nhanh','50.000');await click('Thêm sản phẩm');
 const unitSelect=document.querySelector('[aria-label="Đơn vị tính dòng 1"]');
 expect(unitSelect.tagName).toBe('SELECT');expect([...unitSelect.options].map(option=>option.value)).toContain('ml');
 await value('Đơn vị tính dòng 1','ml');expect(unitSelect.value).toBe('ml');await value('Đơn vị tính dòng 1','kg');
 await click('Xem lại đơn mua');expect(purchaseOrderService.save).not.toHaveBeenCalled();
 expect(document.body.textContent).toContain('125.000 VNĐ');expect(document.body.textContent).toContain('Người lập thử');
 await click('Quay lại chỉnh sửa');expect(purchaseOrderService.save).not.toHaveBeenCalled();
 await click('Xem lại đơn mua');await click('Xác nhận lưu');
 expect(purchaseOrderService.save).toHaveBeenCalledWith(undefined,expect.objectContaining({items:[{variantId:'v',quantity:2.5,unitPrice:50000,purchaseUnit:'kg'}]}));
 expect(saved).toHaveBeenCalledOnce();
});
