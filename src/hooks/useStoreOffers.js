import { useEffect, useState } from 'react';
import { useResource } from './useResource';
import { storefrontPromotionService } from '@/services/client/storefrontPromotionService';
import { offerActive } from '@/lib/storeOffers';

export function useStoreOffers() {
  const resource = useResource(() => storefrontPromotionService.list(), []);
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000);
    const refresh = () => { if (document.visibilityState !== 'hidden') resource.reload({ background: true }); };
    const polling = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); clearInterval(polling); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, [resource.reload]);
  const [anchor, setAnchor] = useState(null);
  useEffect(() => { if (resource.data) setAnchor({ server: Date.parse(resource.data.generatedAt), local: Date.now() }); }, [resource.data]);
  const now = anchor && Number.isFinite(anchor.server) ? anchor.server + Math.max(0, tick - anchor.local) : Date.now();
  return { ...resource, offers: (resource.data?.offers || []).filter(offer => offerActive(offer, now)), now };
}
