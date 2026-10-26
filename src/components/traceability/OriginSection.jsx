import { Globe2, MapPin, Sprout, ArrowUpRight } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';

export function OriginSection({ origin, productName }) {
  const facts = [
    { icon: Globe2, label: 'QUỐC GIA XUẤT XỨ', value: origin?.country, fallback: 'Chưa công bố quốc gia' },
    { icon: MapPin, label: 'VÙNG SẢN XUẤT', value: origin?.region, fallback: 'Chưa công bố vùng sản xuất' },
    { icon: Sprout, label: 'CƠ SỞ SẢN XUẤT', value: origin?.producerName, fallback: 'Chưa công bố cơ sở sản xuất' },
  ];
  return <Reveal as="section" id="nguon-goc" className="scroll-mt-8 border-t border-line py-12 sm:py-16" aria-labelledby="origin-heading">
    <div className="!mb-8 flex flex-wrap items-end justify-between gap-5"><div><p className="!mb-3 text-[10px] font-semibold tracking-[0.2em] text-[#7a8c60]">01 / TỪ NƠI BẮT ĐẦU</p><h2 id="origin-heading" className="font-serif text-3xl font-medium text-primary sm:text-4xl">Hiểu về nguồn gốc.</h2></div><p className="max-w-md text-sm leading-7 text-stone-500">Thông tin xuất xứ được công bố cho <span className="font-medium text-primary">{productName}</span>.</p></div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <div className="relative flex min-h-64 flex-col justify-between overflow-hidden rounded-3xl bg-[#eaf0e1] p-7 sm:p-9">
        <svg viewBox="0 0 360 220" className="pointer-events-none absolute inset-0 size-full text-[#99af7f] opacity-30" fill="none" aria-hidden="true"><path d="M-40 125C40-20 160 240 240 60S430 35 400 190M-30 150C80 0 140 240 250 90S430 65 420 210M-20 175C90 20 170 265 265 110S440 95 440 235M-10 200C100 40 190 290 285 130S460 120 460 260" stroke="currentColor" strokeWidth="1.5" /><circle cx="260" cy="77" r="23" stroke="currentColor" /><circle cx="260" cy="77" r="38" stroke="currentColor" /></svg>
        <span className="relative flex size-12 items-center justify-center rounded-full bg-white/80 text-primary"><MapPin size={24} strokeWidth={1.4} /></span>
        <div className="relative !mt-8"><p className="!mb-3 text-[10px] tracking-[0.2em] text-[#6e805a]">HỒ SƠ XUẤT XỨ</p><h3 className="font-serif text-2xl font-medium leading-snug text-primary">{origin?.originName || 'Nguồn gốc đang được cập nhật'}</h3>{origin?.originCode && <p className="!mt-2 text-xs text-[#6e805a]">Mã vùng: {origin.originCode}</p>}<p className="!mt-4 text-sm leading-7 text-[#617454]">{origin?.description || (origin ? 'Đối chiếu quốc gia, vùng trồng và cơ sở sản xuất từ hồ sơ của sản phẩm.' : 'Cửa hàng chưa công bố hồ sơ xuất xứ cho sản phẩm này.')}</p></div>
      </div>
      <div className="min-w-0 rounded-3xl border border-line bg-white px-6 py-2 sm:px-8">
        <ol className="divide-y divide-line">{facts.map(({ icon: Icon, label, value, fallback }, index) => <li key={label} className="flex gap-4 py-6"><div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cream text-[#7a8c60]"><Icon size={21} strokeWidth={1.4} /></div><div className="min-w-0 flex-1"><p className="!mb-2 text-[10px] tracking-widest text-stone-500">{label}</p><p className={`break-words text-base ${value ? 'font-medium text-primary' : 'text-stone-400'}`}>{value || fallback}</p>{index === 2 && origin?.address && <p className="!mt-2 text-xs leading-6 text-stone-500">{origin.address}</p>}</div><span className="text-[10px] text-stone-400">0{index + 1}</span></li>)}</ol>
        {origin?.country && <div className="flex items-center gap-2 border-t border-line py-4 text-xs text-stone-500"><ArrowUpRight size={14} /> Thông tin theo hồ sơ sản phẩm được công bố.</div>}
      </div>
    </div>
  </Reveal>;
}
