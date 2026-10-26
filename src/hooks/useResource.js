import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '@/lib/utils';

export function useResource(loader, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const loaderRef = useRef(loader);
  const background = useRef(false);
  const inFlight = useRef(false);
  const [refreshError, setRefreshError] = useState('');
  loaderRef.current = loader;
  useEffect(() => {
    let current = true;
    const quiet = background.current; background.current = false;
    inFlight.current = true;
    if (!quiet) { setLoading(true); setError(''); }
    setRefreshError('');
    Promise.resolve().then(() => loaderRef.current()).then((value) => { if (current) { setData(value); setError(''); } }).catch((err) => { if (current) { if (quiet) setRefreshError(errorMessage(err)); else setError(errorMessage(err)); } }).finally(() => { if (current) { inFlight.current = false; setLoading(false); } });
    return () => { current = false; };
    // Callers pass primitive query parameters so stale requests never overwrite current results.
  }, [...dependencies, revision]);
  const reload = useCallback((options) => { if (options?.background && inFlight.current) return; background.current = options?.background === true; setRevision((value) => value + 1); }, []);
  return { data, loading, error, refreshError, reload, setData };
}
