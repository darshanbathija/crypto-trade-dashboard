#!/usr/bin/env node
/**
 * Test script to verify The Graph integration and show UP trades
 * Run with: node test-the-graph.mjs
 */

import { request, gql } from 'graphql-request';

const UNISWAP_V3_BASE_SUBGRAPH =
  'https://api.studio.thegraph.com/query/48211/uniswap-v3-base/version/latest';

const WALLET_ADDRESS = '0x88fb810224bde530af68aa44c33d10abf79ed323';

const SWAPS_QUERY = gql`
  query GetSwaps($walletAddress: String!, $fromTimestamp: Int!, $limit: Int!) {
    swaps(
      where: { origin: $walletAddress, timestamp_gte: $fromTimestamp }
      orderBy: timestamp
      orderDirection: desc
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

async function main() {
  console.log('🔍 Fetching Uniswap V3 swaps from The Graph...');
  console.log(`📍 Wallet: ${WALLET_ADDRESS}`);
  console.log('');

  try {
    const data = await request(UNISWAP_V3_BASE_SUBGRAPH, SWAPS_QUERY, {
      walletAddress: WALLET_ADDRESS.toLowerCase(),
      fromTimestamp: 0, // Fetch all trades
      limit: 100,
    });

    const swaps = data.swaps || [];
    console.log(`✅ Found ${swaps.length} total swaps`);
    console.log('');

    // Filter for UP token trades
    const upSwaps = swaps.filter(
      (swap) =>
        swap.token0.symbol.toUpperCase().includes('UP') ||
        swap.token1.symbol.toUpperCase().includes('UP')
    );

    console.log(`🎯 Found ${upSwaps.length} swaps involving tokens with "UP" in the name`);
    console.log('');

    // Show first 10 UP trades
    if (upSwaps.length > 0) {
      console.log('📊 Sample UP trades:');
      console.log('─'.repeat(100));

      upSwaps.slice(0, 10).forEach((swap, idx) => {
        const date = new Date(parseInt(swap.timestamp) * 1000).toLocaleString();
        const token0Amt = parseFloat(swap.amount0);
        const token1Amt = parseFloat(swap.amount1);

        // Determine which token is UP
        const isToken0Up = swap.token0.symbol.toUpperCase().includes('UP');
        const upToken = isToken0Up ? swap.token0.symbol : swap.token1.symbol;
        const upAmount = isToken0Up ? Math.abs(token0Amt) : Math.abs(token1Amt);
        const otherToken = isToken0Up ? swap.token1.symbol : swap.token0.symbol;
        const otherAmount = isToken0Up ? Math.abs(token1Amt) : Math.abs(token0Amt);

        // Determine trade direction (BUY or SELL UP)
        const isBuying = (isToken0Up && token0Amt > 0) || (!isToken0Up && token1Amt > 0);
        const side = isBuying ? '🟢 BUY' : '🔴 SELL';

        console.log(`${idx + 1}. ${side} ${upAmount.toFixed(4)} ${upToken} for ${otherAmount.toFixed(4)} ${otherToken}`);
        console.log(`   💵 USD Value: $${parseFloat(swap.amountUSD).toFixed(2)}`);
        console.log(`   🕒 Time: ${date}`);
        console.log(`   📝 TX: ${swap.transaction.id.slice(0, 16)}...`);
        console.log('');
      });
    } else {
      console.log('⚠️  No trades found involving tokens with "UP" in the name');
    }

    // Show all unique tokens traded
    const uniqueTokens = new Set();
    swaps.forEach((swap) => {
      uniqueTokens.add(swap.token0.symbol);
      uniqueTokens.add(swap.token1.symbol);
    });

    console.log('');
    console.log('📋 All tokens traded:');
    console.log(Array.from(uniqueTokens).sort().join(', '));

  } catch (error) {
    console.error('❌ Error fetching swaps:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

main();
