import { useState, useEffect, useCallback } from 'react';
import { api } from './api';

/** Generic data-fetching hook with loading / error / refetch. */
export function useFetch<T>(url: string | null) {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.get<T>(url)
      .then(res => {
        if (!cancelled) {
          setData(res.data ?? (res as unknown as T));
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [url, tick]);

  return { data, loading, error, refetch };
}
