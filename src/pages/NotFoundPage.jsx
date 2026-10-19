import { Link } from 'react-router-dom';
import { Sprout, ArrowLeft } from 'lucide-react';
export default function NotFoundPage() { return <div className="not-found"><Sprout size={52} strokeWidth={1} /><span className="eyebrow">404 · LẠC VÀO VƯỜN MỘC</span><h1>Trang này chưa kịp nảy mầm.</h1><p>Cùng trở về để chọn những điều tươi lành nhé.</p><Link className="hero-cta" to="/"><ArrowLeft size={16} /> Về trang chủ</Link></div>; }
