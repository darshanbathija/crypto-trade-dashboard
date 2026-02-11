import { NextRequest, NextResponse } from 'next/server';
import { calculateTotalPnL, calculatePnLByDate } from '@/lib/calculations/pnl';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = (searchParams.get('groupBy') as 'day' | 'week' | 'month') || 'day';

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    // Get total P&L
    const pnl = await calculateTotalPnL(start, end);

    // Get P&L by date if date range is provided
    let pnlByDate;
    if (start && end) {
      pnlByDate = await calculatePnLByDate(start, end, groupBy);
    }

    return NextResponse.json({
      ...pnl,
      pnlByDate,
    });
  } catch (error) {
    console.error('P&L API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
