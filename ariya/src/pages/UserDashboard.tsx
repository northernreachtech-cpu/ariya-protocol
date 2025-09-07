import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User, Calendar, Plus, Crown, Eye, MapPin, Clock, Users, Edit3 } from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";

import type { UserSubscription } from "../lib/sdk";
import Card from "../components/Card";
import Button from "../components/Button";
import ProfilePicture from "../components/ProfilePicture";
import ProfileCreationModal from "../components/ProfileCreationModal";
import ProfileUpdateModal from "../components/ProfileUpdateModal";
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
  const eventRegistryId = useNetworkVariable("eventRegistryId");
  // const airdropRegistryId = useNetworkVariable("airdropRegistryId");
  // const platformTreasuryId = useNetworkVariable("platformTreasuryId");

  // Get the active address (either wallet or zkLogin)
  const activeAddress = currentAccount?.address || zkAddress;
  const isAuthenticated = currentAccount || isZkAuthenticated;

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isCreatingOrganizer, setIsCreatingOrganizer] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showProfileUpdateModal, setShowProfileUpdateModal] = useState(false);
  const [assignedEvents, setAssignedEvents] = useState<any[]>([]);
  const [loadingAssignedEvents, setLoadingAssignedEvents] = useState(false);
  // const [claimingAirdrop, setClaimingAirdrop] = useState<string | null>(null);

  // const handleClaimAirdrop = async (airdropId: string) => {
  //   if (!activeAddress || !airdropRegistryId) {
  //     return;
  //   }

  //   setClaimingAirdrop(airdropId);
  //   try {
  //     const attendanceRegistryId = useNetworkVariable("attendanceRegistryId");
  //     const nftRegistryId = useNetworkVariable("nftRegistryId");
  //     const ratingRegistryId = useNetworkVariable("ratingRegistryId");
      
  //     const tx = sdk.airdropDistribution.claimAirdrop(
  //       airdropId,
  //       airdropRegistryId,
  //       attendanceRegistryId,
  //       nftRegistryId,
  //       ratingRegistryId,
  //       "0x6" // CLOCK_ID
  //     );

  //     await signAndExecute({ transaction: tx });
  //   } catch (error) {
  //     console.error("Error claiming airdrop:", error);
  //   } finally {
  //     setClaimingAirdrop(null);
  //   }
  // };

  const loadAssignedEvents = async () => {
    if (!activeAddress || !eventRegistryId || !profileRegistryId) {
      setAssignedEvents([]);
      return;
    }

    setLoadingAssignedEvents(true);
    try {
      const events = await sdk.eventManagement.getMyAssignedEvents(activeAddress, eventRegistryId);
      
      // Get full event details for each assigned event
      const eventsWithDetails = await Promise.all(
        events.map(async (event) => {
          const fullEvent = await sdk.eventManagement.getEvent(event.id);
          if (fullEvent) {
            return {
              ...fullEvent,
              // Add UI-specific fields
              title: fullEvent.name,
              date: new Date(fullEvent.start_time).toISOString().split("T")[0],
              status: (fullEvent.state === 0
                ? "upcoming"
                : fullEvent.state === 1
                ? "active"
                : "completed") as "upcoming" | "active" | "completed",
            };
          }
          return event;
        })
      );

      setAssignedEvents(eventsWithDetails);
    } catch (error) {
      setAssignedEvents([]);
    } finally {
      setLoadingAssignedEvents(false);
    }
  };

  const loadUserData = async () => {
    if (!activeAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if user is organizer
      const hasOrganizerProfile = await sdk.eventManagement.hasOrganizerProfile(
        activeAddress
      );
      setIsOrganizer(hasOrganizerProfile);

      // Check if user has a profile
      if (profileRegistryId) {
        try {
          const hasUserProfile = await sdk.eventManagement.hasProfile(
            activeAddress,
            profileRegistryId
          );
          setHasProfile(hasUserProfile);
          
          if (hasUserProfile) {
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
          }
        } catch (error) {
          // Error loading user profile
        }
      }

      // Load or create subscription data
      if (subscriptionRegistryId) {
        try {
          const subscriptionId = await sdk.subscription.getUserSubscriptionId(
            subscriptionRegistryId,
            activeAddress
          );
          
          if (subscriptionId) {
            const subscriptionData = await sdk.subscription.getUserSubscription(subscriptionId);
            if (subscriptionData) {
              setSubscription(subscriptionData);
            }
          } else {
            // Create free subscription for user
            try {
              const tx = sdk.subscription.createFreeSubscription(activeAddress, subscriptionRegistryId);
              
              if (currentAccount) {
                // For regular wallet
                await signAndExecute(
                  { transaction: tx },
                  {
                    onSuccess: async () => {
                      // Reload subscription data
                      await loadUserData();
                    },
                    onError: () => {
                      // Error creating free subscription
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
                    onSuccess: async () => {
                      // Reload subscription data
                      await loadUserData();
                    },
                    onError: () => {
                      // Error creating free subscription
                    },
                  }
                );
              }
            } catch (createError) {
              // Error creating free subscription transaction
            }
          }
        } catch (error) {
          // Error loading subscription
        }
      }

      // Load assigned events
      await loadAssignedEvents();
    } catch (error) {
      // Error loading user data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [activeAddress, sdk]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-400/20";
      case "completed":
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-400/20";
      case "upcoming":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-400/20";
      default:
        return "text-foreground-muted bg-card-secondary";
    }
  };

  const handleBecomeOrganizer = async () => {
    if (!activeAddress || !isAuthenticated) return;

    setIsCreatingOrganizer(true);
    try {
      const tx = sdk.eventManagement.createOrganizerProfile(activeAddress);
      
      if (currentAccount) {
        // For regular wallet
        await signAndExecute(
          { transaction: tx },
          {
            onSuccess: async () => {
              // Wait a moment for the transaction to be indexed
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Reload user data to check if organizer profile was created
              await loadUserData();
              setIsCreatingOrganizer(false);
            },
            onError: () => {
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
            onSuccess: async () => {
              // Wait a moment for the transaction to be indexed
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // Reload user data to check if organizer profile was created
              await loadUserData();
              setIsCreatingOrganizer(false); 
            },
            onError: () => {
              setIsCreatingOrganizer(false);
            },
          }
        );
      }
    } catch (error) {
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <User className="h-16 w-16 mx-auto mb-6 text-foreground-muted" />
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Connect Your Wallet
          </h2>
          <p className="text-foreground-secondary mb-6">
            Please connect your wallet or sign in with Google to access your dashboard.
          </p>
          <Button onClick={() => navigate("/")}>
            Go to Home
          </Button>
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProfileUpdateModal(true)}
                    className="flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>

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

        {/* Assigned Events Section */}
        {hasProfile && (
          <Card className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Events Assigned to You
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    Events you've been assigned to manage
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/my-assigned-events")}
                >
                  View All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAssignedEvents}
                  disabled={loadingAssignedEvents}
                >
                  {loadingAssignedEvents ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>
            </div>

            {loadingAssignedEvents ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-foreground-secondary">Loading assigned events...</p>
              </div>
            ) : assignedEvents.length > 0 ? (
              <div className="space-y-4">
                {assignedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-card-secondary rounded-lg border border-border hover:bg-card transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground truncate">
                          {event.name}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ml-2 flex-shrink-0 ${getStatusColor(
                            event.status
                          )}`}
                        >
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-secondary">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(event.start_time).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{event.current_attendees || 0}/{event.capacity} attendees</span>
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-sm text-foreground-muted mt-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-foreground-muted" />
                <h4 className="text-lg font-semibold text-foreground-secondary mb-2">
                  No Assigned Events
                </h4>
                <p className="text-sm text-foreground-muted mb-4">
                  You haven't been assigned to manage any events yet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/events")}
                >
                  Browse Events
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Profile Creation Prompt (if user doesn't have a profile) */}
        {!hasProfile ? (
          <div className="text-center py-12 sm:py-16">
            <div className="mb-6">
              <User className="h-16 w-16 mx-auto text-foreground-muted" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground-secondary">
              Complete Your Profile
            </h3>
            <p className="text-foreground-muted mb-6 max-w-md mx-auto">
              You need to create your profile before you can access the full dashboard features.
            </p>
            <Button onClick={() => setShowProfileModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Profile
            </Button>
          </div>
        ) : (
          /* Organizer Dashboard Content (if user is organizer) */
          isOrganizer ? (
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
            <div className="space-y-8">
              {/* Welcome Section */}
              <div className="text-center py-8">
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

              {/* Airdrop History Section */}
              {/* {airdropRegistryId && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    My Airdrop Rewards
                  </h3>
                  <p className="text-foreground-muted mb-4">
                    View and claim your airdrop rewards from events you've attended.
                  </p>
                  <div className="text-center py-8">
                    <p className="text-foreground-muted">
                      Airdrop history will appear here once you attend events with available rewards.
                    </p>
                  </div>
                </Card>
              )} */}

              {/* Assigned Events Section */}
              {assignedEvents.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    Assigned Events
                  </h3>
                  <div className="space-y-4">
                    {assignedEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div>
                          <h4 className="font-medium text-foreground">{event.name}</h4>
                          <p className="text-sm text-foreground-muted">{event.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )
        )}
      </div>

      {/* Profile Creation Modal */}
      <ProfileCreationModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSuccess={() => {
          setShowProfileModal(false);
          loadUserData(); // Reload user data to check for profile
        }}
      />

      {/* Profile Update Modal */}
      {userProfile && (
        <ProfileUpdateModal
          isOpen={showProfileUpdateModal}
          onClose={() => setShowProfileUpdateModal(false)}
          onSuccess={() => {
            setShowProfileUpdateModal(false);
            loadUserData(); // Reload user data to get updated profile
          }}
          userProfile={userProfile}
        />
      )}
    </div>
  );
};

export default UserDashboard;
