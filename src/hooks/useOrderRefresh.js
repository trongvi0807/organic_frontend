import { useEffect, useRef } from 'react';
// Read-only refresh. Never turns a return-URL parameter into a paid state.
export function publishPaymentUpdate() {
  window.dispatchEvent(new Event('moc:payment-updated'));
  try { localStorage.setItem('moc.payment.updated', String(Date.now())); } catch { /* Poll/focus still works. */ }
}
export function useOrderRefresh(reload, { enabled = true, interval = 10000 } = {}) {
  const current = useRef(reload); current.current = reload;
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => { if (document.visibilityState === 'visible') current.current({ background: true }); };
    const storage = (e) => { if (e.key === 'moc.payment.updated') refresh(); };
    const timer = setInterval(refresh, interval);
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    window.addEventListener('moc:payment-updated', refresh); window.addEventListener('storage', storage);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('moc:payment-updated', refresh); window.removeEventListener('storage', storage); };
  }, [enabled, interval]);
}
