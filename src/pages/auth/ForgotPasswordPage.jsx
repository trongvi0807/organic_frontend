import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LoaderCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordAuthLayout } from '@/components/auth/PasswordAuthLayout';
import { PasswordOtpDialog } from '@/components/auth/PasswordOtpDialog';
import { passwordService, rememberPasswordGrant } from '@/services/auth/passwordService';
import { errorMessage } from '@/lib/utils';

export default function ForgotPasswordPage() {
  const { user } = useAuth(), navigate = useNavigate();
  const [email, setEmail] = useState(''), [challenge, setChallenge] = useState(null), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  if (user) return <Navigate to="/tai-khoan" replace />;
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    if (challenge) { setOpen(true); return; }
    setBusy(true); setError('');
    try { const next = await passwordService.request('forgot', email.trim()); setChallenge(next); setOpen(true); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  return <PasswordAuthLayout title="Quên mật khẩu?" description="Nhập email đã đăng ký. Chúng mình sẽ gửi mã xác thực để bạn đặt mật khẩu mới.">
    <form className="auth-form" onSubmit={submit}>
      <Field label="Email đăng ký"><Input aria-label="Email đăng ký" type="email" autoComplete="email" required maxLength={255} placeholder="ban@email.com" value={email} disabled={busy} onChange={event => { setEmail(event.target.value); setChallenge(null); setError(''); }} /></Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? <LoaderCircle size={17} className="animate-spin" /> : <Mail size={17} />}{challenge ? 'Nhập mã xác thực' : 'Gửi mã xác thực'}</Button>
    </form>
    {open && challenge && <PasswordOtpDialog purpose="forgot" email={email.trim()} challenge={challenge} onChallenge={setChallenge} onClose={() => setOpen(false)} onVerified={result => { rememberPasswordGrant(result, 'forgot'); navigate('/dat-lai-mat-khau'); }} />}
  </PasswordAuthLayout>;
}
