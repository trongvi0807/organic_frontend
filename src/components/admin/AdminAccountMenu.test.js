// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { it, expect } from 'vitest';
import { AdminAccountMenu } from './AdminAccountMenu';
import { STAFF_ROLES } from '@/lib/permissions';

it('keeps the trigger concise and provides all roles in expandable account details', async () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement('div'), root = createRoot(host);
  document.body.append(host);
  try {
    await act(async () => root.render(h(MemoryRouter, null, h(AdminAccountMenu, { user: { fullName: 'DEMO - Quản trị viên tổng hợp', roles: STAFF_ROLES } }))));
    const button = host.querySelector('button');
    expect(button.querySelector('small').textContent).toBe('Quản trị viên tổng hợp');
    expect(host.querySelector('.adk-account-panel')).toBeNull();
    await act(async () => button.click());
    const details = host.querySelector('details');
    expect(details.open).toBe(false);
    expect(details.querySelectorAll('li')).toHaveLength(8);
    expect(details.textContent).toContain('Nhân viên kho');
    expect(details.textContent).toContain('Vai trò được cấp (8)');
    await act(async () => button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(host.querySelector('.adk-account-panel')).toBeNull();
  } finally { await act(async () => root.unmount()); host.remove(); }
});
