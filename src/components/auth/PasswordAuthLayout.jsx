import { Link } from 'react-router-dom';
import { ArrowLeft, Leaf, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/common/Logo';

export function PasswordAuthLayout({ title, description, children, backTo = '/dang-nhap', backLabel = 'Về đăng nhập' }) {
  return <div className="auth-layout"><aside className="auth-story"><img src="/images/farm.jpg" alt="Cánh đồng xanh trong ánh nắng dịu nhẹ" /><div className="auth-story-shade" /><Logo light /><div className="auth-story-copy"><span className="eyebrow">CHÀO BẠN, organicfood.vn ĐÂY.</span><h2>Một khởi đầu xanh.<br />Ngàn điều <em>tốt lành.</em></h2><p>Cùng organicfood.vn nuôi dưỡng những thói quen nhỏ,<br />để mỗi ngày đều là một ngày sống lành.</p><div><ShieldCheck size={18} /> Tự nhiên từ gốc rễ. Tử tế từ trái tim.</div></div><span className="auth-copyright">organicfood.vn · Chọn lành, sống xanh.</span></aside><section className="auth-form-section"><Link to={backTo} className="back-link"><ArrowLeft size={15} />{backLabel}</Link><div className="auth-form-inner"><span className="auth-leaf"><Leaf size={27} strokeWidth={1.3} /></span><span className="eyebrow">BẠN CỦA organicfood.vn</span><h1>{title}</h1><p className="auth-intro">{description}</p>{children}<p className="auth-bottom-note"><ShieldCheck size={14} />Thông tin của bạn được organicfood.vn trân trọng.</p></div></section></div>;
}
