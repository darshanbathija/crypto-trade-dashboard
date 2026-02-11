import axios from 'axios';

const BASESCAN_API_URL = 'https://api.basescan.org/api';

export interface BasescanTransaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  input: string;
  methodId: string;
  functionName: string;
}

export interface BasescanTokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  contractAddress: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
}

/**
 * Fetch normal transactions for a wallet address
 */
export async function fetchWalletTransactions(
  address: string,
  startBlock?: number
): Promise<BasescanTransaction[]> {
  try {
    const apiKey = process.env.BASESCAN_API_KEY;

    const response = await axios.get(BASESCAN_API_URL, {
      params: {
        module: 'account',
        action: 'txlist',
        address,
        startblock: startBlock || 0,
        endblock: 99999999,
        sort: 'asc',
        apikey: apiKey,
      },
    });

    if (response.data.status === '1') {
      return response.data.result;
    } else {
      console.error('Basescan API error:', response.data.message);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch wallet transactions from Basescan:', error);
    throw error;
  }
}

/**
 * Fetch token transfers (ERC-20) for a wallet address
 */
export async function fetchTokenTransfers(
  address: string,
  startBlock?: number
): Promise<BasescanTokenTransfer[]> {
  try {
    const apiKey = process.env.BASESCAN_API_KEY;

    const response = await axios.get(BASESCAN_API_URL, {
      params: {
        module: 'account',
        action: 'tokentx',
        address,
        startblock: startBlock || 0,
        endblock: 99999999,
        sort: 'asc',
        apikey: apiKey,
      },
    });

    if (response.data.status === '1') {
      return response.data.result;
    } else {
      console.error('Basescan API error:', response.data.message);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch token transfers from Basescan:', error);
    throw error;
  }
}

/**
 * Identify if a transaction is a DEX swap based on method signature
 */
export function isSwapTransaction(tx: BasescanTransaction): boolean {
  const swapMethods = [
    '0x38ed1739', // swapExactTokensForTokens (Uniswap V2)
    '0x8803dbee', // swapTokensForExactTokens (Uniswap V2)
    '0x414bf389', // exactInputSingle (Uniswap V3)
    '0xc04b8d59', // exactInput (Uniswap V3)
    '0xdb3e2198', // exactOutputSingle (Uniswap V3)
    '0xf28c0498', // exactOutput (Uniswap V3)
  ];

  return swapMethods.includes(tx.methodId);
}

/**
 * Get DEX protocol name from method ID
 */
export function getDexProtocol(methodId: string): string | null {
  const v2Methods = ['0x38ed1739', '0x8803dbee'];
  const v3Methods = ['0x414bf389', '0xc04b8d59', '0xdb3e2198', '0xf28c0498'];

  if (v2Methods.includes(methodId)) {
    return 'Uniswap V2';
  } else if (v3Methods.includes(methodId)) {
    return 'Uniswap V3';
  }

  return null;
}
