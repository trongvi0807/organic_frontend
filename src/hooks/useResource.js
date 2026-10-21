import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '@/lib/utils';

export function useResource(loader, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  useEffect(() => {
    let current = true;
    setLoading(true); setError('');
    Promise.resolve().then(() => loaderRef.current()).then((value) => { if (current) setData(value); }).catch((err) => { if (current) setError(errorMessage(err)); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
    // Callers pass primitive query parameters so stale requests never overwrite current results.
  }, [...dependencies, revision]);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  return { data, loading, error, reload, setData };
}
