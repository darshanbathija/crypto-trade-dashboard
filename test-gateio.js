const ccxt = require('ccxt');

async function testGateioCredentials() {
  console.log('Testing Gate.io credentials...\n');

  const exchange = new ccxt.gate({
    apiKey: '702a8edc8697dff3b5eb5760d31e413f',
    secret: '1f08e5be70b8fe235134c338d8f53e0f4b2b01b7eb32b48e9e7ff568b56a0370',
    enableRateLimit: true,
  });

  try {
    // Test 1: Fetch balance
    console.log('✓ Attempting to fetch balance...');
    const balance = await exchange.fetchBalance();
    console.log('✓ Balance fetch successful!');
    console.log('  Total currencies:', Object.keys(balance.total).length);

    // Show non-zero balances
    const nonZeroBalances = Object.entries(balance.total)
      .filter(([_, amount]) => amount > 0)
      .map(([currency, amount]) => `${currency}: ${amount}`);

    if (nonZeroBalances.length > 0) {
      console.log('  Non-zero balances:', nonZeroBalances.join(', '));
    } else {
      console.log('  (All balances are zero)');
    }

    // Test 2: Fetch recent trades
    console.log('\n✓ Attempting to fetch recent trades...');
    const trades = await exchange.fetchMyTrades('BTC/USDT', undefined, 5);
    console.log('✓ Trades fetch successful!');
    console.log(`  Found ${trades.length} recent BTC/USDT trades`);

    if (trades.length > 0) {
      const latestTrade = trades[0];
      console.log(`  Latest trade: ${latestTrade.side} ${latestTrade.amount} ${latestTrade.symbol} @ ${latestTrade.price}`);
    }

    console.log('\n✅ All tests passed! Your Gate.io credentials are valid.\n');
    return true;
  } catch (error) {
    console.error('\n❌ Error testing credentials:');
    console.error('  Message:', error.message);
    if (error.message.includes('API key')) {
      console.error('\n  → API key may be invalid or expired');
    } else if (error.message.includes('permission')) {
      console.error('\n  → API key may not have required permissions (need read access to balances and trades)');
    }
    return false;
  }
}

testGateioCredentials();
