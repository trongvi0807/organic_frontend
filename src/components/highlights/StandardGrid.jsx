import { ArrowRight, Droplets, MapPin, Route, ShieldCheck, Sprout, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/common/Reveal';
import { FARMING_STANDARDS } from '@/constants/highlights';
import { SectionHeading } from './SectionHeading';

const icons = { sprout: Sprout, water: Droplets, route: Route };
const tones = { green: 'bg-[#edf2e4]', cream: 'bg-[#faf8ef]', wood: 'bg-[#f3ece1]' };
const journey = [{ label: 'Vùng sản xuất', icon: Sprout }, { label: 'Cơ sở canh tác', icon: MapPin }, { label: 'Hồ sơ sản phẩm', icon: ShieldCheck }, { label: 'Bữa ăn của bạn', icon: Utensils }];

export function StandardGrid() {
  return <section id="tieu-chuan" aria-labelledby="standards-heading" className="scroll-mt-32 py-14 sm:py-20 lg:py-24">
    <Reveal><SectionHeading eyebrow="01 / TỪ ĐẤT LÀNH" title={<span id="standards-heading">Tôn trọng đất.<br />Trân trọng từng mùa vụ.</span>} description="Định hướng lựa chọn nguồn hàng của Mộc bắt đầu từ sự minh bạch. Tiêu chuẩn và điều kiện canh tác cần được đối chiếu trong hồ sơ của từng sản phẩm." centered /></Reveal>
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">{FARMING_STANDARDS.map((standard, index) => { const Icon = icons[standard.icon]; return <Reveal as="article" key={standard.icon} delay={index * 55} className={`flex min-w-0 flex-col rounded-3xl p-7 transition-shadow duration-300 hover:shadow-[0_12px_30px_#2947350d] sm:p-8 ${tones[standard.tone]}`}><div className="!mb-7 flex items-start justify-between"><span className="flex size-14 items-center justify-center rounded-2xl bg-white/70 text-[#74875b]"><Icon size={29} strokeWidth={1.2} /></span><span className="text-[10px] tracking-widest text-[#9da58f]">0{index + 1}</span></div><h3 className="font-serif text-2xl font-medium text-primary">{standard.title}</h3><p className="!mt-4 flex-1 text-sm leading-8 text-[#78816e]">{standard.text}</p><Link to={index === 2 ? '/ve-cua-hang#ho-so-san-pham' : '/ve-cua-hang#nguon-goc'} className="!mt-6 inline-flex min-h-11 items-center justify-between gap-3 border-t border-[#b9c5aa]/40 pt-4 text-xs font-medium !text-primary">{standard.detail}<ArrowRight size={15} /></Link></Reveal>; })}</div>
    <Reveal className="!mt-12 rounded-3xl border border-line bg-white px-5 py-7 sm:px-8"><p className="!mb-6 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-[#83916f]">TỪ NƠI BẮT ĐẦU, ĐẾN LỰA CHỌN CỦA BẠN</p><ol className="grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4">{journey.map(({ label, icon: Icon }, index) => <li key={label} className="relative flex flex-col items-center gap-3 text-center"><Icon size={25} strokeWidth={1.2} className="text-[#84986b]" /><span className="text-xs font-medium text-primary">{label}</span>{index < journey.length - 1 && <ArrowRight size={15} className="absolute right-0 top-2 hidden translate-x-5 text-[#bac4ac] md:block" aria-hidden="true" />}</li>)}</ol><p className="!mt-6 text-center text-[11px] leading-6 text-[#8a9380]">Những thông tin bạn có thể tìm hiểu trên hành trình sản phẩm.</p></Reveal>
  </section>;
}
