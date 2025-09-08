import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "../../config/sui";

// System clock object ID is constant
const CLOCK_ID = "0x6";

export interface CommunityConfig {
  name: string;
  description: string;
  accessRequirements: {
    nftTypes: ("poa" | "completion")[];
    minimumRating?: number;
    timeLimit?: "permanent" | "event_duration" | number;
    customRequirements?: any[];
  };
  features: {
    forum: boolean;
    resources: boolean;
    calendar: boolean;
    directory: boolean;
    governance: boolean;
  };
  moderators: string[];
}

export interface CommunityInfo {
  id: string;
  eventId: string;
  name: string;
  description: string;
  memberCount: number;
  created: number;
  isActive: boolean;
  features: string[];
}

export interface AccessPass {
  communityId: string;
  userAddress: string;
  accessLevel: number;
  expiresAt: number;
  features: string[];
}

export class CommunityAccessSDK {
  private packageId: string;

  constructor(packageId: string) {
    this.packageId = packageId;
  }

  getPackageId(): string {
    return this.packageId;
  }

  /**
   * Create a new community for an event (organizer only)
   */
  createCommunity(
    eventId: string,
    config: CommunityConfig,
    communityRegistryId: string
  ): Transaction {
    const tx = new Transaction();

    // Determine access type based on NFT requirements
    let accessType = 2; // Both PoA and Completion (most permissive)
    if (config.accessRequirements.nftTypes.length === 1) {
      if (config.accessRequirements.nftTypes[0] === "poa") {
        accessType = 0; // PoA only
      } else if (config.accessRequirements.nftTypes[0] === "completion") {
        accessType = 1; // Completion only
      }
    }

    // Convert minimum rating to Move format (1.0-5.0 stars => 100-500)
    const minEventRating = config.accessRequirements.minimumRating
      ? Math.round(config.accessRequirements.minimumRating * 100)
      : 0;

    // Convert time limit to expiry duration
    let expiryDuration = 0; // Permanent by default
    if (config.accessRequirements.timeLimit === "event_duration") {
      expiryDuration = 86400000; // 24 hours in milliseconds (can be adjusted)
    } else if (typeof config.accessRequirements.timeLimit === "number") {
      expiryDuration = config.accessRequirements.timeLimit;
    }

    // Determine if NFT is required (Open vs Closed community)
    const requireNftHeld = config.accessRequirements.nftTypes.length > 0 || minEventRating > 0;

    tx.moveCall({
      target: `${this.packageId}::community_access::create_community`,
      arguments: [
        tx.object(eventId), // event: &Event
        tx.pure.string(config.name), // name: String
        tx.pure.string(config.description), // description: String
        tx.pure.u8(accessType), // access_type: u8
        tx.pure.bool(requireNftHeld), // require_nft_held: bool
        tx.pure.u64(minEventRating), // min_event_rating: u64
        tx.pure.u64(expiryDuration), // expiry_duration: u64
        tx.pure.string(""), // metadata_uri: String (empty for now)
        tx.pure.bool(config.features.forum), // forum_enabled: bool
        tx.pure.bool(config.features.resources), // resource_sharing: bool
        tx.pure.bool(config.features.calendar), // event_calendar: bool
        tx.pure.bool(config.features.directory), // member_directory: bool
        tx.pure.bool(config.features.governance), // governance_enabled: bool
        tx.object(communityRegistryId), // registry: &mut CommunityRegistry
        tx.object(CLOCK_ID), // clock: &Clock
      ],
    });

    return tx;
  }

  /**
   * Request access to a community (user with PoA/Completion NFT)
   */
  requestCommunityAccess(
    communityId: string,
    userAddress: string,
    nftRegistryId: string,
    ratingRegistryId: string,
    communityRegistryId: string
  ): Transaction {
    const tx = new Transaction();

    const [accessPass] = tx.moveCall({
      target: `${this.packageId}::community_access::request_access`,
      arguments: [
        tx.pure.id(communityId), // community_id: ID
        tx.object(communityRegistryId), // registry: &mut CommunityRegistry
        tx.object(nftRegistryId), // nft_registry: &NFTRegistry
        tx.object(ratingRegistryId), // rating_registry: &RatingRegistry
        tx.object(CLOCK_ID), // clock: &Clock
      ],
    });

    // Transfer the access pass to the user
    tx.transferObjects([accessPass], userAddress);

    return tx;
  }

