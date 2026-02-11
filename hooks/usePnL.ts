import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface PnLData {
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalFees: number;
  netPnL: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  pnlByDate?: Array<{ date: string; pnl: number }>;
}

export function usePnL(startDate?: string, endDate?: string, groupBy: string = 'day') {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  params.set('groupBy', groupBy);

  const { data, error, mutate } = useSWR<PnLData>(
    `/api/pnl?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 30000, // Auto-refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
