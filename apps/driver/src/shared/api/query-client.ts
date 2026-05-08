import { QueryClient } from '@tanstack/react-query';

/**
 * Driver app is mobile-first and bandwidth-constrained:
 *   staleTime 2min — drivers don't tab-poll; data freshness within 2min is fine.
 *   gcTime 30min   — long-lived cache so backgrounded screens hydrate instantly.
 *   networkMode 'offlineFirst' — TanStack will resume queries when reconnected.
 *   retry          — never retry on 4xx; once on 5xx so the user isn't stuck.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
      retry: (failureCount, err) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 0,
    },
  },
});
