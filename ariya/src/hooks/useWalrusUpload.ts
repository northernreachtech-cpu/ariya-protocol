import { useCurrentAccount, useWallets } from '@mysten/dapp-kit';
import { useSuiClientContext } from '@mysten/dapp-kit';
import { useWalrusClient } from '../config/walrus';
import { uploadToWalrus } from '../utils/walrus';
import type { Signer } from '@mysten/sui/cryptography';
import { useMemo } from 'react';

/**
 * Create a signer adapter from wallet for Walrus SDK
 * This adapts the wallet's transaction signing interface to the Signer interface required by Walrus SDK
 */
const createSignerFromWallet = (wallet: any, account: any, network: string): Signer | null => {
  if (!wallet || !account) return null;

  // Convert network to chain identifier format (e.g., 'mainnet' -> 'sui:mainnet')
  const getChainIdentifier = (net: string): string => {
    if (net === 'mainnet') return 'sui:mainnet';
    if (net === 'testnet') return 'sui:testnet';
    if (net === 'devnet') return 'sui:devnet';
    return 'sui:testnet'; // Default fallback
  };

  const chainId = getChainIdentifier(network);

  const signerAdapter = {
    getAddress: async () => account.address,
    toSuiAddress: () => account.address, // Synchronous method required by Walrus SDK
    signTransactionBlock: async (input: any) => {
      if (input && typeof input === 'object') {
        if (input.transaction) {
          return wallet.features['sui:signTransactionBlock'].signTransactionBlock({
            ...input,
            chain: chainId,
          });
        }
        return wallet.features['sui:signTransactionBlock'].signTransactionBlock({
          ...input,
          chain: chainId,
        });
      }
      return wallet.features['sui:signTransactionBlock'].signTransactionBlock(input);
    },
    signAndExecuteTransaction: wallet.features['sui:signAndExecuteTransactionBlock']
      ? async (input: any) => {
          try {
            // Walrus SDK passes { transaction: Transaction, client: SuiClient }
            // Extract the transaction and wrap it for the wallet
            const transaction = input?.transaction || input;
            
            return await wallet.features['sui:signAndExecuteTransactionBlock'].signAndExecuteTransactionBlock({
              transaction: transaction,
              chain: chainId,
            });
          } catch (error) {
            console.error('Error in signAndExecuteTransaction:', error);
            throw error;
          }
        }
      : async (input: any) => {
          // Fallback if signAndExecuteTransactionBlock is not available
          if (input && typeof input === 'object') {
            const signed = await wallet.features['sui:signTransactionBlock'].signTransactionBlock({
              ...input,
              chain: chainId,
            });
            return signed;
          }
          const signed = await wallet.features['sui:signTransactionBlock'].signTransactionBlock(input);
          return signed;
        },
    signPersonalMessage: wallet.features['sui:signPersonalMessage'] 
      ? async (input: any) => wallet.features['sui:signPersonalMessage'].signPersonalMessage(input)
      : undefined,
  };

  return signerAdapter as unknown as Signer;
};

/**
 * Hook to get Walrus upload function
 * Tries REST API first (simpler), falls back to SDK if CORS issues occur
 */
export const useWalrusUpload = () => {
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const walrusClient = useWalrusClient();
  const { network } = useSuiClientContext();

  // Create signer for SDK fallback
  const signer = useMemo(() => {
    if (!currentAccount) return null;
    
    const wallet = wallets.find(w => 
      w.accounts.some(acc => acc.address === currentAccount.address) && 
      w.features['sui:signTransactionBlock']
    );
    
    if (!wallet) return null;

    return createSignerFromWallet(wallet, currentAccount, network);
  }, [currentAccount, wallets, network]);

  const upload = async (
    file: File,
    epochs: number = 10
  ): Promise<{ blobId: string; imageUrl: string }> => {
    if (!currentAccount) {
      throw new Error('Wallet not connected. Please connect your wallet to upload files.');
    }

    // Try REST API first, fall back to SDK if CORS fails
    return uploadToWalrus(
      file, 
      currentAccount.address, 
      network, 
      epochs,
      signer || undefined, // Pass signer for SDK fallback
      walrusClient || undefined // Pass walrusClient for SDK fallback
    );
  };

  return {
    upload,
    isReady: !!currentAccount,
    network,
    currentAccount,
  };
};
