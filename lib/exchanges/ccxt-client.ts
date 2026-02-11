import ccxt from 'ccxt';

export interface CCXTTrade {
  id: string;
  timestamp: number;
  datetime: string;
  symbol: string;
  type: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  cost: number;
  fee: {
    cost: number;
    currency: string;
  };
  info: any;
}

export class ExchangeClient {
  private exchange: any;
  private exchangeId: string;

  constructor(exchangeId: string, apiKey: string, secret: string) {
    this.exchangeId = exchangeId;

    // @ts-ignore - CCXT exchange types
    const ExchangeClass = ccxt[exchangeId];

    if (!ExchangeClass) {
      throw new Error(`Exchange ${exchangeId} not supported by CCXT`);
    }

    this.exchange = new ExchangeClass({
      apiKey,
      secret,
      enableRateLimit: true, // CRITICAL: Auto rate limiting
      rateLimit: 1000,
    });
  }

  /**
   * Load markets (required before making any calls)
   */
  async loadMarkets() {
    try {
      await this.exchange.loadMarkets();
    } catch (error) {
      console.error(`Failed to load markets for ${this.exchangeId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch all trades for a symbol with pagination
   * @param symbol - Trading pair (e.g., 'BTC/USDT')
   * @param since - Timestamp to fetch trades from (milliseconds)
   * @param limit - Number of trades per page
   */
  async fetchAllTrades(
    symbol: string,
    since?: number,
    limit: number = 100
  ): Promise<CCXTTrade[]> {
    try {
      const allTrades: CCXTTrade[] = [];
      let currentSince = since || Date.now() - 90 * 24 * 60 * 60 * 1000; // Default: 90 days ago
      let hasMore = true;

      while (hasMore) {
        try {
          const trades = await this.exchange.fetchMyTrades(symbol, currentSince, limit);

          if (!trades || trades.length === 0) {
            hasMore = false;
            break;
          }

          allTrades.push(...(trades as CCXTTrade[]));

          // Update since to the timestamp of the last trade + 1ms
          currentSince = trades[trades.length - 1].timestamp + 1;

          // If we got fewer trades than the limit, we've reached the end
          if (trades.length < limit) {
            hasMore = false;
          }

          // Progress logging
          console.log(
            `Fetched ${trades.length} trades for ${symbol} on ${this.exchangeId}. Total: ${allTrades.length}`
          );

          // CCXT handles rate limiting automatically with enableRateLimit: true
          // But we can add a small delay for extra safety
          await this.sleep(100);
        } catch (error) {
          if (error instanceof ccxt.RateLimitExceeded) {
            console.warn(`Rate limit exceeded, waiting ${this.exchange.rateLimit}ms...`);
            await this.sleep(this.exchange.rateLimit);
            // Retry this iteration
            continue;
          }
          throw error;
        }
      }

      return allTrades;
    } catch (error) {
      console.error(`Failed to fetch trades for ${symbol} on ${this.exchangeId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch trades for multiple symbols
   */
  async fetchAllTradesForSymbols(
    symbols: string[],
    since?: number
  ): Promise<CCXTTrade[]> {
    const allTrades: CCXTTrade[] = [];

    for (const symbol of symbols) {
      try {
        const trades = await this.fetchAllTrades(symbol, since);
        allTrades.push(...trades);
      } catch (error) {
        console.error(`Failed to fetch trades for ${symbol}:`, error);
        // Continue with other symbols even if one fails
      }
    }

    return allTrades;
  }

  /**
   * Fetch account balance
   */
  async fetchBalance(): Promise<any> {
    try {
      return await this.exchange.fetchBalance();
    } catch (error) {
      console.error(`Failed to fetch balance for ${this.exchangeId}:`, error);
      throw error;
    }
  }

  /**
   * Get available markets/symbols
   */
  async getMarkets(): Promise<string[]> {
    try {
      await this.loadMarkets();
      return Object.keys(this.exchange.markets);
    } catch (error) {
      console.error(`Failed to get markets for ${this.exchangeId}:`, error);
      throw error;
    }
  }

  /**
   * Utility function to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Close exchange connection
   */
  async close(): Promise<void> {
    if (this.exchange && typeof this.exchange.close === 'function') {
      await this.exchange.close();
    }
  }
}

/**
 * Create an exchange client for a given exchange
 */
export function createExchangeClient(
  exchangeId: string,
  apiKey: string,
  secret: string
): ExchangeClient {
  return new ExchangeClient(exchangeId, apiKey, secret);
}

/**
 * Map CCXT trade to our database schema
 */
export function mapCCXTTradeToDBTrade(
  trade: CCXTTrade,
  source: string
): {
  source: string;
  sourceId: string;
  timestamp: Date;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  side: string;
  price: number;
  quantity: number;
  total: number;
  fee: number;
  feeCurrency: string;
} {
  // Parse the symbol to get base and quote assets
  const [baseAsset, quoteAsset] = trade.symbol.split('/');

  return {
    source,
    sourceId: trade.id,
    timestamp: new Date(trade.timestamp),
    pair: trade.symbol,
    baseAsset,
    quoteAsset,
    side: trade.side.toUpperCase(), // 'BUY' or 'SELL'
    price: trade.price,
    quantity: trade.amount,
    total: trade.cost,
    fee: trade.fee?.cost || 0,
    feeCurrency: trade.fee?.currency || quoteAsset,
  };
}
