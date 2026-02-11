import { prisma } from '@/lib/db/prisma';
import { fetchSwapsForWallets } from '@/lib/blockchain/thegraph';
import { parseUniswapSwap } from '@/lib/blockchain/dex-parser';

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
 * Sync DEX trades from Base blockchain
 */
export async function syncBlockchainTrades(fromTimestamp?: number): Promise<SyncResult> {
  const jobId = await createSyncJob();

  try {
    // Update job status to RUNNING
    await updateSyncJob(jobId, { status: 'RUNNING', startedAt: new Date() });

    // Get active wallet addresses from database
    const wallets = await prisma.wallet.findMany({
      where: { isActive: true },
    });

    if (wallets.length === 0) {
      console.log('No active wallets found for blockchain sync');
      await updateSyncJob(jobId, {
        status: 'COMPLETED',
        completedAt: new Date(),
        recordsProcessed: 0,
        recordsAdded: 0,
      });
      return { success: true, tradesAdded: 0, tradesSkipped: 0 };
    }

    const walletAddresses = wallets.map((w) => w.address);

    // Determine from timestamp
    if (!fromTimestamp) {
      // Get the most recent sync timestamp from all wallets
      const mostRecentSync = wallets
        .map((w) => w.lastSyncedAt)
        .filter((d): d is Date => d !== null)
        .sort((a, b) => b.getTime() - a.getTime())[0];

      fromTimestamp = mostRecentSync
        ? Math.floor(mostRecentSync.getTime() / 1000)
        : Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000); // Default: 90 days ago
    }

    console.log(
      `Syncing blockchain trades for ${wallets.length} wallets from timestamp ${fromTimestamp}`
    );

    // Fetch swaps from The Graph with timeout
    const swapsByWallet = await withTimeout(
      fetchSwapsForWallets(walletAddresses, fromTimestamp),
      30000
    );

    let tradesAdded = 0;
    let tradesSkipped = 0;
    let totalSwaps = 0;

    // Process swaps for each wallet
    for (const [walletAddress, swaps] of swapsByWallet.entries()) {
      totalSwaps += swaps.length;

      for (const swap of swaps) {
        try {
          const dbTrade = parseUniswapSwap(swap, walletAddress);

          // Upsert trade (insert or skip if exists)
          await prisma.trade.upsert({
            where: {
              source_sourceId: {
                source: 'BASE_CHAIN',
                sourceId: swap.transaction.id,
              },
            },
            update: {},
            create: dbTrade,
          });

          tradesAdded++;
        } catch (error) {
          console.error(`Failed to store swap ${swap.id}:`, error);
          tradesSkipped++;
        }
      }

      // Update wallet last synced timestamp
      await prisma.wallet.update({
        where: { address: walletAddress },
        data: {
          lastSyncedAt: new Date(),
        },
      });
    }

    // Update job status to COMPLETED
    await updateSyncJob(jobId, {
      status: 'COMPLETED',
      completedAt: new Date(),
      recordsProcessed: totalSwaps,
      recordsAdded: tradesAdded,
    });

    console.log(
      `Blockchain sync completed: ${tradesAdded} added, ${tradesSkipped} skipped from ${totalSwaps} total swaps`
    );

    return {
      success: true,
      tradesAdded,
      tradesSkipped,
    };
  } catch (error) {
    console.error('Blockchain sync failed:', error);

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
 * Create a sync job record
 */
async function createSyncJob(): Promise<string> {
  const job = await prisma.syncJob.create({
    data: {
      jobType: 'BLOCKCHAIN',
      source: 'BASE_CHAIN',
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
