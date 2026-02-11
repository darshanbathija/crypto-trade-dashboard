import { createExchangeClient } from './ccxt-client';

/**
 * Gate.io exchange configuration
 */
export const GATEIO_EXCHANGE_ID = 'gate';

/**
 * Default trading pairs to track on Gate.io
 * You can customize this list based on your trading activity
 */
export const GATEIO_DEFAULT_SYMBOLS = [
  'BTC/USDT',
  'ETH/USDT',
  'BNB/USDT',
  'SOL/USDT',
  'XRP/USDT',
  // Add more pairs as needed
];

/**
 * Create a Gate.io client
 */
export function createGateioClient() {
  const apiKey = process.env.GATEIO_API_KEY;
  const secret = process.env.GATEIO_SECRET;

  if (!apiKey || !secret) {
    throw new Error('GATEIO_API_KEY and GATEIO_SECRET must be set in environment variables');
  }

  return createExchangeClient(GATEIO_EXCHANGE_ID, apiKey, secret);
}

/**
 * Get tracked symbols for Gate.io
 * This can be extended to fetch from database or config
 */
export function getGateioTrackedSymbols(): string[] {
  return GATEIO_DEFAULT_SYMBOLS;
}
