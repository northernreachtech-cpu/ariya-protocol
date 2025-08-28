// Image fetching utility with fallback support
export interface ImageSource {
  url: string;
  provider: 'walrus' | 'cloudinary' | 'unknown';
}

// Detect image provider from URL
export const detectImageProvider = (url: string): 'walrus' | 'cloudinary' | 'unknown' => {
  if (url.includes('walrus.space') || url.includes('walrus-testnet')) {
    return 'walrus';
  } else if (url.includes('cloudinary.com') || url.includes('res.cloudinary.com')) {
    return 'cloudinary';
  }
  return 'unknown';
};

// Check if image exists at URL
export const checkImageExists = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.warn(`Failed to check image at ${url}:`, error);
    return false;
  }
};

// Fetch image with fallback logic
export const fetchImageWithFallback = async (
  primaryUrl: string,
  fallbackUrl?: string
): Promise<string> => {
  const primaryProvider = detectImageProvider(primaryUrl);
  console.log(`🖼️ Fetching image from ${primaryProvider}:`, primaryUrl);

  // Try primary URL first
  const primaryExists = await checkImageExists(primaryUrl);
  if (primaryExists) {
    console.log(`✅ Image found at primary URL (${primaryProvider})`);
    return primaryUrl;
  }

  console.warn(`❌ Image not found at primary URL (${primaryProvider})`);

  // If we have a fallback URL, try it
  if (fallbackUrl) {
    const fallbackProvider = detectImageProvider(fallbackUrl);
    console.log(`🔄 Trying fallback URL (${fallbackProvider}):`, fallbackUrl);
    
    const fallbackExists = await checkImageExists(fallbackUrl);
    if (fallbackExists) {
      console.log(`✅ Image found at fallback URL (${fallbackProvider})`);
      return fallbackUrl;
    }
  }

  // If no fallback or fallback also failed, return primary URL anyway
  // (browser will show broken image, but we don't crash)
  console.warn(`⚠️ No working image URL found, returning primary URL`);
  return primaryUrl;
};

// Smart image URL resolver
export const resolveImageUrl = async (imageUrl: string): Promise<string> => {
  const provider = detectImageProvider(imageUrl);
  
  if (provider === 'walrus') {
    // For Walrus URLs, try to find a Cloudinary equivalent
    // This is a simple heuristic - you might need to adjust based on your storage pattern
    const cloudinaryFallback = imageUrl.replace(
      /https:\/\/aggregator\.walrus-testnet\.walrus\.space\/v1\/blobs\//,
      'https://res.cloudinary.com/kellytrex/image/upload/v1756398115/'
    );
    
    return await fetchImageWithFallback(imageUrl, cloudinaryFallback);
  } else if (provider === 'cloudinary') {
    // For Cloudinary URLs, they should work directly
    return await fetchImageWithFallback(imageUrl);
  } else {
    // For unknown URLs, just return as-is
    return imageUrl;
  }
};

// Batch resolve multiple image URLs
export const resolveImageUrls = async (imageUrls: string[]): Promise<string[]> => {
  const resolvedUrls = await Promise.all(
    imageUrls.map(url => resolveImageUrl(url))
  );
  return resolvedUrls;
};
