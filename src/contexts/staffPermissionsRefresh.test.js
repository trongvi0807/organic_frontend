// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { api, getSession, setSession } from '@/services/api';
import { can } from '@/lib/permissions';

vi.mock('@/services/pushNotifications', () => ({ disablePush: vi.fn(), revokeLocalPush: vi.fn(async () => {}) }));
const admin = { username: 'admin', fullName: 'Quản trị', roles: ['ADMIN'] };
let host, root, reload;
function Probe() {
  const { user, refreshUser } = useAuth();
  reload = refreshUser;
  return h('span', null, can(user, 'purchase.approve') ? 'Được duyệt đơn mua' : 'Chưa có quyền duyệt');
}
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  setSession({ sessionId: 'admin-session', accessToken: 'token', refreshToken: 'refresh', user: admin });
  vi.spyOn(api, 'get').mockResolvedValue({ data: { data: admin } });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); setSession(null); vi.restoreAllMocks(); });
const render = () => act(async () => root.render(h(AuthProvider, null, h(Probe))));

it('shows newly saved business permissions immediately and persists them for reload', async () => {
  await render();
  expect(host.textContent).toBe('Chưa có quyền duyệt');
  api.get.mockResolvedValue({ data: { data: { ...admin, roles: ['ADMIN', 'PROCUREMENT_MANAGER'] } } });
  await act(async () => reload());
  expect(host.textContent).toBe('Được duyệt đơn mua');
  expect(getSession().user.roles).toEqual(['ADMIN', 'PROCUREMENT_MANAGER']);
});

it('ignores an older session poll after the saved permissions have been loaded', async () => {
  let finishOld;
  api.get.mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }));
  await render();
  api.get.mockResolvedValue({ data: { data: { ...admin, roles: ['ADMIN', 'PROCUREMENT_MANAGER'] } } });
  await act(async () => reload());
  await act(async () => finishOld({ data: { data: admin } }));
  expect(host.textContent).toBe('Được duyệt đơn mua');
});

it('does not apply the old admin response after another account signs in', async () => {
  await render();
  let finish;
  api.get.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  let pending;
  await act(async () => { pending = reload(); });
  const other = { username: 'sales', roles: ['SALES_STAFF'] };
  await act(async () => {
    setSession({ sessionId: 'sales-session', accessToken: 'other', user: other });
    api.get.mockResolvedValue({ data: { data: other } });
    window.dispatchEvent(new Event('moc:session-refreshed'));
  });
  await act(async () => { finish({ data: { data: { ...admin, roles: ['ADMIN', 'PROCUREMENT_MANAGER'] } } }); await pending; });
  expect(getSession().user.username).toBe('sales');
  expect(host.textContent).toBe('Chưa có quyền duyệt');
});
