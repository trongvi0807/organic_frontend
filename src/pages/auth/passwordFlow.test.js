// @vitest-environment jsdom
import { act, createElement as h } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ user: null, clearSession: vi.fn(), navigate: vi.fn() }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => state }));
vi.mock('react-router-dom', async original => ({ ...await original(), useNavigate: () => state.navigate }));
import ResetPasswordPage from './ResetPasswordPage';
import { PasswordOtpDialog } from '@/components/auth/PasswordOtpDialog';
import { clearPasswordGrant, rememberPasswordGrant, passwordService } from '@/services/auth/passwordService';
beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; state.user = null; vi.clearAllMocks(); clearPasswordGrant(); });
async function render(component, work) {
  const host = document.createElement('div'), root = createRoot(host); document.body.append(host);
  try { await act(async () => root.render(h(MemoryRouter, null, component))); await work(host); }
  finally { await act(async () => root.unmount()); host.remove(); }
}
async function input(element, value) { await act(async () => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); }); }
it('does not expose a password form when navigating directly without OTP proof', async () => {
  await render(h(ResetPasswordPage, { purpose: 'forgot' }), async host => {
    expect(host.querySelector('input[type=password]')).toBeNull();
    expect(host.textContent).toContain('Xác thực OTP lại');
    expect(host.querySelector('.auth-layout')).not.toBeNull();
  });
});
it('submits matching passwords, clears the session and returns to login', async () => {
  rememberPasswordGrant({ resetToken: 'proof', expiresIn: 300 }, 'forgot');
  const complete = vi.spyOn(passwordService, 'complete').mockResolvedValue(null);
  try {
    await render(h(ResetPasswordPage, { purpose: 'forgot' }), async host => {
      await input(host.querySelector('[aria-label="Mật khẩu mới"]'), 'NewPass@123');
      await input(host.querySelector('[aria-label="Xác nhận mật khẩu"]'), 'NewPass@123');
      await act(async () => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
      expect(complete).toHaveBeenCalledWith('forgot', 'proof', 'NewPass@123', 'NewPass@123');
      expect(state.clearSession).toHaveBeenCalledOnce();
      expect(state.navigate).toHaveBeenCalledWith('/dang-nhap', { replace: true });
    });
  } finally { complete.mockRestore(); }
});
it('reopening the OTP popup respects the original send time instead of restarting its cooldown', async () => {
  await render(h(PasswordOtpDialog, { purpose: 'forgot', email: 'a@example.com', challenge: { challengeId: 'c', requestedAt: Date.now() - 61000, expiresIn: 300, resendAfter: 60, message: 'Nếu email có tài khoản hợp lệ, hệ thống đã gửi mã xác thực.' }, onClose: vi.fn(), onVerified: vi.fn(), onChallenge: vi.fn() }), async () => {
    const resend = [...document.querySelectorAll('button')].find(button => button.textContent === 'Gửi lại mã');
    expect(resend).toBeTruthy(); expect(resend.disabled).toBe(false);
    expect(document.querySelector('[role=dialog]').textContent).toContain('3:59');
  });
});
