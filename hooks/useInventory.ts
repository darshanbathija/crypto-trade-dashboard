import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useInventory() {
  const { data, error, isLoading, mutate } = useSWR('/api/inventory', fetcher, {
    refreshInterval: 60000, // Refresh every 60 seconds
  });

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

export function useInventoryHistory(asset: string, days: number = 30) {
  const { data, error, isLoading } = useSWR(
    `/api/inventory/history?asset=${asset}&days=${days}`,
    fetcher,
    {
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  );

  return {
    history: data?.history || [],
    error,
    isLoading,
  };
}
