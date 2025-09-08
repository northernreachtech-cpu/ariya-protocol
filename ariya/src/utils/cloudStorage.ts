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

// Main upload function with fallback
export const uploadImageWithFallback = async (
  file: File,
  userAddress: string,
  epochs: number = 30
): Promise<UploadResult> => {
  console.log("🔄 Starting image upload with fallback...");

  try {
    // Try Walrus first
    console.log("📤 Attempting Walrus upload...");
    const walrusResult = await uploadToWalrus(file, userAddress, epochs);
    
    return {
      blobId: walrusResult.blobId,
      imageUrl: walrusResult.imageUrl,
      provider: 'walrus',
    };
  } catch (walrusError) {
    console.warn("⚠️ Walrus upload failed, trying Cloudinary fallback:", walrusError);
    
    try {
      // Fallback to Cloudinary
      console.log("☁️ Attempting Cloudinary upload...");
      const cloudinaryResult = await uploadToCloudinary(file);
      
      console.log("✅ Cloudinary upload successful");
      return cloudinaryResult;
    } catch (cloudinaryError) {
      console.error("❌ Both Walrus and Cloudinary uploads failed:", {
        walrusError,
        cloudinaryError,
      });
      
      throw new Error(
        `Upload failed on all providers. Walrus: ${walrusError instanceof Error ? walrusError.message : String(walrusError)}, Cloudinary: ${cloudinaryError instanceof Error ? cloudinaryError.message : String(cloudinaryError)}`
      );
    }
  }
};

// Upload to specific provider
export const uploadToSpecificProvider = async (
  file: File,
  userAddress: string,
  provider: 'walrus' | 'cloudinary' = 'walrus',
  epochs: number = 30
): Promise<UploadResult> => {
  if (provider === 'walrus') {
    const result = await uploadToWalrus(file, userAddress, epochs);
    return {
      blobId: result.blobId,
      imageUrl: result.imageUrl,
      provider: 'walrus',
    };
  } else {
    return await uploadToCloudinary(file);
  }
};
