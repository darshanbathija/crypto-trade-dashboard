import { NextRequest, NextResponse } from 'next/server';
import { syncExchangeTrades, syncAllExchanges, ExchangeSource } from '@/lib/sync/exchange-sync';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { exchange, since } = body as {
      exchange?: ExchangeSource;
      since?: number;
    };

    // If specific exchange is provided, sync only that exchange
    if (exchange) {
      const result = await syncExchangeTrades(exchange, since);
      return NextResponse.json(result);
    }

    // Otherwise, sync all configured exchanges
    const results = await syncAllExchanges(since);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Exchange sync API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
