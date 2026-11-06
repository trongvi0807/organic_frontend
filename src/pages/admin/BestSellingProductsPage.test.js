// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
const api=vi.hoisted(()=>({bestSellers:vi.fn(),categories:vi.fn()}));
vi.mock('@/services/admin/salesReportService',()=>({salesReportService:api}));
vi.mock('@/components/ui/field',async original=>({...await original(),Select:({children,...props})=>h('select',props,children)}));
import BestSellingProductsPage from './BestSellingProductsPage';
beforeEach(()=>{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;vi.clearAllMocks();api.categories.mockResolvedValue([]);
  api.bestSellers.mockImplementation(async params=>({...params,generatedAt:'2026-11-06T14:00:00',productCount:0,items:[],warnings:[],summary:{soldQuantity:0,refundedQuantity:0,netQuantity:0,salesAmount:0,refundedAmount:0,netRevenue:0}}));
});
async function render(work){const host=document.createElement('div'),root=createRoot(host);document.body.append(host);try{await act(async()=>root.render(h(MemoryRouter,null,h(BestSellingProductsPage))));await work(host);}finally{await act(async()=>root.unmount());host.remove();}}
it('applies changed sort and limit only after confirmation while retaining the selected period',async()=>{
  await render(async host=>{
    expect(api.bestSellers).toHaveBeenCalledTimes(1);const initial=api.bestSellers.mock.calls[0][0];
    expect(initial.sortBy).toBe('quantity');expect(initial.limit).toBe(10);
    await act(async()=>{const select=host.querySelector('select[aria-label="Tiêu chí xếp hạng"]');select.value='revenue';select.dispatchEvent(new Event('change',{bubbles:true}));});
    await act(async()=>{const select=host.querySelector('select[aria-label="Số sản phẩm xếp hạng"]');select.value='20';select.dispatchEvent(new Event('change',{bubbles:true}));});
    expect(api.bestSellers).toHaveBeenCalledTimes(1);expect(host.textContent).toContain('Bộ lọc đã thay đổi');
    await act(async()=>host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    expect(api.bestSellers).toHaveBeenCalledTimes(2);expect(api.bestSellers.mock.calls[1][0]).toMatchObject({from:initial.from,to:initial.to,sortBy:'revenue',limit:20});
    expect(host.textContent).toContain('Chưa có sản phẩm phù hợp');expect(host.textContent).toContain('Quy tắc tính số liệu');
  });
});
it('shows failures instead of manufacturing zero revenue or keeping an unlabelled old ranking',async()=>{
  api.bestSellers.mockRejectedValue(new Error('Không tải được thống kê'));
  await render(async host=>{expect(host.textContent).toContain('Không tải được thống kê');expect(host.querySelector('.sales-ranking-table')).toBeNull();expect(host.querySelector('.sales-report-metrics')).toBeNull();});
});
