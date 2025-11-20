/**
 * Utility functions for working with Walrus decentralized storage
 * 
 * This module supports both the recommended SDK approach (with on-chain registration)
 * and a REST API fallback for backward compatibility.
 */

import { WalrusFile, RetryableWalrusClientError } from '@mysten/walrus';
import { useWalrusClient, getWalrusAggregatorUrl, getWalrusPublisherUrl, getWalrusNetwork } from '../config/walrus';
import type { Signer } from '@mysten/sui/cryptography';

// Legacy config for REST API fallback
export const WALRUS_CONFIG = {
  defaultEpochs: 10,
};

/**
 * Upload a file to Walrus storage using the SDK approach (recommended)
 * This method includes on-chain registration and certification
 * Follows the exact pattern from walrus.md documentation
 */
export const uploadToWalrusWithSDK = async (
  file: File,
  signer: Signer,
  walrusClient: ReturnType<typeof useWalrusClient>,
  network: string,
  epochs: number = WALRUS_CONFIG.defaultEpochs
): Promise<{ blobId: string; imageUrl: string }> => {
  console.log("📤 Starting Walrus upload with SDK:", {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    epochs,
  });

  try {
    const fileData = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileData);

    // For single files (especially images), use writeBlob directly
    // Quilts are more efficient for multiple small files, but writeBlob is better for single files
    // According to Walrus SDK docs, writeBlob is recommended for single files
    console.log("Using writeBlob for single file upload...");
    
    const result = await walrusClient.walrus.writeBlob({
      blob: fileBytes,
      deletable: false,
      epochs,
      signer,
    });

    const blobId = result.blobId;

    console.log("✅ File stored successfully. Blob ID:", blobId);

    // Get network for URL construction
    const walrusNetwork = getWalrusNetwork(network);
    const aggregatorUrl = getWalrusAggregatorUrl(walrusNetwork);
    const imageUrl = `${aggregatorUrl}/v1/blobs/${blobId}`;

    return { blobId, imageUrl };
  } catch (error) {
    // Handle retryable errors as recommended by Walrus SDK docs
    if (error instanceof RetryableWalrusClientError) {
      console.warn("⚠️ Retryable Walrus error detected, resetting client and retrying...");
      // Reset the client as recommended by docs
      walrusClient.walrus.reset();
      // Retry once
      try {
        const fileData = await file.arrayBuffer();
        const fileBytes = new Uint8Array(fileData);
        
        const result = await walrusClient.walrus.writeBlob({
          blob: fileBytes,
          deletable: false,
          epochs,
          signer,
        });

        const blobId = result.blobId;
        const walrusNetwork = getWalrusNetwork(network);
        const aggregatorUrl = getWalrusAggregatorUrl(walrusNetwork);
        const imageUrl = `${aggregatorUrl}/v1/blobs/${blobId}`;

        console.log("✅ File stored successfully after retry. Blob ID:", blobId);
        return { blobId, imageUrl };
      } catch (retryError) {
        console.error("❌ Walrus storage failed after retry:", retryError);
        throw retryError;
      }
    }
    
    console.error("❌ Walrus storage failed:", error);
    throw error;
  }
};

/**
 * Upload a file to Walrus storage using Publisher REST API
 * The publisher handles on-chain registration and certification automatically
 * This is the recommended approach for most applications (per Walrus SDK docs)
 * 
 * API Endpoint: PUT {publisherUrl}/v1/blobs?epochs={epochs}
 * Response includes blobId and on-chain object information
 */
