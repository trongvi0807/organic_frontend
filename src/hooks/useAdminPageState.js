import { useEffect, useState } from 'react';
import { getSession } from '@/services/api';

const saved = new Map();
// Keep only view preferences, never unsaved business forms or API responses.
export function useAdminPageState(key, initial) {
  const session = getSession();
  const scope = `${session?.sessionId || 'anonymous'}:${session?.user?.username || ''}:${session?.user?.roles?.slice().sort().join(',') || ''}:${key}`;
  const restore = () => saved.has(scope) ? saved.get(scope) : typeof initial === 'function' ? initial() : initial;
  const [state, setState] = useState(() => ({ scope, value: restore() }));
  const value = state.scope === scope ? state.value : restore();
  if (state.scope !== scope) setState({ scope, value });
  const setValue = (next) => setState((old) => ({ scope, value: typeof next === 'function' ? next(old.scope === scope ? old.value : restore()) : next }));
  useEffect(() => { saved.set(scope, value); if (saved.size > 150) saved.delete(saved.keys().next().value); }, [scope, value]);
  return [value, setValue];
}
