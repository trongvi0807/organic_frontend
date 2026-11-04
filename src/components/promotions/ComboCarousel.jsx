import { useEffect, useRef, useState } from 'react';

export function ComboCarousel({ offers, children, busy = false, autoplayMs = 6000 }) {
  const [slide, setSlide] = useState({ activeId: null, previousId: null, direction: 1 });
  const [focused, setFocused] = useState(false), [restart, setRestart] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStart = useRef(null);
  const ids = offers.map(offer => offer.id), signature = JSON.stringify(ids);
  const active = Math.max(0, ids.indexOf(slide.activeId));

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!media) return;
    const update = () => setReducedMotion(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const currentIds = JSON.parse(signature);
    if (currentIds.length < 2 || focused || reducedMotion || busy) return;
    const timer = setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setSlide(current => {
        const index = Math.max(0, currentIds.indexOf(current.activeId));
        return { activeId: currentIds[(index + 1) % currentIds.length], previousId: currentIds[index], direction: 1 };
      });
    }, autoplayMs);
    return () => clearInterval(timer);
  }, [signature, focused, reducedMotion, busy, autoplayMs, restart]);

  function move(step) {
    if (ids.length < 2) return;
    setSlide({ activeId: ids[(active + step + ids.length) % ids.length], previousId: ids[active], direction: step });
    setRestart(value => value + 1);
  }
  return <div className="combo-carousel" role="region" tabIndex={offers.length > 1 ? 0 : undefined} aria-label="Các combo ưu đãi" aria-roledescription="trình chiếu"
    onMouseEnter={() => { if (!focused && !busy && !reducedMotion) move(1); }}
    onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
    onKeyDown={event => {
      if (event.target !== event.currentTarget || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1);
    }}
    onTouchStart={event => { touchStart.current = event.touches[0]?.clientX ?? null; }}
    onTouchEnd={event => {
      const delta = touchStart.current == null ? 0 : touchStart.current - event.changedTouches[0].clientX;
      touchStart.current = null;
      if (Math.abs(delta) > 60) move(delta > 0 ? 1 : -1);
    }}>
    {offers.length > 1 && <p className="sr-only">Combo tự chuyển sau mỗi {autoplayMs / 1000} giây. Có thể dùng phím mũi tên hoặc vuốt ngang để xem combo khác.</p>}
    <div className="combo-carousel-track" style={{ '--combo-direction': slide.direction }} aria-live={focused ? 'polite' : 'off'}>
      {offers.map((offer, index) => <div key={offer.id} className={`combo-carousel-slide${index === active ? ' is-active' : offer.id === slide.previousId ? ' is-outgoing' : ''}`}
        role="group" aria-roledescription="trang trình chiếu" aria-label={`${index + 1} / ${offers.length}: ${offer.name}`}
        aria-hidden={index !== active} inert={index !== active}>
        {children(offer)}
      </div>)}
    </div>
  </div>;
}
