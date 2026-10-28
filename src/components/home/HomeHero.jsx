import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, Leaf, ShoppingBag, Sprout } from 'lucide-react';
import { BotanicalArt } from '@/components/common/BotanicalArt';
import { internalHref } from '@/lib/apiData';
import { safeMediaUrl } from '@/lib/productDetail';

function localFallback(event) { event.currentTarget.onerror = null; event.currentTarget.src = '/images/vegetables.jpg'; }

export function HomeHero({ content, exploreHref = '#san-pham' }) {
  const [slide, setSlide] = useState(0);
  const banners = content.banners || [];
  const slides = banners.length ? banners : [{ title: 'Một bữa ăn lành. Một ngày thật xanh.', buttonHref: '/san-pham', buttonLabel: 'Đi chợ cùng Mộc' }];
  const index = slide % slides.length, banner = slides[index];
  const title = index === 0 ? content.headline || banner.title : banner.title;
  const description = index === 0 ? content.introduction || banner.subtitle : banner.subtitle;
  const image = safeMediaUrl(banner.imageUrl) || '/images/vegetables.jpg';
  return <section className="moc-home-hero" aria-label="Khám phá cửa hàng" aria-roledescription={slides.length > 1 ? 'Trình chiếu banner' : undefined}>
    <BotanicalArt className="moc-home-hero-botanical" />
    <div className="container moc-home-hero-grid">
      <div className="moc-home-hero-copy">
        <span className="moc-home-kicker"><span /><Leaf size={14} />{content.siteName || 'Mộc'} · MỘT CHÚT XANH MỖI NGÀY</span>
        <h1>{title}</h1>
        {description && <p className="moc-home-hero-description">{description}</p>}
        <div className="moc-home-hero-actions"><Link to={internalHref(banner.buttonHref)} className="moc-home-primary-link"><ShoppingBag size={17} />{banner.buttonLabel || 'Khám phá sản phẩm'}<ArrowUpRight size={18} /></Link><Link to="/ve-cua-hang" className="moc-home-underlined-link">Câu chuyện của Mộc<ArrowUpRight size={16} /></Link></div>
        <div className="moc-home-hero-note"><span><Sprout size={21} strokeWidth={1.3} /></span><p>Mua sắm từ những thông tin rõ ràng.<small>Xem quy cách, giá và hồ sơ sản phẩm trước khi chọn.</small></p></div>
        {slides.length > 1 && <div className="moc-home-slider-controls"><button type="button" aria-label="Banner trước" onClick={() => setSlide((old) => (old + slides.length - 1) % slides.length)}><ChevronLeft size={18} /></button><span aria-live="polite">{String(index + 1).padStart(2, '0')} <i>/ {String(slides.length).padStart(2, '0')}</i></span><div className="moc-home-slider-dots">{slides.map((item, itemIndex) => <button type="button" key={itemIndex} aria-label={`Xem banner ${itemIndex + 1}: ${item.title}`} aria-pressed={index === itemIndex} onClick={() => setSlide(itemIndex)}><span /></button>)}</div><button type="button" aria-label="Banner tiếp theo" onClick={() => setSlide((old) => (old + 1) % slides.length)}><ChevronRight size={18} /></button></div>}
      </div>
      <div className="moc-home-hero-visual">
        <div className="moc-home-hero-orbit" aria-hidden="true" />
        <div className="moc-home-hero-image" key={`image-${index}`}><img src={image} alt={banner.imageAlt || banner.title || 'Sắc màu rau củ và bữa ăn mỗi ngày'} width="760" height="860" fetchPriority="high" onError={localFallback} /></div>
        <div className="moc-home-hero-seal" aria-hidden="true"><Leaf size={26} strokeWidth={1.2} /><span>GẦN THIÊN NHIÊN</span><small>Mộc · Organic living</small></div>
        <Link to="/diem-noi-bat#dinh-duong" className="moc-home-hero-inset"><img src="/images/strawberries.jpg" alt="Dâu tây, hình gợi cảm hứng cho bữa ăn nhiều sắc màu" width="160" height="190" /><div><span>Gợi cảm hứng mỗi ngày</span><strong>Thêm sắc màu<br />cho bữa ăn.</strong><ArrowUpRight size={19} /></div></Link>
      </div>
    </div>
    <a href={exploreHref} className="moc-home-scroll-link"><span>Khám phá cửa hàng</span><ArrowDown size={15} /></a>
  </section>;
}
