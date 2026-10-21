import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

let observer;
function revealObserver() {
  if (!observer) observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.dataset.reveal = 'visible';
      observer.unobserve(entry.target);
    }
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });
  return observer;
}

// Content stays visible without JS/IntersectionObserver and with reduced motion.
// One shared observer, one entrance per mount; no scroll event handlers.
export function Reveal({ as: Tag = 'div', children, className, delay = 0, style, ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const shared = revealObserver();
    node.dataset.reveal = 'pending';
    const showFocusedContent = () => { node.dataset.reveal = 'visible'; shared.unobserve(node); };
    node.addEventListener('focusin', showFocusedContent);
    shared.observe(node);
    return () => {
      shared.unobserve(node);
      node.removeEventListener('focusin', showFocusedContent);
      delete node.dataset.reveal;
    };
  }, []);
  return <Tag ref={ref} className={cn('reveal', className)} style={{ '--reveal-delay': `${Math.min(Math.max(delay, 0), 180)}ms`, ...style }} {...props}>{children}</Tag>;
}
