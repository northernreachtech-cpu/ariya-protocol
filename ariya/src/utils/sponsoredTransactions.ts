import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

// Backend API URL - you'll need to update this with your actual backend URL
const BACKEND_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-vercel-app.vercel.app' 
  : 'http://localhost:3000';

export interface SponsoredTransactionRequest {
  transactionBytes: string;
  jwt: string;
  userAddress: string;
  transactionType: string;
}

export interface SponsoredTransactionResponse {
  success: boolean;
  sponsoredTransactionBytes: string;
  digest: string;
  cost: number;
}

/**
 * Sponsor a transaction via the backend API
 */
export async function sponsorTransaction(
  transactionBytes: string,
  jwt: string,
  userAddress: string,
  transactionType: string
): Promise<SponsoredTransactionResponse> {
  try {
    console.log('Sponsoring transaction:', {
      transactionType,
      userAddress,
      hasJWT: !!jwt,
      transactionBytesLength: transactionBytes.length,
      backendUrl: BACKEND_API_URL
    });

    const response = await fetch(`${BACKEND_API_URL}/api/sponsor-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionBytes,
        jwt,
        userAddress,
        transactionType,
      }),
    });

    console.log('Backend response status:', response.status);
    console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error response:', errorData);
      throw new Error(errorData.message || 'Failed to sponsor transaction');
    }

    const result = await response.json();
    console.log('Sponsored transaction result:', result);
    return result;
  } catch (error) {
    console.error('Error sponsoring transaction:', error);
    console.error('Sponsor transaction error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name
    });
    throw error;
  }
}

/**
 * Build a transaction for sponsorship (with onlyTransactionKind: true)
 */
export function buildSponsoredTransaction(
  transactionBuilder: (txb: Transaction) => void
): Transaction {
  const txb = new Transaction();
  // Note: setOnlyTransactionKind is not available in the new SDK
  // The sponsorship will be handled by the backend
  transactionBuilder(txb);
  return txb;
}

/**
 * Execute a sponsored transaction
 */
export async function executeSponsoredTransaction(
  sponsoredTransactionBytes: string,
  signAndExecute: ReturnType<typeof useSignAndExecuteTransaction>['mutateAsync']
): Promise<any> {
  try {
    const result = await signAndExecute({
      transaction: sponsoredTransactionBytes,
    });
    return result;
  } catch (error) {
    console.error('Error executing sponsored transaction:', error);
    throw error;
  }
}

/**
 * Complete sponsored transaction flow
 */
export async function executeSponsoredTransactionFlow(
  transactionBuilder: (txb: Transaction) => void,
  jwt: string,
  userAddress: string,
  transactionType: string,
  signAndExecute: ReturnType<typeof useSignAndExecuteTransaction>['mutateAsync'],
  suiClient: any
): Promise<any> {
  try {
    // 1. Build transaction for sponsorship
    const txb = buildSponsoredTransaction(transactionBuilder);
    const transactionBytes = await txb.build({ client: suiClient });

    // 2. Sponsor the transaction
    const sponsoredResult = await sponsorTransaction(
      Buffer.from(transactionBytes).toString('base64'),
      jwt,
      userAddress,
      transactionType
    );

    // 3. Execute the sponsored transaction
    const result = await executeSponsoredTransaction(
      sponsoredResult.sponsoredTransactionBytes,
      signAndExecute
    );

    console.log('Sponsored transaction completed:', {
      digest: sponsoredResult.digest,
      cost: sponsoredResult.cost,
      result
    });

    return result;
  } catch (error) {
    console.error('Sponsored transaction flow failed:', error);
    throw error;
  }
}

/**
 * Check if user has sufficient SUI balance for gas
 */
export async function hasSufficientBalance(
  suiClient: any,
  address: string,
  requiredAmount: number = 1000000 // 0.001 SUI in MIST
): Promise<boolean> {
  try {
    const balance = await suiClient.getBalance({
      owner: address,
    });
    return BigInt(balance.totalBalance) >= BigInt(requiredAmount);
  } catch (error) {
    console.error('Error checking balance:', error);
    return false;
  }
}

/**
 * Smart transaction execution - uses sponsorship if user has no SUI
 */
export async function smartExecuteTransaction(
  transactionBuilder: (txb: Transaction) => void,
  jwt: string,
  userAddress: string,
  transactionType: string,
  signAndExecute: ReturnType<typeof useSignAndExecuteTransaction>['mutateAsync'],
  suiClient: any
): Promise<any> {
  try {
    console.log('Smart transaction execution started:', {
      transactionType,
      userAddress,
      hasJWT: !!jwt
    });

    // Check if user has sufficient balance
    const hasBalance = await hasSufficientBalance(suiClient, userAddress);
    console.log('User balance check result:', { hasBalance, userAddress });
    
    if (hasBalance) {
      // User has SUI, execute normally
      console.log('User has sufficient balance, using normal transaction');
      const txb = new Transaction();
      transactionBuilder(txb);
      return await signAndExecute({ transaction: txb });
    } else {
      // User has no SUI, use sponsored transaction
      console.log('User has insufficient balance, using sponsored transaction');
      return await executeSponsoredTransactionFlow(
        transactionBuilder,
        jwt,
        userAddress,
        transactionType,
        signAndExecute,
        suiClient
      );
    }
  } catch (error) {
    console.error('Smart transaction execution failed:', error);
    console.error('Smart execution error details:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      name: (error as Error).name
    });
    throw error;
  }
}
