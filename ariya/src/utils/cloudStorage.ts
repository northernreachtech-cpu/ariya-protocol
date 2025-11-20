import { uploadToWalrus } from './walrus';

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
  apiUrl: 'https://api.cloudinary.com/v1_1',
};

export interface UploadResult {
  blobId?: string;
  imageUrl: string;
  provider: 'walrus' | 'cloudinary';
  fallbackUrl?: string; // Store alternative URL for fallback
}

// Upload to Cloudinary as fallback
export const uploadToCloudinary = async (file: File): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  const response = await fetch(
    `${CLOUDINARY_CONFIG.apiUrl}/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  
  return {
    imageUrl: result.secure_url,
    provider: 'cloudinary',
  };
};

// Main upload function using Publisher REST API
export const uploadImageWithFallback = async (
  file: File,
  userAddress: string,
  network: string,
  epochs: number = 30
): Promise<UploadResult> => {
  console.log("🔄 Starting image upload with Walrus Publisher...");

  try {
    // Use Walrus Publisher REST API for upload
    console.log("📤 Attempting Walrus Publisher upload...");
    const walrusResult = await uploadToWalrus(file, userAddress, network, epochs);
    
    return {
      blobId: walrusResult.blobId,
      imageUrl: walrusResult.imageUrl,
      provider: 'walrus',
    };
  } catch (walrusError) {
    console.error("❌ Walrus Publisher upload failed:", walrusError);
    throw new Error(
      `Upload failed: ${walrusError instanceof Error ? walrusError.message : String(walrusError)}`
    );
  }
};

// Upload to specific provider (Publisher API for walrus)
export const uploadToSpecificProvider = async (
  file: File,
  userAddress: string,
  network: string,
  provider: 'walrus' | 'cloudinary' = 'walrus',
  epochs: number = 30
): Promise<UploadResult> => {
  if (provider === 'walrus') {
    const result = await uploadToWalrus(file, userAddress, network, epochs);
    return {
      blobId: result.blobId,
      imageUrl: result.imageUrl,
      provider: 'walrus',
    };
  } else {
    return await uploadToCloudinary(file);
  }
};
