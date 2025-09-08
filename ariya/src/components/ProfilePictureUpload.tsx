import { useState, useRef } from "react";

import Button from "./Button";

// import { useZkLogin } from "../contexts/ZkLoginContext";

interface ProfilePictureUploadProps {
  onUploadComplete: (blobId: string, imageUrl: string) => void;
  currentImageUrl?: string;
}

const ProfilePictureUpload = ({
  onUploadComplete,
  currentImageUrl,
}: ProfilePictureUploadProps) => {

  
  // Safely access zkLogin context
  try {
    // const { zkAddress } = useZkLogin();
    // zkAddress is available if needed
  } catch (error) {
    // ZkLoginProvider not available, continue without zkLogin
  }
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageUrl || null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCloudinaryUpload = async (file: File): Promise<string> => {
    try {
      const { uploadToCloudinary } = await import("../utils/cloudStorage");
      const result = await uploadToCloudinary(file);
      console.log(`✅ Image uploaded via Cloudinary:`, result.imageUrl);
      return result.imageUrl;
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      throw new Error("Failed to upload image to Cloudinary");
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
      const imageUrl = await handleCloudinaryUpload(file);

      onUploadComplete("", imageUrl);
      setSuccess("Image uploaded successfully to Cloudinary!");
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
              disabled={uploading}
              className="flex-1"
            >
              {uploading ? "Uploading..." : "Upload to Cloudinary"}
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        {/* Success Message */}
        {success && <p className="text-green-500 text-sm mt-2">{success}</p>}

        {/* Info */}
        <p className="text-xs text-foreground-secondary mt-2">
          Images are stored on Cloudinary. Max size: 5MB. Supported formats: JPG, PNG, GIF.
        </p>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
