import { NextRequest, NextResponse } from 'next/server';

// Check if we're in production
const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';

// Only import fs modules in development
let writeFile: any, readFile: any, join: any, ENV_FILE: string;

if (!isProduction) {
  const fs = require('fs/promises');
  const path = require('path');
  writeFile = fs.writeFile;
  readFile = fs.readFile;
  join = path.join;
  ENV_FILE = join(process.cwd(), '.env');
}

export async function GET() {
  try {
    // Return current settings (without exposing secrets)
    return NextResponse.json({
      gateio: {
        hasApiKey: !!process.env.GATEIO_API_KEY,
        hasSecret: !!process.env.GATEIO_SECRET,
      },
      mexc: {
        hasApiKey: !!process.env.MEXC_API_KEY,
        hasSecret: !!process.env.MEXC_SECRET,
      },
      kraken: {
        hasApiKey: !!process.env.KRAKEN_API_KEY,
        hasSecret: !!process.env.KRAKEN_SECRET,
      },
      blockchain: {
        hasBasescanKey: !!process.env.BASESCAN_API_KEY,
        walletAddresses: process.env.BASE_WALLET_ADDRESSES?.split(',').filter(Boolean) || [],
      },
      isProduction,
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // In production (Vercel), environment variables are read-only
    // They must be set through the Vercel dashboard
    if (isProduction) {
      return NextResponse.json(
        {
          error: 'Environment variables cannot be modified in production. Please set them in your Vercel dashboard at: https://vercel.com/dashboard → Project → Settings → Environment Variables',
          isProduction: true
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { gateio, mexc, kraken, blockchain } = body;

    // Read current .env file
    let envContent = '';
    try {
      envContent = await readFile(ENV_FILE, 'utf-8');
    } catch {
      // File doesn't exist, start with default content
      envContent = `# Database
DATABASE_URL="file:./dev.db"

# Exchange API Keys
GATEIO_API_KEY=""
GATEIO_SECRET=""
MEXC_API_KEY=""
MEXC_SECRET=""
KRAKEN_API_KEY=""
KRAKEN_SECRET=""

# Blockchain
BASE_RPC_URL="https://mainnet.base.org"
BASESCAN_API_KEY=""
BASE_WALLET_ADDRESSES=""

# Cron Job Security
CRON_SECRET="dev_secret_change_in_production"

# Optional
COINGECKO_API_KEY=""
THEGRAPH_API_KEY=""

# App Config
NEXT_PUBLIC_APP_NAME="Crypto Trade Dashboard"
NODE_ENV="development"
`;
    }

    // Update environment variables
    const updateEnvVar = (content: string, key: string, value: string) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}="${value}"`);
      } else {
        return content + `\n${key}="${value}"`;
      }
    };

    // Update Gate.io keys
    if (gateio?.apiKey !== undefined) {
      envContent = updateEnvVar(envContent, 'GATEIO_API_KEY', gateio.apiKey);
    }
    if (gateio?.secret !== undefined) {
      envContent = updateEnvVar(envContent, 'GATEIO_SECRET', gateio.secret);
    }

    // Update MEXC keys
    if (mexc?.apiKey !== undefined) {
      envContent = updateEnvVar(envContent, 'MEXC_API_KEY', mexc.apiKey);
    }
    if (mexc?.secret !== undefined) {
      envContent = updateEnvVar(envContent, 'MEXC_SECRET', mexc.secret);
    }

    // Update Kraken keys
    if (kraken?.apiKey !== undefined) {
      envContent = updateEnvVar(envContent, 'KRAKEN_API_KEY', kraken.apiKey);
    }
    if (kraken?.secret !== undefined) {
      envContent = updateEnvVar(envContent, 'KRAKEN_SECRET', kraken.secret);
    }

    // Update blockchain settings
    if (blockchain?.basescanKey !== undefined) {
      envContent = updateEnvVar(envContent, 'BASESCAN_API_KEY', blockchain.basescanKey);
    }
    if (blockchain?.walletAddresses !== undefined) {
      const addresses = Array.isArray(blockchain.walletAddresses)
        ? blockchain.walletAddresses.join(',')
        : blockchain.walletAddresses;
      envContent = updateEnvVar(envContent, 'BASE_WALLET_ADDRESSES', addresses);
    }

    // Write updated .env file
    await writeFile(ENV_FILE, envContent);

    // Update process.env immediately (for current session)
    if (gateio?.apiKey !== undefined) process.env.GATEIO_API_KEY = gateio.apiKey;
    if (gateio?.secret !== undefined) process.env.GATEIO_SECRET = gateio.secret;
    if (mexc?.apiKey !== undefined) process.env.MEXC_API_KEY = mexc.apiKey;
    if (mexc?.secret !== undefined) process.env.MEXC_SECRET = mexc.secret;
    if (kraken?.apiKey !== undefined) process.env.KRAKEN_API_KEY = kraken.apiKey;
    if (kraken?.secret !== undefined) process.env.KRAKEN_SECRET = kraken.secret;
    if (blockchain?.basescanKey !== undefined) process.env.BASESCAN_API_KEY = blockchain.basescanKey;
    if (blockchain?.walletAddresses !== undefined) {
      const addresses = Array.isArray(blockchain.walletAddresses)
        ? blockchain.walletAddresses.join(',')
        : blockchain.walletAddresses;
      process.env.BASE_WALLET_ADDRESSES = addresses;
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully. Changes will take full effect after server restart.',
    });
  } catch (error) {
    console.error('Settings POST error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
