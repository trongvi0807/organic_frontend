// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { AuthProvider } from './AuthContext';
import { StoreAccountMenu } from '@/components/layout/StoreAccountMenu';
import { ProfilePanel } from '@/components/customers/ProfilePanel';
import { api, getSession, setSession } from '@/services/api';

const profileService = vi.hoisted(() => ({ get: vi.fn(), uploadAvatar: vi.fn(), deleteAvatar: vi.fn() }));
vi.mock('@/services/client/profileService', () => ({ createProfileService: () => profileService }));
vi.mock('@/services/pushNotifications', () => ({ disablePush: vi.fn(), revokeLocalPush: vi.fn(async () => {}) }));
vi.mock('@/components/customers/ProfileAddressEditor', () => ({ ProfileAddressEditor: () => null }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const user = { username: 'customer', fullName: 'Nguyễn An', phoneNumber: '0901234567', roles: ['CUSTOMER'], avatarUrl: 'https://images.example.com/old.png' };
const profile = { ...user, customerId: 'KH01', status: 'active', membershipStatus: 'member', addresses: [] };
const updated = { ...profile, avatarUrl: 'https://images.example.com/new.png' };
let host, root;
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.clearAllMocks();
  setSession({ accessToken: 'token', refreshToken: 'refresh', sessionId: 'session', user });
  vi.spyOn(api, 'get').mockResolvedValue({ data: { data: user } });
  profileService.get.mockResolvedValue(profile); profileService.uploadAvatar.mockResolvedValue(updated);
  profileService.deleteAvatar.mockResolvedValue({ ...profile, avatarUrl: null });
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); setSession(null); vi.restoreAllMocks(); });
async function render(self = true) {
  await act(async () => root.render(h(MemoryRouter, null, h(AuthProvider, null, h(StoreAccountMenu), h(ProfilePanel, { self })))));
}
async function upload() {
  const input = host.querySelector('[aria-label="Tải ảnh đại diện"]');
  const file = new File(['image'], 'avatar.png', { type: 'image/png' });
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  return file;
}
const avatar = () => host.querySelector('.store-account-trigger img');

it('shows the saved avatar in both header and profile immediately and persists it in the session', async () => {
  await render(); expect(avatar().src).toBe(user.avatarUrl);
  const file = await upload();
  expect(profileService.uploadAvatar).toHaveBeenCalledWith(file);
  expect(avatar().src).toBe(updated.avatarUrl);
  expect(host.querySelector('.profile-photo img').src).toBe(updated.avatarUrl);
  expect(getSession().user.avatarUrl).toBe(updated.avatarUrl);
  expect(toast.success).toHaveBeenCalledWith('Ảnh đại diện đã được cập nhật.');
});

it('does not let an older session request overwrite the newly saved avatar', async () => {
  let finishSession;
  api.get.mockImplementationOnce(() => new Promise(resolve => { finishSession = resolve; }));
  await render(); await upload();
  await act(async () => finishSession({ data: { data: user } }));
  expect(avatar().src).toBe(updated.avatarUrl);
  expect(getSession().user.avatarUrl).toBe(updated.avatarUrl);
});

it('keeps the old avatar and reports failure when the upload fails', async () => {
  profileService.uploadAvatar.mockRejectedValue(new Error('Không lưu được ảnh.'));
  await render(); await upload();
  expect(avatar().src).toBe(user.avatarUrl); expect(getSession().user.avatarUrl).toBe(user.avatarUrl);
  expect(host.querySelector('[role="alert"]').textContent).toContain('Không lưu được ảnh.');
  expect(toast.success).not.toHaveBeenCalled();
});

it('falls back for a broken image, recovers for a new URL, and removes the avatar after confirmation', async () => {
  await render();
  await act(async () => avatar().dispatchEvent(new Event('error')));
  expect(avatar()).toBeNull(); expect(host.querySelector('.store-account-avatar svg')).toBeTruthy();
  await upload(); expect(avatar().src).toBe(updated.avatarUrl);
  await act(async () => [...host.querySelectorAll('button')].find(node => node.textContent === 'Gỡ ảnh').click());
  await act(async () => [...document.querySelectorAll('[role="dialog"] button')].find(node => node.textContent === 'Xác nhận').click());
  expect(profileService.deleteAvatar).toHaveBeenCalledTimes(1);
  expect(avatar()).toBeNull(); expect(getSession().user.avatarUrl).toBeNull();
});

it('does not replace the signed-in avatar when an employee edits another customer', async () => {
  await render(false); await upload();
  expect(host.querySelector('.profile-photo img').src).toBe(updated.avatarUrl);
  expect(avatar().src).toBe(user.avatarUrl); expect(getSession().user.avatarUrl).toBe(user.avatarUrl);
});
