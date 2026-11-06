// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
const api=vi.hoisted(()=>({batches:vi.fn(),nextCode:vi.fn(),save:vi.fn()}));
vi.mock('@/services/admin/liquidationService',()=>({liquidationService:api}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:{fullName:'Nhân viên kho'}})}));
vi.mock('@/components/admin/SearchSelect',()=>({SearchSelect:({options,value,onChange,...props})=>h('select',{'aria-label':props['aria-label'],value,onChange:e=>onChange(e.target.value)},h('option',{value:''},'Chọn lô'),...options.map(o=>h('option',{key:o.value,value:o.value,disabled:o.disabled},o.label)))}));
import { LiquidationForm } from './LiquidationForm';
async function enter(element,value){await act(async()=>{Object.getOwnPropertyDescriptor(element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}));});}
it('requires a review before writing the draft and submits the entered quantity and price unchanged',async()=>{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  api.batches.mockResolvedValue({content:[{id:'batch',productName:'Cà rốt',variantName:'Gói 500 g',batchCode:'B1',lotCode:'LO1',onHand:10,reserved:3,available:7,expiryDate:'2027-01-01'}],totalPages:1});
  api.nextCode.mockResolvedValue({code:'TL20261106-000001'});api.save.mockResolvedValue({id:'document'});
  const host=document.createElement('div'),root=createRoot(host),saved=vi.fn();document.body.append(host);
  try{
    await act(async()=>root.render(h(LiquidationForm,{item:{},onClose:vi.fn(),onSaved:saved})));
    const dialog=document.querySelector('[role=dialog]');
    await enter(dialog.querySelector('textarea'),'Hàng cận hạn');
    await act(async()=>{const select=dialog.querySelector('select[aria-label="Lô thanh lý"]');select.value='batch';select.dispatchEvent(new Event('change',{bubbles:true}));});
    await enter(dialog.querySelector('[aria-label="Số lượng thêm thanh lý"]'),'2.5');
    await enter(dialog.querySelector('[aria-label="Giá thanh lý"]'),'10.000');
    await act(async()=>[...dialog.querySelectorAll('button')].find(b=>b.textContent.includes('Thêm lô')).click());
    expect(api.save).not.toHaveBeenCalled();
    await act(async()=>dialog.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(dialog.textContent).toContain('Kiểm tra phiếu trước khi lưu');expect(dialog.textContent).toContain('25.000 VNĐ');expect(api.save).not.toHaveBeenCalled();
    await act(async()=>dialog.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(api.save).toHaveBeenCalledWith(undefined,{method:'sale',reasonType:'clearance',reason:'Hàng cận hạn',note:null,items:[{batchId:'batch',quantity:2.5,unitPrice:10000}]});
    expect(saved).toHaveBeenCalledWith({id:'document'});
  }finally{await act(async()=>root.unmount());host.remove();}
});

it('preserves quarantined lines while allowing a reason update and review',async()=>{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  api.save.mockClear();api.batches.mockResolvedValue({content:[],totalPages:1});
  const host=document.createElement('div'),root=createRoot(host);document.body.append(host);
  const item={id:'held',code:'TL1',method:'dispose',reasonType:'damaged',reason:'Hàng dập',stockHeld:true,items:[{batchId:'batch',productName:'Cà rốt',variantName:'Gói',quantity:2,unitPrice:0}]};
  try{
    await act(async()=>root.render(h(LiquidationForm,{item,onClose:vi.fn(),onSaved:vi.fn()})));
    const dialog=document.querySelector('[role=dialog]');
    expect(dialog.querySelector('[aria-label="Số lượng lô 1"]').disabled).toBe(true);
    expect(dialog.querySelector('[aria-label="Bỏ lô 1"]').disabled).toBe(true);
    expect(dialog.querySelector('[aria-label="Lô thanh lý"]')).toBeNull();
    await act(async()=>dialog.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(dialog.textContent).toContain('cách ly ngay');expect(api.save).not.toHaveBeenCalled();
    await act(async()=>dialog.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(api.save).toHaveBeenCalledWith('held',expect.objectContaining({reasonType:'damaged',items:[{batchId:'batch',quantity:2,unitPrice:0}]}));
  }finally{await act(async()=>root.unmount());host.remove();}
});
