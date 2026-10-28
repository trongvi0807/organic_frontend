import { ArrowRight, ArrowUpRight, BookOpen, Leaf, MapPin, Plus, ShieldCheck, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/common/Reveal';

const discoverySteps = [
  { title: 'Chọn điều bạn cần', description: 'Khám phá theo danh mục, đối chiếu giá và chọn quy cách phù hợp với bữa ăn của bạn.', icon: Leaf },
  { title: 'Hiểu điều bạn chọn', description: 'Đọc nơi sản xuất, hồ sơ chứng nhận và thông tin được công bố trên từng sản phẩm.', icon: ShieldCheck },
  { title: 'Theo dõi từng đơn hàng', description: 'Xem lại sản phẩm đã chọn, thông tin nhận hàng và hành trình đơn trong tài khoản.', icon: Sprout },
];

const readingGuides = [
  { title: 'Đọc chứng nhận, hiểu rõ hơn.', description: 'Tên tiêu chuẩn, tổ chức cấp và thời hạn: những chi tiết nhỏ đáng dành thời gian đối chiếu.', category: 'NGUỒN GỐC & MINH BẠCH', image: '/images/vegetables.jpg', alt: 'Rau củ xanh cho chủ đề tìm hiểu nguồn gốc sản phẩm', href: '/ve-cua-hang#chung-nhan', tone: 'bg-[#edf1e4]' },
  { title: 'Chăm chút bữa ăn mỗi ngày.', description: 'Bắt đầu từ nguyên liệu phù hợp, sự đa dạng và những lựa chọn cân bằng cho chính bạn.', category: 'CẢM HỨNG BỮA ĂN', image: '/images/nuts.jpg', alt: 'Các loại hạt dùng trong bữa ăn đa dạng', href: '/diem-noi-bat#dinh-duong', tone: 'bg-[#f5e9dc]' },
  { title: 'Một thói quen nhỏ, ít rác hơn.', description: 'Tìm hiểu về tái sử dụng, phân loại bao bì và cách thực hiện từ những việc gần gũi.', category: 'SỐNG GẦN THIÊN NHIÊN', image: '/images/tea.jpg', alt: 'Trà thảo mộc gợi cảm hứng sống gần thiên nhiên', href: '/diem-noi-bat#bao-bi', tone: 'bg-[#efecf0]' },
];

function EditorialLink({ to, children }) {
  return <Link to={to} className="moc-home-editorial-link inline-flex min-h-12 items-center gap-5 rounded-full border border-[#bdcbb4] px-6 py-3 text-sm font-semibold text-[#294b34] transition-colors duration-300 hover:bg-[#e9efdf]">{children}<ArrowUpRight size={17} aria-hidden="true" /></Link>;
}

function OriginChips({ origins }) {
  const published = origins.filter((item) => item && (item.name || item.region || item.country)).slice(0, 3);
  if (!published.length) return null;
  return <div className="moc-home-origin-list !mt-7 border-t border-[#d9e0ce] pt-6">
    <p className="!mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#637453]">Trong hồ sơ nguồn gốc của cửa hàng</p>
    <ul className="flex flex-col gap-3">
      {published.map((item, index) => <li key={item.id || `${item.name}-${index}`} className="flex items-start gap-3 text-sm leading-6 text-[#36523b]">
        <MapPin size={17} strokeWidth={1.5} className="!mt-1 shrink-0 text-[#7d925f]" aria-hidden="true" />
        <span><strong className="font-medium">{item.name || [item.region, item.country].filter(Boolean).join(', ')}</strong>{item.name && (item.region || item.country) && <span className="block text-xs text-[#65715e]">{[item.region, item.country].filter(Boolean).join(', ')}</span>}{item.producerName && <span className="block text-xs text-[#65715e]">{item.producerName}</span>}</span>
      </li>)}
    </ul>
  </div>;
}

function FarmStory({ origins }) {
  return <section id="cau-chuyen" className="moc-home-story scroll-mt-32 bg-[#edf1e5] py-14 sm:py-20 lg:py-24" aria-labelledby="moc-home-story-title">
    <div className="container grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 xl:gap-24">
      <Reveal className="relative min-w-0 pb-5 pr-5 sm:pb-7 sm:pr-7">
        <div className="absolute bottom-0 right-0 h-4/5 w-4/5 rounded-[1.75rem] border border-[#b7c8a5]" aria-hidden="true" />
        <div className="group relative aspect-[1.06] overflow-hidden rounded-[1.75rem] rounded-tr-[6rem] sm:rounded-tr-[9rem]">
          <img src="/images/farm.jpg" alt="Khung cảnh canh tác xanh gợi cảm hứng gần gũi với thiên nhiên" loading="lazy" decoding="async" width="800" height="800" className="h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#173721a6] via-transparent to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-6 bottom-7 sm:inset-x-9 sm:bottom-9"><span className="!mb-3 block text-[10px] font-medium tracking-[0.19em] text-[#f0f2df]">GẦN THIÊN NHIÊN HƠN</span><p className="max-w-xs font-serif text-3xl leading-snug text-[#fffdf2] sm:text-4xl">Từ đất lành,<br />đến bữa ăn của bạn.</p></div>
        </div>
      </Reveal>
      <Reveal delay={80} className="min-w-0">
        <p className="!mb-5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#687d52]"><Sprout size={16} strokeWidth={1.4} aria-hidden="true" /> CÂU CHUYỆN CỦA MỘC</p>
        <h2 id="moc-home-story-title" className="max-w-lg font-serif text-[32px] font-medium leading-[1.3] tracking-tight text-[#294b34] sm:text-[40px] lg:text-[44px]">Chọn thực phẩm.<br /><em className="font-normal text-[#798b5b]">Chọn cả sự rõ ràng.</em></h2>
        <p className="!mt-5 max-w-lg text-sm leading-8 text-[#5c6c56]">Bữa ăn gần gũi bắt đầu từ những nguyên liệu bạn hiểu rõ. Tại Mộc, bạn có thể tìm hiểu nguồn gốc, xem hồ sơ chứng nhận và đối chiếu quy cách trước khi lựa chọn.</p>
        <p className="!mt-3 max-w-lg text-sm leading-8 text-[#5c6c56]">Chúng tôi dành một nơi riêng cho những thông tin ấy, để việc mua sắm mỗi ngày trở nên dễ dàng và có cơ sở hơn.</p>
        <OriginChips origins={origins} />
        <div className="!mt-7"><EditorialLink to="/ve-cua-hang">Khám phá câu chuyện & nguồn gốc</EditorialLink></div>
      </Reveal>
    </div>
  </section>;
}

function ValuesSection({ highlights }) {
  const published = highlights.filter((item) => item && (item.title || item.description));
  const items = published.length ? published : discoverySteps;
  const icons = [Leaf, ShieldCheck, Sprout];
  return <section id="song-xanh" className="moc-home-values py-14 sm:py-20" aria-labelledby="moc-home-values-title">
    <div className="container">
      <Reveal className="!mb-9 flex flex-col justify-between gap-5 sm:!mb-11 lg:flex-row lg:items-end">
        <div><p className="!mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7b8d5f]">CHĂM CHÚT TỪ NHỮNG ĐIỀU NHỎ</p><h2 id="moc-home-values-title" className="font-serif text-3xl font-medium leading-snug text-[#294b34] sm:text-[38px]">{published.length ? 'Những điều Mộc trân trọng.' : 'Mua sắm bằng sự thấu hiểu.'}</h2></div>
        <Link to="/diem-noi-bat" className="inline-flex min-h-11 items-center gap-3 text-sm font-medium text-[#47623a] transition-colors hover:text-[#7c913f]">Điểm nổi bật của cửa hàng <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </Reveal>
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((item, index) => { const Icon = published.length ? icons[index % icons.length] : item.icon; return <Reveal as="article" key={`${item.title}-${index}`} delay={(index % 3) * 55} className={`moc-home-value-card rounded-[1.5rem] p-7 transition-shadow duration-300 hover:shadow-[0_12px_32px_#2c49340a] sm:p-8 ${index % 3 === 0 ? 'bg-[#eef2e7]' : index % 3 === 1 ? 'bg-[#f6ece2]' : 'bg-[#f0edf1]'}`}>
          <div className="!mb-8 flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-full border border-[#8b9b7d]/30 bg-white/40 text-[#6a8056]"><Icon size={25} strokeWidth={1.25} aria-hidden="true" /></span><span className="font-serif text-3xl text-[#8b9b7d]/60" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></div>
          <h3 className="font-serif text-2xl font-medium leading-snug text-[#2e4b35]">{item.title}</h3>
          {item.description && <p className="!mt-4 text-sm leading-7 text-[#65705c]">{item.description}</p>}
        </Reveal>; })}
      </div>
    </div>
  </section>;
}

