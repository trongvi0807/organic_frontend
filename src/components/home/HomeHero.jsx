import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUpRight, ChevronLeft, ChevronRight, Leaf, ShoppingBag, Sprout, ShieldCheck } from 'lucide-react';
import { BotanicalArt } from '@/components/common/BotanicalArt';
import { internalHref } from '@/lib/apiData';
import { safeMediaUrl } from '@/lib/productDetail';

function localFallback(event) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = '/images/vegetables.jpg';
}

export function HomeHero({ content, exploreHref = '#san-pham' }) {
  const [slide, setSlide] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const banners = content.banners || [];
  const slides = banners.length
    ? banners
    : [{ title: 'Một bữa ăn lành. Một ngày thật xanh.', buttonHref: '/san-pham', buttonLabel: 'Đi chợ cùng organicfood.vn' }];

  const index = slide % slides.length;
  const currentBanner = slides[index];
  const title = index === 0 ? content.headline || currentBanner.title : currentBanner.title;
  const description = index === 0 ? content.introduction || currentBanner.subtitle : currentBanner.subtitle;

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // Autoplay hero slides if more than 1, pausing on hover or reduced-motion
  useEffect(() => {
    if (slides.length < 2 || hovered || reducedMotion) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setSlide((old) => (old + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length, hovered, reducedMotion]);

  return (
    <section
      className="moc-home-hero"
      aria-label="Khám phá cửa hàng"
      aria-roledescription={slides.length > 1 ? 'Trình chiếu banner' : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <BotanicalArt className="moc-home-hero-botanical" />

      <div className="container moc-home-hero-grid">
        <div className="moc-home-hero-copy">
          <div className="moc-home-kicker">
            <span className="moc-home-kicker-bar" />
            <Leaf size={14} className="moc-home-kicker-icon" />
            <span>{content.siteName || 'organicfood.vn'} · MỘT CHÚT XANH MỖI NGÀY</span>
          </div>

          <h1 className="moc-home-hero-title">{title}</h1>

          {description && <p className="moc-home-hero-description">{description}</p>}

          <div className="moc-home-hero-actions">
            <Link to={internalHref(currentBanner.buttonHref)} className="moc-home-primary-link">
              <ShoppingBag size={17} />
              <span>{currentBanner.buttonLabel || 'Đi chợ cùng organicfood.vn'}</span>
              <ArrowUpRight size={18} />
            </Link>
            <Link to="/ve-cua-hang" className="moc-home-underlined-link">
              <span>Câu chuyện của organicfood.vn</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="moc-home-hero-note">
            <span className="moc-home-note-icon">
              <Sprout size={22} strokeWidth={1.3} />
            </span>
            <p>
              <strong>Mua sắm từ những thông tin rõ ràng.</strong>
              <small>Xem quy cách, giá và hồ sơ sản phẩm trước khi chọn.</small>
            </p>
          </div>

          {slides.length > 1 && (
            <div className="moc-home-slider-controls" aria-label="Điều khiển banner">
              <button
                type="button"
                aria-label="Banner trước"
                onClick={() => setSlide((old) => (old + slides.length - 1) % slides.length)}
              >
                <ChevronLeft size={18} />
              </button>
              <span aria-live="polite">
                {String(index + 1).padStart(2, '0')} <i>/ {String(slides.length).padStart(2, '0')}</i>
              </span>
              <div className="moc-home-slider-dots">
                {slides.map((item, itemIndex) => (
                  <button
                    type="button"
                    key={itemIndex}
                    aria-label={`Xem banner ${itemIndex + 1}: ${item.title}`}
                    aria-pressed={index === itemIndex}
                    onClick={() => setSlide(itemIndex)}
                  >
                    <span />
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-label="Banner tiếp theo"
                onClick={() => setSlide((old) => (old + 1) % slides.length)}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        <div className="moc-home-hero-visual">
          <div className="moc-home-hero-orbit" aria-hidden="true" />

          {/* Crossfade Image Stack */}
          <div className="moc-home-hero-image-stack">
            {slides.map((item, itemIndex) => {
              const imgSrc = safeMediaUrl(item.imageUrl) || '/images/vegetables.jpg';
              const isActive = index === itemIndex;
              return (
                <div
                  key={itemIndex}
                  className={`moc-home-hero-slide-image ${isActive ? 'is-active' : ''}`}
                  aria-hidden={!isActive}
                >
                  <img
                    src={imgSrc}
                    alt={item.imageAlt || item.title || 'Sắc màu rau củ và bữa ăn mỗi ngày'}
                    width="760"
                    height="860"
                    fetchPriority={itemIndex === 0 ? 'high' : 'auto'}
                    loading={itemIndex === 0 ? 'eager' : 'lazy'}
                    onError={localFallback}
                  />
                </div>
              );
            })}
          </div>

          <div className="moc-home-hero-seal" aria-hidden="true">
            <Leaf size={24} strokeWidth={1.3} />
            <span>GẦN THIÊN NHIÊN</span>
            <small>organicfood.vn</small>
          </div>

          <Link to="/diem-noi-bat#dinh-duong" className="moc-home-hero-inset" aria-label="Gợi cảm hứng dinh dưỡng: Thêm sắc màu cho bữa ăn">
            <img src="/images/strawberries.jpg" alt="Dâu tây tươi gợi cảm hứng dinh dưỡng" width="160" height="190" />
            <div>
              <span>Gợi cảm hứng mỗi ngày</span>
              <strong>Thêm sắc màu<br />cho bữa ăn.</strong>
              <ArrowUpRight size={18} />
            </div>
          </Link>
        </div>
      </div>

      <a href={exploreHref} className="moc-home-scroll-link" aria-label="Cuộn xuống khám phá cửa hàng">
        <span>Khám phá cửa hàng</span>
        <ArrowDown size={15} />
      </a>
    </section>
  );
}
