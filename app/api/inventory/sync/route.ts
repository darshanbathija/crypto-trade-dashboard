import { NextRequest, NextResponse } from 'next/server';
import { syncInventory } from '@/lib/sync/inventory-sync';

export async function POST(request: NextRequest) {
  try {
    const result = await syncInventory();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Synced ${result.snapshots} inventory snapshots`,
        snapshots: result.snapshots,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Inventory sync failed:', error);
    return NextResponse.json(
      { error: 'Failed to sync inventory' },
      { status: 500 }
    );
  }
}
