import { useState, useEffect } from "react";
import { Gift, CheckCircle, Loader2 } from "lucide-react";
import Button from "./Button";
import Card from "./Card";
import { useAriyaSDK, type AirdropDetails } from "../lib/sdk";
import { useNetworkVariable } from "../config/sui";

interface AirdropDisplayProps {
  eventId: string;
  userAddress?: string;
  onClaim?: (airdropId: string) => void;
}

interface AirdropWithStatus extends AirdropDetails {
  eligible: boolean;
  claimed: boolean;
  claimAmount: number;
}

const AirdropDisplay = ({
  eventId,
  userAddress,
  onClaim,
}: AirdropDisplayProps) => {
  const [airdrops, setAirdrops] = useState<AirdropWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sdk = useAriyaSDK();
  const airdropRegistryId = useNetworkVariable('airdropRegistryId');
  const attendanceRegistryId = useNetworkVariable('attendanceRegistryId');
  const nftRegistryId = useNetworkVariable('nftRegistryId');
  const ratingRegistryId = useNetworkVariable('ratingRegistryId');

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

            if (userAddress && attendanceRegistryId && nftRegistryId && ratingRegistryId) {
              // Check eligibility
              eligible = await sdk.airdropDistribution.isUserEligibleData(
                userAddress,
                details.id,
                airdropRegistryId,
                attendanceRegistryId,
                nftRegistryId,
                ratingRegistryId
              );

              // Check claim status
              const claimStatus = await sdk.airdropDistribution.getClaimStatusData(
                userAddress,
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
  }, [eventId, userAddress, airdropRegistryId, attendanceRegistryId, nftRegistryId, ratingRegistryId]);

  const handleClaim = (airdropId: string) => {
    if (onClaim) {
      onClaim(airdropId);
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

  // const getTimeRemaining = (expiresAt: number) => {
  //   const now = Date.now();
  //   const remaining = expiresAt - now;

  //   if (remaining <= 0) {
  //     return "Expired";
  //   }

  //   const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  //   const hours = Math.floor(
  //     (remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  //   );

  //   if (days > 0) {
  //     return `${days}d ${hours}h remaining`;
  //   }

  //   return `${hours}h remaining`;
  // };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Available Rewards
          </h3>
        </div>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Available Rewards
          </h3>
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

  if (airdrops.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Available Rewards
          </h3>
        </div>
        <div className="text-center py-8">
          <p className="text-foreground-muted">No airdrops available for this event.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          Available Rewards ({airdrops.length})
        </h3>
      </div>

      <div className="grid gap-4">
        {airdrops.map((airdrop) => {
          const hasExpired = Date.now() > airdrop.expiresAt;
          const isActive = airdrop.active && !hasExpired;
          
          return (
            <Card key={airdrop.id} className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    {airdrop.name}
                  </h4>
                  <p className="text-foreground-secondary text-sm">
                    {airdrop.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
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
                    <span className="text-foreground-muted">Status:</span>
                    <div className="font-medium">
                      {hasExpired ? "Expired" : isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-primary">
                    {airdrop.claimAmount > 0 ? formatAmount(airdrop.claimAmount) : formatAmount(airdrop.poolBalance / Math.max(airdrop.totalRecipients, 1))}
                  </div>

                  {userAddress && (
                    <div className="flex items-center gap-2">
                      {airdrop.claimed ? (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Claimed</span>
                        </div>
                      ) : airdrop.eligible && isActive ? (
                        <Button
                          size="sm"
                          onClick={() => handleClaim(airdrop.id)}
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
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AirdropDisplay;