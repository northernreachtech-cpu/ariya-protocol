import { Transaction } from "@mysten/sui/transactions";

// Airdrop distribution types
export const AIRDROP_DISTRIBUTION_TYPES = {
  EQUAL_DISTRIBUTION: 0,
  WEIGHTED_BY_DURATION: 1,
  COMPLETION_BONUS: 2,
} as const;

export type AirdropDistributionType =
  (typeof AIRDROP_DISTRIBUTION_TYPES)[keyof typeof AIRDROP_DISTRIBUTION_TYPES];

export interface AirdropEligibilityCriteria {
  requireAttendance: boolean;
  requireCompletion: boolean;
  minDuration: number; // in milliseconds
  requireRatingSubmitted: boolean;
}

export interface AirdropConfig {
  name: string;
  description: string;
  distributionType: AirdropDistributionType;
  eligibility: AirdropEligibilityCriteria;
  validityDays: number;
}

export interface AirdropDetails {
  id: string;
  eventId: string;
  name: string;
  description: string;
  poolBalance: number;
  claimedCount: number;
  totalRecipients: number;
  expiresAt: number;
  active: boolean;
  distributionType: AirdropDistributionType;
  eligibility: AirdropEligibilityCriteria;
}

export interface ClaimStatus {
  claimed: boolean;
  amount: number;
}

export interface ClaimRecord {
  airdropId: string;
  eventId: string;
  amount: number;
  claimedAt: number;
}

export class AirdropDistributionSDK {
  private packageId: string;

  constructor(packageId: string) {
    this.packageId = packageId;
  }

  getPackageId(): string {
    return this.packageId;
  }

  // Create a new airdrop
  createAirdrop(
    eventId: string,
    config: AirdropConfig,
    payment: string, // SUI coin object ID
    registryId: string,
    attendanceRegistryId: string,
    clockId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::airdrop_distribution::create_airdrop`,
      arguments: [
        tx.object(eventId),
        tx.pure.string(config.name),
        tx.pure.string(config.description),
        tx.object(payment),
        tx.pure.u8(config.distributionType),
        tx.pure.bool(config.eligibility.requireAttendance),
        tx.pure.bool(config.eligibility.requireCompletion),
        tx.pure.u64(config.eligibility.minDuration),
        tx.pure.bool(config.eligibility.requireRatingSubmitted),
        tx.pure.u64(config.validityDays),
        tx.object(registryId),
        tx.object(attendanceRegistryId),
        tx.object(clockId),
      ],
    });

    return tx;
  }

  // Claim airdrop rewards
  claimAirdrop(
    airdropId: string,
    registryId: string,
    attendanceRegistryId: string,
    nftRegistryId: string,
    ratingRegistryId: string,
    clockId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::airdrop_distribution::claim_airdrop`,
      arguments: [
        tx.pure.id(airdropId),
        tx.object(registryId),
        tx.object(attendanceRegistryId),
        tx.object(nftRegistryId),
        tx.object(ratingRegistryId),
        tx.object(clockId),
      ],
    });

    return tx;
  }

  // Batch distribute to multiple recipients (organizer only)
  batchDistribute(
    airdropId: string,
    recipients: string[],
    registryId: string,
    attendanceRegistryId: string,
    nftRegistryId: string,
    ratingRegistryId: string,
    clockId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::airdrop_distribution::batch_distribute`,
      arguments: [
        tx.pure.id(airdropId),
        tx.pure.vector("address", recipients),
        tx.object(registryId),
        tx.object(attendanceRegistryId),
        tx.object(nftRegistryId),
        tx.object(ratingRegistryId),
        tx.object(clockId),
      ],
    });

    return tx;
  }

  // Withdraw unclaimed funds after expiry
  withdrawUnclaimed(
    airdropId: string,
    registryId: string,
    clockId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::airdrop_distribution::withdraw_unclaimed`,
      arguments: [
        tx.pure.id(airdropId),
        tx.object(registryId),
        tx.object(clockId),
      ],
    });

    return tx;
  }

  // Get airdrop details
  getAirdropDetails(airdropId: string, registryId: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::airdrop_distribution::get_airdrop_details`,
      arguments: [tx.pure.id(airdropId), tx.object(registryId)],
    });

    return tx;
  }

  // Get user's claim status
  getClaimStatus(
    user: string,
    airdropId: string,
    registryId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::airdrop_distribution::get_claim_status`,
      arguments: [
        tx.pure.address(user),
        tx.pure.id(airdropId),
        tx.object(registryId),
      ],
    });

    return tx;
  }

  // Check if user is eligible
  isUserEligible(
    user: string,
    airdropId: string,
    registryId: string,
    attendanceRegistryId: string,
    nftRegistryId: string,
    ratingRegistryId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::airdrop_distribution::is_user_eligible`,
      arguments: [
        tx.pure.address(user),
        tx.pure.id(airdropId),
        tx.object(registryId),
        tx.object(attendanceRegistryId),
        tx.object(nftRegistryId),
        tx.object(ratingRegistryId),
      ],
    });

    return tx;
  }

  // Get all airdrops for an event
  getEventAirdrops(eventId: string, registryId: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::airdrop_distribution::get_event_airdrops`,
      arguments: [tx.pure.id(eventId), tx.object(registryId)],
    });

    return tx;
  }

  // Get user's claim history
  getUserClaims(user: string, registryId: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::airdrop_distribution::get_user_claims`,
      arguments: [tx.pure.address(user), tx.object(registryId)],
    });

    return tx;
  }
}
