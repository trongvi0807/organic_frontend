// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
const state=vi.hoisted(()=>({push:{pushAllowed:true,enabled:false,busy:false,error:'',toggle:vi.fn()},reason:''}));
vi.mock('@/contexts/NotificationContext',()=>({useNotifications:()=>state.push}));
vi.mock('@/services/pushNotifications',()=>({pushAvailability:()=>state.reason}));
import { PushNotificationSettings } from './PushNotificationSettings';
let host,root;
beforeEach(()=>{globalThis.IS_REACT_ACT_ENVIRONMENT=true;host=document.createElement('div');document.body.append(host);root=createRoot(host);state.push={pushAllowed:true,enabled:false,busy:false,error:'',toggle:vi.fn()};state.reason='';});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();});
it('offers customer opt-in without automatically prompting for permission',async()=>{
 await act(async()=>root.render(h(PushNotificationSettings)));
 expect(host.textContent).toContain('đơn hàng, phản hồi và đổi trả');expect(state.push.toggle).not.toHaveBeenCalled();
 await act(async()=>host.querySelector('button').click());expect(state.push.toggle).toHaveBeenCalledOnce();
});
it('explains denied permission and disables only enabling, so an active registration can still be removed',async()=>{
 state.reason='Quyền thông báo đã bị chặn';await act(async()=>root.render(h(PushNotificationSettings,{compact:true})));
 expect(host.querySelector('button').disabled).toBe(true);expect(host.querySelector('[role=status]').textContent).toContain('bị chặn');
 state.push.enabled=true;await act(async()=>root.render(h(PushNotificationSettings,{compact:true})));
 expect(host.querySelector('button').disabled).toBe(false);expect(host.textContent).toContain('Tắt trên thiết bị này');
});
it('prevents repeated actions and hides controls for ineligible sessions',async()=>{
 state.push.busy=true;await act(async()=>root.render(h(PushNotificationSettings)));expect(host.querySelector('button').disabled).toBe(true);
 state.push.pushAllowed=false;await act(async()=>root.render(h(PushNotificationSettings)));expect(host.textContent).toBe('');
});
