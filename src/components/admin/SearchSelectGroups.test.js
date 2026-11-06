// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { it, expect, vi } from 'vitest';
import { SearchSelect } from './SearchSelect';
it('shows bought and unbought groups together and supports searching the unbought group', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  const host=document.createElement('div');document.body.append(host);const root=createRoot(host), change=vi.fn();
  try {
    await act(async()=>root.render(h(SearchSelect,{value:'',onChange:change,'aria-label':'Sản phẩm',options:[
      {value:'old',label:'Cà rốt · Túi 1 kg',group:'Đã mua từ nhà cung cấp'},
      {value:'new',label:'Táo · Hộp 500 g',group:'Chưa mua từ nhà cung cấp'}]})));
    const input=host.querySelector('input[role="combobox"]');await act(async()=>input.click());
    expect(host.textContent).toContain('Đã mua từ nhà cung cấp');expect(host.textContent).toContain('Chưa mua từ nhà cung cấp');
    await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'chưa mua');input.dispatchEvent(new Event('input',{bubbles:true}));});
    expect(host.querySelectorAll('[role="option"]')).toHaveLength(1);
    await act(async()=>host.querySelector('[role="option"] button').click());expect(change).toHaveBeenCalledWith('new');
  } finally {await act(async()=>root.unmount());host.remove();}
});
