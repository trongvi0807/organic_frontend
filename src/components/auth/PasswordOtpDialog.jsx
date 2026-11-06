import { useEffect, useState } from 'react';
import { LoaderCircle, Mail } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { passwordService } from '@/services/auth/passwordService';
import { errorMessage } from '@/lib/utils';

export function PasswordOtpDialog({ purpose, email, challenge, onChallenge, onVerified, onClose }) {
  const [otp, setOtp] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [sentAt, setSentAt] = useState(challenge.requestedAt || Date.now()), [now, setNow] = useState(Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const elapsed = Math.floor((now - sentAt) / 1000), cooldown = Math.max(0, challenge.resendAfter - elapsed), remaining = Math.max(0, challenge.expiresIn - elapsed);
  async function verify(event) {
    event.preventDefault(); if (busy) return; setBusy(true); setError('');
    try { onVerified(await passwordService.verify(purpose, challenge.challengeId, otp)); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  async function resend() {
    if (busy || cooldown) return; setBusy(true); setError('');
    try { const next = await passwordService.request(purpose, email); onChallenge(next); setOtp(''); setSentAt(Date.now()); setNow(Date.now()); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  return <Modal open title="Xác thực qua email" description={purpose === 'change' ? `Nhập mã OTP đã gửi đến ${challenge.emailHint || 'email của tài khoản'}.` : challenge.message} className="!max-w-[480px]" onOpenChange={open => { if (!open && !busy) onClose(); }}>
    <form className="auth-form" onSubmit={verify}>
      <Field label="Mã xác thực OTP" hint={remaining ? `Mã gồm 6 chữ số, còn hiệu lực ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}.` : 'Mã đã hết hạn. Vui lòng gửi lại mã mới.'}>
        <Input autoFocus aria-label="Mã xác thực OTP" name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={otp} disabled={busy} placeholder="Nhập 6 chữ số" onChange={event => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} />
      </Field>
      {purpose === 'forgot' && <p className="text-sm leading-6 text-stone-500 break-words">Email đã nhập: {email}. Kiểm tra cả thư mục Spam nếu chưa nhận được mã.</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy || !remaining}>{busy ? <LoaderCircle size={17} className="animate-spin" /> : <Mail size={17} />}Xác thực mã</Button>
      <Button type="button" className="w-full" variant="ghost" disabled={busy || cooldown > 0} onClick={resend}>Gửi lại mã{cooldown > 0 ? ` (${cooldown}s)` : ''}</Button>
      <p className="text-xs leading-6 text-stone-500">Không chia sẻ mã xác thực. Gửi lại mã sẽ làm mã cũ hết hiệu lực.</p>
    </form>
  </Modal>;
}
