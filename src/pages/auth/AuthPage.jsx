import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Leaf, ShieldCheck, Mail, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth/authService';
import { DEMO_MODE } from '@/services/api';
import { errorMessage } from '@/lib/utils';
import { loginPath } from '@/lib/permissions';

export default function AuthPage({ mode = 'login' }) {
  const register = mode === 'register';
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [verify, setVerify] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { setError(''); setVerify(false); }, [mode]);
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setCooldown((value) => value - 1), 1000); return () => clearTimeout(timer); }, [cooldown]);
  if (user) return <Navigate to={loginPath(user)} replace />;
  async function submit(event) {
    event.preventDefault(); setError(''); setBusy(true);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (verify) { await authService.verifyOtp({ email, otp: values.otp }); toast.success('Xác thực thành công. Bạn có thể đăng nhập.'); setVerify(false); navigate('/dang-nhap'); }
      else if (register) {
        if (values.password !== values.confirmPassword) throw new Error('Mật khẩu xác nhận chưa khớp.');
        await authService.register(values); setEmail(values.email); setVerify(true); setCooldown(60);
      } else {
        const signedIn = await login({ ...values, rememberMe: values.rememberMe === 'on' });
        toast.success(`Chào mừng ${signedIn.fullName || signedIn.username}!`);
        navigate(loginPath(signedIn), { replace: true });
      }
    } catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  }
  async function resend() { setBusy(true); setError(''); try { await authService.resendOtp(email); setCooldown(60); toast.success('Đã gửi lại mã OTP.'); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); } }
  return <div className="auth-layout"><aside className="auth-story"><img src="/images/farm.jpg" alt="Cánh đồng xanh trong ánh nắng dịu nhẹ" /><div className="auth-story-shade" /><Logo light /><div className="auth-story-copy"><span className="eyebrow">CHÀO BẠN, MỘC ĐÂY.</span><h2>Một khởi đầu xanh.<br />Ngàn điều <em>tốt lành.</em></h2><p>Cùng Mộc nuôi dưỡng những thói quen nhỏ,<br />để mỗi ngày đều là một ngày sống lành.</p><div><ShieldCheck size={18} /> Tự nhiên từ gốc rễ. Tử tế từ trái tim.</div></div><span className="auth-copyright">Mộc Organic · Chọn lành, sống xanh.</span></aside><section className="auth-form-section"><Link to="/" className="back-link"><ArrowLeft size={15} /> Về trang chủ</Link><div className="auth-form-inner"><span className="auth-leaf"><Leaf size={27} strokeWidth={1.3} /></span><span className="eyebrow">BẠN CỦA MỘC</span><h1>{verify ? 'Chỉ còn một bước nhỏ' : register ? 'Bắt đầu hành trình xanh' : 'Mừng bạn trở lại.'}</h1><p className="auth-intro">{verify ? `Nhập mã gồm 6 chữ số đã gửi đến ${email}.` : register ? 'Tạo tài khoản để cùng Mộc chọn những điều lành.' : 'Đăng nhập để tiếp tục những lựa chọn tươi lành.'}</p><form onSubmit={submit} className="auth-form" key={`${mode}-${verify}`}>
    {verify ? <Field label="Mã xác thực OTP"><Input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="Nhập 6 chữ số" required /></Field> : <>
      {register && <Field label="Họ và tên"><Input name="fullName" autoComplete="name" placeholder="Nguyễn An Nhiên" required maxLength={255} /></Field>}
      <Field label="Tên đăng nhập"><Input name="username" autoComplete="username" placeholder="Tên đăng nhập của bạn" required maxLength={50} /></Field>
      {register && <div className="form-grid"><Field label="Địa chỉ email"><Input name="email" type="email" autoComplete="email" placeholder="ban@email.com" required maxLength={255} /></Field><Field label="Số điện thoại"><Input name="phoneNumber" type="tel" autoComplete="tel" placeholder="0901 234 567" required maxLength={255} /></Field></div>}
      <Field label="Mật khẩu"><div className="password-input"><Input name="password" type={showPassword ? 'text' : 'password'} autoComplete={register ? 'new-password' : 'current-password'} placeholder={register ? 'Tối thiểu 8 ký tự' : 'Nhập mật khẩu'} required minLength={register ? 8 : undefined} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></Field>
      {register && <Field label="Xác nhận mật khẩu"><Input name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Nhập lại mật khẩu" required minLength={8} /></Field>}
      {!register && <label className="checkbox-label"><input name="rememberMe" type="checkbox" /> Ghi nhớ đăng nhập</label>}
    </>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <Button type="submit" className="w-full" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={17} /> : verify ? <Mail size={17} /> : null}{busy ? 'Đang xử lý…' : verify ? 'Xác thực tài khoản' : register ? 'Tạo tài khoản' : 'Đăng nhập'}{!busy && <ArrowRight size={17} />}</Button>
    {verify && <Button variant="ghost" className="w-full" disabled={busy || cooldown > 0} onClick={resend}>Gửi lại mã {cooldown > 0 ? `(${cooldown}s)` : ''}</Button>}
  </form><p className="auth-switch">{register ? 'Đã là bạn của Mộc?' : 'Lần đầu đến với Mộc?'} <Link to={register ? '/dang-nhap' : '/dang-ky'}>{register ? 'Đăng nhập' : 'Tạo tài khoản'}</Link></p>{DEMO_MODE && <div className="demo-credentials"><span><Leaf size={14} /> ĐANG Ở CHẾ ĐỘ DEMO</span><p>Admin: <code>admin / Admin@123</code><br />Khách hàng: <code>khachhang / Khach@123</code></p>{register && <small>Đăng ký và OTP cần kết nối backend thật.</small>}</div>}<p className="auth-bottom-note"><ShieldCheck size={14} /> Thông tin của bạn được Mộc trân trọng.</p></div></section></div>;
}
