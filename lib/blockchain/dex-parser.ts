import { UniswapSwap } from './thegraph';

/**
 * Parse Uniswap swap into database trade format
 */
export function parseUniswapSwap(
  swap: UniswapSwap,
  walletAddress: string
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
  walletAddress: string;
  txHash: string;
  gasUsed: number;
  gasPrice: number;
  dexProtocol: string;
} {
  const timestamp = new Date(parseInt(swap.timestamp) * 1000);
  const token0Symbol = swap.token0.symbol;
  const token1Symbol = swap.token1.symbol;

  // Convert amounts from strings with decimals
  const amount0 = parseFloat(swap.amount0);
  const amount1 = parseFloat(swap.amount1);

  // Determine buy/sell direction
  // Positive amount0 means we received token0 (sold token1)
  // Negative amount0 means we gave token0 (bought token0)
  const isBuyingToken0 = amount0 < 0;

  let baseAsset: string;
  let quoteAsset: string;
  let side: string;
  let quantity: number;
  let price: number;
  let total: number;

  if (isBuyingToken0) {
    // Buying token0 with token1
    baseAsset = token0Symbol;
    quoteAsset = token1Symbol;
    side = 'BUY';
    quantity = Math.abs(amount0);
    total = Math.abs(amount1);
    price = total / quantity;
  } else {
    // Selling token0 for token1
    baseAsset = token0Symbol;
    quoteAsset = token1Symbol;
    side = 'SELL';
    quantity = Math.abs(amount0);
    total = Math.abs(amount1);
    price = total / quantity;
  }

  // Calculate gas cost
  const gasUsed = parseFloat(swap.transaction.gasUsed);
  const gasPrice = parseFloat(swap.transaction.gasPrice) / 1e9; // Convert to Gwei
  const gasCostEth = (gasUsed * gasPrice) / 1e9; // Gas cost in ETH

  // Estimate fee in USD (could be improved with ETH price lookup)
  const fee = parseFloat(swap.amountUSD) * 0.003; // Assume 0.3% fee (Uniswap default)

  return {
    source: 'BASE_CHAIN',
    sourceId: swap.transaction.id,
    timestamp,
    pair: `${baseAsset}/${quoteAsset}`,
    baseAsset,
    quoteAsset,
    side,
    price,
    quantity,
    total,
    fee,
    feeCurrency: 'USD',
    walletAddress,
    txHash: swap.transaction.id,
    gasUsed,
    gasPrice,
    dexProtocol: 'Uniswap V3',
  };
}
