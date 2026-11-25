import { useEffect, useRef, useState } from 'react';

const CLICK_DELAY_MS = 500;
const interactiveTarget = target => target.closest('a, button, input, select, textarea, label, [role="button"], [role="link"], [contenteditable="true"]');

export function ComboCarousel({ offers, children, busy = false, autoplayMs = 4000, onView }) {
  const [slide, setSlide] = useState({ activeId: null, previousId: null, direction: 1 });
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [restart, setRestart] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef(null);
  const clickTimer = useRef(null);
  const clickedId = useRef(null);
  const suppressClickUntil = useRef(0);
  const ids = offers.map(offer => offer.id);
  const signature = JSON.stringify(ids);
  const active = Math.max(0, ids.indexOf(slide.activeId));

  function cancelClick() {
    clearTimeout(clickTimer.current);
    clickTimer.current = null;
  }

  useEffect(() => () => {
    clearTimeout(clickTimer.current);
    clickedId.current = null;
  }, [signature, busy]);

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
    // Keep the current combo visible while the shopper interacts with it.
    if (currentIds.length < 2 || focused || hovered || reducedMotion || busy) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setSlide(current => {
        const index = Math.max(0, currentIds.indexOf(current.activeId));
        return { activeId: currentIds[(index + 1) % currentIds.length], previousId: currentIds[index], direction: 1 };
      });
    }, autoplayMs);
    return () => clearInterval(timer);
  }, [signature, focused, hovered, reducedMotion, busy, autoplayMs, restart]);

  function move(step) {
    if (ids.length < 2) return;
    setSlide({ activeId: ids[(active + step + ids.length) % ids.length], previousId: ids[active], direction: step });
    setRestart(value => value + 1);
  }

  return (
    <div
      className="combo-carousel"
      role="region"
      tabIndex={offers.length > 1 || onView ? 0 : undefined}
      aria-label="Các combo ưu đãi"
      aria-roledescription="trình chiếu"
      title="Nhấp để chuyển combo. Nhấp đúp để xem chi tiết."
      onClick={event => {
        if (busy || interactiveTarget(event.target)) {
          cancelClick();
          return;
        }
        if (Date.now() < suppressClickUntil.current) return;
        cancelClick();
        if (event.detail > 1) return;
        clickedId.current = ids[active];
        setRestart(value => value + 1);
        clickTimer.current = setTimeout(() => {
          clickTimer.current = null;
          move(1);
        }, CLICK_DELAY_MS);
      }}
      onDoubleClick={event => {
        if (busy || interactiveTarget(event.target)) return;
        event.preventDefault();
        cancelClick();
        const offer = offers.find(item => item.id === clickedId.current) || offers[active];
        if (offer) onView?.(offer);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={event => {
        if (event.target !== event.currentTarget) cancelClick();
        setFocused(event.target !== event.currentTarget || event.currentTarget.matches(':focus-visible'));
      }}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
      onKeyDown={event => {
        if (event.target !== event.currentTarget || busy || !['ArrowLeft', 'ArrowRight', 'Enter'].includes(event.key)) return;
        event.preventDefault();
        cancelClick();
        if (event.key === 'Enter') onView?.(offers[active]);
        else move(event.key === 'ArrowLeft' ? -1 : 1);
      }}
      onTouchStart={event => {
        touchStart.current = busy || interactiveTarget(event.target) ? null : event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={event => {
        const delta = touchStart.current == null ? 0 : touchStart.current - event.changedTouches[0].clientX;
        touchStart.current = null;
        if (!busy && Math.abs(delta) > 60) {
          cancelClick();
          suppressClickUntil.current = Date.now() + CLICK_DELAY_MS;
          move(delta > 0 ? 1 : -1);
        }
      }}
    >
      {offers.length > 1 && (
        <p className="sr-only">
          Combo tự chuyển sau mỗi {autoplayMs / 1000} giây. Nhấp một lần để chuyển combo, nhấp đúp hoặc nhấn Enter để xem chi tiết. Tạm dừng khi di chuột hoặc thao tác bên trong banner. Có thể vuốt ngang hoặc dùng phím mũi tên để chuyển slide.
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

    </div>
  );
}
