'use client';

import { usePnL } from '@/hooks/usePnL';
import { formatCurrency, formatDateShort } from '@/lib/utils/formatting';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface PnLChartProps {
  startDate?: string;
  endDate?: string;
  groupBy?: 'day' | 'week' | 'month';
}

export function PnLChart({ startDate, endDate, groupBy = 'day' }: PnLChartProps) {
  const { data: pnl, isLoading } = usePnL(startDate, endDate, groupBy);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-96 flex items-center justify-center">
        <div className="text-gray-500">Loading chart...</div>
      </div>
    );
  }

  if (!pnl?.pnlByDate || pnl.pnlByDate.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-96 flex items-center justify-center">
        <div className="text-gray-500">No P&L data available. Select a date range to view chart.</div>
      </div>
    );
  }

  // Calculate cumulative P&L
  let cumulative = 0;
  const chartData = pnl.pnlByDate.map((item) => {
    cumulative += item.pnl;
    return {
      date: item.date,
      pnl: cumulative,
      dailyPnL: item.pnl,
    };
  });

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Cumulative P&L Over Time
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis
            dataKey="date"
            tickFormatter={(date) => formatDateShort(date)}
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value)}
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#F9FAFB',
            }}
            labelFormatter={(date) => formatDateShort(date)}
            formatter={(value: number, name: string) => [
              formatCurrency(value),
              name === 'pnl' ? 'Cumulative P&L' : 'Daily P&L',
            ]}
          />
          <Line
            type="monotone"
            dataKey="pnl"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
