import { prisma } from '@/lib/db/prisma';
import { mapCCXTTradeToDBTrade } from '@/lib/exchanges/ccxt-client';
import { createGateioClient, getGateioTrackedSymbols } from '@/lib/exchanges/gateio';
import { createMexcClient, getMexcTrackedSymbols } from '@/lib/exchanges/mexc';
import { createKrakenClient, getKrakenTrackedSymbols } from '@/lib/exchanges/kraken';

export type ExchangeSource = 'GATEIO' | 'MEXC' | 'KRAKEN';

// Helper to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
}

interface SyncResult {
  success: boolean;
  tradesAdded: number;
  tradesSkipped: number;
  error?: string;
}

/**
 * Sync trades from a specific exchange
 */
export async function syncExchangeTrades(
  source: ExchangeSource,
  since?: number
): Promise<SyncResult> {
  const jobId = await createSyncJob(source);

  try {
    // Update job status to RUNNING
    await updateSyncJob(jobId, { status: 'RUNNING', startedAt: new Date() });

    // Get the last synced trade timestamp from database
    if (!since) {
      const lastTrade = await prisma.trade.findFirst({
        where: { source },
        orderBy: { timestamp: 'desc' },
      });
      since = lastTrade ? lastTrade.timestamp.getTime() : undefined;
    }

    // Create the appropriate exchange client
    const client =
      source === 'GATEIO'
        ? createGateioClient()
        : source === 'MEXC'
        ? createMexcClient()
        : createKrakenClient();

    // Load markets with timeout
    await withTimeout(client.loadMarkets(), 15000);

    // Get tracked symbols for this exchange
    const symbols =
      source === 'GATEIO'
        ? getGateioTrackedSymbols()
        : source === 'MEXC'
        ? getMexcTrackedSymbols()
        : getKrakenTrackedSymbols();

    console.log(`Syncing ${source} trades for symbols:`, symbols);

    // Fetch trades for all symbols with timeout
    const trades = await withTimeout(client.fetchAllTradesForSymbols(symbols, since), 30000);

    console.log(`Fetched ${trades.length} total trades from ${source}`);

    let tradesAdded = 0;
    let tradesSkipped = 0;

    // Store trades in database
    for (const trade of trades) {
      try {
        const dbTrade = mapCCXTTradeToDBTrade(trade, source);

        // Upsert trade (insert or skip if exists)
        await prisma.trade.upsert({
          where: {
            source_sourceId: {
              source,
              sourceId: trade.id,
            },
          },
          update: {},
          create: dbTrade,
        });

        tradesAdded++;
      } catch (error) {
        console.error(`Failed to store trade ${trade.id}:`, error);
        tradesSkipped++;
      }
    }

    // Close the exchange connection
    await client.close();

    // Update job status to COMPLETED
    await updateSyncJob(jobId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      recordsProcessed: trades.length,
      recordsAdded: tradesAdded,
    });

    console.log(
      `${source} sync completed: ${tradesAdded} added, ${tradesSkipped} skipped`
    );

    return {
      success: true,
      tradesAdded,
      tradesSkipped,
    };
  } catch (error) {
    console.error(`${source} sync failed:`, error);

    // Update job status to FAILED
    await updateSyncJob(jobId, {
      status: 'FAILED',
      completedAt: new Date(),
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      tradesAdded: 0,
      tradesSkipped: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Sync trades from all configured exchanges
 */
export async function syncAllExchanges(since?: number): Promise<{
  gateio?: SyncResult;
  mexc?: SyncResult;
  kraken?: SyncResult;
}> {
  const results: Record<string, SyncResult> = {};

  // Sync Gate.io if configured
  if (process.env.GATEIO_API_KEY && process.env.GATEIO_SECRET) {
    console.log('Syncing Gate.io...');
    results.gateio = await syncExchangeTrades('GATEIO', since);
  }

  // Sync MEXC if configured
  if (process.env.MEXC_API_KEY && process.env.MEXC_SECRET) {
    console.log('Syncing MEXC...');
    results.mexc = await syncExchangeTrades('MEXC', since);
  }

  // Sync Kraken if configured
  if (process.env.KRAKEN_API_KEY && process.env.KRAKEN_SECRET) {
    console.log('Syncing Kraken...');
    results.kraken = await syncExchangeTrades('KRAKEN', since);
  }

  return results;
}

/**
 * Create a sync job record
 */
async function createSyncJob(source: ExchangeSource): Promise<string> {
  const job = await prisma.syncJob.create({
    data: {
      jobType: 'EXCHANGE',
      source,
      status: 'PENDING',
    },
  });
  return job.id;
}

/**
 * Update a sync job record
 */
async function updateSyncJob(
  jobId: string,
  data: {
    status?: string;
    startedAt?: Date;
    completedAt?: Date;
    error?: string;
    recordsProcessed?: number;
    recordsAdded?: number;
  }
): Promise<void> {
  await prisma.syncJob.update({
    where: { id: jobId },
    data,
  });
}
