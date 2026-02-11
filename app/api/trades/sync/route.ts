import { NextRequest, NextResponse } from 'next/server';
import { syncAllExchanges } from '@/lib/sync/exchange-sync';
import { syncBlockchainTrades } from '@/lib/sync/blockchain-sync';
import { recalculateAllPositions } from '@/lib/calculations/positions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sources, fullSync } = body as {
      sources?: string[];
      fullSync?: boolean;
    };

    const results: any = {};

    // Determine timestamp for incremental sync
    const since = fullSync ? undefined : Date.now() - 7 * 24 * 60 * 60 * 1000; // Last 7 days

    // Sync exchanges if no sources specified or 'exchanges' is included
    if (!sources || sources.includes('exchanges')) {
      console.log('Syncing exchanges...');
      results.exchanges = await syncAllExchanges(since);
    }

    // Sync blockchain if no sources specified or 'blockchain' is included
    if (!sources || sources.includes('blockchain')) {
      console.log('Syncing blockchain...');
      const fromTimestamp = since ? Math.floor(since / 1000) : undefined;
      results.blockchain = await syncBlockchainTrades(fromTimestamp);
    }

    // Recalculate positions after syncing
    console.log('Recalculating positions...');
    await recalculateAllPositions();

    return NextResponse.json({
      success: true,
      results,
      message: 'Sync completed successfully',
    });
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
