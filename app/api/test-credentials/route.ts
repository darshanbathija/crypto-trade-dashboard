import { NextResponse } from 'next/server';
import { createGateioClient } from '@/lib/exchanges/gateio';
import { createMexcClient } from '@/lib/exchanges/mexc';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results = {
    gateio: { configured: false, valid: false, error: null as string | null },
    mexc: { configured: false, valid: false, error: null as string | null },
    basescan: { configured: false, valid: false, error: null as string | null },
    database: { connected: false, error: null as string | null },
  };

  // Test Gate.io
  if (process.env.GATEIO_API_KEY && process.env.GATEIO_SECRET) {
    results.gateio.configured = true;

    // Check if it's a placeholder value
    if (process.env.GATEIO_API_KEY.includes('your_') || process.env.GATEIO_API_KEY.includes('here')) {
      results.gateio.error = 'Placeholder value detected - not a real API key';
    } else {
      try {
        const client = createGateioClient();
        await client.loadMarkets();

        // Try to fetch account balance (read-only test)
        await client.fetchBalance();
        results.gateio.valid = true;
        await client.close();
      } catch (error: any) {
        results.gateio.error = error.message || 'Authentication failed';
        console.error('Gate.io test failed:', error);
      }
    }
  } else {
    results.gateio.error = 'API credentials not set in environment variables';
  }

  // Test MEXC
  if (process.env.MEXC_API_KEY && process.env.MEXC_SECRET) {
    results.mexc.configured = true;

    if (process.env.MEXC_API_KEY.includes('your_') || process.env.MEXC_API_KEY.includes('here')) {
      results.mexc.error = 'Placeholder value detected - not a real API key';
    } else {
      try {
        const client = createMexcClient();
        await client.loadMarkets();
        await client.fetchBalance();
        results.mexc.valid = true;
        await client.close();
      } catch (error: any) {
        results.mexc.error = error.message || 'Authentication failed';
        console.error('MEXC test failed:', error);
      }
    }
  } else {
    results.mexc.error = 'API credentials not set in environment variables';
  }

  // Test Basescan
  if (process.env.BASESCAN_API_KEY) {
    results.basescan.configured = true;

    if (process.env.BASESCAN_API_KEY.includes('your_') || process.env.BASESCAN_API_KEY.includes('here')) {
      results.basescan.error = 'Placeholder value detected - not a real API key';
    } else {
      // Test with a simple API call (V2)
      try {
        const testUrl = `https://api.etherscan.io/v2/api?chainid=8453&module=account&action=balance&address=0x0000000000000000000000000000000000000000&apikey=${process.env.BASESCAN_API_KEY}`;
        const response = await fetch(testUrl);
        const data = await response.json();

        if (data.status === '1' || data.message === 'OK') {
          results.basescan.valid = true;
        } else {
          results.basescan.error = data.result || 'Invalid API key';
        }
      } catch (error: any) {
        results.basescan.error = error.message || 'API test failed';
        console.error('Basescan test failed:', error);
      }
    }
  } else {
    results.basescan.error = 'API key not set in environment variables';
  }

  // Test Database connection
  try {
    const { prisma } = await import('@/lib/db/prisma');
    await prisma.$queryRaw`SELECT 1`;
    results.database.connected = true;
  } catch (error: any) {
    results.database.error = error.message || 'Connection failed';
    console.error('Database test failed:', error);
  }

  return NextResponse.json(results);
}