function ReadingSection() {
  return <section className="moc-home-reading bg-[#faf8f2] py-14 sm:py-20" aria-labelledby="moc-home-reading-title">
    <div className="container">
      <Reveal className="!mb-9 flex flex-col justify-between gap-5 sm:!mb-11 lg:flex-row lg:items-end"><div><p className="!mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7b8d5f]"><BookOpen size={15} strokeWidth={1.4} aria-hidden="true" /> GÓC CẢM HỨNG</p><h2 id="moc-home-reading-title" className="font-serif text-3xl font-medium leading-snug text-[#294b34] sm:text-[38px]">Một chút hiểu biết.<br /><em className="font-normal text-[#7a8b60]">Nhiều lựa chọn tốt hơn.</em></h2></div><p className="max-w-sm text-sm leading-7 text-[#6a745f]">Những chủ đề gần gũi giúp bạn đọc thông tin kỹ hơn và chăm chút thói quen mỗi ngày.</p></Reveal>
      <div className="grid gap-7 md:grid-cols-3">
        {readingGuides.map((guide, index) => <Reveal as="article" key={guide.href} delay={index * 60} className="moc-home-reading-card group min-w-0">
          <Link to={guide.href} className={`block overflow-hidden rounded-[1.5rem] ${guide.tone}`} tabIndex={-1} aria-hidden="true"><img src={guide.image} alt="" loading="lazy" decoding="async" width="600" height="450" className="aspect-[4/3] w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-105" /></Link>
          <div className="px-1 pb-1 pt-6"><p className="!mb-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#78865e]">{guide.category}</p><h3 className="font-serif text-2xl font-medium leading-snug text-[#294b34]"><Link to={guide.href} className="rounded-sm transition-colors hover:text-[#7b8e5d]">{guide.title}</Link></h3><p className="!mt-3 text-sm leading-7 text-[#727968]">{guide.description}</p><Link to={guide.href} className="!mt-4 inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-[#36553b] transition-colors hover:text-[#7b8e5d]" aria-label={`Tìm hiểu thêm: ${guide.title}`}>Tìm hiểu thêm <ArrowRight size={15} aria-hidden="true" /></Link></div>
        </Reveal>)}
      </div>
    </div>
  </section>;
}

