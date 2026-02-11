'use client';

import { usePositions } from '@/hooks/usePositions';
import { formatCurrency } from '@/lib/utils/formatting';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export function PositionPieChart() {
  const { data, isLoading } = usePositions('OPEN');

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-96 flex items-center justify-center">
        <div className="text-gray-500">Loading positions...</div>
      </div>
    );
  }

  if (!data?.positions || data.positions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-96 flex items-center justify-center">
        <div className="text-gray-500">No open positions</div>
      </div>
    );
  }

  // Calculate position values
  const chartData = data.positions
    .map((position) => {
      const currentPrice = position.currentPrice || position.avgOpenPrice;
      const value = position.remainingQuantity * currentPrice;

      return {
        name: position.asset,
        value,
        quantity: position.remainingQuantity,
        price: currentPrice,
      };
    })
    .filter((item) => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow h-96 flex items-center justify-center">
        <div className="text-gray-500">No position data available</div>
      </div>
    );
  }

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Portfolio Allocation
      </h3>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Total Value: {formatCurrency(totalValue)}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(1)}%`
            }
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: 'none',
              borderRadius: '8px',
              color: '#F9FAFB',
            }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
