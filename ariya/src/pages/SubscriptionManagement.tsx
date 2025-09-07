import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Users,
  CheckCircle,
  AlertCircle,
  Calendar,
  ArrowRight,
  Loader2,
  Star,
  Zap,
} from "lucide-react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useAriyaSDK } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";
import { suiClient } from "../config/sui";
import { useZkLogin } from "../contexts/ZkLoginContext";
import Card from "../components/Card";
import Button from "../components/Button";
import WalletConnectionPrompt from "../components/WalletConnectionPrompt";
import useScrollToTop from "../hooks/useScrollToTop";
import type { UserSubscription, SubscriptionPricing } from "../lib/sdk";
import { SUBSCRIPTION_TYPES } from "../lib/sdk";

const SubscriptionManagement = () => {
  useScrollToTop();
  const currentAccount = useCurrentAccount();
  const { isZkAuthenticated } = useZkLogin();
  const sdk = useAriyaSDK();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // Get the active address (either wallet or zkLogin)
  // ccurrentAccount?.address || zkAddress;
  const isAuthenticated = currentAccount || isZkAuthenticated;
  
  // Network variables
  const subscriptionRegistryId = useNetworkVariable("subscriptionRegistryId");
  const subscriptionConfigId = useNetworkVariable("subscriptionConfigId");
  const platformTreasuryId = useNetworkVariable("platformTreasuryId");
  const profileRegistryId = useNetworkVariable("profileRegistryId");

  // State
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [pricing, setPricing] = useState<SubscriptionPricing | null>(null);
  const [organizerProfileId, setOrganizerProfileId] = useState<string | null>(null);
  const [remainingAttendees, setRemainingAttendees] = useState<number | 'unlimited'>(0);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro' | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Load subscription data
  useEffect(() => {
    if (currentAccount && subscriptionRegistryId) {
      loadSubscriptionData();
    }
  }, [currentAccount, subscriptionRegistryId]);

  const loadSubscriptionData = async () => {
    if (!currentAccount || !subscriptionRegistryId) return;

    try {
      setLoading(true);

      // Load pricing
      const pricingData = await sdk.subscription.getSubscriptionPricing(subscriptionConfigId);
      setPricing(pricingData);

      // Get user subscription ID
      const subscriptionId = await sdk.subscription.getUserSubscriptionId(
        subscriptionRegistryId,
        currentAccount.address
      );

      if (subscriptionId) {
        // Get subscription details
        const subscriptionData = await sdk.subscription.getUserSubscription(subscriptionId);
        setSubscription(subscriptionData);

        // Get organizer profile ID for attendee tracking
        try {
          const profileId = await sdk.eventManagement.getUserProfileId(
            currentAccount.address,
            profileRegistryId
          );
          setOrganizerProfileId(profileId);

          // Get remaining attendees for free tier
          if (subscriptionData?.subscription_type === SUBSCRIPTION_TYPES.FREE && profileId) {
            const remaining = await sdk.subscription.getRemainingAttendees(
              subscriptionId,
              profileId,
              currentAccount.address
            );
            setRemainingAttendees(remaining);
          }
        } catch (error) {
          // No organizer profile found
        }
      } else {
        // No subscription found for user
      }
    } catch (error) {
      // Error loading subscription data
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'basic' | 'pro') => {
    if (!currentAccount || !subscription || !pricing || !organizerProfileId) return;

    setUpgrading(true);
    setSelectedPlan(plan);

    try {
      // Get required amount
      const requiredAmount = plan === 'basic' 
        ? (isYearly ? pricing.basicYearly : pricing.basicMonthly)
        : (isYearly ? pricing.proYearly : pricing.proMonthly);
      
      const amountInMist = Math.floor(requiredAmount * 1e9);

      // Get user's SUI coins
      const { data: coins } = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: "0x2::sui::SUI",
      });

      const coinWithBalance = coins.find(
        (coin: { balance: string }) => parseInt(coin.balance) >= amountInMist
      );

      if (!coinWithBalance) {
        alert("Insufficient Sui balance for subscription upgrade");
        return;
      }

      // Create transaction
      const tx = new Transaction();
      
      // Split coin for payment
      const [paymentCoin] = tx.splitCoins(tx.object(coinWithBalance.coinObjectId), [
        tx.pure.u64(amountInMist)
      ]);

      // Add subscription upgrade call
      if (plan === 'basic') {
        tx.moveCall({
          target: `${sdk.subscription.getPackageId()}::subscription::subscribe_basic`,
          arguments: [
            tx.object(subscription.id),
            tx.pure.bool(isYearly),
            paymentCoin,
            tx.object(subscriptionConfigId),
            tx.object(subscriptionRegistryId),
            tx.object(platformTreasuryId),
            tx.object("0x6"), // Clock ID
          ],
        });
      } else {
        tx.moveCall({
          target: `${sdk.subscription.getPackageId()}::subscription::subscribe_pro`,
          arguments: [
            tx.object(subscription.id),
            tx.pure.bool(isYearly),
            paymentCoin,
            tx.object(subscriptionConfigId),
            tx.object(subscriptionRegistryId),
            tx.object(platformTreasuryId),
            tx.object("0x6"), // Clock ID
          ],
        });
      }

      // Execute transaction
      await signAndExecute({ transaction: tx });

      // Reload subscription data
      await loadSubscriptionData();
      
      alert(`Successfully upgraded to ${plan.toUpperCase()} plan!`);
    } catch (error: any) {
      alert(`Upgrade failed: ${error.message || 'Unknown error'}`);
    } finally {
      setUpgrading(false);
      setSelectedPlan(null);
    }
  };

  const handleCreateFreeSubscription = async () => {
    if (!currentAccount || !subscriptionRegistryId) return;

    setCreatingSubscription(true);
    try {
      // Create free subscription transaction
      const tx = sdk.subscription.createFreeSubscription(
        currentAccount.address,
        subscriptionRegistryId
      );

      // Execute transaction
      await signAndExecute({ transaction: tx });

      // Wait for blockchain indexing and then reload subscription data
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
      // Reload subscription data
      await loadSubscriptionData();
      
      setSuccessMessage("Free subscription created successfully! You now have access to create events with up to 501 total attendees.");
      setShowSuccessModal(true);
    } catch (error: any) {
      setSuccessMessage(`Failed to create subscription: ${error.message || 'Unknown error'}`);
      setShowSuccessModal(true);
    } finally {
      setCreatingSubscription(false);
    }
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return { status: 'No Subscription', color: 'text-gray-500' };
    
    const now = Date.now();
    const isExpired = subscription.end_date > 0 && now > subscription.end_date;
    
    if (!subscription.is_active || isExpired) {
      return { status: 'Inactive', color: 'text-red-500' };
    }
    
    return { status: 'Active', color: 'text-green-500' };
  };

  const getSubscriptionIcon = (type: number) => {
    switch (type) {
      case SUBSCRIPTION_TYPES.FREE:
        return <Users className="h-6 w-6" />;
      case SUBSCRIPTION_TYPES.BASIC:
        return <Star className="h-6 w-6" />;
      case SUBSCRIPTION_TYPES.PRO:
        return <Crown className="h-6 w-6" />;
      default:
        return <Users className="h-6 w-6" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <WalletConnectionPrompt
        title="Connect Your Wallet"
        description="Please connect your wallet or sign in with Google to manage your subscription."
        icon={<Crown className="h-16 w-16 mx-auto mb-6 text-foreground-muted" />}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-livvic font-bold text-foreground mb-4">
            Subscription Management
          </h1>
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
            Manage your subscription plan and view usage statistics
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Subscription */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-foreground">
                    Current Subscription
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSubscriptionData}
                  >
                    <Loader2 className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {subscription ? (
                  <div className="space-y-6">
                    {/* Subscription Info */}
                    <div className="flex items-center justify-between p-4 bg-card-secondary rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          {getSubscriptionIcon(subscription.subscription_type)}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">
                            {sdk.subscription.getSubscriptionTypeName(subscription.subscription_type)} Plan
                          </h3>
                          <p className={`text-sm font-medium ${getSubscriptionStatus().color}`}>
                            {getSubscriptionStatus().status}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-foreground-secondary">Since</p>
                        <p className="font-medium text-foreground">
                          {new Date(subscription.start_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div>
                      <h4 className="text-lg font-semibold text-foreground mb-3">
                        Plan Benefits
                      </h4>
                      <div className="space-y-2">
                        {sdk.subscription.getSubscriptionBenefits(subscription.subscription_type).map((benefit, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-foreground-secondary">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Usage Stats */}
                    {subscription.subscription_type === SUBSCRIPTION_TYPES.FREE && (
                      <div>
                        <h4 className="text-lg font-semibold text-foreground mb-3">
                          Usage Statistics
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-card-secondary rounded-lg">
                            <p className="text-sm text-foreground-secondary">Remaining Attendees</p>
                            <p className="text-2xl font-bold text-foreground">
                              {remainingAttendees === 'unlimited' ? '∞' : remainingAttendees}
                            </p>
                            <p className="text-xs text-foreground-secondary">out of 501 total</p>
                          </div>
                          <div className="p-4 bg-card-secondary rounded-lg">
                            <p className="text-sm text-foreground-secondary">Used Attendees</p>
                            <p className="text-2xl font-bold text-foreground">
                              {remainingAttendees === 'unlimited' ? 0 : 501 - remainingAttendees}
                            </p>
                            <p className="text-xs text-foreground-secondary">total used</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expiration Info */}
                    {subscription.end_date > 0 && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-4 w-4 text-amber-500" />
                          <span className="font-medium text-foreground">Expiration Date</span>
                        </div>
                        <p className="text-foreground-secondary">
                          Your subscription expires on {new Date(subscription.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-foreground-secondary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No Subscription Found
                    </h3>
                    <p className="text-foreground-secondary mb-4">
                      You don't have an active subscription. Create a free subscription to get started.
                    </p>
                    <div className="space-y-3">
                      <Button 
                        onClick={handleCreateFreeSubscription}
                        disabled={creatingSubscription}
                      >
                        {creatingSubscription ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Creating...
                          </>
                        ) : (
                          'Create Free Subscription'
                        )}
                      </Button>
                      <div className="text-sm text-foreground-muted">
                        If you just created a subscription, try refreshing the data
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>

          {/* Upgrade Options */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-6">
                  Upgrade Plans
                </h2>

                {pricing && subscription && subscription.subscription_type < SUBSCRIPTION_TYPES.PRO && (
                  <div className="space-y-4">
                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center space-x-4 mb-6">
                      <span className={`text-sm ${!isYearly ? 'text-foreground' : 'text-foreground-secondary'}`}>
                        Monthly
                      </span>
                      <button
                        onClick={() => setIsYearly(!isYearly)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          isYearly ? 'bg-primary' : 'bg-foreground-secondary'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isYearly ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`text-sm ${isYearly ? 'text-foreground' : 'text-foreground-secondary'}`}>
                        Yearly
                        {isYearly && <span className="ml-1 text-xs text-green-500">(Save 2 months!)</span>}
                      </span>
                    </div>

                    {/* Basic Plan */}
                    {subscription.subscription_type < SUBSCRIPTION_TYPES.BASIC && (
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Star className="h-5 w-5 text-blue-500" />
                            <h3 className="font-semibold text-foreground">Basic Plan</h3>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-foreground">
                              {isYearly ? pricing.basicYearly : pricing.basicMonthly} Sui
                            </p>
                            <p className="text-xs text-foreground-secondary">
                              {isYearly ? 'per year' : 'per month'}
                            </p>
                          </div>
                        </div>
                        <ul className="space-y-1 mb-4">
                          <li className="flex items-center text-sm text-foreground-secondary">
                            <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                            Unlimited attendees
                          </li>
                          <li className="flex items-center text-sm text-foreground-secondary">
                            <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                            Advanced features
                          </li>
                          <li className="flex items-center text-sm text-foreground-secondary">
                            <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                            Priority support
                          </li>
                        </ul>
                        <Button
                          className="w-full"
                          onClick={() => handleUpgrade('basic')}
                          disabled={upgrading && selectedPlan === 'basic'}
                        >
                          {upgrading && selectedPlan === 'basic' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <ArrowRight className="h-4 w-4 mr-2" />
                          )}
                          Upgrade to Basic
                        </Button>
                      </div>
                    )}

                    {/* Pro Plan */}
                    <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Crown className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold text-foreground">Pro Plan</h3>
                          <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full">
                            BEST VALUE
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-foreground">
                            {isYearly ? pricing.proYearly : pricing.proMonthly} Sui
                          </p>
                          <p className="text-xs text-foreground-secondary">
                            {isYearly ? 'per year' : 'per month'}
                          </p>
                        </div>
                      </div>
                      <ul className="space-y-1 mb-4">
                        <li className="flex items-center text-sm text-foreground-secondary">
                          <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                          Unlimited attendees
                        </li>
                        <li className="flex items-center text-sm text-foreground-secondary">
                          <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                          All premium features
                        </li>
                        <li className="flex items-center text-sm text-foreground-secondary">
                          <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                          No platform fees
                        </li>
                        <li className="flex items-center text-sm text-foreground-secondary">
                          <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                          Advanced analytics
                        </li>
                      </ul>
                      <Button
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={() => handleUpgrade('pro')}
                        disabled={upgrading && selectedPlan === 'pro'}
                      >
                        {upgrading && selectedPlan === 'pro' ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Zap className="h-4 w-4 mr-2" />
                        )}
                        Upgrade to Pro
                      </Button>
                    </div>
                  </div>
                )}

                {subscription?.subscription_type === SUBSCRIPTION_TYPES.PRO && (
                  <div className="text-center py-8">
                    <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      You're on Pro Plan!
                    </h3>
                    <p className="text-foreground-secondary">
                      You have access to all premium features. No upgrades needed.
                    </p>
                  </div>
                )}

                {!pricing && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
                    <p className="text-foreground-secondary">Failed to load subscription pricing</p>
                    <p className="text-sm text-foreground-muted mt-2">
                      The subscription configuration may not be deployed on the blockchain yet.
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-4 shadow-lg text-center">
            <div className="mb-4">
              {successMessage.includes("successfully") ? (
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              ) : (
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              )}
            </div>
            <h3 className={`text-xl font-semibold mb-4 ${
              successMessage.includes("successfully") ? "text-green-600" : "text-red-600"
            }`}>
              {successMessage.includes("successfully") ? "Success!" : "Error"}
            </h3>
            <p className="text-foreground mb-6">{successMessage}</p>
            <Button 
              onClick={() => setShowSuccessModal(false)} 
              className="w-full"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
