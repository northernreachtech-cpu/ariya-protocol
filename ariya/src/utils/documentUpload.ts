import { uploadToWalrus } from './walrus';

// Cloudinary configuration for document uploads
const CLOUDINARY_CONFIG = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
  apiUrl: 'https://api.cloudinary.com/v1_1',
};

// Document file types and size limits
export const DOCUMENT_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ],
  allowedExtensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.gif']
};

export interface DocumentUploadResult {
  documentId?: string;
  documentUrl: string;
  provider: 'walrus' | 'cloudinary';
  fallbackUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface DocumentValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: string;
  fileSize?: number;
}

// Validate document file
export const validateDocument = (file: File): DocumentValidationResult => {
  // Check file size
  if (file.size > DOCUMENT_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: `File size exceeds ${DOCUMENT_CONFIG.maxFileSize / (1024 * 1024)}MB limit`,
      fileSize: file.size
    };
  }

  // Check file type
  if (!DOCUMENT_CONFIG.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not supported. Allowed types: ${DOCUMENT_CONFIG.allowedExtensions.join(', ')}`,
      fileType: file.type
    };
  }

  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!DOCUMENT_CONFIG.allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File extension ${fileExtension} is not supported. Allowed extensions: ${DOCUMENT_CONFIG.allowedExtensions.join(', ')}`,
      fileType: file.type
    };
  }

  return {
    isValid: true,
    fileType: file.type,
    fileSize: file.size
  };
};

// Upload to Cloudinary as fallback
const uploadToCloudinary = async (file: File): Promise<DocumentUploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('resource_type', 'auto'); // Auto-detect resource type

  const response = await fetch(
    `${CLOUDINARY_CONFIG.apiUrl}/${CLOUDINARY_CONFIG.cloudName}/upload`,
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
    documentUrl: result.secure_url,
    provider: 'cloudinary',
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
};

// Main document upload function using Aggregator/Publisher approach
export const uploadDocumentWithFallback = async (
  file: File,
  userAddress: string,
  network: string,
  epochs: number = 30
): Promise<DocumentUploadResult> => {
  console.log("🔄 Starting document upload with Walrus Publisher...");
  console.log("📄 File details:", {
    name: file.name,
    size: file.size,
    type: file.type
  });

  // Validate file first
  const validation = validateDocument(file);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid document file');
  }

  try {
    // Use Walrus Publisher REST API for upload
    console.log("📤 Attempting Walrus Publisher upload...");
    const walrusResult = await uploadToWalrus(file, userAddress, network, epochs);
    
    return {
      documentId: walrusResult.blobId,
      documentUrl: walrusResult.imageUrl,
      provider: 'walrus',
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  } catch (walrusError) {
    console.error("❌ Walrus SDK upload failed:", walrusError);
    throw new Error(
      `Document upload failed: ${walrusError instanceof Error ? walrusError.message : String(walrusError)}`
    );
  }
};

// Upload to specific provider (Publisher API for walrus)
export const uploadDocumentToProvider = async (
  file: File,
  userAddress: string,
  network: string,
  provider: 'walrus' | 'cloudinary' = 'walrus',
  epochs: number = 30
): Promise<DocumentUploadResult> => {
  // Validate file first
  const validation = validateDocument(file);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid document file');
  }

  if (provider === 'walrus') {
    const result = await uploadToWalrus(file, userAddress, network, epochs);
    return {
      documentId: result.blobId,
      documentUrl: result.imageUrl,
      provider: 'walrus',
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    };
  } else {
    return await uploadToCloudinary(file);
  }
};

// Get file type icon
export const getFileTypeIcon = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('text')) return '📃';
  if (mimeType.includes('image')) return '🖼️';
  return '📎';
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file extension from MIME type
export const getFileExtension = (mimeType: string): string => {
  const extensions: { [key: string]: string } = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'text/plain': '.txt',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif'
  };
  return extensions[mimeType] || '';
};

// Generate unique filename
export const generateUniqueFilename = (originalName: string, userAddress: string): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(`.${extension}`, '');
  const shortAddress = userAddress.slice(0, 8) + '...' + userAddress.slice(-6);
  
  return `${baseName}_${shortAddress}_${timestamp}.${extension}`;
};
