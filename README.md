# Crypto Trade Dashboard

A comprehensive web dashboard to analyze cryptocurrency trades across multiple centralized exchanges (CEX) and decentralized exchanges (DEX).

## Features

✅ **Multi-Exchange Support**
- Gate.io, MEXC, Kraken (via CCXT)
- Base blockchain DEX swaps (Uniswap V2/V3 via The Graph)

✅ **Comprehensive Analytics**
- Real-time P&L tracking (realized & unrealized)
- FIFO position tracking
- Win rate calculation
- Fee analysis (trading fees + gas costs)
- Best/worst trade identification

✅ **Interactive Dashboard**
- Summary statistics cards
- P&L chart (cumulative over time)
- Portfolio allocation pie chart
- Paginated trade history table
- Manual sync button

✅ **Production-Ready**
- TypeScript throughout
- Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- Next.js 14 with App Router
- SWR for data fetching
- Recharts for visualizations

## Tech Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Server Actions
- **Database:** Prisma ORM + SQLite (local) / PostgreSQL (production)
- **Exchange Integration:** CCXT (100+ exchanges)
- **Blockchain:** The Graph (Uniswap subgraph), Basescan API
- **Charts:** Recharts
- **Deployment:** Vercel + Neon PostgreSQL

## Getting Started

### Prerequisites

- Node.js v18+ (use `nvm use 18`)
- npm or yarn
- API keys for Gate.io and MEXC
- Basescan API key (free)
- Base blockchain wallet address(es)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   # Exchange API Keys
   GATEIO_API_KEY="your_gateio_api_key"
   GATEIO_SECRET="your_gateio_secret"
   MEXC_API_KEY="your_mexc_api_key"
   MEXC_SECRET="your_mexc_secret"

   # Blockchain
   BASESCAN_API_KEY="your_basescan_api_key"
   BASE_WALLET_ADDRESSES="0xYourWallet1,0xYourWallet2"

   # Database (SQLite for local dev)
   DATABASE_URL="file:./dev.db"
   ```

3. **Set up the database:**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Add wallet addresses (for Base blockchain tracking):**

   First, make sure Node v18 is active:
   ```bash
   export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm use 18
   ```

   Then run Prisma Studio to add wallet addresses:
   ```bash
   npx prisma studio
   ```

   Navigate to the `Wallet` model and add your Base wallet addresses manually.

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open the dashboard:**
   ```
   http://localhost:3000
   ```

## Usage

### Initial Data Sync

After starting the app, click the **"Sync Trades"** button in the dashboard to fetch your trade history from:
- Gate.io (last 7 days by default)
- MEXC (last 7 days by default)
- Base blockchain (all Uniswap swaps for configured wallets)

The sync process will:
1. Fetch trades from all configured exchanges
2. Fetch DEX swaps from Base blockchain
3. Store trades in the database (with duplicate detection)
4. Calculate positions using FIFO methodology
5. Calculate P&L metrics

### Manual Sync via API

You can also trigger sync via API:

```bash
# Sync all sources (last 7 days)
curl -X POST http://localhost:3000/api/trades/sync \
  -H "Content-Type: application/json" \
  -d '{"fullSync": false}'

# Full sync (90 days for exchanges)
curl -X POST http://localhost:3000/api/trades/sync \
  -H "Content-Type: application/json" \
  -d '{"fullSync": true}'
```

### View Analytics

Once synced, the dashboard displays:
- **Summary Cards:** Net P&L, Win Rate, Total Trades, Total Fees
- **P&L Chart:** Cumulative P&L over the last 30 days
- **Portfolio Allocation:** Pie chart of open positions by asset
- **Trade History:** Paginated table with all trades

### API Endpoints

- `GET /api/trades` - Get paginated trade history
- `GET /api/positions` - Get open/closed positions
- `GET /api/pnl` - Get P&L statistics
- `POST /api/trades/sync` - Trigger manual sync
- `POST /api/exchanges/sync` - Sync specific exchange
- `POST /api/blockchain/sync` - Sync blockchain trades

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── trades/         # Trade API routes
│   │   ├── positions/      # Position API routes
│   │   ├── pnl/            # P&L API route
│   │   ├── exchanges/sync/ # Exchange sync API
│   │   └── blockchain/sync/# Blockchain sync API
│   ├── dashboard/          # Dashboard page
│   └── layout.tsx
├── components/
│   ├── charts/             # Recharts components
│   └── dashboard/          # Dashboard components
├── hooks/                  # React hooks (SWR)
├── lib/
│   ├── db/                 # Prisma client
│   ├── exchanges/          # CCXT integration
│   ├── blockchain/         # The Graph + Basescan
│   ├── sync/               # Sync orchestrators
│   ├── calculations/       # P&L & position tracking
│   └── utils/              # Formatting utilities
├── prisma/
│   └── schema.prisma       # Database schema
└── types/                  # TypeScript types
```

## Database Schema

- **Trade:** Unified model for CEX and DEX trades
- **Position:** FIFO position tracking with P&L
- **PositionTrade:** Many-to-many relationship between trades and positions
- **Wallet:** Base blockchain wallet addresses
- **Asset:** Asset metadata and current prices
- **PriceHistory:** Historical price data
- **SyncJob:** Sync operation tracking

## Deployment

### Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/crypto-trade-dashboard.git
   git push -u origin main
   ```

2. **Create Neon PostgreSQL database:**
   ```bash
   npm install -g neonctl
   neonctl projects create --name crypto-trades
   neonctl connection-string
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

4. **Add environment variables in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env.example`
   - Set `DATABASE_URL` to your Neon PostgreSQL connection string

5. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```

## Customization

### Tracked Trading Pairs

Edit the default trading pairs in:
- `lib/exchanges/gateio.ts` - Gate.io symbols
- `lib/exchanges/mexc.ts` - MEXC symbols
- `lib/exchanges/kraken.ts` - Kraken symbols

### Add More Exchanges

Thanks to CCXT, you can easily add any of 100+ supported exchanges:
1. Create a new file in `lib/exchanges/your-exchange.ts`
2. Follow the pattern from `gateio.ts` or `mexc.ts`
3. Update `lib/sync/exchange-sync.ts` to include your exchange

## Troubleshooting

### "No trades found"
- Ensure API keys are correctly configured in `.env`
- Check that API keys have read permissions for trade history
- Click "Sync Trades" to fetch data

### "No open positions"
- You need at least one trade to create a position
- Sync your trades first

### Database errors
- Run `npx prisma migrate dev` to ensure schema is up to date
- Check that `DATABASE_URL` is correctly set in `.env`

### Node version issues
- Ensure you're using Node v18+: `nvm use 18`

## Future Enhancements

- [ ] Kraken integration
- [ ] Additional blockchains (Ethereum, Arbitrum, Polygon)
- [ ] Tax reporting (CSV export with cost basis)
- [ ] Email/SMS alerts for price targets
- [ ] Portfolio rebalancing suggestions
- [ ] Advanced filtering (by date range, P&L threshold, asset type)
- [ ] Mobile-responsive optimizations
- [ ] Dark mode improvements

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
