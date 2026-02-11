import { prisma } from '@/lib/db/prisma';
import { createGateioClient } from '@/lib/exchanges/gateio';
import { createMexcClient } from '@/lib/exchanges/mexc';
import { createKrakenClient } from '@/lib/exchanges/kraken';

const TRACKED_ASSETS = ['USDT', 'USDC', 'UP'];

interface InventorySnapshot {
  source: string;
  location: string;
  asset: string;
  balance: number;
  usdValue?: number;
  priceAtSnapshot?: number;
}

/**
 * Fetch current balances from a CEX exchange
 */
async function fetchExchangeBalances(
  exchangeName: string,
  client: any
): Promise<InventorySnapshot[]> {
  try {
    await client.loadMarkets();
    const balance = await client.fetchBalance();

    const snapshots: InventorySnapshot[] = [];

    for (const asset of TRACKED_ASSETS) {
      const total = balance.total[asset] || 0;

      if (total > 0) {
        // Try to get current price in USD
        let priceInUsd: number | undefined;
        try {
          const ticker = await client.fetchTicker(`${asset}/USDT`);
          priceInUsd = ticker.last;
        } catch (e) {
          // If asset/USDT pair doesn't exist, try other pairs
          if (asset === 'USDT' || asset === 'USDC') {
            priceInUsd = 1.0; // Stablecoins are ~$1
          }
        }

        snapshots.push({
          source: exchangeName,
          location: exchangeName,
          asset,
          balance: total,
          priceAtSnapshot: priceInUsd,
          usdValue: priceInUsd ? total * priceInUsd : undefined,
        });
      }
    }

    return snapshots;
  } catch (error) {
    console.error(`Failed to fetch ${exchangeName} balances:`, error);
    return [];
  }
}

/**
 * Fetch token balances from Base blockchain wallets
 */
async function fetchWalletBalances(): Promise<InventorySnapshot[]> {
  const wallets = await prisma.wallet.findMany({
    where: { isActive: true },
  });

  const snapshots: InventorySnapshot[] = [];

  // For now, we'll fetch balances using a simple approach
  // In production, you'd use web3.js or ethers.js to query balances
  // This is a placeholder that shows the structure

  for (const wallet of wallets) {
    // TODO: Implement actual blockchain balance fetching
    // For each tracked asset (USDT, USDC, UP), query the token contract
    // Example with ethers.js:
    // const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    // const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    // const balance = await tokenContract.balanceOf(wallet.address);

    // For now, return empty snapshots
    console.log(`TODO: Fetch balances for wallet ${wallet.address}`);
  }

  return snapshots;
}

/**
 * Sync current inventory across all exchanges and wallets
 */
export async function syncInventory(): Promise<{
  success: boolean;
  snapshots: number;
  error?: string;
}> {
  try {
    const allSnapshots: InventorySnapshot[] = [];
    const snapshotTime = new Date();

    // Fetch from Gate.io
    if (process.env.GATEIO_API_KEY && process.env.GATEIO_SECRET) {
      const gateioClient = createGateioClient();
      const gateioSnapshots = await fetchExchangeBalances('GATEIO', gateioClient);
      allSnapshots.push(...gateioSnapshots);
    }

    // Fetch from MEXC
    if (process.env.MEXC_API_KEY && process.env.MEXC_SECRET) {
      const mexcClient = createMexcClient();
      const mexcSnapshots = await fetchExchangeBalances('MEXC', mexcClient);
      allSnapshots.push(...mexcSnapshots);
    }

    // Fetch from Kraken
    if (process.env.KRAKEN_API_KEY && process.env.KRAKEN_SECRET) {
      const krakenClient = createKrakenClient();
      const krakenSnapshots = await fetchExchangeBalances('KRAKEN', krakenClient);
      allSnapshots.push(...krakenSnapshots);
    }

    // Fetch from Base blockchain wallets
    const walletSnapshots = await fetchWalletBalances();
    allSnapshots.push(...walletSnapshots);

    // Store snapshots in database
    for (const snapshot of allSnapshots) {
      await prisma.inventorySnapshot.create({
        data: {
          source: snapshot.source,
          location: snapshot.location,
          asset: snapshot.asset,
          balance: snapshot.balance,
          usdValue: snapshot.usdValue,
          priceAtSnapshot: snapshot.priceAtSnapshot,
          snapshotAt: snapshotTime,
        },
      });
    }

    return {
      success: true,
      snapshots: allSnapshots.length,
    };
  } catch (error) {
    console.error('Inventory sync failed:', error);
    return {
      success: false,
      snapshots: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get current inventory summary
 */
export async function getCurrentInventory() {
  // Get the most recent snapshot for each asset/location combination
  const latestSnapshots = await prisma.$queryRaw<any[]>`
    SELECT
      source,
      location,
      asset,
      balance,
      usdValue,
      priceAtSnapshot,
      snapshotAt
    FROM InventorySnapshot
    WHERE (source, location, asset, snapshotAt) IN (
      SELECT source, location, asset, MAX(snapshotAt)
      FROM InventorySnapshot
      GROUP BY source, location, asset
    )
    ORDER BY source, asset
  `;

  // Calculate totals by asset
  const totals: Record<string, { balance: number; usdValue: number }> = {};

  for (const snapshot of latestSnapshots) {
    if (!totals[snapshot.asset]) {
      totals[snapshot.asset] = { balance: 0, usdValue: 0 };
    }
    totals[snapshot.asset].balance += snapshot.balance;
    totals[snapshot.asset].usdValue += snapshot.usdValue || 0;
  }

  return {
    byLocation: latestSnapshots,
    totals,
    lastUpdated: latestSnapshots[0]?.snapshotAt || null,
  };
}

/**
 * Get inventory history for charting
 */
export async function getInventoryHistory(
  asset: string,
  startDate: Date,
  endDate: Date
) {
  const snapshots = await prisma.inventorySnapshot.findMany({
    where: {
      asset,
      snapshotAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { snapshotAt: 'asc' },
  });

  // Group by snapshot time and aggregate
  const grouped = snapshots.reduce((acc, snapshot) => {
    const timeKey = snapshot.snapshotAt.toISOString();

    if (!acc[timeKey]) {
      acc[timeKey] = {
        timestamp: snapshot.snapshotAt,
        totalBalance: 0,
        totalUsdValue: 0,
        bySource: {} as Record<string, number>,
      };
    }

    acc[timeKey].totalBalance += snapshot.balance;
    acc[timeKey].totalUsdValue += snapshot.usdValue || 0;
    acc[timeKey].bySource[snapshot.source] = (acc[timeKey].bySource[snapshot.source] || 0) + snapshot.balance;

    return acc;
  }, {} as Record<string, any>);

  return Object.values(grouped);
}
