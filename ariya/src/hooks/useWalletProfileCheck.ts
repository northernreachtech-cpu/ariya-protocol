import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";

interface ProfileStatus {
  hasGeneralProfile: boolean;
  hasOrganizerProfile: boolean;
  isLoading: boolean;
  needsGeneralProfile: boolean;
  needsOrganizerProfile: boolean;
}

export const useWalletProfileCheck = () => {
  const currentAccount = useCurrentAccount();
  const sdk = useAriyaSDK();
  const profileRegistryId = useNetworkVariable("profileRegistryId");

  const [profileStatus, setProfileStatus] = useState<ProfileStatus>({
    hasGeneralProfile: false,
    hasOrganizerProfile: false,
    isLoading: false,
    needsGeneralProfile: false,
    needsOrganizerProfile: false,
  });

  const [isChecking, setIsChecking] = useState(false);

  const checkProfiles = async () => {
    if (!currentAccount?.address || !profileRegistryId) return;

    console.log("🔄 Starting profile check...");
    console.log("👤 Account:", currentAccount.address);
    console.log("🏛️ Registry:", profileRegistryId);

    setIsChecking(true);
    setProfileStatus((prev) => ({ ...prev, isLoading: true }));

    try {
      // Check both profiles concurrently
      const [hasGeneralProfile, hasOrganizerProfile] = await Promise.all([
        sdk.eventManagement.hasProfile(
          currentAccount.address,
          profileRegistryId
        ),
        sdk.eventManagement.hasOrganizerProfile(currentAccount.address),
      ]);

      console.log("📊 Profile check results:", {
        hasGeneralProfile,
        hasOrganizerProfile,
      });

      const needsGeneralProfile = !hasGeneralProfile;
      const needsOrganizerProfile = hasGeneralProfile && !hasOrganizerProfile;

      console.log("🎯 Profile needs:", {
        needsGeneralProfile,
        needsOrganizerProfile,
      });

      setProfileStatus({
        hasGeneralProfile,
        hasOrganizerProfile,
        isLoading: false,
        needsGeneralProfile,
        needsOrganizerProfile,
      });
    } catch (error) {
      console.error("❌ Error checking profiles:", error);
      setProfileStatus((prev) => ({ ...prev, isLoading: false }));
    } finally {
      setIsChecking(false);
    }
  };

  // Only check profiles when wallet is connected
  useEffect(() => {
    if (currentAccount?.address && profileRegistryId) {
      checkProfiles();
    } else {
      // Reset when wallet disconnects
      setProfileStatus({
        hasGeneralProfile: false,
        hasOrganizerProfile: false,
        isLoading: false,
        needsGeneralProfile: false,
        needsOrganizerProfile: false,
      });
    }
  }, [currentAccount?.address, profileRegistryId]);

  return {
    profileStatus,
    isChecking,
    checkProfiles,
  };
};
