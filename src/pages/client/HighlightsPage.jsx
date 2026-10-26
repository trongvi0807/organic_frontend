import { ArrowRight, Leaf } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Reveal } from '@/components/common/Reveal';
import { HighlightHero } from '@/components/highlights/HighlightHero';
import { StandardGrid } from '@/components/highlights/StandardGrid';
import { CertificationSection } from '@/components/highlights/CertificationSection';
import { HealthBenefits } from '@/components/highlights/HealthBenefits';
import { PackagingSection } from '@/components/highlights/PackagingSection';

export default function HighlightsPage() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }));
    return () => cancelAnimationFrame(frame);
  }, [hash]);
  return <div className="bg-[#fdfcf7]">
    <HighlightHero />
    <div className="!mx-auto max-w-[1408px] px-5 sm:px-10 lg:px-14"><StandardGrid /></div>
    <CertificationSection />
    <div className="!mx-auto max-w-[1408px] px-5 sm:px-10 lg:px-14"><HealthBenefits /><PackagingSection />
      <Reveal as="section" className="!mx-auto flex max-w-2xl flex-col items-center pb-16 pt-14 text-center sm:pb-24 sm:pt-20"><Leaf size={30} strokeWidth={1.2} className="!mb-5 text-[#8a9b6c]" /><p className="!mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[#8b9878]">MỘC / CHỌN MỘT CHÚT XANH</p><h2 className="font-serif text-3xl font-medium leading-snug text-primary sm:text-4xl">Bắt đầu từ một lựa chọn nhỏ.</h2><p className="!mt-4 text-sm leading-8 text-[#808975]">Hiểu nguồn gốc, đọc kỹ thông tin và chọn sản phẩm phù hợp cho hôm nay.</p><div className="!mt-7 flex flex-wrap justify-center gap-3"><Link to="/san-pham" className="inline-flex min-h-12 items-center justify-center gap-4 rounded-2xl bg-primary px-6 py-3 text-sm font-medium !text-white transition-colors hover:bg-primary-dark">Khám phá sản phẩm <ArrowRight size={16} /></Link><Link to="/ve-cua-hang" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-[#ccd6bd] px-6 py-3 text-sm font-medium !text-primary transition-colors hover:bg-sage">Tìm hiểu nguồn gốc <ArrowRight size={16} /></Link></div></Reveal>
    </div>
  </div>;
}
