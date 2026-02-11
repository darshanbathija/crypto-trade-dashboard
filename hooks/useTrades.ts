import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface Trade {
  id: string;
  source: string;
  timestamp: string;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  side: string;
  price: number;
  quantity: number;
  total: number;
  fee: number;
  feeCurrency: string;
  walletAddress?: string | null;
  txHash?: string | null;
  dexProtocol?: string | null;
}

export interface TradesResponse {
  trades: Trade[];
  total: number;
  page: number;
  totalPages: number;
}

export function useTrades(params: {
  page?: number;
  limit?: number;
  source?: string;
  asset?: string;
  startDate?: string;
  endDate?: string;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.source) searchParams.set('source', params.source);
  if (params.asset) searchParams.set('asset', params.asset);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);

  const { data, error, mutate } = useSWR<TradesResponse>(
    `/api/trades?${searchParams.toString()}`,
    fetcher
  );

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
