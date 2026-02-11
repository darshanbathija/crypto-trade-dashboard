'use client';

import { useState } from 'react';
import { useInventoryHistory } from '@/hooks/useInventory';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const ASSETS = ['USDT', 'USDC', 'UP'];

export function InventoryChart() {
  const [selectedAsset, setSelectedAsset] = useState('USDT');
  const [days, setDays] = useState(30);

  const { history, isLoading } = useInventoryHistory(selectedAsset, days);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const chartData = history.map((item: any) => ({
    date: format(new Date(item.timestamp), 'MMM dd'),
    total: item.totalBalance,
    ...item.bySource,
  }));

  // Get unique sources from the data
  const sources = history.length > 0
    ? Object.keys(history[0].bySource || {})
    : [];

  const sourceColors: Record<string, string> = {
    GATEIO: '#8884d8',
    MEXC: '#82ca9d',
    KRAKEN: '#ffc658',
    BASE_CHAIN: '#ff7c7c',
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          Inventory Over Time
        </h3>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Asset Selector */}
          <select
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {ASSETS.map((asset) => (
              <option key={asset} value={asset}>
                {asset}
              </option>
            ))}
          </select>

          {/* Time Range Selector */}
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) =>
                value.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '0.375rem',
              }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Total"
              dot={{ r: 3 }}
            />
            {sources.map((source) => (
              <Line
                key={source}
                type="monotone"
                dataKey={source}
                stroke={sourceColors[source] || '#888'}
                strokeWidth={1.5}
                name={source}
                dot={{ r: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No inventory history available. Click "Sync Inventory" to start tracking.
        </div>
      )}
    </div>
  );
}
