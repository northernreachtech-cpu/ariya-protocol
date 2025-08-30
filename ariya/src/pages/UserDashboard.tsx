import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User, Edit, Calendar, Plus, Crown } from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable, suiClient } from "../config/sui";
import type { UserSubscription } from "../lib/sdk";
import Card from "../components/Card";
import Button from "../components/Button";
import ProfilePicture from "../components/ProfilePicture";
import useScrollToTop from "../hooks/useScrollToTop";
import { useZkLogin } from "../contexts/ZkLoginContext";

interface UserProfile {
  id: string;
  name: string;
  bio: string;
  photoUrl: string;
  telegramUsername: string;
  xUsername: string;
}

const UserDashboard = () => {
  useScrollToTop();
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { zkAddress, isZkAuthenticated } = useZkLogin();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const sdk = useAriyaSDK();
  const profileRegistryId = useNetworkVariable("profileRegistryId");
  const subscriptionRegistryId = useNetworkVariable("subscriptionRegistryId");
  // const platformTreasuryId = useNetworkVariable("platformTreasuryId");

  // Get the active address (either wallet or zkLogin)
  const activeAddress = currentAccount?.address || zkAddress;
  const isAuthenticated = currentAccount || isZkAuthenticated;

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isCreatingOrganizer, setIsCreatingOrganizer] = useState(false);

  const loadUserData = async () => {
    if (!activeAddress) return;

    try {
      setLoading(true);

      // Check if user is organizer
      console.log("🔍 Checking organizer profile for address:", activeAddress);
      const hasOrganizerProfile = await sdk.eventManagement.hasOrganizerProfile(
        activeAddress
      );
      console.log("📋 Has organizer profile:", hasOrganizerProfile);
      setIsOrganizer(hasOrganizerProfile);

      // Load user profile
      if (profileRegistryId) {
        try {
          const profile = await sdk.eventManagement.getUserProfileByAddress(
            activeAddress,
            profileRegistryId
          );
          if (profile) {
            setUserProfile({
              id: profile.id,
              name: profile.name,
              bio: profile.bio,
              photoUrl: profile.photo_url,
              telegramUsername: profile.telegram_username,
              xUsername: profile.x_username,
            });
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      }

      // Load or create subscription data
      if (subscriptionRegistryId) {
        try {
          console.log("🔍 Checking subscription for address:", activeAddress);
          const subscriptionId = await sdk.subscription.getUserSubscriptionId(
            subscriptionRegistryId,
            activeAddress
          );
          
          if (subscriptionId) {
            console.log("📋 Found existing subscription ID:", subscriptionId);
            const subscriptionData = await sdk.subscription.getUserSubscription(subscriptionId);
            if (subscriptionData) {
              console.log("✅ Loaded subscription data:", subscriptionData);
              setSubscription(subscriptionData);
            } else {
              console.warn("⚠️ Found subscription ID but failed to load subscription data");
            }
          } else {
            console.log("📋 No subscription found, creating free subscription...");
            // Create free subscription for user
            try {
              const tx = sdk.subscription.createFreeSubscription(activeAddress, subscriptionRegistryId);
              
              if (currentAccount) {
                // For regular wallet
                await signAndExecute(
                  { transaction: tx },
                  {
                    onSuccess: async (result) => {
                      console.log("✅ Free subscription created successfully:", result);
                      // Reload subscription data
                      await loadUserData();
                    },
                    onError: (error) => {
                      console.error("❌ Error creating free subscription:", error);
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
                    onSuccess: async (result) => {
                      console.log("✅ Free subscription created successfully:", result);
                      // Reload subscription data
                      await loadUserData();
                    },
                    onError: (error) => {
                      console.error("❌ Error creating free subscription:", error);
                    },
                  }
                );
              }
            } catch (createError) {
              console.error("❌ Error creating free subscription transaction:", createError);
            }
          }
        } catch (error) {
          console.error("Error loading subscription:", error);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [activeAddress, sdk]);

  const handleBecomeOrganizer = async () => {
    if (!activeAddress || !isAuthenticated) return;

    setIsCreatingOrganizer(true);
    try {
      console.log("🚀 Creating organizer profile transaction...");
      const tx = sdk.eventManagement.createOrganizerProfile(activeAddress);
      console.log("📦 Organizer transaction created:", tx);
      
      if (currentAccount) {
        // For regular wallet
        await signAndExecute(
          { transaction: tx },
          {
            onSuccess: async (result) => {
              console.log("✅ Organizer profile created successfully:", result);
              
              // Debug transaction effects
              try {
                const fullTx = await suiClient.getTransactionBlock({
                  digest: result.digest,
                  options: {
                    showObjectChanges: true,
                  },
                });
                console.log("🔍 Organizer transaction effects:", fullTx);
                if (fullTx.objectChanges) {
                  const createdObjects = fullTx.objectChanges.filter(
                    (change) => change.type === "created"
                  );
                  console.log(`📦 Found ${createdObjects.length} created objects in organizer transaction`);
                  createdObjects.forEach((change, index) => {
                    console.log(`[Object ${index + 1}]`);
                    console.log(`  ID: ${change.objectId}`);
                    console.log(`  Owner: ${JSON.stringify(change.owner)}`);
                    console.log(`  Type: ${change.objectType}`);
                  });
                }
              } catch (txError) {
                console.error("Failed to fetch organizer transaction details:", txError);
              }
              
              // Wait a moment for the transaction to be indexed
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Reload user data to check if organizer profile was created
              await loadUserData();
              setIsCreatingOrganizer(false);
            },
            onError: (error) => {
              console.error("❌ Error creating organizer profile:", error);
              setIsCreatingOrganizer(false);
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
            onSuccess: async (result) => {
              console.log("✅ Organizer profile created successfully:", result);
              
              // Wait a moment for the transaction to be indexed
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Reload user data to check if organizer profile was created
              await loadUserData();
              setIsCreatingOrganizer(false);
            },
            onError: (error) => {
              console.error("❌ Error creating organizer profile:", error);
              setIsCreatingOrganizer(false);
            },
          }
        );
      }
    } catch (error) {
      console.error("❌ Error creating organizer profile:", error);
      setIsCreatingOrganizer(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-foreground-secondary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8 sm:pb-12">
        {/* User Profile Section */}
        <Card className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <ProfilePicture
              src={userProfile?.photoUrl}
              size="xl"
              className="flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                    {userProfile?.name || "User Profile"}
                  </h1>
                  {userProfile?.bio && (
                    <p className="text-foreground-secondary mb-3">
                      {userProfile.bio}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {userProfile?.telegramUsername && (
                      <span className="text-foreground-secondary">
                        📱 {userProfile.telegramUsername}
                      </span>
                    )}
                    {userProfile?.xUsername && (
                      <span className="text-foreground-secondary">
                        🐦 {userProfile.xUsername}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Subscription Status */}
        {subscription ? (
          <Card className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {sdk.subscription.getSubscriptionTypeName(subscription.subscription_type)} Plan
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {subscription.is_active ? 'Active' : 'Inactive'} • Since {new Date(subscription.start_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/subscription")}>
                Manage Subscription
              </Button>
            </div>
          </Card>
        ) : (
          /* Fallback: Show subscription status when not loaded */
          <Card className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Free Plan
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    Setting up your subscription...
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>
                Loading...
              </Button>
            </div>
          </Card>
        )}

        {/* Organizer Dashboard Content (if user is organizer) */}
        {isOrganizer ? (
          <div className="text-center py-12 sm:py-16">
            <div className="mb-6">
              <Calendar className="h-16 w-16 mx-auto text-foreground-muted" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground-secondary">
              Organizer Dashboard
            </h3>
            <p className="text-foreground-muted mb-6 max-w-md mx-auto">
              You're an organizer! Your events and management tools will appear
              here.
            </p>
            <Button onClick={() => navigate("/dashboard/organizer")}>
              <Plus className="mr-2 h-4 w-4" />
              Go to Organizer Dashboard
            </Button>
          </div>
        ) : (
          /* Regular User Content (if not organizer) */
          <div className="text-center py-12 sm:py-16">
            <div className="mb-6">
              <User className="h-16 w-16 mx-auto text-foreground-muted" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground-secondary">
              Welcome to Ariya!
            </h3>
            <p className="text-foreground-muted mb-6 max-w-md mx-auto">
              Your profile is set up. Browse events or become an organizer to
              create your own events.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate("/events")}>Browse Events</Button>
              <Button
                variant="outline"
                onClick={handleBecomeOrganizer}
                disabled={isCreatingOrganizer}
              >
                {isCreatingOrganizer ? "Creating..." : "Become Organizer"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
