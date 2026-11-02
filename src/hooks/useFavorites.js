import { useEffect, useState } from 'react';
import { readStorage, writeStorage } from '@/lib/storage';

const validIds = (value) => Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === 'string' && id))] : [];

export function useFavorites(username) {
  const key = `moc.favorites:${username ? `account:${username}` : 'guest'}`;
  const read = () => validIds(readStorage(key, []));
  const [state, setState] = useState(() => ({ key, ids: validIds(readStorage(key, readStorage('moc.favorites', []))) }));
  const favorites = state.key === key ? state.ids : read();

  useEffect(() => {
    // Preserve pre-existing heart selections for the current browser/account once.
    const saved = readStorage(key, null);
    const ids = validIds(saved ?? readStorage('moc.favorites', []));
    setState({ key, ids });
    writeStorage(key, ids);
    try { localStorage.removeItem('moc.favorites'); } catch { /* Current-tab selections still work. */ }
    const changed = (event) => { if (event.key === key || event.key === null) setState({ key, ids: read() }); };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, [key]);

  useEffect(() => { if (state.key === key) writeStorage(key, state.ids); }, [key, state]);

  function toggleFavorite(id) {
    setState((old) => {
      const ids = old.key === key ? old.ids : read();
      return { key, ids: ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id] };
    });
  }
  return { favorites, toggleFavorite };
}
