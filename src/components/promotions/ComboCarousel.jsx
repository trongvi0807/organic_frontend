import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

export function ComboCarousel({ offers, children, busy = false, autoplayMs = 6000 }) {
  const [slide, setSlide] = useState({ activeId: null, previousId: null, direction: 1 });
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [restart, setRestart] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef(null);
  const ids = offers.map(offer => offer.id);
  const signature = JSON.stringify(ids);
  const active = Math.max(0, ids.indexOf(slide.activeId));

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const currentIds = JSON.parse(signature);
    // Pause autoplay when hovered, focused, busy, manually paused, or prefers-reduced-motion
    if (currentIds.length < 2 || focused || hovered || manualPaused || reducedMotion || busy) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setSlide(current => {
        const index = Math.max(0, currentIds.indexOf(current.activeId));
        return { activeId: currentIds[(index + 1) % currentIds.length], previousId: currentIds[index], direction: 1 };
      });
    }, autoplayMs);
    return () => clearInterval(timer);
  }, [signature, focused, hovered, manualPaused, reducedMotion, busy, autoplayMs, restart]);

  function move(step) {
    if (ids.length < 2) return;
    setSlide({ activeId: ids[(active + step + ids.length) % ids.length], previousId: ids[active], direction: step });
    setRestart(value => value + 1);
  }

  function goTo(index) {
    if (ids.length < 2 || index === active) return;
    const step = index > active ? 1 : -1;
    setSlide({ activeId: ids[index], previousId: ids[active], direction: step });
    setRestart(value => value + 1);
  }

  const isPaused = focused || hovered || manualPaused || busy;

  return (
    <div
      className="combo-carousel"
      role="region"
      tabIndex={offers.length > 1 ? 0 : undefined}
      aria-label="Các combo ưu đãi"
      aria-roledescription="trình chiếu"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      }}
      onTouchStart={event => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={event => {
        const delta = touchStart.current == null ? 0 : touchStart.current - event.changedTouches[0].clientX;
        touchStart.current = null;
        if (Math.abs(delta) > 60) move(delta > 0 ? 1 : -1);
      }}
    >
      {offers.length > 1 && (
        <p className="sr-only">
          Combo tự chuyển sau mỗi {autoplayMs / 1000} giây. Di chuột hoặc chạm để tạm dừng. Có thể dùng phím mũi tên hoặc nút điều khiển để chuyển slide.
        </p>
      )}

      <div className="combo-carousel-track" style={{ '--combo-direction': slide.direction }} aria-live={focused ? 'polite' : 'off'}>
        {offers.map((offer, index) => (
          <div
            key={offer.id}
            className={`combo-carousel-slide${index === active ? ' is-active' : offer.id === slide.previousId ? ' is-outgoing' : ''}`}
            role="group"
            aria-roledescription="trang trình chiếu"
            aria-label={`${index + 1} / ${offers.length}: ${offer.name}`}
            aria-hidden={index !== active}
            inert={index !== active}
          >
            {children(offer)}
          </div>
        ))}
      </div>

      {offers.length > 1 && (
        <div className="combo-carousel-controls" aria-label="Điều khiển trình chiếu combo">
          <div className="combo-carousel-indicators" role="tablist" aria-label="Chọn combo hiển thị">
            {offers.map((offer, idx) => (
              <button
                key={offer.id}
                type="button"
                role="tab"
                aria-selected={idx === active}
                aria-label={`Xem combo ${idx + 1}: ${offer.name}`}
                className={`combo-carousel-dot ${idx === active ? 'is-active' : ''}`}
                onClick={() => goTo(idx)}
              >
                <span className="sr-only">{offer.name}</span>
              </button>
            ))}
          </div>

          <div className="combo-carousel-nav">
            <button
              type="button"
              className="combo-carousel-btn"
              onClick={() => move(-1)}
              aria-label="Combo trước"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="combo-carousel-btn combo-carousel-btn--pause"
              onClick={() => setManualPaused(!manualPaused)}
              aria-label={manualPaused ? 'Tiếp tục tự chuyển' : 'Tạm dừng tự chuyển'}
              title={manualPaused ? 'Tiếp tục tự chuyển' : 'Tạm dừng tự chuyển'}
            >
              {manualPaused ? <Play size={12} /> : <Pause size={12} />}
            </button>
            <button
              type="button"
              className="combo-carousel-btn"
              onClick={() => move(1)}
              aria-label="Combo tiếp theo"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
