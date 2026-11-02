import { useEffect } from 'react';

// Quietly re-query lists too, so products absent from a sold-out list can return.
export function useStoreCatalogRefresh(reload, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => { if (document.visibilityState === 'visible') reload({ background: true }); };
    const events = ['focus', 'moc:payment-updated', 'moc:order-updated', 'moc:inventory-updated'];
    events.forEach((name) => window.addEventListener(name, refresh));
    document.addEventListener('visibilitychange', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => {
      window.clearInterval(timer);
      events.forEach((name) => window.removeEventListener(name, refresh));
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [reload, enabled]);
}
