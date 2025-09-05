import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "../../config/sui";

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
    profileRegistryId: string,
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
        tx.object(profileRegistryId),
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
    eventId: string,
    recipients: string[],
    registryId: string,
    attendanceRegistryId: string,
    nftRegistryId: string,
    ratingRegistryId: string,
    profileRegistryId: string,
    clockId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::airdrop_distribution::batch_distribute`,
      arguments: [
        tx.pure.id(airdropId),
        tx.object(eventId),
        tx.pure.vector("address", recipients),
        tx.object(registryId),
        tx.object(attendanceRegistryId),
        tx.object(nftRegistryId),
        tx.object(ratingRegistryId),
        tx.object(profileRegistryId),
        tx.object(clockId),
      ],
    });

    return tx;
  }

  // Withdraw unclaimed funds after expiry
  withdrawUnclaimed(
    airdropId: string,
    eventId: string,
    registryId: string,
    profileRegistryId: string,
    clockId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::airdrop_distribution::withdraw_unclaimed`,
      arguments: [
        tx.pure.id(airdropId),
        tx.object(eventId),
        tx.object(registryId),
        tx.object(profileRegistryId),
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

  // Data fetching functions (actual implementations)
  
  // Get airdrop details from blockchain
  async getAirdropDetailsData(airdropId: string, registryId: string): Promise<AirdropDetails | null> {
    try {
      console.log('getAirdropDetailsData called with airdropId:', airdropId, 'Type:', typeof airdropId);
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::airdrop_distribution::get_airdrop_details`,
        arguments: [tx.pure.id(airdropId), tx.object(registryId)],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        if (Array.isArray(returnVals) && returnVals.length >= 6) {
          const [eventId, name, poolBalance, claimedCount, expiresAt, active] = returnVals;
          
          return {
            id: airdropId,
            eventId: String(eventId),
            name: String(name),
            description: "", // Not returned by get_airdrop_details
            poolBalance: parseInt(String(poolBalance)),
            claimedCount: parseInt(String(claimedCount)),
            totalRecipients: 0, // Not returned by get_airdrop_details
            expiresAt: parseInt(String(expiresAt)),
            active: Boolean(active),
            distributionType: 0, // Not returned by get_airdrop_details
            eligibility: {
              requireAttendance: false,
              requireCompletion: false,
              minDuration: 0,
              requireRatingSubmitted: false,
            },
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching airdrop details:', error);
      return null;
    }
  }

  // Get user's claim status
  async getClaimStatusData(user: string, airdropId: string, registryId: string): Promise<ClaimStatus> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::airdrop_distribution::get_claim_status`,
        arguments: [
          tx.pure.address(user),
          tx.pure.id(airdropId),
          tx.object(registryId),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: user,
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        if (Array.isArray(returnVals) && returnVals.length >= 2) {
          const [claimed, amount] = returnVals;
          return {
            claimed: Boolean(claimed),
            amount: parseInt(String(amount)),
          };
        }
      }
      return { claimed: false, amount: 0 };
    } catch (error) {
      console.error('Error fetching claim status:', error);
      return { claimed: false, amount: 0 };
    }
  }

  // Check if user is eligible for airdrop
  async isUserEligibleData(
    user: string,
    airdropId: string,
    registryId: string,
    attendanceRegistryId: string,
    nftRegistryId: string,
    ratingRegistryId: string
  ): Promise<boolean> {
    try {
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

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: user,
      });

      return result.effects?.status?.status === 'success';
    } catch (error) {
      console.error('Error checking eligibility:', error);
      return false;
    }
  }

  // Get all airdrops for an event
  async getEventAirdropsData(eventId: string, registryId: string): Promise<string[]> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::airdrop_distribution::get_event_airdrops`,
        arguments: [tx.pure.id(eventId), tx.object(registryId)],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        console.log('getEventAirdropsData returnVals:', returnVals);
        if (Array.isArray(returnVals) && returnVals.length > 0) {
          const airdropIds = returnVals[0];
          console.log('airdropIds:', airdropIds);
          if (Array.isArray(airdropIds)) {
            const convertedIds = airdropIds
              .filter(id => Array.isArray(id)) // Only process byte arrays, skip type strings
              .map(id => {
                console.log('Processing id:', id, 'Type:', typeof id, 'IsArray:', Array.isArray(id));
                // Skip the first byte (type indicator) and take the next 32 bytes for the actual object ID
                const actualIdBytes = id.slice(1, 33); // Skip first byte, take next 32 bytes
                const bytes = new Uint8Array(actualIdBytes);
                const hex = Array.from(bytes)
                  .map(b => b.toString(16).padStart(2, '0'))
                  .join('');
                const result = '0x' + hex;
                console.log('Converted to:', result);
                return result;
              });
            console.log('Final convertedIds:', convertedIds);
            return convertedIds;
          }
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching event airdrops:', error);
      return [];
    }
  }

  // Get user's claim history
  async getUserClaimsData(user: string, registryId: string): Promise<ClaimRecord[]> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::airdrop_distribution::get_user_claims`,
        arguments: [
          tx.pure.address(user),
          tx.object(registryId),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: user,
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        if (Array.isArray(returnVals) && returnVals.length > 0) {
          const claims = returnVals[0];
          if (Array.isArray(claims)) {
            return claims.map((claim: any) => ({
              airdropId: String(claim.airdrop_id),
              eventId: String(claim.event_id),
              amount: parseInt(String(claim.amount)),
              claimedAt: parseInt(String(claim.claimed_at)),
            }));
          }
        }
      }
      return [];
    } catch (error) {
      console.error('Error fetching user claims:', error);
      return [];
    }
  }
}
