'use client';

import { useState } from 'react';

interface InventorySyncButtonProps {
  onSyncComplete?: () => void;
}

export function InventorySyncButton({ onSyncComplete }: InventorySyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      const response = await fetch('/api/inventory/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Synced ${data.snapshots} inventory snapshots`,
        });
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Sync failed',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Sync failed',
      });
    } finally {
      setSyncing(false);
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`w-full sm:w-auto px-4 py-2 rounded-md font-medium text-sm sm:text-base text-white ${
          syncing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {syncing ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Syncing...
          </span>
        ) : (
          'Sync Inventory'
        )}
      </button>

      {message && (
        <div
          className={`px-4 py-2 rounded-md text-xs sm:text-sm ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
