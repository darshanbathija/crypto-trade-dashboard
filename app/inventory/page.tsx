'use client';

import { useState } from 'react';
import Link from 'next/link';
import { InventorySummary } from '@/components/inventory/InventorySummary';
import { InventoryChart } from '@/components/inventory/InventoryChart';
import { InventorySyncButton } from '@/components/inventory/InventorySyncButton';

export default function InventoryPage() {
  const [refreshKey, setRefreshKey] = useState(0);

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
                Inventory Tracker
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Live balances of USDT, USDC, and UP across all exchanges and wallets
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-1 sm:flex-initial"
              >
                ← Dashboard
              </Link>
              <div className="flex-1 sm:flex-initial">
                <InventorySyncButton onSyncComplete={handleSyncComplete} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Current Inventory */}
        <div key={`summary-${refreshKey}`}>
          <InventorySummary />
        </div>

        {/* Historical Chart */}
        <div key={`chart-${refreshKey}`} className="mt-6 sm:mt-8">
          <InventoryChart />
        </div>

        {/* Info Box */}
        <div className="mt-6 sm:mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
            How it works
          </h4>
          <ul className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Click "Sync Inventory" to fetch current balances from all exchanges and wallets</li>
            <li>• Inventory snapshots are saved automatically for historical tracking</li>
            <li>• Charts show balance changes over time for each asset</li>
            <li>• Configure your API keys in Settings to enable exchange syncing</li>
          </ul>
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
