import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';

export default function LogoutPage() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function signOut() {
    setBusy(true);
    try { await logout(); toast.success('Đã đăng xuất. Hẹn gặp lại bạn!'); }
    catch { toast.info('Đã đăng xuất trên trình duyệt. Máy chủ chưa xác nhận thu hồi phiên.'); }
    finally { navigate('/dang-nhap', { replace: true }); }
  }
  return <div className="logout-page"><Logo /><div className="logout-card"><span className="auth-leaf">{user ? <LogOut size={29} /> : <Leaf size={29} />}</span><h1>{user ? 'Hẹn gặp lại bạn nhé?' : 'Bạn đã đăng xuất'}</h1><p>{user ? 'Đăng xuất tài khoản trên trình duyệt này. Những lựa chọn tươi lành vẫn luôn đợi bạn.' : 'Cảm ơn bạn đã ghé Mộc. Hẹn gặp lại trong một ngày thật xanh.'}</p>{user ? <div className="logout-actions"><Button disabled={busy} onClick={signOut}>{busy ? 'Đang đăng xuất…' : 'Đăng xuất'}</Button><Link to="/">Ở lại với Mộc</Link></div> : <Link className="hero-cta" to="/dang-nhap">Đăng nhập lại</Link>}</div></div>;
}
