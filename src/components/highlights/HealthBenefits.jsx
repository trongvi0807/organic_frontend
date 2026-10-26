import { Apple, ArrowUpRight, Heart, Utensils } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/common/Reveal';
import { HIGHLIGHT_SOURCES } from '@/constants/highlights';
import { SectionHeading } from './SectionHeading';

const benefits = [
  { icon: Apple, title: 'Đa dạng cho bữa ăn cân bằng', text: 'Kết hợp rau củ, trái cây, ngũ cốc nguyên hạt, các loại đậu và hạt để làm phong phú lựa chọn thực phẩm mỗi ngày.' },
  { icon: Utensils, title: 'Trân trọng hương vị nguyên liệu', text: 'Chọn quy cách vừa đủ, đọc hướng dẫn bảo quản và chế biến phù hợp để thưởng thức hương vị theo cách bạn yêu thích.' },
  { icon: Heart, title: 'Phù hợp với người bạn chăm sóc', text: 'Đọc thành phần, thông tin dị ứng và hướng dẫn sử dụng. Lựa chọn thực phẩm phù hợp với độ tuổi và nhu cầu riêng của từng người.' },
];

export function HealthBenefits() {
  return <section id="dinh-duong" aria-labelledby="nutrition-heading" className="scroll-mt-32 py-14 sm:py-20 lg:py-24"><div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
    <Reveal className="relative min-w-0 pb-6 pr-5 sm:pr-8"><div className="aspect-[5/6] max-h-[620px] overflow-hidden rounded-3xl rounded-tr-[6rem] bg-[#edf1e5]"><img src="/images/vegetables.jpg" alt="Rau củ nhiều màu sắc cho bữa ăn đa dạng" loading="lazy" className="size-full object-cover" /></div><div className="absolute bottom-0 right-0 max-w-[80%] rounded-2xl border border-[#e7e1d2] bg-[#f7f1e6] p-5 shadow-[0_8px_30px_#4a3c2210] sm:p-7"><p className="!mb-2 text-[9px] tracking-[0.16em] text-[#9a8b6d]">CHĂM CHÚT TỪ BỮA ĂN</p><p className="font-serif text-xl leading-snug text-[#6e654c] sm:text-2xl">Ăn đa dạng.<br />Thưởng thức trọn vẹn.</p></div></Reveal>
    <Reveal><SectionHeading eyebrow="03 / TRỌN BỮA NGON" title={<span id="nutrition-heading">Điều lành bắt đầu<br />từ những bữa ăn.</span>} description="Một lựa chọn lành mạnh nằm trong cả thói quen ăn uống: đa dạng, cân bằng và phù hợp với chính bạn." /><div className="space-y-6">{benefits.map(({ icon: Icon, title, text }) => <article key={title} className="flex gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf1e5] text-[#7a8e60]"><Icon size={22} strokeWidth={1.3} /></span><div><h3 className="text-sm font-semibold text-primary">{title}</h3><p className="!mt-2 text-xs leading-7 text-[#7c8571]">{text}</p></div></article>)}</div><a href={HIGHLIGHT_SOURCES.nutrition} target="_blank" rel="noopener noreferrer" className="!mt-6 inline-flex min-h-11 items-center gap-2 text-[10px] !text-[#8b957e] underline decoration-[#c8d0bb] underline-offset-4">Tìm hiểu về chế độ ăn lành mạnh từ WHO <ArrowUpRight size={12} /></a><div className="!mt-5 border-t border-line pt-5"><Link to="/san-pham" className="inline-flex min-h-11 items-center gap-2 text-xs font-medium !text-primary">Chọn nguyên liệu cho hôm nay <ArrowUpRight size={15} /></Link></div></Reveal>
  </div></section>;
}
