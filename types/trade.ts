export type TradeSource = 'GATEIO' | 'MEXC' | 'KRAKEN' | 'BASE_CHAIN';
export type TradeSide = 'BUY' | 'SELL';
export type PositionStatus = 'OPEN' | 'CLOSED';

export interface Trade {
  id: string;
  source: TradeSource;
  sourceId: string;
  timestamp: Date;
  pair: string;
  baseAsset: string;
  quoteAsset: string;
  side: TradeSide;
  price: number;
  quantity: number;
  total: number;
  fee: number;
  feeCurrency: string;
  walletAddress?: string | null;
  txHash?: string | null;
  gasUsed?: number | null;
  gasPrice?: number | null;
  dexProtocol?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Position {
  id: string;
  asset: string;
  exchange?: string | null;
  walletAddress?: string | null;
  status: PositionStatus;
  side: TradeSide;
  openQuantity: number;
  closedQuantity: number;
  remainingQuantity: number;
  avgOpenPrice: number;
  avgClosePrice?: number | null;
  currentPrice?: number | null;
  realizedPnL: number;
  unrealizedPnL?: number | null;
  totalFees: number;
  openedAt: Date;
  closedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