export const uploadToWalrusWithREST = async (
  file: File,
  userAddress: string,
  network: string = 'testnet',
  epochs: number = WALRUS_CONFIG.defaultEpochs
): Promise<{ blobId: string; imageUrl: string }> => {
  console.log("📤 Starting Walrus upload with REST API:", {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    epochs,
    userAddress,
  });

  const walrusNetwork = getWalrusNetwork(network);
  const publisherUrl = getWalrusPublisherUrl(walrusNetwork);
  const fullUrl = `${publisherUrl}/v1/blobs?epochs=${epochs}`;
  
  console.log("📡 Uploading to Walrus Publisher:", {
    url: fullUrl,
    network: walrusNetwork,
    fileSize: file.size,
    fileType: file.type,
    publisherUrl,
  });

  let response: Response;
  try {
    // Note: Some browsers may block PUT requests with file bodies due to CORS
    // The publisher endpoint should handle CORS, but if it doesn't, we may need to use a different approach
    response = await fetch(fullUrl, {
      method: "PUT",
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
      // Add mode to handle CORS
      mode: 'cors',
    });
  } catch (fetchError) {
    const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
    console.error("❌ Fetch error details:", {
      error: fetchError,
      message: errorMessage,
      url: fullUrl,
      network: walrusNetwork,
      publisherUrl,
    });
    
    // Provide more helpful error message
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      // Check if it's likely a CORS issue
      const isLikelyCORS = errorMessage === 'Failed to fetch' && typeof window !== 'undefined';
      
      if (isLikelyCORS) {
        throw new Error(
          `CORS Error: The Walrus Publisher endpoint (${publisherUrl}) does not allow direct browser uploads.\n\n` +
          `This is a common security restriction. Solutions:\n` +
          `1. Use a proxy server to handle uploads (recommended for production)\n` +
          `2. Use the Walrus SDK with a properly configured signer\n` +
          `3. Contact Walrus team to enable CORS for your domain\n\n` +
          `Note: The publisher endpoint may require server-side requests or authentication.`
        );
      }
      
      throw new Error(
        `Failed to connect to Walrus Publisher at ${publisherUrl}.\n\n` +
        `Possible causes:\n` +
        `1. CORS restrictions (server doesn't allow browser requests)\n` +
        `2. Network connectivity issues\n` +
        `3. Publisher endpoint may be down\n\n` +
        `Please check your network connection and browser console for detailed errors.`
      );
    }
    
    throw new Error(
      `Failed to upload to Walrus Publisher: ${errorMessage}`
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Walrus REST upload failed:", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      userAddress
    });
    throw new Error(`Walrus upload failed (${response.status}): ${errorText || response.statusText}`);
  }

  const result = await response.json();
  console.log("Walrus REST response:", result);

  // Handle different response structures
  let blobId: string;

  if (result.newlyCreated?.blobObject?.blobId) {
    blobId = result.newlyCreated.blobObject.blobId;
  } else if (result.newlyCreated?.blobId) {
    blobId = result.newlyCreated.blobId;
  } else if (result.alreadyCertified?.blobId) {
    blobId = result.alreadyCertified.blobId;
  } else if (result.blobId) {
    blobId = result.blobId;
  } else if (result.blob?.id) {
    blobId = result.blob.id;
  } else if (result.id) {
    blobId = result.id;
  } else {
    console.error("Unexpected Walrus response structure:", result);
    throw new Error("Invalid response structure from Walrus API");
  }

  const aggregatorUrl = getWalrusAggregatorUrl(walrusNetwork);
  const imageUrl = `${aggregatorUrl}/v1/blobs/${blobId}`;

  console.log("✅ Walrus REST upload successful!");
  console.log("📁 Blob ID:", blobId);
  console.log("🔗 View URL:", imageUrl);

  if (result.newlyCreated?.id) {
    console.log("🪙 Sui Object ID:", result.newlyCreated.id);
    const explorerNetwork = walrusNetwork === 'mainnet' ? 'mainnet' : 'testnet';
    console.log(
      "🔍 Sui Explorer:",
      `https://suiscan.xyz/${explorerNetwork}/object/${result.newlyCreated.id}`
    );
  }

  return { blobId, imageUrl };
};

/**
 * Upload a file to Walrus storage
 * First tries REST API (publisher), falls back to SDK if CORS issues occur
 */
export const uploadToWalrus = async (
  file: File,
  userAddress: string,
  network: string,
  epochs: number = WALRUS_CONFIG.defaultEpochs,
  signer?: Signer,
  walrusClient?: ReturnType<typeof useWalrusClient>
): Promise<{ blobId: string; imageUrl: string }> => {
  // First try REST API (simpler, no signer needed)
  try {
    return await uploadToWalrusWithREST(file, userAddress, network, epochs);
  } catch (restError) {
    // Check if it's a CORS error
    const isCORSError = restError instanceof Error && 
      (restError.message.includes('CORS') || 
       restError.message.includes('Failed to fetch') ||
       restError.message.includes('NetworkError'));
    
    // If REST fails due to CORS and we have signer, try SDK fallback
    if (isCORSError && signer && walrusClient && walrusClient.walrus) {
      console.warn("⚠️ REST API failed due to CORS, falling back to SDK:", restError);
      console.log("🔄 Attempting SDK upload with signer...");
      try {
        return await uploadToWalrusWithSDK(file, signer, walrusClient, network, epochs);
      } catch (sdkError) {
        console.error("❌ SDK fallback also failed:", sdkError);
        // Throw the original REST error with SDK error context
        throw new Error(
          `Both REST API and SDK upload failed.\n` +
          `REST Error: ${restError instanceof Error ? restError.message : String(restError)}\n` +
          `SDK Error: ${sdkError instanceof Error ? sdkError.message : String(sdkError)}`
        );
      }
    }
    // If no signer available or not a CORS error, throw the REST error
    throw restError;
  }
};

/**
 * Retrieve files from Walrus using the SDK
 */
export const getWalrusFiles = async (
  blobIds: string[],
  walrusClient: ReturnType<typeof useWalrusClient>
): Promise<WalrusFile[]> => {
  try {
    const files = await walrusClient.walrus.getFiles({ ids: blobIds });
    return files;
  } catch (error) {
    console.error("Failed to retrieve files from Walrus:", error);
    throw error;
  }
};

/**
 * Get the display URL for a Walrus blob
 */
export const getWalrusImageUrl = (blobId: string, network?: string): string => {
  const walrusNetwork = network ? getWalrusNetwork(network) : 'testnet';
  const aggregatorUrl = getWalrusAggregatorUrl(walrusNetwork);
  return `${aggregatorUrl}/v1/blobs/${blobId}`;
};

/**
 * Check if a URL is a Walrus blob URL
 */
export const isWalrusUrl = (url: string): boolean => {
  return url.includes('walrus.space') || url.includes('walrus-');
};

/**
 * Extract blob ID from a Walrus URL
 */
export const extractBlobIdFromUrl = (url: string): string | null => {
  if (!isWalrusUrl(url)) return null;

  const match = url.match(/\/v1\/blobs\/([^\/]+)$/);
  return match ? match[1] : null;
};
