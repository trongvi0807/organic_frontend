import { useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export function useStoreScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    const path = location.pathname + location.search + location.hash;
    const key = `moc.scroll:${location.key}:${path}`;
    const previous = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    let lastY = 0, tries = 0, timer, restoring = true;
    let saved = 0, hasSaved = false;
    try {
      const value = sessionStorage.getItem(key);
      hasSaved = value !== null;
      saved = Number(value) || 0;
    } catch { /* Session storage may be unavailable. */ }

    const requested = Number(location.state?.restoreScroll);
    const hasRequested = Number.isFinite(requested) && requested >= 0;
    const target = navigationType === 'POP' ? saved : hasRequested ? Math.min(requested, 100000) : 0;
    const restorePosition = (navigationType === 'POP' && hasSaved) || hasRequested;

    const save = () => {
      // Ignore a scroll event from the previous page during a navigation commit.
      if (window.location.pathname + window.location.search + window.location.hash !== path) return;
      lastY = window.scrollY;
      if (restoring) return;
      try {
        sessionStorage.setItem(key, String(lastY));
        if (location.pathname === '/' || location.pathname.startsWith('/san-pham')) {
          sessionStorage.setItem('moc.shopping.return', JSON.stringify({ to: path, y: lastY }));
        }
      } catch { /* Navigation still works without persistence. */ }
    };
    const cancel = () => {
      restoring = false;
      clearTimeout(timer);
      save();
    };
    const restore = () => {
      let anchorId = location.hash.slice(1);
      try { anchorId = decodeURIComponent(anchorId); } catch { /* Use the original hash. */ }
      const anchor = location.hash && !restorePosition ? document.getElementById(anchorId) : null;
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'instant' });
        restoring = false;
        save();
        return;
      }
      window.scrollTo({ top: target, behavior: 'instant' });
      tries += 1;
      // Reviews/images may change layout after the page first becomes tall enough.
      // Briefly reapply saved positions; user input immediately takes control.
      const ready = (!location.hash || restorePosition)
        && document.documentElement.scrollHeight - window.innerHeight >= target
        && (target === 0 || tries >= 10);
      if (ready || tries >= 50) {
        restoring = false;
        save();
        return;
      }
      timer = setTimeout(restore, 100);
    };
    timer = setTimeout(restore, 0);
    window.addEventListener('scroll', save, { passive: true });
    document.addEventListener('click', save, true);
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchmove', cancel, { passive: true });
    window.addEventListener('pointerdown', cancel);
    window.addEventListener('keydown', cancel);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', save);
      document.removeEventListener('click', save, true);
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchmove', cancel);
      window.removeEventListener('pointerdown', cancel);
      window.removeEventListener('keydown', cancel);
      if (!restoring) {
        try { sessionStorage.setItem(key, String(lastY)); } catch { /* Optional persistence. */ }
      }
      history.scrollRestoration = previous;
    };
  }, [location.key, location.pathname, location.search, location.hash, navigationType]);
}
