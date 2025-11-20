import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { walrus } from '@mysten/walrus';
import { useSuiClientContext } from '@mysten/dapp-kit';
import { useMemo } from 'react';

// Import WASM URL for Vite - this ensures proper WASM loading in browser environments
// According to Walrus SDK docs: https://sdk.mystenlabs.com/walrus
// In vite you can get the url for the wasm bindings by importing the wasm file with a ?url suffix
import walrusWasmUrl from '@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url';

// SuiJsonRpcClient may not be available in all @mysten/sui versions
// We'll use SuiClient with network property as a compatible alternative
// This matches the behavior needed by the walrus SDK

/**
 * Get Walrus network configuration based on Sui network
 */
export const getWalrusNetwork = (network: string): 'mainnet' | 'testnet' | 'devnet' => {
  // Map Sui network to Walrus network
  if (network === 'mainnet') return 'mainnet';
  if (network === 'testnet') return 'testnet';
  if (network === 'devnet') return 'devnet';
  // Default to testnet if unknown
  return 'testnet';
};

/**
 * Create a Walrus-extended Sui client for a specific network
 * Following the pattern from walrus.md documentation
 * 
 * Note: Walrus only supports 'mainnet' and 'testnet', not 'devnet'
 */
export const createWalrusClient = (network: 'mainnet' | 'testnet' | 'devnet' = 'testnet') => {
  try {
    // Walrus only supports mainnet and testnet
    // Map devnet to testnet for Walrus
    const walrusNetwork = network === 'devnet' ? 'testnet' : network;
    
    if (walrusNetwork !== 'mainnet' && walrusNetwork !== 'testnet') {
      throw new Error(`Walrus only supports 'mainnet' and 'testnet', got: ${network}`);
    }

    console.log('Creating Walrus client for network:', { network, walrusNetwork });

    // 1. Initialize the base Sui client with network property (required by Walrus)
    // Note: @mysten/sui/jsonRpc export may not be available in v1.36.0
    // Using SuiClient with network property as compatible alternative
    // This provides the same functionality needed by walrus SDK
    const client = new SuiClient({
      url: getFullnodeUrl(network),
    });
    
    // Add network property to client (required by Walrus SDK)
    // The walrus extension checks for this property during initialization
    (client as any).network = walrusNetwork;
    
    // 2. Extend the client with the Walrus SDK
    // Pass wasmUrl for proper WASM loading in Vite/browser environments
    // Configure storageNodeClientOptions for better error handling and debugging
    return (client as any).$extend(walrus({
      wasmUrl: walrusWasmUrl,
      storageNodeClientOptions: {
        // Custom timeout for storage node requests (60 seconds)
        timeout: 60_000,
        // Error callback for debugging network issues
        onError: (error) => {
          console.warn('Walrus storage node error:', error);
        },
      },
    }));
  } catch (error) {
    console.error('Failed to create Walrus client with SDK:', error);
    console.warn('Will use REST API fallback');
    // Return a mock client that will trigger REST API fallback
    return null as any;
  }
};

/**
 * React hook to get the Walrus client for the current network
 */
export const useWalrusClient = () => {
  const { network } = useSuiClientContext();
  
  return useMemo(() => {
    console.log('useWalrusClient - Raw network from context:', network, typeof network);
    const walrusNetwork = getWalrusNetwork(network);
    console.log('useWalrusClient - Mapped Walrus network:', walrusNetwork);
    return createWalrusClient(walrusNetwork);
  }, [network]);
};

/**
 * Get Walrus aggregator URL based on network
 */
export const getWalrusAggregatorUrl = (network: 'mainnet' | 'testnet' | 'devnet'): string => {
  switch (network) {
    case 'mainnet':
      return 'https://aggregator.walrus-mainnet.walrus.space';
    case 'testnet':
      return 'https://aggregator.walrus-testnet.walrus.space';
    case 'devnet':
      return 'https://aggregator.walrus-devnet.walrus.space';
    default:
      return 'https://aggregator.walrus-testnet.walrus.space';
  }
};

/**
 * Get Walrus publisher URL based on network
 */
export const getWalrusPublisherUrl = (network: 'mainnet' | 'testnet' | 'devnet'): string => {
  switch (network) {
    case 'mainnet':
      return 'https://publisher.walrus-mainnet.walrus.space';
    case 'testnet':
      return 'https://publisher.walrus-testnet.walrus.space';
    case 'devnet':
      return 'https://publisher.walrus-devnet.walrus.space';
    default:
      return 'https://publisher.walrus-testnet.walrus.space';
  }
};

