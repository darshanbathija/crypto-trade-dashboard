import { prisma } from '@/lib/db/prisma';
import { Trade } from '@prisma/client';

export interface PnLResult {
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalFees: number;
  netPnL: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  bestTrade?: Trade;
  worstTrade?: Trade;
  pnlByDate?: Array<{ date: string; pnl: number }>;
}

/**
 * Calculate total P&L across all positions
 */
export async function calculateTotalPnL(
  startDate?: Date,
  endDate?: Date
): Promise<PnLResult> {
  // Get all closed positions for realized P&L
  const closedPositions = await prisma.position.findMany({
    where: {
      status: 'CLOSED',
      ...(startDate && { closedAt: { gte: startDate } }),
      ...(endDate && { closedAt: { lte: endDate } }),
    },
  });

  // Calculate realized P&L
  const totalRealizedPnL = closedPositions.reduce(
    (sum, pos) => sum + pos.realizedPnL,
    0
  );

  const totalFees = closedPositions.reduce((sum, pos) => sum + pos.totalFees, 0);

  // Get all open positions for unrealized P&L
  const openPositions = await prisma.position.findMany({
    where: { status: 'OPEN' },
  });

  // Update current prices for open positions
  await updateCurrentPricesForPositions(openPositions);

  // Calculate unrealized P&L
  const totalUnrealizedPnL = openPositions.reduce((sum, pos) => {
    const unrealized = calculateUnrealizedPnL(pos);
    return sum + unrealized;
  }, 0);

  // Calculate win rate
  const winningTrades = closedPositions.filter((p) => p.realizedPnL > 0).length;
  const losingTrades = closedPositions.filter((p) => p.realizedPnL < 0).length;
  const winRate = winningTrades / (winningTrades + losingTrades) || 0;

  // Find best and worst trades
  const sortedPositions = [...closedPositions].sort(
    (a, b) => b.realizedPnL - a.realizedPnL
  );
  const bestPosition = sortedPositions[0];
  const worstPosition = sortedPositions[sortedPositions.length - 1];

  // Get the trades for best and worst positions
  let bestTrade: Trade | undefined;
  let worstTrade: Trade | undefined;

  if (bestPosition) {
    const bestPositionTrades = await prisma.positionTrade.findFirst({
      where: { positionId: bestPosition.id },
      include: { trade: true },
    });
    bestTrade = bestPositionTrades?.trade;
  }

  if (worstPosition) {
    const worstPositionTrades = await prisma.positionTrade.findFirst({
      where: { positionId: worstPosition.id },
      include: { trade: true },
    });
    worstTrade = worstPositionTrades?.trade;
  }

  return {
    totalRealizedPnL,
    totalUnrealizedPnL,
    totalFees,
    netPnL: totalRealizedPnL + totalUnrealizedPnL - totalFees,
    winRate,
    totalTrades: closedPositions.length,
    winningTrades,
    losingTrades,
    bestTrade,
    worstTrade,
  };
}

/**
 * Calculate P&L grouped by date
 */
export async function calculatePnLByDate(
  startDate: Date,
  endDate: Date,
  groupBy: 'day' | 'week' | 'month' = 'day'
): Promise<Array<{ date: string; pnl: number }>> {
  const closedPositions = await prisma.position.findMany({
    where: {
      status: 'CLOSED',
      closedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { closedAt: 'asc' },
  });

  // Group positions by date
  const pnlByDate = new Map<string, number>();

  for (const position of closedPositions) {
    if (!position.closedAt) continue;

    const dateKey = formatDateForGrouping(position.closedAt, groupBy);
    const currentPnL = pnlByDate.get(dateKey) || 0;
    pnlByDate.set(dateKey, currentPnL + position.realizedPnL);
  }

  // Convert to array and sort
  return Array.from(pnlByDate.entries())
    .map(([date, pnl]) => ({ date, pnl }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate unrealized P&L for a position
 */
function calculateUnrealizedPnL(position: {
  remainingQuantity: number;
  avgOpenPrice: number;
  currentPrice: number | null;
  side: string;
}): number {
  if (!position.currentPrice) return 0;

  const currentValue = position.remainingQuantity * position.currentPrice;
  const costBasis = position.remainingQuantity * position.avgOpenPrice;

  return position.side === 'BUY' ? currentValue - costBasis : costBasis - currentValue;
}

/**
 * Update current prices for open positions
 * In a production app, this would fetch real-time prices from an API
 */
async function updateCurrentPricesForPositions(
  positions: Array<{ id: string; asset: string }>
): Promise<void> {
  // For now, we'll fetch prices from the most recent trades
  // In production, you'd fetch from a price API (CoinGecko, exchange APIs, etc.)

  for (const position of positions) {
    try {
      // Get the most recent trade for this asset
      const recentTrade = await prisma.trade.findFirst({
        where: { baseAsset: position.asset },
        orderBy: { timestamp: 'desc' },
      });

      if (recentTrade) {
        await prisma.position.update({
          where: { id: position.id },
          data: {
            currentPrice: recentTrade.price,
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error(`Failed to update price for ${position.asset}:`, error);
    }
  }
}

/**
 * Format date for grouping
 */
function formatDateForGrouping(date: Date, groupBy: 'day' | 'week' | 'month'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (groupBy) {
    case 'day':
      return `${year}-${month}-${day}`;
    case 'week':
      // Get ISO week number
      const weekNumber = getISOWeek(date);
      return `${year}-W${String(weekNumber).padStart(2, '0')}`;
    case 'month':
      return `${year}-${month}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Get ISO week number
 */
function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Calculate P&L for a specific asset
 */
export async function calculateAssetPnL(asset: string): Promise<PnLResult> {
  const closedPositions = await prisma.position.findMany({
    where: {
      status: 'CLOSED',
      asset,
    },
  });

  const openPositions = await prisma.position.findMany({
    where: {
      status: 'OPEN',
      asset,
    },
  });

  await updateCurrentPricesForPositions(openPositions);

  const totalRealizedPnL = closedPositions.reduce(
    (sum, pos) => sum + pos.realizedPnL,
    0
  );

  const totalUnrealizedPnL = openPositions.reduce(
    (sum, pos) => sum + calculateUnrealizedPnL(pos),
    0
  );

  const totalFees = [...closedPositions, ...openPositions].reduce(
    (sum, pos) => sum + pos.totalFees,
    0
  );

  const winningTrades = closedPositions.filter((p) => p.realizedPnL > 0).length;
  const losingTrades = closedPositions.filter((p) => p.realizedPnL < 0).length;

  return {
    totalRealizedPnL,
    totalUnrealizedPnL,
    totalFees,
    netPnL: totalRealizedPnL + totalUnrealizedPnL - totalFees,
    winRate: winningTrades / (winningTrades + losingTrades) || 0,
    totalTrades: closedPositions.length,
    winningTrades,
    losingTrades,
  };
}
