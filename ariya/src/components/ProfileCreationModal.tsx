import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { useState } from "react";
import { suiClient, useNetworkVariable } from "../config/sui";
import { useZkLogin } from "../contexts/ZkLoginContext";
import { useAriyaSDK } from "../lib/sdk";
import Button from "./Button";
import Card from "./Card";
import ProfilePictureUpload from "./ProfilePictureUpload";
import { OrganizerChoiceModal } from "./OrganizerChoiceModal";

interface ProfileCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isOrganizer?: boolean;
}

const ProfileCreationModal = ({
  isOpen,
  onClose,
  onSuccess,
  isOrganizer = false,
}: ProfileCreationModalProps) => {
  const currentAccount = useCurrentAccount();
  const { zkAddress, isZkAuthenticated } = useZkLogin();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const sdk = useAriyaSDK();
  const profileRegistryId = useNetworkVariable("profileRegistryId");

  // Get the active address (either wallet or zkLogin)
  const activeAddress = currentAccount?.address || zkAddress;
  const isAuthenticated = currentAccount || isZkAuthenticated;

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    photoUrl: "",
    telegramUsername: "",
    xUsername: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [showOrganizerChoice, setShowOrganizerChoice] = useState(false);
  const [isCreatingOrganizer, setIsCreatingOrganizer] = useState(false);

  const handleProfilePictureUpload = (_blobId: string, imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    setFormData((prev) => ({ ...prev, photoUrl: imageUrl }));
  };

  const handleTransactionSuccess = async (result: any) => {
    // --- Transaction Effects Debugging ---
    console.log("--- Waiting for transaction to be indexed... ---");
    try {
      // Wait for the transaction to be finalized
      await suiClient.waitForTransaction({
        digest: result.digest,
      });

      const fullTx = await suiClient.getTransactionBlock({
        digest: result.digest,
        options: {
          showObjectChanges: true,
          showEffects: true,
        },
      });

      console.log("--- Inspecting Transaction Effects ---", fullTx);
      console.log("📋 Transaction status:", fullTx.effects?.status);
      console.log("📋 All object changes:", fullTx.objectChanges);
      
      // Check if transaction actually succeeded
      if (fullTx.effects?.status?.status === 'failure') {
        console.error("❌ Transaction failed:", fullTx.effects?.status?.error);
        setError(`Transaction failed: ${fullTx.effects?.status?.error}`);
        setLoading(false);
        return;
      }
      
      if (fullTx.objectChanges) {
        const createdObjects = fullTx.objectChanges.filter(
          (change) => change.type === "created"
        );
        console.log(`Found ${createdObjects.length} created objects.`);
        createdObjects.forEach((change, index) => {
          if (change.type === "created") {
            console.log(`[Object ${index + 1}]`);
            console.log(`  ID: ${change.objectId}`);
            console.log(`  Owner: ${JSON.stringify(change.owner)}`);
            console.log(`  Type: ${change.objectType}`);
          }
        });

        // Look specifically for ProfileCap objects
        const profileCaps = createdObjects.filter((change) =>
          change.objectType?.includes("ProfileCap")
        );
        console.log(
          `Found ${profileCaps.length} ProfileCap objects:`,
          profileCaps
        );
      } else {
        console.log(
          "No 'objectChanges' found in full transaction details."
        );
      }
    } catch (txError) {
      console.error(
        "Failed to fetch full transaction details:",
        txError
      );
    }
    console.log("------------------------------------");
    // --- End Debugging ---

    // Show organizer choice modal after successful profile creation
    setShowOrganizerChoice(true);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAddress || !profileRegistryId || !isAuthenticated) return;

    console.log("🚀 Starting profile creation...");
    console.log("📝 Form data:", formData);
    console.log("👤 Active address:", activeAddress);
    console.log("🔐 Authentication type:", currentAccount ? "Wallet" : "zkLogin");
    console.log("🏛️ Profile registry ID:", profileRegistryId);
    
    // Check if user already has a profile
    try {
      const hasProfile = await sdk.eventManagement.hasProfile(activeAddress, profileRegistryId);
      console.log("🔍 User already has profile:", hasProfile);
    } catch (error) {
      console.log("🔍 Error checking existing profile:", error);
    }

    setLoading(true);
    setError("");

    // Check wallet balance before proceeding
    try {
      const balance = await suiClient.getBalance({
        owner: activeAddress,
        coinType: "0x2::sui::SUI"
      });
      console.log("💰 Wallet balance:", balance.totalBalance);
      
      if (Number(balance.totalBalance) === 0) {
        setError("Insufficient Sui balance. Please add some Sui to your wallet to create a profile.");
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("❌ Error checking balance:", error);
    }

    try {
      // Create the transaction for profile creation
      const tx = sdk.eventManagement.createProfile(
        formData.name,
        formData.bio,
        formData.photoUrl,
        formData.telegramUsername,
        formData.xUsername,
        profileRegistryId,
        activeAddress
      );

      // Set the sender for zkLogin transactions
      if (!currentAccount && isZkAuthenticated) {
        tx.setSender(activeAddress);
      }

      console.log("📦 Transaction created:", tx);
      console.log("🔍 Transaction details:", {
        packageId: sdk.eventManagement.getPackageId(),
        target: `${sdk.eventManagement.getPackageId()}::event_management::create_profile`,
        arguments: [
          formData.name,
          formData.bio,
          formData.photoUrl,
          formData.telegramUsername,
          formData.xUsername,
          profileRegistryId,
          activeAddress,
        ],
      });

      // Handle transaction execution 
      // With Enoki wallet registered, signAndExecute will work for both regular and zkLogin wallets
      if (currentAccount || isZkAuthenticated) {
        signAndExecute(
          { transaction: tx },
          {
            onSuccess: async (result) => {
              console.log("✅ Profile created successfully:", result);
              await handleTransactionSuccess(result);
            },
            onError: (error) => {
              console.error("❌ Error creating profile:", error);
              console.error("❌ Error details:", JSON.stringify(error, null, 2));
              setError("Failed to create profile. Please try again.");
              setLoading(false);
            },
          }
        );
      } else {
        setError("No authentication method available");
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Failed to create profile:", error);
      setError("Failed to create profile. Please try again.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">
            {isOrganizer ? "Complete Your Profile" : "Create Your Profile"}
          </h2>
          <p className="text-foreground-secondary text-sm mb-4">
            {isOrganizer
              ? "As an organizer, you need a general profile to continue."
              : "Create your profile to get started with Ariya."}
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
              <input
                type="text"
                value={formData.telegramUsername}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    telegramUsername: e.target.value,
                  }))
                }
                className="w-full p-3 rounded-lg border border-border bg-card-secondary text-sm"
                placeholder="@username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                X (Twitter) Username
              </label>
              <input
                type="text"
                value={formData.xUsername}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    xUsername: e.target.value,
                  }))
                }
                className="w-full p-3 rounded-lg border border-border bg-card-secondary text-sm"
                placeholder="@username"
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
                disabled={loading || !formData.name.trim()}
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Profile"}
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

      {/* Organizer Choice Modal */}
      <OrganizerChoiceModal
        isOpen={showOrganizerChoice}
        onClose={() => {
          setShowOrganizerChoice(false);
          onSuccess();
          onClose();
        }}
        onBecomeOrganizer={async () => {
          setIsCreatingOrganizer(true);
          try {
            const tx = sdk.eventManagement.createOrganizerProfile(activeAddress);
            
            if (currentAccount) {
              // For regular wallet
              await signAndExecute(
                { transaction: tx },
                {
                  onSuccess: () => {
                    console.log("✅ Organizer profile created successfully");
                    setShowOrganizerChoice(false);
                    onSuccess();
                    onClose();
                  },
                  onError: (error) => {
                    console.error("❌ Error creating organizer profile:", error);
                    setError("Failed to create organizer profile. You can try again later from your dashboard.");
                  },
                }
              );
            } else {
              // For zkLogin
              const txWithSender = tx;
              txWithSender.setSender(activeAddress);
              
              await signAndExecute(
                { transaction: txWithSender },
                {
                  onSuccess: () => {
                    console.log("✅ Organizer profile created successfully");
                    setShowOrganizerChoice(false);
                    onSuccess();
                    onClose();
                  },
                  onError: (error) => {
                    console.error("❌ Error creating organizer profile:", error);
                    setError("Failed to create organizer profile. You can try again later from your dashboard.");
                  },
                }
              );
            }
          } catch (error) {
            console.error("❌ Error creating organizer profile:", error);
            setError("Failed to create organizer profile. You can try again later from your dashboard.");
          } finally {
            setIsCreatingOrganizer(false);
          }
        }}
        isLoading={isCreatingOrganizer}
      />
    </div>
  );
};

export default ProfileCreationModal;
