import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useNavigate, useLocation } from "react-router-dom";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";
import { useZkLogin } from "../contexts/ZkLoginContext";

interface ProfileStatus {
  hasGeneralProfile: boolean;
  hasOrganizerProfile: boolean;
  isLoading: boolean;
  needsGeneralProfile: boolean;
  needsOrganizerProfile: boolean;
}

export const useUnifiedProfileCheck = () => {
  const currentAccount = useCurrentAccount();
  
  // Safely access zkLogin context with fallback
  let zkAddress: string | null = null;
  let isZkAuthenticated = false;
  
  try {
    const zkLoginContext = useZkLogin();
    zkAddress = zkLoginContext.zkAddress;
    isZkAuthenticated = zkLoginContext.isZkAuthenticated;
  } catch (error) {
    // ZkLoginProvider not available, continue without zkLogin
    console.log("ZkLoginProvider not available, using wallet-only mode");
  }
  
  const navigate = useNavigate();
  const location = useLocation();
  const sdk = useAriyaSDK();
  const profileRegistryId = useNetworkVariable("profileRegistryId");

  // Get the active address (either wallet or zkLogin)
  const activeAddress = currentAccount?.address || zkAddress;
  const isAuthenticated = currentAccount || isZkAuthenticated;

  const [profileStatus, setProfileStatus] = useState<ProfileStatus>({
    hasGeneralProfile: false,
    hasOrganizerProfile: false,
    isLoading: false,
    needsGeneralProfile: false,
    needsOrganizerProfile: false,
  });

  const [isChecking, setIsChecking] = useState(false);

  const checkProfiles = async () => {
    if (!activeAddress || !profileRegistryId) return;

    setIsChecking(true);
    setProfileStatus((prev) => ({ ...prev, isLoading: true }));

    try {
      // Check both profiles concurrently
      const [hasGeneralProfile, hasOrganizerProfile] = await Promise.all([
        sdk.eventManagement.hasProfile(
          activeAddress,
          profileRegistryId
        ),
        sdk.eventManagement.hasOrganizerProfile(activeAddress),
      ]);

      const needsGeneralProfile = !hasGeneralProfile;
      const needsOrganizerProfile = hasGeneralProfile && !hasOrganizerProfile;

      setProfileStatus({
        hasGeneralProfile,
        hasOrganizerProfile,
        isLoading: false,
        needsGeneralProfile,
        needsOrganizerProfile,
      });

      // Auto-redirect users with general profiles to dashboard (except if already on dashboard or creating profile)
      if (hasGeneralProfile && !needsGeneralProfile) {
        const currentPath = location.pathname;
        const isOnDashboard = currentPath.startsWith('/dashboard');
        const isCreatingProfile = currentPath.includes('/profile/');
        const isOnLanding = currentPath === '/';
        
        if (!isOnDashboard && !isCreatingProfile && isOnLanding) {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error checking profiles:", error);
      setProfileStatus((prev) => ({ ...prev, isLoading: false }));
    } finally {
      setIsChecking(false);
    }
  };

  // Check profiles when any authentication method is active
  useEffect(() => {
    if (activeAddress && profileRegistryId && isAuthenticated) {
      checkProfiles();
    } else {
      // Reset when no authentication
      setProfileStatus({
        hasGeneralProfile: false,
        hasOrganizerProfile: false,
        isLoading: false,
        needsGeneralProfile: false,
        needsOrganizerProfile: false,
      });
    }
  }, [activeAddress, profileRegistryId, isAuthenticated]);

  return {
    profileStatus,
    isChecking,
    checkProfiles,
    activeAddress,
    isAuthenticated,
  };
};
