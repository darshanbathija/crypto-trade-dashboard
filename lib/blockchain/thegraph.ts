import { request, gql } from 'graphql-request';

// Uniswap V3 Subgraph endpoint for Base
const UNISWAP_V3_BASE_SUBGRAPH =
  'https://api.studio.thegraph.com/query/48211/uniswap-v3-base/version/latest';

export interface UniswapSwap {
  id: string;
  timestamp: string;
  token0: {
    symbol: string;
    decimals: string;
  };
  token1: {
    symbol: string;
    decimals: string;
  };
  amount0: string;
  amount1: string;
  amountUSD: string;
  transaction: {
    id: string;
    gasUsed: string;
    gasPrice: string;
  };
  origin: string;
}

/**
 * Fetch Uniswap V3 swaps for a wallet address
 */
export async function fetchUniswapSwaps(
  walletAddress: string,
  fromTimestamp: number,
  limit: number = 1000
): Promise<UniswapSwap[]> {
  try {
    const SWAPS_QUERY = gql`
      query GetSwaps($walletAddress: String!, $fromTimestamp: Int!, $limit: Int!) {
        swaps(
          where: { origin: $walletAddress, timestamp_gte: $fromTimestamp }
          orderBy: timestamp
          orderDirection: asc
          first: $limit
        ) {
          id
          timestamp
          token0 {
            symbol
            decimals
          }
          token1 {
            symbol
            decimals
          }
          amount0
          amount1
          amountUSD
          transaction {
            id
            gasUsed
            gasPrice
          }
          origin
        }
      }
    `;

    const data = await request(UNISWAP_V3_BASE_SUBGRAPH, SWAPS_QUERY, {
      walletAddress: walletAddress.toLowerCase(),
      fromTimestamp,
      limit,
    });

    return (data as any).swaps || [];
  } catch (error) {
    console.error('Failed to fetch Uniswap swaps from The Graph:', error);
    throw error;
  }
}

/**
 * Fetch swaps for multiple wallets
 */
export async function fetchSwapsForWallets(
  walletAddresses: string[],
  fromTimestamp: number
): Promise<Map<string, UniswapSwap[]>> {
  const swapsByWallet = new Map<string, UniswapSwap[]>();

  for (const address of walletAddresses) {
    try {
      const swaps = await fetchUniswapSwaps(address, fromTimestamp);
      swapsByWallet.set(address, swaps);
      console.log(`Fetched ${swaps.length} Uniswap swaps for ${address}`);
    } catch (error) {
      console.error(`Failed to fetch swaps for ${address}:`, error);
      swapsByWallet.set(address, []);
    }
  }

  return swapsByWallet;
}
