import { ArrowDown, ArrowUpRight, Leaf, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HIGHLIGHT_SECTIONS } from '@/constants/highlights';

export function HighlightHero() {
  return <>
    <section aria-labelledby="highlights-title" className="relative isolate overflow-hidden bg-[#294734]">
      <img src="/images/farm.jpg" alt="Ánh nắng dịu trên cánh đồng xanh" fetchPriority="high" className="absolute inset-0 -z-20 size-full object-cover object-[62%_center]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#183c2cf2] via-[#244a35c4] to-[#1b302d26]" />
      <div className="!mx-auto max-w-[1408px] px-5 pb-16 pt-7 sm:px-10 sm:pb-20 lg:px-14 lg:pb-24">
        <nav aria-label="Đường dẫn" className="!mb-12 flex items-center gap-3 text-xs text-white/65 sm:!mb-16"><Link to="/" className="transition-colors hover:!text-white">Trang chủ</Link><span aria-hidden="true">/</span><span aria-current="page" className="text-white/90">Điểm nổi bật</span></nav>
        <div className="max-w-3xl"><p className="!mb-5 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.24em] text-[#d5dfbd]"><Leaf size={14} /> MỘC ORGANIC / NHỮNG ĐIỀU CHÚNG TÔI TRÂN TRỌNG</p><h1 id="highlights-title" className="font-serif text-[38px] font-medium leading-[1.2] tracking-tight text-[#fffdf0] sm:text-5xl lg:text-[68px]">Tinh hoa từ đất mẹ.<br /><em className="font-normal text-[#d4dfb4]">Trọn vị nguyên bản.</em></h1><p className="!mt-6 max-w-lg text-sm leading-8 text-[#e0e5d4]">Từ nguồn gốc được tìm hiểu kỹ đến những lựa chọn cho bữa ăn mỗi ngày. Cùng Mộc chăm chút điều tốt lành, theo cách gần gũi với thiên nhiên hơn.</p><div className="!mt-9 flex flex-wrap gap-3"><a href="#tieu-chuan" className="inline-flex min-h-13 items-center justify-center gap-5 rounded-2xl bg-[#f4f3df] px-5 py-4 text-sm font-semibold !text-[#294734] transition-all duration-300 hover:bg-white motion-safe:hover:-translate-y-0.5">Khám phá giá trị Mộc <ArrowDown size={16} /></a><Link to="/san-pham" className="inline-flex min-h-13 items-center justify-center gap-3 rounded-2xl border border-white/35 px-5 py-4 text-sm !text-white transition-colors hover:bg-white/10">Khám phá sản phẩm <ArrowUpRight size={16} /></Link></div></div>
        <div className="!mt-12 flex items-end justify-between gap-6"><p className="max-w-xs border-l border-[#c1d3a5]/50 pl-4 text-[11px] leading-6 text-[#d7dfcb]">Một chút xanh trong từng lựa chọn.<br />Một đời lành từ những điều nhỏ.</p><div className="hidden size-25 shrink-0 -rotate-12 flex-col items-center justify-center gap-2 rounded-full border border-[#dae1c1]/55 text-[#edf0dc] sm:flex"><Sprout size={31} strokeWidth={1.2} /><span className="text-[8px] tracking-[0.16em]">GẦN THIÊN NHIÊN</span></div></div>
      </div>
    </section>
    <nav aria-label="Nội dung điểm nổi bật" className="border-b border-line bg-[#f4f3e9]"><div className="!mx-auto grid max-w-[1408px] grid-cols-2 px-5 sm:px-10 lg:grid-cols-4 lg:px-14">{HIGHLIGHT_SECTIONS.map((section, index) => <a key={section.id} href={`#${section.id}`} className="group flex min-h-20 items-center gap-3 px-3 py-4 transition-colors hover:bg-[#e7eddb] sm:gap-5 sm:px-6"><span className="font-serif text-2xl text-[#acb59b]">0{index + 1}</span><span className="text-xs font-medium text-primary sm:text-sm">{section.label}</span><ArrowDown size={14} className="!ml-auto shrink-0 text-[#8a9a70] transition-transform motion-safe:group-hover:translate-y-1" /></a>)}</div></nav>
  </>;
}
