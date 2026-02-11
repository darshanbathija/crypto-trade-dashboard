import { NextRequest, NextResponse } from 'next/server';
import { getCurrentInventory } from '@/lib/sync/inventory-sync';

export async function GET(request: NextRequest) {
  try {
    const inventory = await getCurrentInventory();

    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Failed to get inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}
