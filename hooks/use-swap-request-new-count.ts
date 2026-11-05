'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { SwapRequestResponse } from '@/lib/types/swap-request';

/**
 * Returns the count of "new" swap requests for the current manager.
 * Used by the sidebar to show a badge. Refetches on mount and when the user
 * might have changed (e.g. after navigation to swap-request page).
 */
export function useSwapRequestNewCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch<SwapRequestResponse>(
          '/swap-request/manager?page=1&per_page=1',
        );
        if (cancelled) return;
        setCount(res.tabCounts?.new ?? 0);
      } catch {
        if (!cancelled) setCount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}
