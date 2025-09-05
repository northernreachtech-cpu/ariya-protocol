import { useState, useEffect } from "react";

import {
  Gift,

  CheckCircle,
 
  Plus,
} from "lucide-react";
import Button from "./Button";
import Card from "./Card";
import AirdropCreationModal from "./AirdropCreationModal";
import {
  useAriyaSDK,
  type AirdropDetails,
  type AirdropConfig,
} from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";
import { useCurrentAccount } from "@mysten/dapp-kit";

interface AirdropManagerProps {
  eventId: string;
  eventName: string;
  isOrganizer?: boolean;
}

interface AirdropWithStatus extends AirdropDetails {
  eligible: boolean;
  claimed: boolean;
  claimAmount: number;
}

const AirdropManager = ({
  eventId,
  eventName,
  isOrganizer = false,
}: AirdropManagerProps) => {
  const [airdrops, setAirdrops] = useState<AirdropWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingAirdrop, setCreatingAirdrop] = useState(false);

  const currentAccount = useCurrentAccount();
  const sdk = useAriyaSDK();
  const airdropRegistryId = useNetworkVariable('airdropRegistryId');
  const attendanceRegistryId = useNetworkVariable('attendanceRegistryId');
  const nftRegistryId = useNetworkVariable('nftRegistryId');
  const ratingRegistryId = useNetworkVariable('ratingRegistryId');
  const profileRegistryId = useNetworkVariable('profileRegistryId');

  const loadAirdrops = async () => {
    if (!airdropRegistryId || !eventId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all airdrops for this event
      const airdropIds = await sdk.airdropDistribution.getEventAirdropsData(eventId, airdropRegistryId);
      
      if (airdropIds.length === 0) {
        setAirdrops([]);
        setLoading(false);
        return;
      }

      // Get details for each airdrop
      const airdropDetails = await Promise.all(
        airdropIds.map(async (airdropId) => {
          const details = await sdk.airdropDistribution.getAirdropDetailsData(airdropId, airdropRegistryId);
          return details;
        })
      );

      // Filter out null results and add status information
      const airdropsWithStatus = await Promise.all(
        airdropDetails
          .filter((details): details is AirdropDetails => details !== null)
          .map(async (details) => {
            let eligible = false;
            let claimed = false;
            let claimAmount = 0;

            if (currentAccount?.address && attendanceRegistryId && nftRegistryId && ratingRegistryId) {
              // Check eligibility
              eligible = await sdk.airdropDistribution.isUserEligibleData(
                currentAccount.address,
                details.id,
                airdropRegistryId,
                attendanceRegistryId,
                nftRegistryId,
                ratingRegistryId
              );

              // Check claim status
              const claimStatus = await sdk.airdropDistribution.getClaimStatusData(
                currentAccount.address,
                details.id,
                airdropRegistryId
              );
              claimed = claimStatus.claimed;
              claimAmount = claimStatus.amount;
            }

            return {
              ...details,
              eligible,
              claimed,
              claimAmount,
            };
          })
      );

      setAirdrops(airdropsWithStatus);
    } catch (error) {
      console.error('Error loading airdrops:', error);
      setError('Failed to load airdrops');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAirdrops();
  }, [eventId, currentAccount?.address, airdropRegistryId, attendanceRegistryId, nftRegistryId, ratingRegistryId]);

  const handleCreateAirdrop = async (config: AirdropConfig, amount: number) => {
    if (!currentAccount || !airdropRegistryId || !attendanceRegistryId || !profileRegistryId) {
      return;
    }

    setCreatingAirdrop(true);
    try {
      // Convert amount to SUI units (1 SUI = 1,000,000,000 MIST)
      const amountInMist = Math.floor(amount * 1000000000);

      // Get SUI coin from user's wallet
      const { suiClient } = await import("../config/sui");
      const coinsResponse = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: "0x2::sui::SUI",
      });

      // Find a coin with sufficient balance
      const coinWithBalance = coinsResponse.data?.find(
        (coin: { balance: string }) => parseInt(coin.balance) >= amountInMist
      );

      if (!coinWithBalance) {
        throw new Error("Insufficient Sui balance for airdrop");
      }

      const tx = sdk.airdropDistribution.createAirdrop(
        eventId,
        config,
        coinWithBalance.coinObjectId,
        airdropRegistryId,
        attendanceRegistryId,
        profileRegistryId,
        "0x6" // CLOCK_ID
      );

      // Execute transaction
      const { useSignAndExecuteTransaction } = await import("@mysten/dapp-kit");
      const { mutate: signAndExecute } = useSignAndExecuteTransaction();
      
      await signAndExecute({ transaction: tx });

      setShowCreateModal(false);
      await loadAirdrops(); // Refresh the list
    } catch (error) {
      console.error('Error creating airdrop:', error);
      throw error;
    } finally {
      setCreatingAirdrop(false);
    }
  };

  const handleClaimAirdrop = async (airdropId: string) => {
    if (!currentAccount || !airdropRegistryId || !attendanceRegistryId || !nftRegistryId || !ratingRegistryId) {
      return;
    }

    try {
      const tx = sdk.airdropDistribution.claimAirdrop(
        airdropId,
        airdropRegistryId,
        attendanceRegistryId,
        nftRegistryId,
        ratingRegistryId,
        "0x6" // CLOCK_ID
      );

      // Execute transaction
      const { useSignAndExecuteTransaction } = await import("@mysten/dapp-kit");
      const { mutate: signAndExecute } = useSignAndExecuteTransaction();
      
      await signAndExecute({ transaction: tx });
      await loadAirdrops(); // Refresh the list
    } catch (error) {
      console.error('Error claiming airdrop:', error);
      throw error;
    }
  };

  const formatAmount = (amount: number) => {
    return `${(amount / 1000000000).toFixed(3)} SUI`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTimeRemaining = (expiresAt: number) => {
    const now = Date.now();
    const remaining = expiresAt - now;

    if (remaining <= 0) {
      return "Expired";
    }

    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    }

    return `${hours}h remaining`;
  };

  const getStatusText = (airdrop: AirdropWithStatus) => {
    const hasExpired = Date.now() > airdrop.expiresAt;

    if (airdrop.claimed) {
      return "Claimed";
    }

    if (hasExpired) {
      return "Expired";
    }

    return "Active";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Event Airdrops
            </h3>
          </div>
        </div>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Event Airdrops
            </h3>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-foreground-muted">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={loadAirdrops}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Event Airdrops ({airdrops.length})
          </h3>
        </div>
        {isOrganizer && (
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Airdrop
          </Button>
        )}
      </div>

      {airdrops.length === 0 ? (
        <div className="text-center py-8">
          <Gift className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
          <p className="text-foreground-muted mb-4">No airdrops available for this event.</p>
          {isOrganizer && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create First Airdrop
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {airdrops.map((airdrop) => {
            const hasExpired = Date.now() > airdrop.expiresAt;
            const isActive = airdrop.active && !hasExpired;
            const statusText = getStatusText(airdrop);
            
            return (
              <Card key={airdrop.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-foreground mb-2">
                        {airdrop.name}
                      </h4>
                      <p className="text-foreground-secondary text-sm mb-3">
                        {airdrop.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusText === "Claimed" ? "bg-success/20 text-success" :
                        statusText === "Active" ? "bg-primary/20 text-primary" :
                        "bg-foreground-muted/20 text-foreground-muted"
                      }`}>
                        {statusText}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-foreground-muted">Pool Balance:</span>
                      <div className="font-medium">{formatAmount(airdrop.poolBalance)}</div>
                    </div>
                    <div>
                      <span className="text-foreground-muted">Claims:</span>
                      <div className="font-medium">{airdrop.claimedCount}</div>
                    </div>
                    <div>
                      <span className="text-foreground-muted">Expires:</span>
                      <div className="font-medium">{formatDate(airdrop.expiresAt)}</div>
                    </div>
                    <div>
                      <span className="text-foreground-muted">Time Remaining:</span>
                      <div className="font-medium">{getTimeRemaining(airdrop.expiresAt)}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="text-2xl font-bold text-primary">
                      {airdrop.claimAmount > 0 ? formatAmount(airdrop.claimAmount) : formatAmount(airdrop.poolBalance / Math.max(airdrop.totalRecipients, 1))}
                    </div>

                    <div className="flex items-center gap-2">
                      {airdrop.claimed ? (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Claimed</span>
                        </div>
                      ) : airdrop.eligible && isActive ? (
                        <Button
                          size="sm"
                          onClick={() => handleClaimAirdrop(airdrop.id)}
                        >
                          <Gift className="mr-2 h-4 w-4" />
                          Claim Reward
                        </Button>
                      ) : (
                        <div className="text-sm text-foreground-muted">
                          {!airdrop.eligible ? "Not eligible" : 
                           hasExpired ? "Expired" : "Inactive"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AirdropCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAirdrop}
        eventName={eventName}
        loading={creatingAirdrop}
      />
    </div>
  );
};

export default AirdropManager;
