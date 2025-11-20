import { useState, useRef } from "react";

import Button from "./Button";
import { useWalrusUpload } from "../hooks/useWalrusUpload";

interface ProfilePictureUploadProps {
  onUploadComplete: (blobId: string, imageUrl: string) => void;
  currentImageUrl?: string;
}

const ProfilePictureUpload = ({
  onUploadComplete,
  currentImageUrl,
}: ProfilePictureUploadProps) => {
  const { upload: uploadToWalrus, isReady } = useWalrusUpload();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageUrl || null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleWalrusUpload = async (file: File): Promise<{ blobId: string; imageUrl: string }> => {
    if (!isReady) {
      throw new Error("Wallet not connected. Please connect your wallet to upload images.");
    }
    
    try {
      const result = await uploadToWalrus(file, 10); // 10 epochs for profile pictures
      console.log(`✅ Image uploaded via Walrus:`, result.imageUrl);
      return result;
    } catch (error) {
      console.error("Walrus upload failed:", error);
      throw new Error("Failed to upload image to Walrus");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB for profile pictures)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await handleWalrusUpload(file);

      onUploadComplete(result.blobId, result.imageUrl);
      setSuccess("Image uploaded successfully to Walrus!");
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Profile Picture
        </label>

        {/* Preview */}
        {previewUrl && (
          <div className="mb-4">
            <img
              src={previewUrl}
              alt="Profile preview"
              className="w-24 h-24 rounded-full object-cover border-2 border-border"
            />
          </div>
        )}

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Upload Button */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={triggerFileInput}
            disabled={uploading}
            className="flex-1"
          >
            {previewUrl ? "Change Image" : "Select Image"}
          </Button>

          {previewUrl && (
            <Button
              type="button"
              onClick={handleUpload}
              disabled={uploading || !isReady}
              className="flex-1"
            >
              {uploading ? "Uploading..." : "Upload to Walrus"}
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {/* Success Message */}
        {success && <p className="text-green-500 text-sm mt-2">{success}</p>}

        {/* Info */}
        <p className="text-xs text-foreground-secondary mt-2">
          Images are stored on Walrus (decentralized storage). Max size: 5MB. Supported formats: JPG, PNG, GIF.
          {!isReady && " Please connect your wallet to upload."}
        </p>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
