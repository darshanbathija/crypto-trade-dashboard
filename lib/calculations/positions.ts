import { prisma } from '@/lib/db/prisma';
import { Trade } from '@prisma/client';

/**
 * Process a trade for position tracking using FIFO methodology
 */
export async function processTradeForPosition(trade: Trade): Promise<void> {
  const { baseAsset, side, quantity, price, fee, source, walletAddress } = trade;

  // Find existing open position for this asset
  const existingPosition = await prisma.position.findFirst({
    where: {
      asset: baseAsset,
      status: 'OPEN',
      // Match by exchange OR wallet address
      ...(source === 'BASE_CHAIN'
        ? { walletAddress: walletAddress }
        : { exchange: source }),
    },
  });

  if (side === 'BUY') {
    if (existingPosition) {
      // Add to existing long position
      await addToPosition(existingPosition.id, trade);
    } else {
      // Open new long position
      await createPosition(trade, 'BUY');
    }
  } else {
    // SELL
    if (existingPosition) {
      // Close or reduce existing position
      await closeOrReducePosition(existingPosition.id, trade);
    } else {
      // Opening a short position (less common in crypto spot trading)
      // For now, we'll treat this as a standalone sell
      await createPosition(trade, 'SELL');
    }
  }
}

/**
 * Create a new position from a trade
 */
async function createPosition(trade: Trade, side: string): Promise<void> {
  const position = await prisma.position.create({
    data: {
      asset: trade.baseAsset,
      exchange: trade.source === 'BASE_CHAIN' ? null : trade.source,
      walletAddress: trade.walletAddress,
      status: 'OPEN',
      side: side,
      openQuantity: trade.quantity,
      closedQuantity: 0,
      remainingQuantity: trade.quantity,
      avgOpenPrice: trade.price,
      realizedPnL: 0,
      totalFees: trade.fee,
      openedAt: trade.timestamp,
    },
  });

  // Link trade to position
  await prisma.positionTrade.create({
    data: {
      positionId: position.id,
      tradeId: trade.id,
      quantity: trade.quantity,
    },
  });

  console.log(`Created new ${side} position for ${trade.baseAsset}: ${position.id}`);
}

/**
 * Add quantity to an existing position (accumulate)
 */
async function addToPosition(positionId: string, trade: Trade): Promise<void> {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
  });

  if (!position) {
    throw new Error(`Position ${positionId} not found`);
  }

  // Calculate new average open price using weighted average
  const totalCost =
    position.avgOpenPrice * position.openQuantity + trade.price * trade.quantity;
  const totalQuantity = position.openQuantity + trade.quantity;
  const newAvgOpenPrice = totalCost / totalQuantity;

  // Update position
  await prisma.position.update({
    where: { id: positionId },
    data: {
      openQuantity: totalQuantity,
      remainingQuantity: totalQuantity - position.closedQuantity,
      avgOpenPrice: newAvgOpenPrice,
      totalFees: position.totalFees + trade.fee,
    },
  });

  // Link trade to position
  await prisma.positionTrade.create({
    data: {
      positionId: position.id,
      tradeId: trade.id,
      quantity: trade.quantity,
    },
  });

  console.log(
    `Added ${trade.quantity} to position ${positionId}. New avg price: ${newAvgOpenPrice}`
  );
}

/**
 * Close or reduce a position (FIFO)
 */
async function closeOrReducePosition(positionId: string, trade: Trade): Promise<void> {
  const position = await prisma.position.findUnique({
    where: { id: positionId },
  });

  if (!position) {
    throw new Error(`Position ${positionId} not found`);
  }

  // Calculate quantity to close (cannot close more than remaining)
  const closingQuantity = Math.min(position.remainingQuantity, trade.quantity);

  // Calculate realized P&L for the closed portion
  const realizedPnL = (trade.price - position.avgOpenPrice) * closingQuantity;

  // Calculate new values
  const newClosedQuantity = position.closedQuantity + closingQuantity;
  const newRemainingQuantity = position.remainingQuantity - closingQuantity;
  const newRealizedPnL = position.realizedPnL + realizedPnL;
  const newTotalFees = position.totalFees + trade.fee;

  // Determine if position is now closed
  const isFullyClosed = newRemainingQuantity <= 0.000001; // Account for floating point precision

  // Update position
  await prisma.position.update({
    where: { id: positionId },
    data: {
      closedQuantity: newClosedQuantity,
      remainingQuantity: isFullyClosed ? 0 : newRemainingQuantity,
      realizedPnL: newRealizedPnL,
      totalFees: newTotalFees,
      status: isFullyClosed ? 'CLOSED' : 'OPEN',
      closedAt: isFullyClosed ? new Date() : null,
      avgClosePrice: isFullyClosed
        ? trade.price
        : position.avgClosePrice
        ? (position.avgClosePrice * position.closedQuantity + trade.price * closingQuantity) /
          newClosedQuantity
        : trade.price,
    },
  });

  // Link trade to position
  await prisma.positionTrade.create({
    data: {
      positionId: position.id,
      tradeId: trade.id,
      quantity: closingQuantity,
    },
  });

  console.log(
    `Closed ${closingQuantity} of position ${positionId}. Realized P&L: ${realizedPnL}. Status: ${isFullyClosed ? 'CLOSED' : 'OPEN'}`
  );

  // If there's remaining sell quantity, create a new short position
  const remainingSellQuantity = trade.quantity - closingQuantity;
  if (remainingSellQuantity > 0.000001) {
    console.log(
      `Creating new short position for remaining ${remainingSellQuantity} ${trade.baseAsset}`
    );
    // Create a synthetic trade for the remaining quantity
    await createPosition(
      {
        ...trade,
        quantity: remainingSellQuantity,
      },
      'SELL'
    );
  }
}

/**
 * Recalculate positions for all trades (used for backfilling or corrections)
 */
export async function recalculateAllPositions(): Promise<void> {
  console.log('Starting position recalculation...');

  // Delete all existing positions and position-trade links
  await prisma.positionTrade.deleteMany({});
  await prisma.position.deleteMany({});

  // Get all trades ordered by timestamp
  const trades = await prisma.trade.findMany({
    orderBy: { timestamp: 'asc' },
  });

  console.log(`Processing ${trades.length} trades...`);

  // Process each trade in chronological order
  for (const trade of trades) {
    await processTradeForPosition(trade);
  }

  console.log('Position recalculation completed');
}

/**
 * Get all open positions
 */
export async function getOpenPositions() {
  return await prisma.position.findMany({
    where: { status: 'OPEN' },
    orderBy: { openedAt: 'desc' },
  });
}

/**
 * Get all closed positions
 */
export async function getClosedPositions(limit: number = 100) {
  return await prisma.position.findMany({
    where: { status: 'CLOSED' },
    orderBy: { closedAt: 'desc' },
    take: limit,
  });
}

/**
 * Get position details with all trades
 */
export async function getPositionWithTrades(positionId: string) {
  return await prisma.position.findUnique({
    where: { id: positionId },
    include: {
      trades: {
        include: {
          trade: true,
        },
      },
    },
  });
}
