import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordAuthLayout } from '@/components/auth/PasswordAuthLayout';
import { passwordService, getPasswordGrant, clearPasswordGrant, passwordValidation } from '@/services/auth/passwordService';
import { errorMessage } from '@/lib/utils';

export default function ResetPasswordPage({ purpose }) {
  const { user, clearSession } = useAuth(), navigate = useNavigate();
  const [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [show, setShow] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), [, tick] = useState(0);
  useEffect(() => { const timer = setInterval(() => tick(value => value + 1), 1000); return () => clearInterval(timer); }, []);
  const grant = getPasswordGrant(purpose === 'change' ? user?.accountId : null);
  const valid = grant?.purpose === purpose && (purpose !== 'change' || !!user);
  const restart = purpose === 'change' ? '/tai-khoan' : '/quen-mat-khau';
  async function submit(event) {
    event.preventDefault(); if (busy || !valid) return;
    const issue = passwordValidation(password, confirm); if (issue) { setError(issue); return; }
    setBusy(true); setError('');
    try {
      await passwordService.complete(purpose, grant.token, password, confirm);
      clearPasswordGrant(); clearSession(); setPassword(''); setConfirm('');
      toast.success('Đã cập nhật mật khẩu. Vui lòng đăng nhập lại.'); navigate('/dang-nhap', { replace: true });
    } catch (failure) { setError(errorMessage(failure)); }
    finally { setBusy(false); }
  }
  return <PasswordAuthLayout title={purpose === 'change' ? 'Đổi mật khẩu' : 'Đặt mật khẩu mới'} description={valid ? 'Email đã được xác thực. Nhập mật khẩu mới để bảo vệ tài khoản của bạn.' : 'Vui lòng xác thực OTP trước khi đặt mật khẩu. Quyền xác thực có hiệu lực 5 phút và chỉ dùng một lần.'} backTo={restart} backLabel={purpose === 'change' ? 'Về tài khoản' : 'Xác thực lại email'}>
    {!valid ? <Link className="button button-primary inline-flex" to={restart}>Xác thực OTP lại</Link> : <form className="auth-form" onSubmit={submit}>
      <Field label="Mật khẩu mới" hint="Từ 8 ký tự, tối đa 72 byte. Chọn mật khẩu khác mật khẩu hiện tại."><div className="password-input"><Input aria-label="Mật khẩu mới" type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={72} value={password} disabled={busy} onChange={event => setPassword(event.target.value)} /><button type="button" disabled={busy} aria-label={show ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShow(!show)}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></Field>
      <Field label="Xác nhận mật khẩu"><Input aria-label="Xác nhận mật khẩu" type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={72} value={confirm} disabled={busy} onChange={event => setConfirm(event.target.value)} /></Field>
      <p className="text-xs leading-6 text-stone-500">Sau khi lưu, các phiên đăng nhập cũ sẽ kết thúc. Bạn cần đăng nhập lại bằng mật khẩu mới.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? <LoaderCircle size={17} className="animate-spin" /> : <KeyRound size={17} />}Lưu mật khẩu mới</Button>
    </form>}
  </PasswordAuthLayout>;
}
