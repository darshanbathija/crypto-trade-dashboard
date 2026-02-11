import { NextRequest, NextResponse } from 'next/server';
import { syncBlockchainTrades } from '@/lib/sync/blockchain-sync';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fromTimestamp } = body as { fromTimestamp?: number };

    const result = await syncBlockchainTrades(fromTimestamp);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Blockchain sync API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