  /**
   * Check if user has access to a community
   */
  async checkCommunityAccess(
    communityId: string,
    userAddress: string,
    communityRegistryId: string
  ): Promise<AccessPass | null> {
    try {
      // First check if user is a member
      const isMemberTx = new Transaction();
      isMemberTx.moveCall({
        target: `${this.packageId}::community_access::is_member`,
        arguments: [
          isMemberTx.pure.id(communityId),
          isMemberTx.pure.address(userAddress),
          isMemberTx.object(communityRegistryId),
        ],
      });

      const memberResult = await suiClient.devInspectTransactionBlock({
        transactionBlock: isMemberTx,
        sender: userAddress,
      });

      if (
        memberResult &&
        memberResult.results &&
        memberResult.results.length > 0 &&
        memberResult.results[0].returnValues
      ) {
        const memberReturnVals = memberResult.results[0].returnValues;
        const isMember = Array.isArray(memberReturnVals[0])
          ? memberReturnVals[0][0]
          : memberReturnVals[0];

        if (!isMember) return null;

        // Get member info and features
        const [memberInfo, features] = await Promise.all([
          this.getMemberInfo(communityId, userAddress, communityRegistryId),
          this.getCommunityFeatures(communityId, communityRegistryId),
        ]);

        if (memberInfo && features) {
          return {
            communityId,
            userAddress,
            accessLevel: 1, // Basic member level
            expiresAt: memberInfo.expiresAt,
            features: features,
          };
        }
      }
    } catch (e) {
      console.error("Error checking community access:", e);
    }
    return null;
  }

  /**
   * Check if user is an active member of a community
   * This performs comprehensive checks: membership, NFT ownership, expiry
   */
  async isActiveCommunityMember(
    communityId: string,
    userAddress: string,
    communityRegistryId: string,
    nftRegistryId: string
  ): Promise<{
    isActive: boolean;
    reason?: string;
    membershipDetails?: any;
  }> {
    try {
      // 1. Check on-chain membership using is_member
      const isMemberTx = new Transaction();
      isMemberTx.moveCall({
        target: `${this.packageId}::community_access::is_member`,
        arguments: [
          isMemberTx.pure.id(communityId),
          isMemberTx.pure.address(userAddress),
          isMemberTx.object(communityRegistryId),
        ],
      });

      const memberResult = await suiClient.devInspectTransactionBlock({
        transactionBlock: isMemberTx,
        sender: userAddress,
      });

      if (
        !memberResult ||
        !memberResult.results ||
        memberResult.results.length === 0 ||
        !memberResult.results[0].returnValues
      ) {
        return { isActive: false, reason: "Failed to check membership status" };
      }

      const memberReturnVals = memberResult.results[0].returnValues;
      const isMember = Array.isArray(memberReturnVals[0])
        ? memberReturnVals[0][0]
        : memberReturnVals[0];

      if (!isMember) {
        return { isActive: false, reason: "Not a member of this community" };
      }

      // 2. Get member info to check expiry
      const memberInfo = await this.getMemberInfo(
        communityId,
        userAddress,
        communityRegistryId
      );

      if (!memberInfo) {
        return { isActive: false, reason: "Failed to get member information" };
      }

      // 3. Check if membership has expired
      const currentTime = Date.now();
      if (memberInfo.expiresAt > 0 && currentTime > memberInfo.expiresAt) {
        return { isActive: false, reason: "Membership has expired" };
      }

      // 4. Check NFT ownership (PoA or Completion based on community requirements)
      // For now, we'll check for PoA NFT as that's the most common requirement
      const hasPoA = await this.checkPoANFTOwnership(
        userAddress,
        communityId,
        nftRegistryId
      );

      if (!hasPoA) {
        return { isActive: false, reason: "Required PoA NFT not found" };
      }

      return {
        isActive: true,
        membershipDetails: {
          joinedAt: memberInfo.joinedAt,
          expiresAt: memberInfo.expiresAt,
          contributionScore: memberInfo.contributionScore,
          lastActive: memberInfo.lastActive,
        },
      };
    } catch (e) {
      console.error("Error checking active community membership:", e);
      return { isActive: false, reason: "Error checking membership status" };
    }
  }

