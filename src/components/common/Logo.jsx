import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ light = false }) {
  return <Link to="/" className={cn('brand brand-organicfood', light && 'brand-light')} aria-label="organicfood.vn - Trang chủ">
    <span className="brand-symbol" aria-hidden="true"><Sprout size={27} strokeWidth={1.5} /></span>
    <span className="brand-word">organicfood<span className="brand-domain">.vn</span><small>Healthy Food - Better Life</small></span>
  </Link>;
}
