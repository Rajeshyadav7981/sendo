import { useQueries, useQuery } from '@tanstack/react-query';
import { payoutApi, type PayoutSummary } from './payout.api';

export const payoutKeys = {
  all: ['payout'] as const,
  month: (driverId: string, month: string) =>
    [...payoutKeys.all, driverId, month] as const,
};

export function useDriverPayout(driverId: string, month: string) {
  return useQuery({
    queryKey: payoutKeys.month(driverId, month),
    queryFn: () => payoutApi.forDriver(driverId, month),
    enabled: !!driverId && !!month,
  });
}

export function useDriverPayoutHistory(driverId: string, months: string[]) {
  const results = useQueries({
    queries: months.map((m) => ({
      queryKey: payoutKeys.month(driverId, m),
      queryFn: () => payoutApi.forDriver(driverId, m),
      enabled: !!driverId && !!m,
      retry: 0,
      staleTime: 60_000,
    })),
  });
  return months.map((m, i) => ({
    month: m,
    data: results[i].data as PayoutSummary | undefined,
    isLoading: results[i].isLoading,
    error: results[i].error as Error | null,
  }));
}

export function lastNMonths(n: number, refDate: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(refDate.getFullYear(), refDate.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}
