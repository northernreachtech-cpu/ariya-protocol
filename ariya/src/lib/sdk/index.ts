import { useMemo } from "react";
import { EventManagementSDK } from "./eventManagement";
import { IdentityAccessSDK } from "./identityAccess";
import { AttendanceVerificationSDK } from "./attendanceVerification";
import { CommunityAccessSDK } from "./communityAccess";
import { AirdropDistributionSDK } from "./airdropDistribution";
import { SubscriptionSDK } from "./subscription";
import { DocumentFlowSDK } from "./documentFlow";
import { PlatformTreasurySDK } from "./platformTreasury";
import { useNetworkVariable } from "../../config/sui";

// Main SDK class that combines all modules
export class AriyaSDK {
  public eventManagement: EventManagementSDK;
  public identityAccess: IdentityAccessSDK;
  public attendanceVerification: AttendanceVerificationSDK;
  public communityAccess: CommunityAccessSDK;
  public airdropDistribution: AirdropDistributionSDK;
  public subscription: SubscriptionSDK;
  public documentFlow: DocumentFlowSDK;
  public platformTreasury: PlatformTreasurySDK;

  constructor(packageId: string) {
    this.eventManagement = new EventManagementSDK(packageId);
    this.identityAccess = new IdentityAccessSDK(packageId);
    this.attendanceVerification = new AttendanceVerificationSDK(packageId);
    this.communityAccess = new CommunityAccessSDK(packageId);
    this.airdropDistribution = new AirdropDistributionSDK(packageId);
    this.subscription = new SubscriptionSDK(packageId);
    this.documentFlow = new DocumentFlowSDK(packageId);
    this.platformTreasury = new PlatformTreasurySDK(packageId);
  }
}

// React hook to use the SDK
export function useAriyaSDK(): AriyaSDK {
  const packageId = useNetworkVariable("packageId");

  return useMemo(() => {
    return new AriyaSDK(packageId);
  }, [packageId]);
}

// Re-export types and utilities (excluding ERROR_CODES to avoid conflicts)
export {
  EventManagementSDK,
  EVENT_STATES,
  type Event,
  type OrganizerProfile,
} from "./eventManagement";

export { IdentityAccessSDK, type Registration } from "./identityAccess";

export {
  type TreasuryStatus,
  type PlatformFeeEvent,
  type WithdrawalEvent,
  type AdminTransferEvent,
} from "./platformTreasury";

export {
  AttendanceVerificationSDK,
  type CheckInResult,
  type QRCodeData,
} from "./attendanceVerification";

export {
  CommunityAccessSDK,
  type CommunityConfig,
  type CommunityInfo,
  type AccessPass,
} from "./communityAccess";

export {
  AirdropDistributionSDK,
  AIRDROP_DISTRIBUTION_TYPES,
  type AirdropDistributionType,
  type AirdropEligibilityCriteria,
  type AirdropConfig,
  type AirdropDetails,
  type ClaimStatus,
  type ClaimRecord,
} from "./airdropDistribution";

// Add export for EscrowSettlementSDK (to be implemented)
export { EscrowSettlementSDK } from "./escrowSettlement";

// Add export for SubscriptionSDK
export { 
  SubscriptionSDK, 
  SUBSCRIPTION_TYPES, 
  type UserSubscription,
  type SubscriptionConfig,
  type SubscriptionRegistry,
  type SubscriptionPricing
} from "./subscription";

// Add export for DocumentFlowSDK
export {
  DocumentFlowSDK,
  DOCUMENT_STATES,
  type ChainParticipant,
  type ApprovalRecord,
  type DocumentFlow,
  type DocumentSubmission,
  type DocumentFlowRegistry,
  type FlowManagerCap,
} from "./documentFlow";

// Re-export ERROR_CODES with explicit naming to avoid conflicts
export { ERROR_CODES as EVENT_MANAGEMENT_ERROR_CODES } from "./eventManagement";
