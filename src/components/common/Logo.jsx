import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ light = false }) { return <Link to="/" className={cn('brand', light && 'brand-light')} aria-label="Mộc Organic - Trang chủ"><span className="brand-symbol"><Sprout size={27} strokeWidth={1.5} /></span><span className="brand-word">mộc<span className="brand-dot">.</span><small>ORGANIC LIVING</small></span></Link>; }
