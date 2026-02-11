'use client';

import { usePnL } from '@/hooks/usePnL';
import { formatCurrency, formatPercent, getPnLColorClass } from '@/lib/utils/formatting';

export function SummaryStats() {
  const { data: pnl, isLoading } = usePnL();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!pnl) return null;

  const stats = [
    {
      title: 'Net P&L',
      value: formatCurrency(pnl.netPnL),
      subtitle: `${formatCurrency(pnl.totalRealizedPnL)} realized`,
      colorClass: getPnLColorClass(pnl.netPnL),
    },
    {
      title: 'Win Rate',
      value: formatPercent(pnl.winRate),
      subtitle: `${pnl.winningTrades}W / ${pnl.losingTrades}L`,
      colorClass: pnl.winRate > 0.5 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
    },
    {
      title: 'Total Trades',
      value: pnl.totalTrades.toString(),
      subtitle: `${pnl.totalTrades} closed positions`,
      colorClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Total Fees',
      value: formatCurrency(pnl.totalFees),
      subtitle: 'Trading + Gas costs',
      colorClass: 'text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">
            {stat.title}
          </div>
          <div className={`text-2xl sm:text-3xl font-bold mb-1 ${stat.colorClass}`}>
            {stat.value}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            {stat.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
}
