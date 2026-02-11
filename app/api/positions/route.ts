import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // 'OPEN' or 'CLOSED'
    const asset = searchParams.get('asset');

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (asset) where.asset = asset;

    // Get positions
    const positions = await prisma.position.findMany({
      where,
      orderBy: { openedAt: 'desc' },
      include: {
        trades: {
          include: {
            trade: true,
          },
        },
      },
    });

    // Calculate unrealized P&L for open positions
    const positionsWithPnL = await Promise.all(
      positions.map(async (position) => {
        if (position.status === 'OPEN' && !position.currentPrice) {
          // Get most recent trade price for this asset
          const recentTrade = await prisma.trade.findFirst({
            where: { baseAsset: position.asset },
            orderBy: { timestamp: 'desc' },
          });

          if (recentTrade) {
            const currentPrice = recentTrade.price;
            const unrealizedPnL =
              position.side === 'BUY'
                ? (currentPrice - position.avgOpenPrice) * position.remainingQuantity
                : (position.avgOpenPrice - currentPrice) * position.remainingQuantity;

            return {
              ...position,
              currentPrice,
              unrealizedPnL,
            };
          }
        }

        return position;
      })
    );

    return NextResponse.json({ positions: positionsWithPnL });
  } catch (error) {
    console.error('Positions API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
