import { NextRequest, NextResponse } from 'next/server';
import { getInventoryHistory } from '@/lib/sync/inventory-sync';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const asset = searchParams.get('asset') || 'USDT';
    const daysBack = parseInt(searchParams.get('days') || '30');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const history = await getInventoryHistory(asset, startDate, endDate);

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Failed to get inventory history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory history' },
      { status: 500 }
    );
  }
}
