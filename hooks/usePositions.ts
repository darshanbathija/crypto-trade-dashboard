import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface Position {
  id: string;
  asset: string;
  exchange?: string | null;
  walletAddress?: string | null;
  status: string;
  side: string;
  openQuantity: number;
  closedQuantity: number;
  remainingQuantity: number;
  avgOpenPrice: number;
  avgClosePrice?: number | null;
  currentPrice?: number | null;
  realizedPnL: number;
  unrealizedPnL?: number | null;
  totalFees: number;
  openedAt: string;
  closedAt?: string | null;
}

export interface PositionsResponse {
  positions: Position[];
}

export function usePositions(status?: 'OPEN' | 'CLOSED', asset?: string) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (asset) params.set('asset', asset);

  const { data, error, mutate } = useSWR<PositionsResponse>(
    `/api/positions?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 30000, // Auto-refresh every 30 seconds
    }
  );

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
