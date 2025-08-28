import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, User, Edit, Calendar, Plus, Crown } from "lucide-react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";
import type { UserSubscription } from "../lib/sdk";
import Card from "../components/Card";
import Button from "../components/Button";
import ProfilePicture from "../components/ProfilePicture";
import useScrollToTop from "../hooks/useScrollToTop";

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
  const sdk = useAriyaSDK();
  const profileRegistryId = useNetworkVariable("profileRegistryId");
  const subscriptionRegistryId = useNetworkVariable("subscriptionRegistryId");

  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);

  const loadUserData = async () => {
    if (!currentAccount) return;

    try {
      setLoading(true);

      // Check if user is organizer
      const hasOrganizerProfile = await sdk.eventManagement.hasOrganizerProfile(
        currentAccount.address
      );
      setIsOrganizer(hasOrganizerProfile);

      // Load user profile
      if (profileRegistryId) {
        try {
          const profile = await sdk.eventManagement.getUserProfileByAddress(
            currentAccount.address,
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

      // Load subscription data
      if (subscriptionRegistryId) {
        try {
          const subscriptionId = await sdk.subscription.getUserSubscriptionId(
            subscriptionRegistryId,
            currentAccount.address
          );
          if (subscriptionId) {
            const subscriptionData = await sdk.subscription.getUserSubscription(subscriptionId);
            setSubscription(subscriptionData);
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
  }, [currentAccount, sdk]);

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
        {subscription && (
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
                onClick={() => navigate("/create-organizer-profile")}
              >
                Become Organizer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
