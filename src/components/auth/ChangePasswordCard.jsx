import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { passwordService, rememberPasswordGrant } from '@/services/auth/passwordService';
import { errorMessage } from '@/lib/utils';
import { PasswordOtpDialog } from './PasswordOtpDialog';

export function ChangePasswordCard() {
  const { user } = useAuth(), navigate = useNavigate();
  const [challenge, setChallenge] = useState(null), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function start() {
    if (busy) return; setBusy(true); setError('');
    try { const next = await passwordService.request('change'); setChallenge(next); setOpen(true); }
    catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  return <section className="!my-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
    <h2 className="!font-sans !text-base font-semibold text-primary">Bảo mật tài khoản</h2>
    <p className="!my-3 text-sm leading-7 text-stone-500">Xác thực qua email của tài khoản trước khi đổi mật khẩu. Tài khoản đăng nhập bằng Google cũng có thể thiết lập mật khẩu tại đây.</p>
    {error && <p className="form-error !mb-3" role="alert">{error}</p>}
    <Button variant="outline" disabled={busy} onClick={() => challenge ? setOpen(true) : start()}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <KeyRound size={16} />}{challenge ? 'Tiếp tục xác thực' : 'Đổi mật khẩu'}</Button>
    {open && challenge && <PasswordOtpDialog purpose="change" challenge={challenge} onChallenge={setChallenge} onClose={() => setOpen(false)} onVerified={result => { rememberPasswordGrant(result, 'change', user.accountId); navigate('/doi-mat-khau'); }} />}
  </section>;
}
