const REVISION_KEY = 'moc.business-data-revision';
const REVISION = '20261029-catalog-replacement';

// The store replaced its catalog and business history. Discard only related browser
// state once; account sessions, device permissions and unrelated preferences stay intact.
export function clearRetiredBusinessStorage() {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem(REVISION_KEY) === REVISION) return;
    const obsolete = (key) => key === 'moc.cart' || key === 'moc.favorites'
      || key.startsWith('moc.demo.') || key === 'moc.customer-orders.demo.v1'
      || key.startsWith('moc.order-updates.read:');
    for (const storage of [window.localStorage, window.sessionStorage]) {
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
      keys.filter((key) => key && obsolete(key)).forEach((key) => storage.removeItem(key));
    }
    window.localStorage.setItem(REVISION_KEY, REVISION);
  } catch { /* Storage may be unavailable; persisted service data remains authoritative. */ }
}
