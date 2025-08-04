import { useState, useRef } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import Button from "./Button";
import { uploadToWalrus } from "../utils/walrus";

interface ProfilePictureUploadProps {
  onUploadComplete: (blobId: string, imageUrl: string) => void;
  currentImageUrl?: string;
}

const ProfilePictureUpload = ({
  onUploadComplete,
  currentImageUrl,
}: ProfilePictureUploadProps) => {
  const currentAccount = useCurrentAccount();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageUrl || null
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleWalrusUpload = async (file: File): Promise<string> => {
    if (!currentAccount) {
      throw new Error("No wallet connected");
    }

    const { blobId } = await uploadToWalrus(file, currentAccount.address);
    return blobId;
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
      const blobId = await handleWalrusUpload(file);
      const imageUrl = `https://aggregator.walrus-testnet.walrus.space/v1/blobs/${blobId}`;

      onUploadComplete(blobId, imageUrl);
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
              disabled={uploading}
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
          Images are stored on Walrus (decentralized storage) for 10 epochs. Max
          size: 5MB. Supported formats: JPG, PNG, GIF.
        </p>
      </div>
    </div>
  );
};

export default ProfilePictureUpload;