function QuestionsSection({ faqs }) {
  const published = faqs.filter((item) => item && item.question && item.answer);
  if (!published.length) return null;
  return <section className="moc-home-questions py-14 sm:py-20" aria-labelledby="moc-home-questions-title"><div className="container grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
    <Reveal><span className="!mb-4 flex size-12 items-center justify-center rounded-full bg-[#edf1e4] text-[#829364]"><Leaf size={23} strokeWidth={1.3} aria-hidden="true" /></span><p className="!mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7b8d5f]">CÙNG BẠN TÌM HIỂU</p><h2 id="moc-home-questions-title" className="font-serif text-3xl font-medium leading-snug text-[#294b34] sm:text-[38px]">Bạn hỏi,<br /><em className="font-normal text-[#7a8b60]">Mộc giải đáp.</em></h2><p className="!mt-5 max-w-xs text-sm leading-7 text-[#727968]">Một vài thông tin hữu ích trước khi bạn chọn sản phẩm cho mình.</p></Reveal>
    <Reveal delay={60} className="min-w-0 border-t border-[#e0e5d8]">{published.map((item, index) => <details key={`${item.question}-${index}`} className="group border-b border-[#e0e5d8] py-1"><summary className="flex min-h-18 cursor-pointer list-none items-center justify-between gap-5 py-5 text-sm font-medium leading-6 text-[#36513b] [&::-webkit-details-marker]:hidden">{item.question}<Plus size={18} strokeWidth={1.5} className="shrink-0 text-[#8c9c72] transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true" /></summary><p className="pb-6 pr-8 text-sm leading-8 text-[#68745e]">{item.answer}</p></details>)}</Reveal>
  </div></section>;
}

export function HomeEditorial({ origins = [], highlights = [], faqs = [], children }) {
  return <>
    <FarmStory origins={Array.isArray(origins) ? origins : []} />
    <ValuesSection highlights={Array.isArray(highlights) ? highlights : []} />
    {children}
    <ReadingSection />
    <QuestionsSection faqs={Array.isArray(faqs) ? faqs : []} />
  </>;
}
