'use client';

import { useInventory } from '@/hooks/useInventory';
import { formatCurrency } from '@/lib/utils/formatting';

export function InventorySummary() {
  const { data, isLoading } = useInventory();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const assets = ['USDT', 'USDC', 'UP'];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Total Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {assets.map((asset) => {
          const total = data.totals[asset];
          if (!total) return null;

          return (
            <div
              key={asset}
              className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
            >
              <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">
                Total {asset}
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {total.balance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 6,
                })}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {formatCurrency(total.usdValue)} USD
              </div>
            </div>
          );
        })}
      </div>

      {/* Breakdown by Location */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Inventory by Location
        </h3>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  USD Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.byLocation.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900 dark:text-white">
                    {item.location}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                    {item.asset}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900 dark:text-white font-mono">
                    {item.balance.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right text-xs sm:text-sm text-gray-900 dark:text-white">
                    {formatCurrency(item.usdValue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.lastUpdated && (
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-right">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
