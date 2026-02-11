'use client';

import { useState } from 'react';

export function SyncButton({ onSyncComplete }: { onSyncComplete?: () => void }) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/trades/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullSync: false, // Incremental sync (last 7 days)
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        onSyncComplete?.();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        // Show detailed error message
        const errorMsg = data.error || 'Sync failed';
        console.error('Sync error details:', data);
        setError(errorMsg);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleSync}
        disabled={syncing}
        className={`px-6 py-2 rounded-md font-medium transition-colors ${
          syncing
            ? 'bg-gray-400 cursor-not-allowed'
            : success
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {syncing ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
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
        ) : success ? (
          '✓ Synced!'
        ) : (
          'Sync Trades'
        )}
      </button>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">
          Error: {error}
        </div>
      )}
    </div>
  );
}
