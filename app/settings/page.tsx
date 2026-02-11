'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Settings {
  gateio: { hasApiKey: boolean; hasSecret: boolean };
  mexc: { hasApiKey: boolean; hasSecret: boolean };
  kraken: { hasApiKey: boolean; hasSecret: boolean };
  blockchain: { hasBasescanKey: boolean; walletAddresses: string[] };
}

interface Wallet {
  id: string;
  address: string;
  label: string | null;
  isActive: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProduction, setIsProduction] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Form state
  const [gateioApiKey, setGateioApiKey] = useState('');
  const [gateioSecret, setGateioSecret] = useState('');
  const [mexcApiKey, setMexcApiKey] = useState('');
  const [mexcSecret, setMexcSecret] = useState('');
  const [krakenApiKey, setKrakenApiKey] = useState('');
  const [krakenSecret, setKrakenSecret] = useState('');
  const [basescanKey, setBasescanKey] = useState('');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletLabel, setNewWalletLabel] = useState('');

  useEffect(() => {
    loadSettings();
    loadWallets();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setSettings(data);
      // Set production flag from API response
      if (data.isProduction !== undefined) {
        setIsProduction(data.isProduction);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const loadWallets = async () => {
    try {
      const response = await fetch('/api/wallets');
      const data = await response.json();
      setWallets(data.wallets || []);
    } catch (error) {
      console.error('Failed to load wallets:', error);
    }
  };

  const handleTestCredentials = async () => {
    setTesting(true);
    setTestResults(null);
    setMessage(null);

    try {
      const response = await fetch('/api/test-credentials');
      const data = await response.json();
      setTestResults(data);

      // Show summary message
      const validCount = [data.gateio.valid, data.mexc.valid, data.basescan.valid].filter(Boolean).length;
      const configuredCount = [data.gateio.configured, data.mexc.configured, data.basescan.configured].filter(Boolean).length;

      if (validCount === 0 && configuredCount === 0) {
        setMessage({ type: 'error', text: 'No API credentials configured' });
      } else if (validCount === 0) {
        setMessage({ type: 'error', text: 'API credentials configured but not working. Check details below.' });
      } else {
        setMessage({ type: 'success', text: `${validCount} of ${configuredCount} API credentials working correctly!` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gateio: {
            apiKey: gateioApiKey || undefined,
            secret: gateioSecret || undefined,
          },
          mexc: {
            apiKey: mexcApiKey || undefined,
            secret: mexcSecret || undefined,
          },
          kraken: {
            apiKey: krakenApiKey || undefined,
            secret: krakenSecret || undefined,
          },
          blockchain: {
            basescanKey: basescanKey || undefined,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        // Clear form
        setGateioApiKey('');
        setGateioSecret('');
        setMexcApiKey('');
        setMexcSecret('');
        setKrakenApiKey('');
        setKrakenSecret('');
        setBasescanKey('');
        // Reload settings
        await loadSettings();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddWallet = async () => {
    if (!newWalletAddress) {
      setMessage({ type: 'error', text: 'Wallet address is required' });
      return;
    }

    try {
      const response = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: newWalletAddress,
          label: newWalletLabel || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Wallet added successfully' });
        setNewWalletAddress('');
        setNewWalletLabel('');
        await loadWallets();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to add wallet' });
    }
  };

  const handleDeleteWallet = async (address: string) => {
    if (!confirm('Are you sure you want to remove this wallet?')) {
      return;
    }

    try {
      const response = await fetch(`/api/wallets?address=${encodeURIComponent(address)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Wallet removed successfully' });
        await loadWallets();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to remove wallet' });
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Configure API keys and wallet addresses
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Test Credentials Button */}
        <div className="mb-6">
          <button
            onClick={handleTestCredentials}
            disabled={testing}
            className={`w-full sm:w-auto px-6 py-3 rounded-md font-medium text-white ${
              testing ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {testing ? (
              <span className="flex items-center gap-2 justify-center">
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
                Testing Credentials...
              </span>
            ) : (
              '🔍 Test API Credentials'
            )}
          </button>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="mb-6 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              API Credentials Test Results
            </h3>
            <div className="space-y-3">
              {/* Gate.io */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="flex-shrink-0">
                  {testResults.gateio.valid ? (
                    <span className="text-2xl">✅</span>
                  ) : testResults.gateio.configured ? (
                    <span className="text-2xl">❌</span>
                  ) : (
                    <span className="text-2xl">⚠️</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">Gate.io</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testResults.gateio.valid
                      ? 'API credentials are valid and working!'
                      : testResults.gateio.error || 'Not configured'}
                  </div>
                </div>
              </div>

              {/* MEXC */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="flex-shrink-0">
                  {testResults.mexc.valid ? (
                    <span className="text-2xl">✅</span>
                  ) : testResults.mexc.configured ? (
                    <span className="text-2xl">❌</span>
                  ) : (
                    <span className="text-2xl">⚠️</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">MEXC</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testResults.mexc.valid
                      ? 'API credentials are valid and working!'
                      : testResults.mexc.error || 'Not configured'}
                  </div>
                </div>
              </div>

              {/* Basescan */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="flex-shrink-0">
                  {testResults.basescan.valid ? (
                    <span className="text-2xl">✅</span>
                  ) : testResults.basescan.configured ? (
                    <span className="text-2xl">❌</span>
                  ) : (
                    <span className="text-2xl">⚠️</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">Basescan</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testResults.basescan.valid
                      ? 'API key is valid and working!'
                      : testResults.basescan.error || 'Not configured'}
                  </div>
                </div>
              </div>

              {/* Database */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                <div className="flex-shrink-0">
                  {testResults.database.connected ? (
                    <span className="text-2xl">✅</span>
                  ) : (
                    <span className="text-2xl">❌</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">Database</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testResults.database.connected
                      ? 'Database connection successful!'
                      : testResults.database.error || 'Connection failed'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Production Environment Warning */}
        {isProduction && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                  Production Environment Detected
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                  <p>API keys cannot be modified through this interface in production. To update environment variables:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Go to your <a href="https://vercel.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline font-medium">Vercel Dashboard</a></li>
                    <li>Select your project → Settings → Environment Variables</li>
                    <li>Add or update: GATEIO_API_KEY, MEXC_API_KEY, BASESCAN_API_KEY, etc.</li>
                    <li>Redeploy for changes to take effect</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Gate.io Settings */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
            Gate.io API Keys
            {settings.gateio.hasApiKey && (
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                ✓ Configured
              </span>
            )}
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="text"
                value={gateioApiKey}
                onChange={(e) => setGateioApiKey(e.target.value)}
                placeholder={settings.gateio.hasApiKey ? '••••••••••••••••' : 'Enter Gate.io API key'}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secret Key
              </label>
              <input
                type="password"
                value={gateioSecret}
                onChange={(e) => setGateioSecret(e.target.value)}
                placeholder={settings.gateio.hasSecret ? '••••••••••••••••' : 'Enter Gate.io secret key'}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* MEXC Settings */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
            MEXC API Keys
            {settings.mexc.hasApiKey && (
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                ✓ Configured
              </span>
            )}
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="text"
                value={mexcApiKey}
                onChange={(e) => setMexcApiKey(e.target.value)}
                placeholder={settings.mexc.hasApiKey ? '••••••••••••••••' : 'Enter MEXC API key'}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secret Key
              </label>
              <input
                type="password"
                value={mexcSecret}
                onChange={(e) => setMexcSecret(e.target.value)}
                placeholder={settings.mexc.hasSecret ? '••••••••••••••••' : 'Enter MEXC secret key'}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Kraken Settings */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
            Kraken API Keys (Optional)
            {settings.kraken.hasApiKey && (
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                ✓ Configured
              </span>
            )}
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="text"
                value={krakenApiKey}
                onChange={(e) => setKrakenApiKey(e.target.value)}
                placeholder={settings.kraken.hasApiKey ? '••••••••••••••••' : 'Enter Kraken API key'}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Secret Key
              </label>
              <input
                type="password"
                value={krakenSecret}
                onChange={(e) => setKrakenSecret(e.target.value)}
                placeholder={settings.kraken.hasSecret ? '••••••••••••••••' : 'Enter Kraken secret key'}
                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Basescan API Key */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
            Basescan API Key
            {settings.blockchain.hasBasescanKey && (
              <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full">
                ✓ Configured
              </span>
            )}
          </h2>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key (Get free key at basescan.org)
            </label>
            <input
              type="text"
              value={basescanKey}
              onChange={(e) => setBasescanKey(e.target.value)}
              placeholder={settings.blockchain.hasBasescanKey ? '••••••••••••••••' : 'Enter Basescan API key'}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mb-4 sm:mb-6">
          <button
            onClick={handleSaveSettings}
            disabled={saving || isProduction}
            className={`w-full sm:w-auto px-6 py-2 rounded-md font-medium text-sm sm:text-base text-white ${
              saving || isProduction ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving...' : isProduction ? 'Use Vercel Dashboard' : 'Save API Keys'}
          </button>
        </div>

        {/* Wallet Addresses */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">
            Base Blockchain Wallets
          </h2>

          {/* Add Wallet Form */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Add New Wallet
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <input
                type="text"
                value={newWalletAddress}
                onChange={(e) => setNewWalletAddress(e.target.value)}
                placeholder="0x... wallet address"
                className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                value={newWalletLabel}
                onChange={(e) => setNewWalletLabel(e.target.value)}
                placeholder="Label (optional)"
                className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleAddWallet}
                className="px-4 py-2 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white rounded-md font-medium"
              >
                Add Wallet
              </button>
            </div>
          </div>

          {/* Wallet List */}
          <div className="space-y-2">
            {wallets.length === 0 ? (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No wallets configured. Add a wallet to track Base blockchain swaps.
              </p>
            ) : (
              wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg gap-2"
                >
                  <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <div className="font-mono text-xs sm:text-sm text-gray-900 dark:text-white break-all">
                      {wallet.address}
                    </div>
                    {wallet.label && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {wallet.label}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteWallet(wallet.address)}
                    className="w-full sm:w-auto px-3 py-1 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
