// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
vi.mock('./api', () => ({ default:{ get:vi.fn() }, unwrap:(r)=>r.data.data, DEMO_MODE:false }));
import api from './api';
import PromotionsPage from '@/pages/admin/PromotionsPage';
let root,container;
beforeEach(()=>{ globalThis.IS_REACT_ACT_ENVIRONMENT=true; vi.clearAllMocks(); container=document.createElement('div'); document.body.append(container); root=createRoot(container); });
afterEach(async()=>{ await act(async()=>root.unmount()); container.remove(); });
it('loads promotion target choices without requesting forbidden catalog/inventory management APIs',async()=>{
  api.get.mockImplementation(async(path)=>({data:{data:{items:path.endsWith('/products')?[{id:'p1',productCode:'SP01',productName:'Cà rốt hữu cơ'}]:path.endsWith('/batches')?[{id:'b1',batchCode:'LO01',productName:'Cà rốt hữu cơ'}]:[],totalPages:1,totalElements:0}}}));
  await act(async()=>root.render(h(PromotionsPage)));
  await act(async()=>[...container.querySelectorAll('button')].find((b)=>b.textContent==='Tạo mã ưu đãi').click());
  expect(api.get.mock.calls.map(([path])=>path)).toEqual(['/admin/promotions','/admin/promotions/products','/admin/promotions/batches']);
  expect(document.body.textContent).toContain('Cà rốt hữu cơ');
  expect(document.body.textContent).toContain('LO01 · Cà rốt hữu cơ');
  expect(document.body.textContent).not.toContain('Request failed');
});
