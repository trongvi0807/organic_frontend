import { useEffect } from 'react';
import { publicApi, DEMO_MODE } from '@/services/api';
import { invalidateProductAvailability } from '@/services/client/catalogService';

// One public connection per storefront. Existing polling remains the fallback.
export function useStockUpdates() {
  useEffect(() => {
    if (DEMO_MODE || typeof EventSource === 'undefined') return;
    let stream, timer;
    const refresh = () => {
      invalidateProductAvailability();
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        window.dispatchEvent(new Event('moc:inventory-updated'));
      }, 100);
    };
    const connect = () => {
      if (document.visibilityState === 'hidden') {
        stream?.close();
        stream = null;
        return;
      }
      if (stream) return;
      const base = publicApi.defaults.baseURL.replace(/\/+$/, '');
      stream = new EventSource(`${base}/products/stock-events`);
      // Re-query after every connection/reconnection to cover missed events.
      stream.addEventListener('open', refresh);
      stream.addEventListener('stock-changed', refresh);
    };
    connect();
    document.addEventListener('visibilitychange', connect);
    return () => {
      stream?.close();
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', connect);
    };
  }, []);
}
