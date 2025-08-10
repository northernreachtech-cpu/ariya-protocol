import { useState } from "react";
import { motion } from "framer-motion";
import {
  Gift,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Download,
  Eye,
} from "lucide-react";
import Button from "./Button";
import Card from "./Card";
import {
  type AirdropDetails,
  type ClaimStatus,
  AIRDROP_DISTRIBUTION_TYPES,
} from "../lib/sdk";

interface AirdropManagementProps {
  eventId: string;
  airdrops: AirdropDetails[];
  userAddress?: string;
  isOrganizer?: boolean;
  onClaim?: (airdropId: string) => void;
  onWithdraw?: (airdropId: string) => void;
  onViewDetails?: (airdropId: string) => void;
  loading?: boolean;
}

const AirdropManagement = ({
  airdrops,
  userAddress,
  isOrganizer = false,
  onClaim,
  onWithdraw,
  onViewDetails,
  loading = false,
}: AirdropManagementProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [claimStatuses, _setClaimStatuses] = useState<
    Record<string, ClaimStatus>
  >({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [eligibilityStatuses, _setEligibilityStatuses] = useState<
    Record<string, boolean>
  >({});

  const getDistributionTypeLabel = (type: number) => {
    switch (type) {
      case AIRDROP_DISTRIBUTION_TYPES.EQUAL_DISTRIBUTION:
        return "Equal Distribution";
      case AIRDROP_DISTRIBUTION_TYPES.WEIGHTED_BY_DURATION:
        return "Duration Weighted";
      case AIRDROP_DISTRIBUTION_TYPES.COMPLETION_BONUS:
        return "Completion Bonus";
      default:
        return "Unknown";
    }
  };

  const getDistributionTypeIcon = (type: number) => {
    switch (type) {
      case AIRDROP_DISTRIBUTION_TYPES.EQUAL_DISTRIBUTION:
        return Users;
      case AIRDROP_DISTRIBUTION_TYPES.WEIGHTED_BY_DURATION:
        return Clock;
      case AIRDROP_DISTRIBUTION_TYPES.COMPLETION_BONUS:
        return CheckCircle;
      default:
        return Gift;
    }
  };

  const getStatusColor = (airdrop: AirdropDetails) => {
    const now = Date.now();
    const hasExpired = now > airdrop.expiresAt;

    if (!airdrop.active) {
      return "text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800";
    }

    if (hasExpired) {
      return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-400/20";
    }

    return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-400/20";
  };

  const getStatusText = (airdrop: AirdropDetails) => {
    const now = Date.now();
    const hasExpired = now > airdrop.expiresAt;

    if (!airdrop.active) {
      return "Inactive";
    }

    if (hasExpired) {
      return "Expired";
    }

    return "Active";
  };

  const formatAmount = (amount: number) => {
    return `${(amount / 1000000000).toFixed(3)} SUI`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const handleClaim = (airdropId: string) => {
    if (onClaim) {
      onClaim(airdropId);
    }
  };

  const handleWithdraw = (airdropId: string) => {
    if (onWithdraw) {
      onWithdraw(airdropId);
    }
  };

  const handleViewDetails = (airdropId: string) => {
    if (onViewDetails) {
      onViewDetails(airdropId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="p-6 animate-pulse">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 bg-skeleton rounded w-1/3"></div>
                <div className="h-5 bg-skeleton rounded w-20"></div>
              </div>
              <div className="h-4 bg-skeleton rounded w-2/3"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-8 bg-skeleton rounded"></div>
                <div className="h-8 bg-skeleton rounded"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (airdrops.length === 0) {
    return (
      <div className="text-center py-12">
        <Gift className="h-16 w-16 mx-auto text-foreground-muted mb-4" />
        <h3 className="text-xl font-semibold mb-2 text-foreground-secondary">
          No airdrops available
        </h3>
        <p className="text-foreground-muted max-w-md mx-auto">
          {isOrganizer
            ? "Create an airdrop campaign to reward your event participants."
            : "No airdrop campaigns have been created for this event yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Airdrop Campaigns ({airdrops.length})
        </h3>
        {isOrganizer && (
          <Button size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {airdrops.map((airdrop, index) => {
          const DistributionIcon = getDistributionTypeIcon(
            airdrop.distributionType
          );
          const isEligible = eligibilityStatuses[airdrop.id];
          const claimStatus = claimStatuses[airdrop.id];
          const hasExpired = Date.now() > airdrop.expiresAt;
          const canClaim =
            isEligible &&
            !claimStatus?.claimed &&
            airdrop.active &&
            !hasExpired;
          const canWithdraw =
            isOrganizer && hasExpired && airdrop.poolBalance > 0;

          return (
            <motion.div
              key={airdrop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all duration-300">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-foreground">
                          {airdrop.name}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            airdrop
                          )}`}
                        >
                          {getStatusText(airdrop)}
                        </span>
                      </div>
                      <p className="text-foreground-secondary text-sm">
                        {airdrop.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewDetails(airdrop.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Distribution Type */}
                  <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                    <DistributionIcon className="h-4 w-4" />
                    <span>
                      {getDistributionTypeLabel(airdrop.distributionType)}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-card-secondary rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        {formatAmount(airdrop.poolBalance)}
                      </div>
                      <div className="text-xs text-foreground-muted">
                        Pool Balance
                      </div>
                    </div>

                    <div className="text-center p-3 bg-card-secondary rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        {airdrop.claimedCount}
                      </div>
                      <div className="text-xs text-foreground-muted">
                        Claims
                      </div>
                    </div>

                    <div className="text-center p-3 bg-card-secondary rounded-lg">
                      <div className="text-2xl font-bold text-foreground">
                        {airdrop.totalRecipients}
                      </div>
                      <div className="text-xs text-foreground-muted">
                        Eligible
                      </div>
                    </div>

                    <div className="text-center p-3 bg-card-secondary rounded-lg">
                      <div className="text-sm font-semibold text-foreground">
                        {getTimeRemaining(airdrop.expiresAt)}
                      </div>
                      <div className="text-xs text-foreground-muted">
                        Expires
                      </div>
                    </div>
                  </div>

                  {/* Eligibility Requirements */}
                  <div className="bg-card-secondary rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-foreground mb-2">
                      Eligibility Requirements
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle
                          className={`h-3 w-3 ${
                            airdrop.eligibility.requireAttendance
                              ? "text-green-500"
                              : "text-gray-400"
                          }`}
                        />
                        <span
                          className={
                            airdrop.eligibility.requireAttendance
                              ? "text-foreground"
                              : "text-foreground-muted"
                          }
                        >
                          Attendance Required
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle
                          className={`h-3 w-3 ${
                            airdrop.eligibility.requireCompletion
                              ? "text-green-500"
                              : "text-gray-400"
                          }`}
                        />
                        <span
                          className={
                            airdrop.eligibility.requireCompletion
                              ? "text-foreground"
                              : "text-foreground-muted"
                          }
                        >
                          Completion Required
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle
                          className={`h-3 w-3 ${
                            airdrop.eligibility.requireRatingSubmitted
                              ? "text-green-500"
                              : "text-gray-400"
                          }`}
                        />
                        <span
                          className={
                            airdrop.eligibility.requireRatingSubmitted
                              ? "text-foreground"
                              : "text-foreground-muted"
                          }
                        >
                          Rating Required
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock
                          className={`h-3 w-3 ${
                            airdrop.eligibility.minDuration > 0
                              ? "text-green-500"
                              : "text-gray-400"
                          }`}
                        />
                        <span
                          className={
                            airdrop.eligibility.minDuration > 0
                              ? "text-foreground"
                              : "text-foreground-muted"
                          }
                        >
                          Min Duration:{" "}
                          {airdrop.eligibility.minDuration / (1000 * 60 * 60)}h
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* User Status */}
                  {userAddress && (
                    <div className="bg-card-secondary rounded-lg p-4">
                      <h5 className="text-sm font-semibold text-foreground mb-2">
                        Your Status
                      </h5>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {claimStatus?.claimed ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm text-foreground">
                                Claimed {formatAmount(claimStatus.amount)}
                              </span>
                            </>
                          ) : isEligible ? (
                            <>
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm text-foreground">
                                Eligible to claim
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm text-foreground">
                                Not eligible
                              </span>
                            </>
                          )}
                        </div>

                        {canClaim && (
                          <Button
                            size="sm"
                            onClick={() => handleClaim(airdrop.id)}
                          >
                            <Gift className="mr-2 h-4 w-4" />
                            Claim Reward
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Organizer Actions */}
                  {isOrganizer && (
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="text-sm text-foreground-secondary">
                        Expires{" "}
                        {formatDate(airdrop.expiresAt)}
                      </div>

                      <div className="flex gap-2">
                        {canWithdraw && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleWithdraw(airdrop.id)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Withdraw Unclaimed
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(airdrop.id)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AirdropManagement;
