import { useCallback, useEffect, useRef, useState } from 'react';
import { catalogService } from '@/services/client/catalogService';
import { availableVariantQuantity, inlineAvailableQuantity } from '@/lib/productAvailability';

export function useProductAvailability(product, variantId, { lazy = false } = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(!lazy);
  const [state, setState] = useState({ productId: '', data: null, loading: false, error: false });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (!lazy || !ref.current || typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } }, { rootMargin: '160px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [lazy]);
  useEffect(() => {
    if (!visible || !product?.id) return;
    let current = true;
    setState((old) => ({ productId: product.id, data: old.productId === product.id ? old.data : null, loading: true, error: false }));
    catalogService.availability(product.id, { fresh: revision > 0 }).then((data) => {
      if (current) setState({ productId: product.id, data, loading: false, error: false });
    }).catch(() => { if (current) setState({ productId: product.id, data: null, loading: false, error: true }); });
    return () => { current = false; };
  }, [product?.id, visible, revision]);
  useEffect(() => {
    if (!visible || !product?.id) return;
    const refresh = () => { if (document.visibilityState === 'visible') reload(); };
    window.addEventListener('focus', refresh);
    window.addEventListener('moc:payment-updated', refresh);
    document.addEventListener('visibilitychange', refresh);
    // Refresh loaded cards too: an earlier zero must not remain after a stock receipt.
    const timer = setInterval(refresh, 30000);
    return () => { window.removeEventListener('focus', refresh); window.removeEventListener('moc:payment-updated', refresh); document.removeEventListener('visibilitychange', refresh); if (timer) clearInterval(timer); };
  }, [visible, product?.id, lazy, reload]);
  const data = state.productId === product?.id ? state.data : null;
  const quantity = data ? availableVariantQuantity(data, variantId) : state.error ? null : inlineAvailableQuantity(product, variantId);
  return { ref, quantity, quantities: data, loading: state.productId !== product?.id || state.loading, error: state.productId === product?.id && state.error, reload };
}
