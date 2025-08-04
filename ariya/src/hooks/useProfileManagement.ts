import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";

export interface ProfileStatus {
  hasGeneralProfile: boolean;
  hasOrganizerProfile: boolean;
  isLoading: boolean;
  needsGeneralProfile: boolean;
  needsOrganizerProfile: boolean;
}

export const useProfileManagement = () => {
  const currentAccount = useCurrentAccount();
  const sdk = useAriyaSDK();
  const profileRegistryId = useNetworkVariable("profileRegistryId");

  const [profileStatus, setProfileStatus] = useState<ProfileStatus>({
    hasGeneralProfile: false,
    hasOrganizerProfile: false,
    isLoading: true,
    needsGeneralProfile: false,
    needsOrganizerProfile: false,
  });

  const checkProfiles = async () => {
    if (!currentAccount || !profileRegistryId) {
      setProfileStatus((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setProfileStatus((prev) => ({ ...prev, isLoading: true }));

      const [hasGeneral, hasOrganizer] = await Promise.all([
        sdk.eventManagement.hasProfile(
          currentAccount.address,
          profileRegistryId
        ),
        sdk.eventManagement.hasOrganizerProfile(currentAccount.address),
      ]);

      setProfileStatus({
        hasGeneralProfile: hasGeneral,
        hasOrganizerProfile: hasOrganizer,
        isLoading: false,
        needsGeneralProfile: !hasGeneral,
        needsOrganizerProfile: hasGeneral && !hasOrganizer,
      });
    } catch (error) {
      console.error("Error checking profiles:", error);
      setProfileStatus((prev) => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    checkProfiles();
  }, [currentAccount, profileRegistryId]);

  return {
    profileStatus,
    checkProfiles,
  };
};
