// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
const api=vi.hoisted(()=>({revenue:vi.fn()}));
vi.mock('@/services/admin/salesReportService',()=>({salesReportService:api}));
vi.mock('@/components/dashboard/RevenueTimeline',()=>({RevenueTimeline:({onGranularityChange})=>h('button',{type:'button',onClick:()=>onGranularityChange('month')},'Gộp tháng')}));
import RevenueReportPage from './RevenueReportPage';
import { revenueFixture } from '../../test/revenueFixture';
beforeEach(()=>{globalThis.IS_REACT_ACT_ENVIRONMENT=true;vi.clearAllMocks();api.revenue.mockImplementation(async params=>revenueFixture(params.from,params.to,params.granularity));});
async function render(work){const host=document.createElement('div'),root=createRoot(host);document.body.append(host);try{await act(async()=>root.render(h(MemoryRouter,null,h(RevenueReportPage))));await work(host);}finally{await act(async()=>root.unmount());host.remove();}}
it('shows refund/net/clearance values and applies presets only after confirmation',async()=>{
  await render(async host=>{
    expect(host.textContent).toContain('Tiền hoàn thành công');expect(host.textContent).toContain('Thu bán thanh lý');expect(host.textContent).toContain('160.000 VNĐ');
    await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='7 ngày').click());expect(api.revenue).toHaveBeenCalledTimes(1);
    await act(async()=>host.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));expect(api.revenue).toHaveBeenCalledTimes(2);
    const selected=api.revenue.mock.calls[1][0];expect((Date.parse(selected.to)-Date.parse(selected.from))/86400000).toBe(6);
    await act(async()=>[...host.querySelectorAll('button')].find(b=>b.textContent==='Gộp tháng').click());expect(api.revenue.mock.calls.at(-1)[0]).toMatchObject({from:selected.from,to:selected.to,granularity:'month'});
  });
});
it('hides financial metrics and disables export when the report cannot be loaded',async()=>{
  api.revenue.mockRejectedValue(new Error('Báo cáo đang gián đoạn'));await render(async host=>{expect(host.textContent).toContain('Báo cáo đang gián đoạn');expect(host.querySelector('.revenue-report-metrics')).toBeNull();expect([...host.querySelectorAll('button')].find(b=>b.textContent.includes('Xuất CSV')).disabled).toBe(true);});
});