  /**
   * Check if user owns a PoA NFT for the event associated with this community
   */
  private async checkPoANFTOwnership(
    userAddress: string,
    communityId: string,
    _nftRegistryId: string
  ): Promise<boolean> {
    try {
      // First, get the event ID for this community
      const { data: events } = await suiClient.queryEvents({
        query: {
          MoveEventType: `${this.packageId}::community_access::CommunityCreated`,
        },
        limit: 50,
        order: "descending",
      });

      let eventId = "";
      for (const event of events) {
        const eventData = event.parsedJson as any;
        if (eventData && eventData.community_id === communityId) {
          eventId = eventData.event_id;
          break;
        }
      }

      if (!eventId) {
        console.warn("Could not find event ID for community:", communityId);
        return false;
      }

      // Check if user has PoA NFT for this event
      const { data: objects } = await suiClient.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${this.packageId.replace(
            "community_access",
            "nft_minting"
          )}::nft_minting::ProofOfAttendance`,
        },
        options: { showContent: true },
      });

      // Check if any PoA NFT is for this specific event
      for (const obj of objects) {
        if (obj.data?.content?.dataType === "moveObject") {
          const fields = (obj.data.content as any).fields;
          if (fields && fields.event_id === eventId) {
            return true;
          }
        }
      }

      return false;
    } catch (e) {
      console.error("Error checking PoA NFT ownership:", e);
      return false;
    }
  }

  /**
   * Get user's active communities (only communities where user is an active member)
   */
  async getActiveUserCommunities(
    userAddress: string,
    communityRegistryId: string,
    nftRegistryId: string
  ): Promise<CommunityInfo[]> {
    try {
      // First get all communities the user has access objects for
      const { data: objects } = await suiClient.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${this.packageId}::community_access::CommunityAccess`,
        },
        options: { showContent: true },
      });

      const activeCommunities: CommunityInfo[] = [];

      // Check each community for active membership
      for (const obj of objects) {
        if (obj.data?.content?.dataType === "moveObject") {
          const fields = (obj.data.content as any).fields;
          const communityId = fields.community_id;

          // Check if user is an active member
          const membershipCheck = await this.isActiveCommunityMember(
            communityId,
            userAddress,
            communityRegistryId,
            nftRegistryId
          );

          if (membershipCheck.isActive) {
            activeCommunities.push({
              id: communityId,
              eventId: fields.event_id || "",
              name: fields.name || "Community",
              description: fields.description || "",
              memberCount: 0, // Would need separate query
              created: Number(fields.created_at) || 0,
              isActive: true,
              features: [], // Parse from fields
            });
          }
        }
      }

      return activeCommunities;
    } catch (e) {
      console.error("Error fetching active user communities:", e);
      return [];
    }
  }

  /**
   * Get member information
   */
  private async getMemberInfo(
    communityId: string,
    userAddress: string,
    communityRegistryId: string
  ): Promise<{
    joinedAt: number;
    expiresAt: number;
    contributionScore: number;
    lastActive: number;
  } | null> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::community_access::get_member_info`,
        arguments: [
          tx.pure.id(communityId),
          tx.pure.address(userAddress),
          tx.object(communityRegistryId),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: userAddress,
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        if (Array.isArray(returnVals) && returnVals.length >= 4) {
          return {
            joinedAt: Number(
              Array.isArray(returnVals[0]) ? returnVals[0][0] : returnVals[0]
            ),
            expiresAt: Number(
              Array.isArray(returnVals[1]) ? returnVals[1][0] : returnVals[1]
            ),
            contributionScore: Number(
              Array.isArray(returnVals[2]) ? returnVals[2][0] : returnVals[2]
            ),
            lastActive: Number(
              Array.isArray(returnVals[3]) ? returnVals[3][0] : returnVals[3]
            ),
          };
        }
      }
    } catch (e) {
      console.error("Error getting member info:", e);
    }
    return null;
  }

  /**
   * Get event ID for a community from CommunityCreated events
   */
  private async getEventIdForCommunity(communityId: string): Promise<string | null> {
    try {
      const { data: events } = await suiClient.queryEvents({
        query: {
          MoveEventType: `${this.packageId}::community_access::CommunityCreated`,
        },
        limit: 50,
        order: "descending",
      });

      for (const event of events) {
        const eventData = event.parsedJson as any;
        if (eventData && eventData.community_id === communityId) {
          return eventData.event_id;
        }
      }
      return null;
    } catch (e) {
      console.error("Error getting event ID for community:", e);
      return null;
    }
  }

  /**
   * Get community features
   */
  public async getCommunityFeatures(
    communityId: string,
    communityRegistryId: string
  ): Promise<string[]> {
    try {
      // Use the Move contract's get_community_features function
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::community_access::get_community_features`,
        arguments: [
          tx.pure.id(communityId),
          tx.object(communityRegistryId),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        if (Array.isArray(returnVals) && returnVals.length >= 5) {
          const features: string[] = [];
          if (returnVals[0]) features.push("forum");
          if (returnVals[1]) features.push("resources");
          if (returnVals[2]) features.push("calendar");
          if (returnVals[3]) features.push("directory");
          if (returnVals[4]) features.push("governance");
          return features;
        }
      }

      // Fallback to default features
      return ["forum", "directory"];
    } catch (e) {
      console.error("Error getting community features:", e);
      return ["forum", "directory"]; // Fallback to default features
    }
  }

  /**
   * Get communities for an event
   * Query CommunityCreated events to find communities for a specific event
   */
  async getEventCommunities(
    eventId: string,
    communityRegistryId: string
  ): Promise<CommunityInfo[]> {
    try {
      // Query for CommunityCreated events for this specific event
      const { data: events } = await suiClient.queryEvents({
        query: {
          MoveEventType: `${this.packageId}::community_access::CommunityCreated`,
        },
        limit: 50, // Reasonable limit
        order: "descending",
      });

      const communities: CommunityInfo[] = [];

      // Filter events for this specific event and fetch community details
      for (const event of events) {
        try {
          const eventData = event.parsedJson as any;

          // Check if this community is for our event
          if (eventData && eventData.event_id === eventId) {

            // Fetch community details using the community ID
            const communityDetails = await this.getCommunityDetails(
              eventData.community_id,
              communityRegistryId
            );

            if (communityDetails) {
              communities.push(communityDetails);
            }
          }
        } catch (e) {
          console.warn("⚠️ Error processing community event:", e);
          continue;
        }
      }

      return communities;
    } catch (e) {
      console.error("Error fetching event communities:", e);
      return [];
    }
  }

  /**
   * Get all communities (across all events)
   */
  async getAllCommunities(): Promise<any[]> {
    // Query all CommunityCreated events using queryEvents
    const { data: events } = await suiClient.queryEvents({
      query: {
        MoveEventType: `${this.packageId}::community_access::CommunityCreated`,
      },
      limit: 100,
      order: "descending",
    });
    const communities: any[] = [];
    for (const event of events) {
      if (event.type?.includes("CommunityCreated")) {
        const e = event.parsedJson as any;
        communities.push({
          id: e.community_id,
          name: e.name,
          description: e.description,
          event_id: e.event_id,
          created_at: e.timestamp,
        });
      }
    }
    return communities;
  }

  /**
   * Get detailed information about a specific community
   */
  public async getCommunityDetails(
    communityId: string,
    communityRegistryId: string
  ): Promise<CommunityInfo | null> {
    try {
      // Use the Move contract's get_community_details function
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::community_access::get_community_details`,
        arguments: [
          tx.pure.id(communityId),
          tx.object(communityRegistryId),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000", // Dummy sender
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        
        if (Array.isArray(returnVals) && returnVals.length >= 5) {
          // Parse name from tuple [byteArray, typeString]
          let name = "Event Community";
          if (Array.isArray(returnVals[0]) && returnVals[0].length >= 2) {
            const nameTuple = returnVals[0];
            if (Array.isArray(nameTuple[0])) {
              const nameBytes = nameTuple[0];
              name = nameBytes.length > 0 ? String.fromCharCode(...nameBytes) : "Event Community";
            }
          }
          
          // Parse description from tuple [byteArray, typeString]
          let description = "Join the live community for this event";
          if (Array.isArray(returnVals[1]) && returnVals[1].length >= 2) {
            const descriptionTuple = returnVals[1];
            if (Array.isArray(descriptionTuple[0])) {
              const descriptionBytes = descriptionTuple[0];
              description = descriptionBytes.length > 0 ? String.fromCharCode(...descriptionBytes) : "Join the live community for this event";
            }
          }
          
          const memberCount = Number(Array.isArray(returnVals[2]) ? returnVals[2][0] : returnVals[2]);
          const isActive = Boolean(Array.isArray(returnVals[3]) ? returnVals[3][0] : returnVals[3]);
           Number(Array.isArray(returnVals[4]) ? returnVals[4][0] : returnVals[4]);

          // Get event ID from CommunityCreated events
          const eventId = await this.getEventIdForCommunity(communityId);

          // Get community features
          const features = await this.getCommunityFeatures(communityId, communityRegistryId);

          const parsedData = {
            id: communityId,
            eventId: eventId || "",
            name: name || "Event Community",
            description: description || "Join the live community for this event",
            memberCount: memberCount || 0,
            created: Date.now(), // We'll get this from events if needed
            isActive: isActive !== false,
            features: features,
          };


          return parsedData;
        }
      }

      // Fallback to hardcoded data if contract call fails
      console.warn("⚠️ Failed to get community details from contract, using fallback data");
      return {
        id: communityId,
        eventId: "",
        name: "Event Community",
        description: "Join the live community for this event",
        memberCount: 0,
        created: Date.now(),
        isActive: true,
        features: ["forum", "resources", "directory"],
      };
    } catch (e) {
      console.error("Error getting community details:", e);
      return null;
    }
  }

  /**
   * Get user's accessible communities
   */
  async getUserCommunities(
    userAddress: string,
    _communityRegistryId: string
  ): Promise<CommunityInfo[]> {
    try {
      // Query for CommunityAccess objects owned by user
      const { data: objects } = await suiClient.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${this.packageId}::community_access::CommunityAccess`,
        },
        options: { showContent: true },
      });

      const communities: CommunityInfo[] = [];

      for (const obj of objects) {
        if (obj.data?.content?.dataType === "moveObject") {
          const fields = (obj.data.content as any).fields;
          // Extract community info from fields
          communities.push({
            id: fields.community_id,
            eventId: fields.event_id,
            name: fields.name || "Community",
            description: fields.description || "",
            memberCount: 0, // Would need separate query
            created: Number(fields.created_at) || 0,
            isActive: true,
            features: [], // Parse from fields
          });
        }
      }

      return communities;
    } catch (e) {
      console.error("Error fetching user communities:", e);
      return [];
    }
  }

  /**
   * Update community contribution score
   */
  updateContributionScore(
    communityId: string,
    userAddress: string,
    points: number,
    communityRegistryId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::community_access::update_contribution_score`,
      arguments: [
        tx.pure.id(communityId),
        tx.pure.address(userAddress),
        tx.pure.u64(points),
        tx.object(communityRegistryId),
      ],
    });

    return tx;
  }

  /**
   * Add custom requirement to a community (organizer only)
   */
  addCustomRequirement(
    communityId: string,
    requirementType: string,
    value: number,
    communityRegistryId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::community_access::add_custom_requirement`,
      arguments: [
        tx.pure.id(communityId),
        tx.pure.string(requirementType),
        tx.pure.u64(value),
        tx.object(communityRegistryId),
      ],
    });

    return tx;
  }

  /**
   * Remove a member from community (organizer only)
   */
  removeMember(
    communityId: string,
    memberToRemove: string,
    reason: string,
    communityRegistryId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::community_access::remove_member`,
      arguments: [
        tx.pure.id(communityId),
        tx.pure.address(memberToRemove),
        tx.pure.string(reason),
        tx.object(communityRegistryId),
      ],
    });

    return tx;
  }

  /**
   * Update member activity timestamp
   */
  updateMemberActivity(
    communityId: string,
    communityRegistryId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::community_access::update_member_activity`,
      arguments: [
        tx.pure.id(communityId),
        tx.object(communityRegistryId),
        tx.object(CLOCK_ID),
      ],
    });

    return tx;
  }

  /**
   * Verify access pass for community features
   */
  async verifyAccess(
    accessPassId: string,
    communityRegistryId: string
  ): Promise<boolean> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::community_access::verify_access`,
        arguments: [
          tx.object(accessPassId),
          tx.object(communityRegistryId),
          tx.object(CLOCK_ID),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      if (result && result.results && result.results.length > 0 && result.results[0].returnValues) {
        const returnVals = result.results[0].returnValues;
        return Boolean(Array.isArray(returnVals[0]) ? returnVals[0][0] : returnVals[0]);
      }
      return false;
    } catch (e) {
      console.error("Error verifying access:", e);
      return false;
    }
  }

  /**
   * Get access configuration for a community
   */
  async getAccessConfiguration(
    communityId: string,
    communityRegistryId: string
  ): Promise<{
    accessType: number;
    requireNftHeld: boolean;
    minEventRating: number;
    expiryDuration: number;
  } | null> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::community_access::get_access_configuration`,
        arguments: [
          tx.pure.id(communityId),
          tx.object(communityRegistryId),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        if (Array.isArray(returnVals) && returnVals.length >= 4) {
          return {
            accessType: Number(Array.isArray(returnVals[0]) ? returnVals[0][0] : returnVals[0]),
            requireNftHeld: Boolean(Array.isArray(returnVals[1]) ? returnVals[1][0] : returnVals[1]),
            minEventRating: Number(Array.isArray(returnVals[2]) ? returnVals[2][0] : returnVals[2]),
            expiryDuration: Number(Array.isArray(returnVals[3]) ? returnVals[3][0] : returnVals[3]),
          };
        }
      }
      return null;
    } catch (e) {
      console.error("Error getting access configuration:", e);
      return null;
    }
  }

  /**
   * Get community organizer address
   */
  async getCommunityOrganizer(
    communityId: string,
    communityRegistryId: string
  ): Promise<string | null> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::community_access::get_community_organizer`,
        arguments: [
          tx.pure.id(communityId),
          tx.object(communityRegistryId),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      if (result && result.results && result.results.length > 0 && result.results[0].returnValues) {
        const returnVals = result.results[0].returnValues;
        return Array.isArray(returnVals[0]) ? String(returnVals[0][0]) : String(returnVals[0]);
      }
      return null;
    } catch (e) {
      console.error("Error getting community organizer:", e);
      return null;
    }
  }

  /**
   * Get event ID associated with a community
   */
  async getCommunityEventId(
    communityId: string,
    communityRegistryId: string
  ): Promise<string | null> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::community_access::get_community_event_id`,
        arguments: [
          tx.pure.id(communityId),
          tx.object(communityRegistryId),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0000000000000000000000000000000000000000000000000000000000000000",
      });

      if (result && result.results && result.results.length > 0 && result.results[0].returnValues) {
        const returnVals = result.results[0].returnValues;
        return Array.isArray(returnVals[0]) ? String(returnVals[0][0]) : String(returnVals[0]);
      }
      return null;
    } catch (e) {
      console.error("Error getting community event ID:", e);
      return null;
    }
  }

  /**
   * Get user memberships across all communities
   */
  async getUserMemberships(
    userAddress: string,
    communityRegistryId: string
  ): Promise<Array<{
    communityId: string;
    eventId: string;
    joinedAt: number;
    expiresAt: number;
    active: boolean;
  }>> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::community_access::get_user_memberships`,
        arguments: [
          tx.pure.address(userAddress),
          tx.object(communityRegistryId),
        ],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: userAddress,
      });

      if (result && result.results && result.results.length > 0 && result.results[0].returnValues) {
        // Parse the vector of memberships
        // This would need to be implemented based on the actual return format
        return [];
      }
      return [];
    } catch (e) {
      console.error("Error getting user memberships:", e);
      return [];
    }
  }
}
