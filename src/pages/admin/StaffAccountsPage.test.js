// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({ list: vi.fn(), save: vi.fn(), currentAdministrator: vi.fn() }));
const auth = vi.hoisted(() => ({ user: { username: 'admin', roles: ['ADMIN'] }, refreshUser: vi.fn() }));
vi.mock('@/services/admin/staffAccountService', () => ({ staffAccountService: service }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }));
vi.mock('@/components/ui/field', async original => ({ ...await original(), Select: props => h('select', props) }));
import StaffAccountsPage from './StaffAccountsPage';

const admin = { id: 'admin', employeeCode: 'NV01', fullName: 'Quản trị cửa hàng', username: 'admin', phoneNumber: '0901234567', roles: ['ADMIN', 'WAREHOUSE_STAFF'], active: true };
let host, root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.clearAllMocks();
  service.list.mockResolvedValue({ items: [admin], totalPages: 1, totalElements: 1 });
  service.currentAdministrator.mockResolvedValue(admin);
  auth.refreshUser.mockResolvedValue(auth.user);
  service.save.mockResolvedValue({});
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
const button = (scope, text) => [...scope.querySelectorAll('button')].find(node => node.textContent === text);
const role = (scope, text) => [...scope.querySelectorAll('label')].find(node => node.querySelector('strong')?.textContent === text)?.querySelector('input');
async function enter(input, value) {
  await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); });
}
async function open(text) {
  await act(async () => root.render(h(StaffAccountsPage)));
  await act(async () => button(host, text).click());
  return document.querySelector('[role="dialog"]');
}
const submit = async dialog => act(async () => dialog.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));

it('only offers business roles when creating an employee and submits no ADMIN role', async () => {
  const dialog = await open('Thêm nhân viên');
  expect(role(dialog, 'Quản trị viên')).toBeUndefined();
  expect(dialog.querySelectorAll('input[type="checkbox"]')).toHaveLength(7);
  const inputs = dialog.querySelectorAll('input:not([type="checkbox"])');
  for (const [index, value] of ['Nhân viên kho', 'nhanvienkho', 'Organic@123', '0901234568', 'kho@example.com'].entries()) await enter(inputs[index], value);
  await act(async () => role(dialog, 'Nhân viên kho').click());
  await submit(dialog);
  expect(service.save).toHaveBeenCalledWith(undefined, expect.objectContaining({ username: 'nhanvienkho', roles: ['WAREHOUSE_STAFF'] }));
});

it('locks the existing ADMIN role and account status, while allowing contact updates', async () => {
  const dialog = await open('Chỉnh sửa');
  const adminRole = role(dialog, 'Quản trị viên');
  expect(adminRole.checked).toBe(true); expect(adminRole.disabled).toBe(true);
  expect(dialog.querySelector('[aria-label="Trạng thái tài khoản"]').disabled).toBe(true);
  expect(dialog.textContent).toContain('Không được xóa, khóa');
  await act(async () => adminRole.click());
  await enter(dialog.querySelector('input'), 'Quản trị đã cập nhật');
  await submit(dialog);
  expect(service.save).toHaveBeenCalledWith('admin', expect.objectContaining({ fullName: 'Quản trị đã cập nhật', active: true, roles: ['ADMIN', 'WAREHOUSE_STAFF'] }));
  expect(button(host, 'Xóa')).toBeUndefined();
});

it('does not offer promotion to ADMIN when editing another employee', async () => {
  service.list.mockResolvedValue({ items: [{ ...admin, id: 'warehouse', roles: ['WAREHOUSE_STAFF'] }], totalPages: 1, totalElements: 1 });
  const dialog = await open('Chỉnh sửa');
  expect(role(dialog, 'Quản trị viên')).toBeUndefined();
  expect(dialog.querySelector('[aria-label="Trạng thái tài khoản"]').disabled).toBe(false);
});

it('pins the current admin even when the employee table is on a different page or filtered', async () => {
  service.list.mockResolvedValue({ items: [], totalPages: 0, totalElements: 0 });
  const dialog = await open('Gán thêm quyền');
  expect(dialog.textContent).toContain('Phân quyền tài khoản Admin');
  expect(role(dialog, 'Quản trị viên').disabled).toBe(true);
  await act(async () => role(dialog, 'Trưởng nhóm thu mua').click());
  await submit(dialog);
  expect(service.save).toHaveBeenCalledWith('admin', expect.objectContaining({ roles: ['ADMIN', 'WAREHOUSE_STAFF', 'PROCUREMENT_MANAGER'], active: true }));
  expect(auth.refreshUser).toHaveBeenCalledTimes(1);
});

it('keeps additional business roles editable without allowing the admin role to be removed', async () => {
  const dialog = await open('Gán thêm quyền');
  await act(async () => role(dialog, 'Nhân viên kho').click());
  await submit(dialog);
  expect(service.save).toHaveBeenCalledWith('admin', expect.objectContaining({ roles: ['ADMIN'], active: true }));
});

it('reports an admin lookup error without presenting a fabricated account to edit', async () => {
  service.currentAdministrator.mockRejectedValue(new Error('Chưa tải được tài khoản Admin.'));
  await act(async () => root.render(h(StaffAccountsPage)));
  expect(host.textContent).toContain('Chưa tải được tài khoản Admin.');
  expect(button(host, 'Gán thêm quyền')).toBeUndefined();
});
