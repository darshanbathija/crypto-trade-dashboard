import { createExchangeClient } from './ccxt-client';

/**
 * Kraken exchange configuration (Future support)
 */
export const KRAKEN_EXCHANGE_ID = 'kraken';

/**
 * Default trading pairs to track on Kraken
 */
export const KRAKEN_DEFAULT_SYMBOLS = [
  'BTC/USD',
  'ETH/USD',
  'SOL/USD',
  'XRP/USD',
  // Add more pairs as needed
];

/**
 * Create a Kraken client
 */
export function createKrakenClient() {
  const apiKey = process.env.KRAKEN_API_KEY;
  const secret = process.env.KRAKEN_SECRET;

  if (!apiKey || !secret) {
    throw new Error('KRAKEN_API_KEY and KRAKEN_SECRET must be set in environment variables');
  }

  return createExchangeClient(KRAKEN_EXCHANGE_ID, apiKey, secret);
}

/**
 * Get tracked symbols for Kraken
 */
export function getKrakenTrackedSymbols(): string[] {
  return KRAKEN_DEFAULT_SYMBOLS;
}
