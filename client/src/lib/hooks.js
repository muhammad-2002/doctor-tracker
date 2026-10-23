'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebounce(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Filter/pagination state for a list screen. Any filter change returns to page 1. */
export function useListParams(initial = {}) {
  const base = useRef({ page: 1, limit: 10, ...initial });
  const [params, setParams] = useState(base.current);
  const [resetKey, setResetKey] = useState(0);
  const set = useCallback((patch) => setParams((p) => ({ ...p, ...patch, page: 'page' in patch ? patch.page : 1 })), []);
  const reset = useCallback(() => {
    setParams(base.current);
    setResetKey((k) => k + 1); // remounts uncontrolled inputs (search box)
  }, []);
  return { params, set, reset, resetKey };
}
