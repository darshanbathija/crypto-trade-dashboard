import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const wallets = await prisma.wallet.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ wallets });
  } catch (error) {
    console.error('Wallets GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, label } = body;

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Check if wallet already exists
    const existing = await prisma.wallet.findUnique({
      where: { address },
    });

    if (existing) {
      return NextResponse.json({ error: 'Wallet already exists' }, { status: 400 });
    }

    // Create wallet
    const wallet = await prisma.wallet.create({
      data: {
        address,
        label: label || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, wallet });
  } catch (error) {
    console.error('Wallets POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    await prisma.wallet.delete({
      where: { address },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wallets DELETE error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
