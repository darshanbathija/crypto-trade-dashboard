'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SummaryStats } from '@/components/dashboard/SummaryStats';
import { PnLChart } from '@/components/charts/PnLChart';
import { PositionPieChart } from '@/components/charts/PositionPieChart';
import { TradeTable } from '@/components/dashboard/TradeTable';
import { SyncButton } from '@/components/dashboard/SyncButton';

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Default date range: last 30 days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const handleSyncComplete = () => {
    // Trigger re-fetch of all data by changing the key
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                Crypto Trade Dashboard
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Track trades across Gate.io, MEXC, and Base blockchain
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto">
              <Link
                href="/settings"
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-1 sm:flex-initial"
              >
                <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Settings</span>
              </Link>
              <div className="flex-1 sm:flex-initial">
                <SyncButton onSyncComplete={handleSyncComplete} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Summary Stats */}
        <div key={`stats-${refreshKey}`}>
          <SummaryStats />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div key={`pnl-chart-${refreshKey}`}>
            <PnLChart
              startDate={startDate.toISOString()}
              endDate={endDate.toISOString()}
              groupBy="day"
            />
          </div>
          <div key={`pie-chart-${refreshKey}`}>
            <PositionPieChart />
          </div>
        </div>

        {/* Trade Table */}
        <div key={`table-${refreshKey}`}>
          <TradeTable />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Crypto Trade Dashboard - Built with Next.js, Prisma, CCXT & The Graph
          </p>
        </div>
      </footer>
    </div>
  );
}
