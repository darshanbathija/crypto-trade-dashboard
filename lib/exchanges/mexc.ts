import { createExchangeClient } from './ccxt-client';

/**
 * MEXC exchange configuration
 */
export const MEXC_EXCHANGE_ID = 'mexc';

/**
 * Default trading pairs to track on MEXC
 * You can customize this list based on your trading activity
 */
export const MEXC_DEFAULT_SYMBOLS = [
  'BTC/USDT',
  'ETH/USDT',
  'BNB/USDT',
  'SOL/USDT',
  'XRP/USDT',
  // Add more pairs as needed
];

/**
 * Create a MEXC client
 */
export function createMexcClient() {
  const apiKey = process.env.MEXC_API_KEY;
  const secret = process.env.MEXC_SECRET;

  if (!apiKey || !secret) {
    throw new Error('MEXC_API_KEY and MEXC_SECRET must be set in environment variables');
  }

  return createExchangeClient(MEXC_EXCHANGE_ID, apiKey, secret);
}

/**
 * Get tracked symbols for MEXC
 * This can be extended to fetch from database or config
 */
export function getMexcTrackedSymbols(): string[] {
  return MEXC_DEFAULT_SYMBOLS;
}
