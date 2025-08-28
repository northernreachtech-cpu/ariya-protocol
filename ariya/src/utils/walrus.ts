/**
 * Utility functions for working with Walrus decentralized storage
 */

export const WALRUS_CONFIG = {
  publisherUrl: "https://publisher.walrus-testnet.walrus.space",
  aggregatorUrl: "https://aggregator.walrus-testnet.walrus.space",
  defaultEpochs: 10,
};

/**
 * Upload a file to Walrus storage
 */
export const uploadToWalrus = async (
  file: File,
  userAddress: string,
  epochs: number = WALRUS_CONFIG.defaultEpochs
): Promise<{ blobId: string; imageUrl: string }> => {
  console.log("📤 Starting Walrus upload:", {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    epochs,
    userAddress
  });

  const response = await fetch(
    `${WALRUS_CONFIG.publisherUrl}/v1/blobs?epochs=${epochs}`,
    {
      method: "PUT",
      body: file,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Walrus upload failed:", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
      userAddress
    });
    throw new Error(`Walrus upload failed (${response.status}): ${errorText || response.statusText}`);
  }

  const result = await response.json();
  console.log("Walrus response:", result); // Debug log

  // Handle different response structures based on Walrus API documentation
  let blobId: string;

  // Check for newlyCreated structure (most common)
  if (result.newlyCreated?.blobObject?.blobId) {
    blobId = result.newlyCreated.blobObject.blobId;
  } else if (result.newlyCreated?.blobId) {
    blobId = result.newlyCreated.blobId;
  }
  // Check for alreadyCertified structure
  else if (result.alreadyCertified?.blobId) {
    blobId = result.alreadyCertified.blobId;
  }
  // Check for direct blobId
  else if (result.blobId) {
    blobId = result.blobId;
  }
  // Check for alternative structures
  else if (result.blob?.id) {
    blobId = result.blob.id;
  } else if (result.id) {
    blobId = result.id;
  } else {
    console.error("Unexpected Walrus response structure:", result);
    throw new Error("Invalid response structure from Walrus API");
  }

  // Log successful upload details
  console.log("✅ Walrus upload successful!");
  console.log("📁 Blob ID:", blobId);
  console.log(
    "🔗 View URL:",
    `${WALRUS_CONFIG.aggregatorUrl}/v1/blobs/${blobId}`
  );
  if (result.newlyCreated?.id) {
    console.log("🪙 Sui Object ID:", result.newlyCreated.id);
    console.log(
      "🔍 Sui Explorer:",
      `https://suiscan.xyz/testnet/object/${result.newlyCreated.id}`
    );
  }

  const imageUrl = `${WALRUS_CONFIG.aggregatorUrl}/v1/blobs/${blobId}`;

  return { blobId, imageUrl };
};

/**
 * Get the display URL for a Walrus blob
 */
export const getWalrusImageUrl = (blobId: string): string => {
  return `${WALRUS_CONFIG.aggregatorUrl}/v1/blobs/${blobId}`;
};

/**
 * Check if a URL is a Walrus blob URL
 */
export const isWalrusUrl = (url: string): boolean => {
  return url.includes(WALRUS_CONFIG.aggregatorUrl);
};

/**
 * Extract blob ID from a Walrus URL
 */
export const extractBlobIdFromUrl = (url: string): string | null => {
  if (!isWalrusUrl(url)) return null;

  const match = url.match(/\/v1\/blobs\/([^\/]+)$/);
  return match ? match[1] : null;
};
