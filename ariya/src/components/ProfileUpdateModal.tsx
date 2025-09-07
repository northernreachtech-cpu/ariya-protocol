import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useState, useEffect } from "react";
import { useZkLogin } from "../contexts/ZkLoginContext";
import { useAriyaSDK } from "../lib/sdk";
import { parseMoveAbortError } from "../utils/errorMessages";
import { TelegramService } from "../lib/firebase";
import Button from "./Button";
import Card from "./Card";
import ProfilePictureUpload from "./ProfilePictureUpload";
import TelegramLinkModal from "./TelegramLinkModal";

interface UserProfile {
  id: string;
  name: string;
  bio: string;
  photoUrl: string;
  telegramUsername: string;
  xUsername: string;
}

interface ProfileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userProfile: UserProfile;
}

const ProfileUpdateModal = ({
  isOpen,
  onClose,
  onSuccess,
  userProfile,
}: ProfileUpdateModalProps) => {
  const currentAccount = useCurrentAccount();
  const { zkAddress, isZkAuthenticated } = useZkLogin();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const sdk = useAriyaSDK();

  // Get the active address (either wallet or zkLogin)
  const activeAddress = currentAccount?.address || zkAddress;
  const isAuthenticated = currentAccount || isZkAuthenticated;

  const [formData, setFormData] = useState({
    name: userProfile.name,
    bio: userProfile.bio,
    photoUrl: userProfile.photoUrl,
    telegramUsername: userProfile.telegramUsername.replace("@", ""),
    xUsername: userProfile.xUsername.replace("@", ""),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(userProfile.photoUrl);
  const [showTelegramLink, setShowTelegramLink] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [profileCap, setProfileCap] = useState<{
    id: string;
    profile_id: string;
    owner: string;
  } | null>(null);

  // Load ProfileCap when modal opens
  useEffect(() => {
    if (isOpen && activeAddress) {
      loadProfileCap();
    }
  }, [isOpen, activeAddress]);

  const loadProfileCap = async () => {
    if (!activeAddress) return;
    
    try {
      const cap = await sdk.eventManagement.getUserProfileCap(activeAddress);
      setProfileCap(cap);
    } catch (error) {
      setError("Failed to load profile capability. Please try again.");
    }
  };

  const handleProfilePictureUpload = (_blobId: string, imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    setFormData((prev) => ({ ...prev, photoUrl: imageUrl }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAddress || !profileCap || !isAuthenticated) return;


    setLoading(true);
    setError("");

    // Check wallet balance before proceeding
    try {
      const { suiClient } = await import("../config/sui");
      const balance = await suiClient.getBalance({
        owner: activeAddress,
        coinType: "0x2::sui::SUI"
      });
      
      if (Number(balance.totalBalance) === 0) {
        setError("Insufficient Sui balance. Please add some Sui to your wallet to update your profile.");
        setLoading(false);
        return;
      }
    } catch (error) {
      // Error checking balance
    }

    try {
      // Create the transaction for profile update
      const tx = sdk.eventManagement.updateProfile(
        userProfile.id,
        profileCap.id,
        formData.name,
        formData.bio,
        formData.photoUrl,
        formData.telegramUsername ? `@${formData.telegramUsername}` : "",
        formData.xUsername ? `@${formData.xUsername}` : ""
      );

      // Set the sender for zkLogin transactions
      if (!currentAccount && isZkAuthenticated) {
        tx.setSender(activeAddress);
      }


      // Handle transaction execution 
      if (currentAccount || isZkAuthenticated) {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: async (_result) => {
              
              // Send Telegram notification for profile update
              if (activeAddress) {
                try {
                  await TelegramService.sendProfileUpdateNotification(activeAddress);
                } catch (error) {
                  // Failed to send Telegram notification
                }
              }
              
              setLoading(false);
              onSuccess();
              onClose();
            },
            onError: (error) => {
              const userFriendlyError = parseMoveAbortError(error);
              setError(userFriendlyError);
              setLoading(false);
            },
          }
        );
      } else {
        setError("No authentication method available");
        setLoading(false);
      }
    } catch (error) {
      const userFriendlyError = parseMoveAbortError(error);
      setError(userFriendlyError);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">
            Update Your Profile
          </h2>
          <p className="text-foreground-secondary text-sm mb-4">
            Update your profile information to keep it current.
          </p>
          {!currentAccount && isZkAuthenticated && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-600 text-sm">
                ⚠️ zkLogin users need Sui tokens for gas fees. Make sure you have sufficient balance.
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full p-3 rounded-lg border border-border bg-card-secondary text-sm"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, bio: e.target.value }))
                }
                className="w-full p-3 rounded-lg border border-border bg-card-secondary text-sm"
                placeholder="Tell us about yourself"
                rows={2}
              />
            </div>

            <ProfilePictureUpload
              onUploadComplete={handleProfilePictureUpload}
              currentImageUrl={uploadedImageUrl}
            />

            <div>
              <label className="block text-sm font-medium mb-1">
                Telegram Username
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.telegramUsername}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Remove @ if user types it, we'll add it when needed
                    const cleanValue = value.startsWith("@") ? value.substring(1) : value;
                    setFormData((prev) => ({
                      ...prev,
                      telegramUsername: cleanValue,
                    }));
                  }}
                  className="flex-1 p-3 rounded-lg border border-border bg-card-secondary text-sm"
                  placeholder="username (without @)"
                  disabled={telegramLinked}
                />
                {formData.telegramUsername && !telegramLinked && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowTelegramLink(true);
                    }}
                    className="px-4 bg-blue-500 text-white border-blue-500 hover:bg-blue-600 whitespace-nowrap"
                  >
                    Link Telegram Account
                  </Button>
                )}
                {telegramLinked && (
                  <div className="flex items-center px-3 py-2 bg-green-100 text-green-700 text-sm rounded-lg border border-green-200">
                    ✓ Linked: @{formData.telegramUsername}
                  </div>
                )}
              </div>
              {formData.telegramUsername && !telegramLinked && (
                <p className="text-xs text-foreground-secondary mt-1">
                  Click "Link Telegram Account" to verify your account and enable notifications. Make sure you've started a chat with the Ariya bot first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                X (Twitter) Username
              </label>
              <input
                type="text"
                value={formData.xUsername}
                onChange={(e) => {
                  const value = e.target.value;
                  // Remove @ if user types it, we'll add it when needed
                  const cleanValue = value.startsWith("@") ? value.substring(1) : value;
                  setFormData((prev) => ({
                    ...prev,
                    xUsername: cleanValue,
                  }));
                }}
                className="w-full p-3 rounded-lg border border-border bg-card-secondary text-sm"
                placeholder="username (without @)"
              />
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading || !formData.name.trim() || !profileCap}
                className="flex-1"
              >
                {loading ? "Updating..." : "Update Profile"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Telegram Link Modal */}
      <TelegramLinkModal
        isOpen={showTelegramLink}
        onClose={() => setShowTelegramLink(false)}
        userId={activeAddress || ""}
        onSuccess={() => {
          setTelegramLinked(true);
          setShowTelegramLink(false);
        }}
        preFilledUsername={formData.telegramUsername}
      />
    </div>
  );
};

export default ProfileUpdateModal;
