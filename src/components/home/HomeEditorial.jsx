import { ArrowRight, ArrowUpRight, BookOpen, Leaf, MapPin, Plus, ShieldCheck, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/common/Reveal';

const discoverySteps = [
  { title: 'Chọn điều bạn cần', description: 'Khám phá theo danh mục, đối chiếu giá và chọn quy cách phù hợp với bữa ăn của bạn.', icon: Leaf },
  { title: 'Hiểu điều bạn chọn', description: 'Đọc nơi sản xuất, hồ sơ chứng nhận và thông tin được công bố trên từng sản phẩm.', icon: ShieldCheck },
  { title: 'Theo dõi từng đơn hàng', description: 'Xem lại sản phẩm đã chọn, thông tin nhận hàng và hành trình đơn trong tài khoản.', icon: Sprout },
];

const readingGuides = [
  {
    title: 'Đọc chứng nhận, hiểu rõ hơn.',
    description: 'Tên tiêu chuẩn, tổ chức cấp và thời hạn: những chi tiết nhỏ đáng dành thời gian đối chiếu.',
    category: 'NGUỒN GỐC & MINH BẠCH',
    image: '/images/vegetables.jpg',
    alt: 'Rau củ xanh cho chủ đề tìm hiểu nguồn gốc sản phẩm',
    href: '/ve-cua-hang#chung-nhan',
    tone: 'bg-[#edf2e4]',
  },
  {
    title: 'Chăm chút bữa ăn mỗi ngày.',
    description: 'Bắt đầu từ nguyên liệu phù hợp, sự đa dạng và những lựa chọn cân bằng cho chính bạn.',
    category: 'CẢM HỨNG BỮA ĂN',
    image: '/images/nuts.jpg',
    alt: 'Các loại hạt dùng trong bữa ăn đa dạng',
    href: '/diem-noi-bat#dinh-duong',
    tone: 'bg-[#f6eee2]',
  },
  {
    title: 'Một thói quen nhỏ, ít rác hơn.',
    description: 'Tìm hiểu về tái sử dụng, phân loại bao bì và cách thực hiện từ những việc gần gũi.',
    category: 'SỐNG GẦN THIÊN NHIÊN',
    image: '/images/tea.jpg',
    alt: 'Trà thảo mộc gợi cảm hứng sống gần thiên nhiên',
    href: '/diem-noi-bat#bao-bi',
    tone: 'bg-[#f0edf2]',
  },
];

function EditorialLink({ to, children }) {
  return (
    <Link
      to={to}
      className="moc-home-editorial-link inline-flex min-h-12 items-center gap-4 rounded-full border border-[#b8c7ae] bg-white/70 px-6 py-3 text-sm font-semibold text-[#1B4D2E] transition-all duration-300 hover:bg-[#1B4D2E] hover:text-white hover:shadow-md"
    >
      <span>{children}</span>
      <ArrowUpRight size={17} aria-hidden="true" />
    </Link>
  );
}

function OriginChips({ origins }) {
  const published = (origins || []).filter((item) => item && (item.name || item.region || item.country)).slice(0, 3);
  if (!published.length) return null;
  return (
    <div className="moc-home-origin-list !mt-7 border-t border-[#d8e0ce] pt-6">
      <p className="!mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#55694a]">
        Trong hồ sơ nguồn gốc của cửa hàng
      </p>
      <ul className="flex flex-col gap-3">
        {published.map((item, index) => (
          <li key={item.id || `${item.name}-${index}`} className="flex items-start gap-3 text-sm leading-6 text-[#24422c]">
            <MapPin size={17} strokeWidth={1.6} className="!mt-1 shrink-0 text-[#1B4D2E]" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-[#1B4D2E]">
                {item.name || [item.region, item.country].filter(Boolean).join(', ')}
              </strong>
              {item.name && (item.region || item.country) && (
                <span className="block text-xs text-[#56695b]">{[item.region, item.country].filter(Boolean).join(', ')}</span>
              )}
              {item.producerName && <span className="block text-xs text-[#56695b]">{item.producerName}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FarmStory({ origins }) {
  return (
    <section id="cau-chuyen" className="moc-home-story scroll-mt-32 bg-[#edf2e6] py-16 sm:py-20 lg:py-24" aria-labelledby="moc-home-story-title">
      <div className="container grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 xl:gap-24">
        <Reveal className="relative min-w-0 pb-5 pr-5 sm:pb-7 sm:pr-7">
          <div className="absolute bottom-0 right-0 h-4/5 w-4/5 rounded-[2rem] border-2 border-[#b5c7a2]" aria-hidden="true" />
          <div className="group relative aspect-[1.08] overflow-hidden rounded-[2rem] rounded-tr-[6rem] shadow-lg sm:rounded-tr-[9rem]">
            <img
              src="/images/farm.jpg"
              alt="Khung cảnh nông trại canh tác xanh tươi lành"
              loading="lazy"
              decoding="async"
              width="800"
              height="800"
              className="h-full w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-104"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#14331ebf] via-[#14331e22] to-transparent" aria-hidden="true" />
            <div className="absolute inset-x-6 bottom-7 sm:inset-x-9 sm:bottom-9">
              <span className="!mb-2 inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-[#edf4df]">
                <Leaf size={13} /> GẦN THIÊN NHIÊN HƠN
              </span>
              <p className="max-w-xs font-serif text-3xl font-medium leading-snug text-[#fffef5] sm:text-4xl">
                Từ đất lành,<br />đến bữa ăn của bạn.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={80} className="min-w-0">
          <p className="!mb-4 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#1B4D2E]">
            <Sprout size={16} strokeWidth={1.5} aria-hidden="true" /> CÂU CHUYỆN CỦA ORGANICFOOD.VN
          </p>
          <h2 id="moc-home-story-title" className="max-w-lg font-serif text-[32px] font-medium leading-[1.3] tracking-tight text-[#1B4D2E] sm:text-[40px] lg:text-[44px]">
            Chọn thực phẩm.<br />
            <em className="font-normal text-[#597543]">Chọn cả sự rõ ràng.</em>
          </h2>
          <p className="!mt-5 max-w-lg text-sm leading-8 text-[#516453]">
            Bữa ăn gần gũi bắt đầu từ những nguyên liệu bạn hiểu rõ. Tại organicfood.vn, bạn có thể tìm hiểu nguồn gốc, xem hồ sơ chứng nhận và đối chiếu quy cách trước khi lựa chọn.
          </p>
          <p className="!mt-3 max-w-lg text-sm leading-8 text-[#516453]">
            Chúng tôi dành một nơi riêng cho những thông tin ấy, để việc mua sắm mỗi ngày trở nên dễ dàng và có cơ sở hơn.
          </p>
          <OriginChips origins={origins} />
          <div className="!mt-8">
            <EditorialLink to="/ve-cua-hang">Khám phá câu chuyện & nguồn gốc</EditorialLink>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ValuesSection({ highlights }) {
  const published = (highlights || []).filter((item) => item && (item.title || item.description));
  const items = published.length ? published : discoverySteps;
  const icons = [Leaf, ShieldCheck, Sprout];

  return (
    <section id="song-xanh" className="moc-home-values py-16 sm:py-20" aria-labelledby="moc-home-values-title">
      <div className="container">
        <Reveal className="!mb-10 flex flex-col justify-between gap-5 sm:!mb-12 lg:flex-row lg:items-end">
          <div>
            <p className="!mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#1B4D2E]">
              CHĂM CHÚT TỪ NHỮNG ĐIỀU NHỎ
            </p>
            <h2 id="moc-home-values-title" className="font-serif text-3xl font-medium leading-snug text-[#1B4D2E] sm:text-[38px]">
              {published.length ? 'Những điều organicfood.vn trân trọng.' : 'Mua sắm bằng sự thấu hiểu.'}
            </h2>
          </div>
          <Link
            to="/diem-noi-bat"
            className="inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-[#1B4D2E] transition-colors hover:text-[#327a4a]"
          >
            <span>Điểm nổi bật của cửa hàng</span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item, index) => {
            const Icon = published.length ? icons[index % icons.length] : item.icon;
            return (
              <Reveal
                as="article"
                key={`${item.title}-${index}`}
                delay={(index % 3) * 60}
                className={`moc-home-value-card rounded-[1.75rem] border border-[#e2e8da] p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  index % 3 === 0 ? 'bg-[#f0f4ea]' : index % 3 === 1 ? 'bg-[#f7efe4]' : 'bg-[#f1edf2]'
                }`}
              >
                <div className="!mb-7 flex items-center justify-between">
                  <span className="flex size-13 items-center justify-center rounded-2xl border border-[#1B4D2E]/20 bg-white/70 text-[#1B4D2E] shadow-sm">
                    <Icon size={26} strokeWidth={1.3} aria-hidden="true" />
                  </span>
                  <span className="font-serif text-3xl font-semibold text-[#1B4D2E]/30" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-medium leading-snug text-[#1B4D2E]">{item.title}</h3>
                {item.description && <p className="!mt-4 text-sm leading-7 text-[#56695b]">{item.description}</p>}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ReadingSection() {
  return (
    <section className="moc-home-reading bg-[#faf7ef] py-16 sm:py-20" aria-labelledby="moc-home-reading-title">
      <div className="container">
        <Reveal className="!mb-10 flex flex-col justify-between gap-5 sm:!mb-12 lg:flex-row lg:items-end">
          <div>
            <p className="!mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#1B4D2E]">
              <BookOpen size={15} strokeWidth={1.5} aria-hidden="true" /> GÓC CẢM HỨNG
            </p>
            <h2 id="moc-home-reading-title" className="font-serif text-3xl font-medium leading-snug text-[#1B4D2E] sm:text-[38px]">
              Một chút hiểu biết.<br />
              <em className="font-normal text-[#5b7847]">Nhiều lựa chọn tốt hơn.</em>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-[#5b6a5a]">
            Những chủ đề gần gũi giúp bạn đọc thông tin kỹ hơn và chăm chút thói quen dinh dưỡng mỗi ngày.
          </p>
        </Reveal>

        <div className="grid gap-7 md:grid-cols-3">
          {readingGuides.map((guide, index) => (
            <Reveal as="article" key={guide.href} delay={index * 70} className="moc-home-reading-card group min-w-0">
              <Link
                to={guide.href}
                className={`block overflow-hidden rounded-[1.75rem] border border-[#e3ebd9] shadow-sm ${guide.tone}`}
                tabIndex={-1}
                aria-hidden="true"
              >
                <img
                  src={guide.image}
                  alt={guide.alt || guide.title}
                  loading="lazy"
                  decoding="async"
                  width="600"
                  height="450"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-700 motion-safe:group-hover:scale-104"
                />
              </Link>
              <div className="px-1 pb-1 pt-6">
                <p className="!mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1B4D2E]">{guide.category}</p>
                <h3 className="font-serif text-2xl font-medium leading-snug text-[#1B4D2E]">
                  <Link to={guide.href} className="transition-colors hover:text-[#327a4a]">
                    {guide.title}
                  </Link>
                </h3>
                <p className="!mt-3 text-sm leading-7 text-[#56695b]">{guide.description}</p>
                <Link
                  to={guide.href}
                  className="!mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-bold text-[#1B4D2E] transition-colors hover:text-[#327a4a]"
                  aria-label={`Tìm hiểu thêm: ${guide.title}`}
                >
                  <span>Tìm hiểu thêm</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuestionsSection({ faqs }) {
  const published = (faqs || []).filter((item) => item && item.question && item.answer);
  if (!published.length) return null;

  return (
    <section className="moc-home-questions py-16 sm:py-20" aria-labelledby="moc-home-questions-title">
      <div className="container grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
        <Reveal>
          <span className="!mb-4 flex size-13 items-center justify-center rounded-2xl bg-[#edf2e4] text-[#1B4D2E] shadow-sm">
            <Leaf size={24} strokeWidth={1.4} aria-hidden="true" />
          </span>
          <p className="!mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#1B4D2E]">CÙNG BẠN TÌM HIỂU</p>
          <h2 id="moc-home-questions-title" className="font-serif text-3xl font-medium leading-snug text-[#1B4D2E] sm:text-[38px]">
            Bạn hỏi,<br />
            <em className="font-normal text-[#5b7847]">organicfood.vn giải đáp.</em>
          </h2>
          <p className="!mt-5 max-w-xs text-sm leading-7 text-[#56695b]">
            Một vài thông tin hữu ích về cách đóng gói, giao nhận và cam kết chất lượng của chúng tôi.
          </p>
        </Reveal>

        <Reveal delay={60} className="min-w-0 border-t border-[#dce3d4]">
          {published.map((item, index) => (
            <details key={`${item.question}-${index}`} className="group border-b border-[#dce3d4] py-1">
              <summary className="flex min-h-18 cursor-pointer list-none items-center justify-between gap-5 py-5 text-sm font-semibold leading-6 text-[#1F3324] transition-colors hover:text-[#1B4D2E] [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <Plus
                  size={19}
                  strokeWidth={1.8}
                  className="shrink-0 text-[#1B4D2E] transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>
              <p className="pb-6 pr-8 text-sm leading-8 text-[#56695b]">{item.answer}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export function HomeEditorial({ origins = [], highlights = [], faqs = [], children }) {
  return (
    <>
      <FarmStory origins={Array.isArray(origins) ? origins : []} />
      <ValuesSection highlights={Array.isArray(highlights) ? highlights : []} />
      {children}
      <ReadingSection />
      <QuestionsSection faqs={Array.isArray(faqs) ? faqs : []} />
    </>
  );
}
