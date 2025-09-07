import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "../../config/sui";
import { extractMoveObjectFields } from "../../utils/extractors";

// System clock object ID is constant
const CLOCK_ID = "0x6";

// Types based on Move module documentation
export interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  start_time: number;
  end_time: number;
  capacity: number;
  current_attendees: number;
  organizer: string;
  sponsors: string[]; // New field: List of sponsor names
  assignee: string; // New field: Person assigned to the event
  is_child: boolean; // New field: Whether this is a child event
  parent_id: string; // New field: Parent event ID if this is a child event
  state: number;
  created_at: number;
  sponsor_conditions: SponsorConditions;
  metadata_uri: string;
  fee_amount: number;
}

export interface OrganizerProfile {
  id: string;
  address: string;
  name: string;
  bio: string;
  total_events: number;
  successful_events: number;
  total_attendees_served: number;
  avg_rating: number;
  created_at: number;
}

export interface SponsorConditions {
  min_attendees: number;
  min_completion_rate: number;
  min_avg_rating: number;
  custom_benchmarks: CustomBenchmark[];
}

export interface CustomBenchmark {
  metric_name: string; // Changed from 'description' to match Move struct
  target_value: number;
  comparison_type: number; // New field: 0: >=, 1: <=, 2: ==
  // Removed 'current_value' as it's not in Move struct
}

export interface EventInfo {
  id: string;
  name: string;
  description: string;
  location: string;
  organizer: string;
  start_time: number;
  end_time: number;
  capacity: number;
  current_attendees: number;
  state: number;
  fee_amount: number;
  metadata_uri: string;
}

// Event States
export const EVENT_STATES = {
  CREATED: 0,
  ACTIVE: 1,
  COMPLETED: 2,
  SETTLED: 3,
} as const;

// Error Codes
export const ERROR_CODES = {
  ENotOrganizer: 1,
  EEventNotActive: 2,
  EEventAlreadyCompleted: 3,
  EInvalidCapacity: 4,
  EInvalidTimestamp: 5,
} as const;

export class EventManagementSDK {
  private packageId: string;

  constructor(packageId: string) {
    this.packageId = packageId;
  }

  getPackageId(): string {
    return this.packageId;
  }

  /**
   * Creates a new organizer profile
   */
  createOrganizerProfile(recipient: string): Transaction {
    const tx = new Transaction();

    const [organizerCap] = tx.moveCall({
      target: `${this.packageId}::event_management::create_organizer_profile`,
      arguments: [
        tx.object(CLOCK_ID),
      ],
    });

    // Transfer the OrganizerCap to the user
    tx.transferObjects([organizerCap], tx.pure.address(recipient));
    tx.setGasBudget(50000000); // Increased to 50,000,000 MIST = 0.05 SUI
    return tx;
  }

  /**
   * Creates a new event
   */
  createEvent(
    name: string,
    description: string,
    location: string,
    startTime: number,
    endTime: number,
    capacity: number,
    feeAmount: number,
    minAttendees: number,
    minCompletionRate: number,
    minAvgRating: number,
    metadataUri: string,
    sponsors: string[],
    assignee: string,
    isChild: boolean,
    parentId: string,
    eventRegistryId: string,
    organizerProfile: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::event_management::create_event`,
      arguments: [
        tx.pure.string(name),
        tx.pure.string(description),
        tx.pure.string(location),
        tx.pure.u64(startTime),
        tx.pure.u64(endTime),
        tx.pure.u64(capacity),
        tx.pure.u64(feeAmount),
        tx.pure.u64(minAttendees),
        tx.pure.u64(minCompletionRate),
        tx.pure.u64(minAvgRating),
        tx.pure.string(metadataUri),
        (tx.pure as any).vector("string", sponsors),
        tx.pure.string(assignee),
        tx.pure.bool(isChild),
        tx.pure.id(parentId),
        tx.object(CLOCK_ID),
        tx.object(eventRegistryId),
        tx.object(organizerProfile),
      ],
    });

    tx.setGasBudget(50000000); // 50,000,000 MIST = 0.05 SUI
    return tx;
  }

  /**
   * Activates an event for registration
   */
  activateEvent(eventId: string, eventRegistryId: string): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::event_management::activate_event`,
      arguments: [
        tx.object(eventId),
        tx.object(CLOCK_ID),
        tx.object(eventRegistryId),
      ],
    });

    return tx;
  }

  /**
   * Completes an event (only callable after end time)
   */
  completeEvent(
    eventId: string,
    eventRegistryId: string,
    profileId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::event_management::complete_event`,
      arguments: [
        tx.object(eventId),
        tx.object(CLOCK_ID),
        tx.object(eventRegistryId),
        tx.object(profileId),
      ],
    });

    return tx;
  }

  /**
   * Extract event ID from transaction result
   */
  extractEventIdFromResult(result: {
    events?: Array<{
      type?: string;
      parsedJson?: { event_id?: string };
    }>;
    objectChanges?: Array<{
      type: string;
      objectType?: string;
      objectId: string;
    }>;
  }): string | null {
    try {
      // Look for EventCreated event in the transaction result
      if (result.events) {
        for (const event of result.events) {
          if (event.type?.includes("EventCreated")) {
            return event.parsedJson?.event_id || null;
          }
        }
      }

      // Fallback: look for created objects
      if (result.objectChanges) {
        for (const change of result.objectChanges) {
          if (
            change.type === "created" &&
            change.objectType?.includes("Event")
          ) {
            return change.objectId;
          }
        }
      }

      return null;
    } catch (error) {
      
      return null;
    }
  }

  /**
   * Get event fee amount using Move function
   */
  async getEventFeeAmount(eventId: string): Promise<number> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::event_management::get_event_fee_amount`,
        arguments: [tx.object(eventId)],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: "0x0", // Use dummy sender for inspection
      });

      if (result && result.results && result.results.length > 0) {
        const returnVals = result.results[0].returnValues;
        if (Array.isArray(returnVals) && returnVals.length > 0) {
          const feeAmount = Array.isArray(returnVals[0]) 
            ? returnVals[0][0] 
            : returnVals[0];
          return typeof feeAmount === 'string' ? parseInt(feeAmount) : (feeAmount as unknown as number) || 0;
        }
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get event details by ID
   */
  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const response = await suiClient.getObject({
        id: eventId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (
        !response.data?.content ||
        response.data.content.dataType !== "moveObject"
      ) {
        return null;
      }

      const fields = response.data.content.fields as {
        id: { id: string };
        name: string;
        description: string;
        location: string;
        start_time: string;
        end_time: string;
        capacity: string;
        current_attendees: string;
        organizer: string;
        sponsors: string[];
        assignee: string;
        is_child: boolean;
        parent_id: string;
        state: string;
        created_at: string;
        sponsor_conditions: {
          min_attendees: number;
          min_completion_rate: number;
          min_avg_rating: number;
          custom_benchmarks: Array<{
            metric_name: string;
            target_value: number;
            comparison_type: number;
          }>;
        };
        metadata_uri: string;
        fee_amount: string;
      };
      return {
        id: fields.id.id,
        name: fields.name,
        description: fields.description,
        location: fields.location,
        start_time: parseInt(fields.start_time),
        end_time: parseInt(fields.end_time),
        capacity: parseInt(fields.capacity),
        current_attendees: parseInt(fields.current_attendees),
        organizer: fields.organizer,
        sponsors: fields.sponsors || [],
        assignee: fields.assignee || "",
        is_child: fields.is_child || false,
        parent_id: fields.parent_id || "",
        state: parseInt(fields.state),
        created_at: parseInt(fields.created_at),
        sponsor_conditions: fields.sponsor_conditions,
        metadata_uri: fields.metadata_uri,
        fee_amount: parseInt(fields.fee_amount),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get organizer profile by address
   */
  async getOrganizerProfile(
    profileId: string
  ): Promise<OrganizerProfile | null> {
    try {
      const response = await suiClient.getObject({
        id: profileId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (
        !response.data?.content ||
        response.data.content.dataType !== "moveObject"
      ) {
        return null;
      }

      const fields = response.data.content.fields as {
        id: { id: string };
        address: string;
        name: string;
        bio: string;
        total_events: string;
        successful_events: string;
        total_attendees_served: string;
        avg_rating: string;
        created_at: string;
      };
      return {
        id: fields.id.id,
        address: fields.address,
        name: fields.name,
        bio: fields.bio,
        total_events: parseInt(fields.total_events),
        successful_events: parseInt(fields.successful_events),
        total_attendees_served: parseInt(fields.total_attendees_served),
        avg_rating: parseInt(fields.avg_rating),
        created_at: parseInt(fields.created_at),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get events by organizer address
   */
  async getEventsByOrganizer(
    organizerAddress: string,
    _eventRegistryId: string // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<EventInfo[]> {
    try {
      // Since events are shared objects, we need to query them differently
      // For now, let's use a simple approach: query recent transactions and extract events
      const { data: transactions } = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: this.packageId,
            module: "event_management",
            function: "create_event",
          },
        },
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
        limit: 50,
      });

      const eventInfos: EventInfo[] = [];

      for (const txn of transactions) {
        if (txn.events) {
          for (const event of txn.events) {
            if (event.type?.includes("EventCreated")) {
              const eventData = event.parsedJson as {
                event_id: string;
                organizer: string;
              };
              if (
                eventData &&
                eventData.event_id &&
                eventData.organizer === organizerAddress
              ) {
                // Get the full event object
                const eventResponse = await suiClient.getObject({
                  id: eventData.event_id,
                  options: {
                    showContent: true,
                    showType: true,
                  },
                });

                if (eventResponse.data?.content?.dataType === "moveObject") {
                  const fields = eventResponse.data.content.fields as {
                    name: string;
                    description: string;
                    location: string;
                    organizer: string;
                    start_time: string;
                    end_time: string;
                    capacity: string;
                    current_attendees: string;
                    state: string;
                    fee_amount: string;
                    metadata_uri: string;
                  };
                  eventInfos.push({
                    id: eventData.event_id,
                    name: fields.name,
                    description: fields.description || "",
                    location: fields.location || "",
                    organizer: fields.organizer,
                    start_time: parseInt(fields.start_time),
                    end_time: parseInt(fields.end_time),
                    capacity: parseInt(fields.capacity),
                    current_attendees: parseInt(fields.current_attendees),
                    state: parseInt(fields.state),
                    fee_amount: parseInt(fields.fee_amount),
                    metadata_uri: fields.metadata_uri || "",
                  });
                }
              }
            }
          }
        }
      }

      return eventInfos;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all active events
   */
  async getActiveEvents(): Promise<EventInfo[]> {
    try {
      // Query recent transactions to get all events
      const { data: transactions } = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: this.packageId,
            module: "event_management",
            function: "create_event",
          },
        },
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
        limit: 100,
      });

      const eventInfos: EventInfo[] = [];

      for (const txn of transactions) {
        if (txn.events) {
          for (const event of txn.events) {
            if (event.type?.includes("EventCreated")) {
              const eventData = event.parsedJson as {
                event_id: string;
                organizer: string;
              };
              if (eventData && eventData.event_id) {
                // Get the full event object
                const eventResponse = await suiClient.getObject({
                  id: eventData.event_id,
                  options: {
                    showContent: true,
                    showType: true,
                  },
                });

                if (eventResponse.data?.content?.dataType === "moveObject") {
                  const fields = eventResponse.data.content.fields as {
                    name: string;
                    description: string;
                    location: string;
                    organizer: string;
                    start_time: string;
                    end_time: string;
                    capacity: string;
                    current_attendees: string;
                    state: string;
                    is_child: boolean;
                    fee_amount: string;
                    metadata_uri: string;
                  };
                  
                  // Only include parent events (not child events)
                  if (!fields.is_child) {
                    eventInfos.push({
                      id: eventData.event_id,
                      name: fields.name,
                      description: fields.description || "",
                      location: fields.location || "",
                      organizer: fields.organizer,
                      start_time: parseInt(fields.start_time),
                      end_time: parseInt(fields.end_time),
                      capacity: parseInt(fields.capacity),
                      current_attendees: parseInt(fields.current_attendees),
                      state: parseInt(fields.state),
                      fee_amount: parseInt(fields.fee_amount),
                      metadata_uri: fields.metadata_uri || "",
                    });
                  }
                }
              }
            }
          }
        }
      }

      return eventInfos;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get all organizers with profiles
   */
  async getAllOrganizers(): Promise<OrganizerProfile[]> {
    try {
      // Query for all OrganizerProfile objects
      const { data: transactions } = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: this.packageId,
            module: "event_management",
            function: "create_organizer_profile",
          },
        },
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
        limit: 100,
      });

      const organizers: OrganizerProfile[] = [];

      for (const txn of transactions) {
        if (txn.objectChanges) {
          for (const change of txn.objectChanges) {
            if (
              change.type === "created" &&
              change.objectType?.includes("OrganizerProfile")
            ) {
              const profileResponse = await suiClient.getObject({
                id: change.objectId,
                options: {
                  showContent: true,
                  showType: true,
                },
              });

              if (profileResponse.data?.content?.dataType === "moveObject") {
                const fields = profileResponse.data.content.fields as {
                  id: { id: string };
                  address: string;
                  name: string;
                  bio: string;
                  total_events: string;
                  successful_events: string;
                  total_attendees_served: string;
                  avg_rating: string;
                  created_at: string;
                };
                organizers.push({
                  id: fields.id.id,
                  address: fields.address,
                  name: fields.name,
                  bio: fields.bio,
                  total_events: parseInt(fields.total_events),
                  successful_events: parseInt(fields.successful_events),
                  total_attendees_served: parseInt(
                    fields.total_attendees_served
                  ),
                  avg_rating: parseInt(fields.avg_rating),
                  created_at: parseInt(fields.created_at),
                });
              }
            }
          }
        }
      }

      return organizers;
    } catch (error) {
      return [];
    }
  }

  async hasOrganizerProfile(address: string): Promise<boolean> {
    try {
      const { data: objects } = await suiClient.getOwnedObjects({
        owner: address,
        filter: {
          StructType: `${this.packageId}::event_management::OrganizerCap`,
        },
        options: { showContent: true },
      });

      if (objects.length === 0) return false;

      for (const obj of objects) {
        const fields = extractMoveObjectFields(obj);

        if (fields) {
          const profileId = fields.profile_id;

          const profileResponse = await suiClient.getObject({
            id: profileId,
            options: { showContent: true },
          });

          const profileFields = extractMoveObjectFields(profileResponse);

          if (profileFields && profileFields.address === address) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if a user has a regular profile
   */
  async hasProfile(
    address: string,
    profileRegistryId: string
  ): Promise<boolean> {
    try {
      // Query the ProfileRegistry to check if the user has a profile
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::event_management::has_profile`,
        arguments: [tx.object(profileRegistryId), tx.pure.address(address)],
      });

      const response = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: address,
      });

      return response.results?.[0]?.returnValues?.[0]?.[0]?.[0] === 1;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user profile ID from registry
   */
  async getUserProfileId(
    address: string,
    profileRegistryId: string
  ): Promise<string | null> {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${this.packageId}::event_management::get_user_profile_id`,
        arguments: [tx.object(profileRegistryId), tx.pure.address(address)],
      });

      const response = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: address,
      });

      const returnValue = response.results?.[0]?.returnValues?.[0];

      if (returnValue && Array.isArray(returnValue) && returnValue.length > 0) {
        // The return value should be a byte array representing the ID
        // We need to convert it to a proper Sui object ID format
        const idBytes = returnValue[0];
        if (typeof idBytes === 'string') {
          return idBytes;
        } else if (Array.isArray(idBytes)) {
          // If it's a byte array, we need to convert it to a hex string
          const hexString = '0x' + Array.from(idBytes as number[])
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          return hexString;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Creates a new regular user profile
   */
  createProfile(
    name: string,
    bio: string,
    photoUrl: string,
    telegramUsername: string,
    xUsername: string,
    profileRegistryId: string,
    recipient: string
  ): Transaction {
    const tx = new Transaction();

    const [profileCap] = tx.moveCall({
      target: `${this.packageId}::event_management::create_profile`,
      arguments: [
        tx.pure.string(name),
        tx.pure.string(bio),
        tx.pure.string(photoUrl),
        tx.pure.string(telegramUsername),
        tx.pure.string(xUsername),
        tx.object(CLOCK_ID),
        tx.object(profileRegistryId),
      ],
    });

    // Transfer the ProfileCap to the user
    tx.transferObjects([profileCap], tx.pure.address(recipient));
    tx.setGasBudget(50000000); // Increased to 50,000,000 MIST = 0.05 SUI
    return tx;
  }

  /**
   * Get user's ProfileCap by address
   */
  async getUserProfileCap(userAddress: string): Promise<{
    id: string;
    profile_id: string;
    owner: string;
  } | null> {
    try {
      const objects = await suiClient.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${this.packageId}::event_management::ProfileCap`,
        },
        options: {
          showContent: true,
        },
      });

      if (objects.data.length === 0) {
        return null;
      }

      const profileCap = objects.data[0];
      if (profileCap.data?.content && 'fields' in profileCap.data.content) {
        const fields = profileCap.data.content.fields as any;
        return {
          id: profileCap.data.objectId,
          profile_id: fields.profile_id,
          owner: fields.owner,
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update user profile (requires ProfileCap)
   */
  updateProfile(
    profileId: string,
    profileCapId: string,
    name: string,
    bio: string,
    photoUrl: string,
    telegramUsername: string,
    xUsername: string
  ): Transaction {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${this.packageId}::event_management::update_profile`,
      arguments: [
        tx.object(profileId),
        tx.object(profileCapId),
        tx.pure.string(name),
        tx.pure.string(bio),
        tx.pure.string(photoUrl),
        tx.pure.string(telegramUsername),
        tx.pure.string(xUsername),
      ],
    });
    
    tx.setGasBudget(10000000); // 10,000,000 MIST = 0.01 SUI
    return tx;
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(profileId: string): Promise<{
    id: string;
    address: string;
    name: string;
    bio: string;
    photo_url: string;
    telegram_username: string;
    x_username: string;
    created_at: number;
  } | null> {
    try {
      const response = await suiClient.getObject({
        id: profileId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (
        !response.data?.content ||
        response.data.content.dataType !== "moveObject"
      ) {
        return null;
      }

      const fields = response.data.content.fields as {
        id: { id: string };
        address: string;
        name: string;
        bio: string;
        photo_url: string;
        telegram_username: string;
        x_username: string;
        created_at: string;
      };
      
      return {
        id: fields.id.id,
        address: fields.address,
        name: fields.name,
        bio: fields.bio,
        photo_url: fields.photo_url,
        telegram_username: fields.telegram_username,
        x_username: fields.x_username,
        created_at: parseInt(fields.created_at),
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user profile by address (helper function)
   */
  async getUserProfileByAddress(
    address: string,
    profileRegistryId: string
  ): Promise<{
    id: string;
    address: string;
    name: string;
    bio: string;
    photo_url: string;
    telegram_username: string;
    x_username: string;
    created_at: number;
  } | null> {
    try {
      // First check if user has a profile
      const hasProfile = await this.hasProfile(address, profileRegistryId);
      
      if (!hasProfile) {
        return null;
      }

      // Get the profile ID
      const profileId = await this.getUserProfileId(address, profileRegistryId);
      
      if (!profileId) {
        return null;
      }

      // Validate profile ID format
      if (typeof profileId !== 'string' || !profileId.startsWith('0x')) {
        return null;
      }

      // Get the profile details
      const profile = await this.getUserProfile(profileId);
      
      return profile;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get real-time attendee count for an event
   */
  async getEventAttendeeCount(
    eventId: string,
    _registrationRegistryId: string // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<number> {
    try {
      // Query both paid and free registration events for this specific event
      const [paidTransactions, freeTransactions] = await Promise.all([
        suiClient.queryTransactionBlocks({
          filter: {
            MoveFunction: {
              package: this.packageId,
              module: "identity_access",
              function: "register_for_event",
            },
          },
          options: {
            showEffects: true,
            showEvents: true,
            showObjectChanges: true,
          },
          limit: 100,
        }),
        suiClient.queryTransactionBlocks({
          filter: {
            MoveFunction: {
              package: this.packageId,
              module: "identity_access",
              function: "register_for_free_event",
            },
          },
          options: {
            showEffects: true,
            showEvents: true,
            showObjectChanges: true,
          },
          limit: 100,
        })
      ]);

      let attendeeCount = 0;

      // Combine both transaction sets
      const allTransactions = [
        ...(paidTransactions.data || []),
        ...(freeTransactions.data || [])
      ];

      // Count UserRegistered events for this event
      for (const txn of allTransactions) {
        if (txn.events) {
          for (const event of txn.events) {
            if (event.type?.includes("UserRegistered")) {
              const eventData = event.parsedJson as {
                event_id: string;
                wallet: string;
              };

              if (eventData && eventData.event_id === eventId) {
                attendeeCount++;
              }
            }
          }
        }
      }
      

      return attendeeCount;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get list of registered users for an event with their wallet addresses
   */
  async getEventRegisteredUsers(
    eventId: string
  ): Promise<Array<{ wallet: string; registeredAt: number }>> {
    try {
      // Query both paid and free registration events for this specific event
      const [paidTransactions, freeTransactions] = await Promise.all([
        suiClient.queryTransactionBlocks({
          filter: {
            MoveFunction: {
              package: this.packageId,
              module: "identity_access",
              function: "register_for_event",
            },
          },
          options: {
            showEffects: true,
            showEvents: true,
            showObjectChanges: true,
          },
          limit: 100,
        }),
        suiClient.queryTransactionBlocks({
          filter: {
            MoveFunction: {
              package: this.packageId,
              module: "identity_access",
              function: "register_for_free_event",
            },
          },
          options: {
            showEffects: true,
            showEvents: true,
            showObjectChanges: true,
          },
          limit: 100,
        })
      ]);

      const registeredUsers: Array<{ wallet: string; registeredAt: number }> = [];

      // Combine both transaction sets
      const allTransactions = [
        ...(paidTransactions.data || []),
        ...(freeTransactions.data || [])
      ];

      // Extract registered users for this event
      for (const txn of allTransactions) {
        if (txn.events) {
          for (const event of txn.events) {
            if (event.type?.includes("UserRegistered")) {
              const eventData = event.parsedJson as {
                event_id: string;
                wallet: string;
              };

              if (eventData && eventData.event_id === eventId) {
                registeredUsers.push({
                  wallet: eventData.wallet,
                  registeredAt: txn.timestampMs ? parseInt(txn.timestampMs) : Date.now()
                });
              }
            }
          }
        }
      }

      return registeredUsers;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get list of checked-in users for an event with their wallet addresses
   */
  async getEventCheckedInUsers(
    eventId: string,
    _attendanceRegistryId: string
  ): Promise<Array<{ wallet: string; checkedInAt: number }>> {
    try {
      // Query attendance events for this event
      const { data: transactions } = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: this.packageId,
            module: "attendance_verification",
            function: "check_in_attendee",
          },
        },
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
        limit: 100,
      });

      const checkedInUsers: Array<{ wallet: string; checkedInAt: number }> = [];

      for (const txn of transactions) {
        if (txn.events) {
          for (const event of txn.events) {
            if (event.type?.includes("AttendeeCheckedIn")) {
              const eventData = event.parsedJson as {
                event_id: string;
                attendee: string;
                check_in_time: number;
              };

              if (eventData && eventData.event_id === eventId) {
                checkedInUsers.push({
                  wallet: eventData.attendee,
                  checkedInAt: eventData.check_in_time
                });
              }
            }
          }
        }
      }

      return checkedInUsers;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get event with real-time attendee count
   */
  async getEventWithAttendeeCount(
    eventId: string,
    registrationRegistryId: string
  ): Promise<Event | null> {
    try {
      const event = await this.getEvent(eventId);
      if (!event) return null;

      const attendeeCount = await this.getEventAttendeeCount(
        eventId,
        registrationRegistryId
      );

      return {
        ...event,
        current_attendees: attendeeCount,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete an event (only organizer, only if not active and no attendees)
   */
  deleteEvent(
    eventId: string,
    eventRegistryId: string
  ): Transaction {
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.packageId}::event_management::delete_event`,
      arguments: [
        tx.object(eventId), // event: Event
        tx.object(eventRegistryId), // registry: &mut EventRegistry
      ],
    });
    return tx;
  }

  /**
   * Get events assigned to a specific user
   */
  async getEventsAssignedToUser(
    assignee: string,
    eventRegistryId: string
  ): Promise<EventInfo[]> {
    try {
      // Validate parameters
      if (!eventRegistryId || !eventRegistryId.startsWith('0x')) {
        return [];
      }

      if (!assignee || assignee.trim() === '') {
        return [];
      }

      // Try a different approach - query the EventRegistry directly
      try {
        const registryResponse = await suiClient.getObject({
          id: eventRegistryId,
          options: {
            showContent: true,
            showType: true,
          },
        });

        if (registryResponse.data?.content?.dataType === "moveObject") {
          const registryFields = registryResponse.data.content.fields as any;
          
          // Check if there's an events_by_assignee field
          if (registryFields.events_by_assignee) {
            // This would require additional processing to extract the data
            // For now, let's fall back to the transaction query approach
          }
        }
      } catch (registryError) {
        // Could not query EventRegistry directly, continue with fallback
      }

      // Fall back to querying all events and filtering by assignee
      const { data: transactions } = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: this.packageId,
            module: "event_management",
            function: "create_event",
          },
        },
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
        limit: 100,
      });

      const events: EventInfo[] = [];

      for (const txn of transactions) {
        if (txn.events) {
          for (const event of txn.events) {
            if (event.type?.includes("EventCreated")) {
              const eventData = event.parsedJson as {
                event_id: string;
                organizer: string;
              };
              if (eventData && eventData.event_id) {
                // Get the full event object
                const eventResponse = await suiClient.getObject({
                  id: eventData.event_id,
                  options: {
                    showContent: true,
                    showType: true,
                  },
                });

                if (eventResponse.data?.content?.dataType === "moveObject") {
                  const fields = eventResponse.data.content.fields as {
                    name: string;
                    description: string;
                    location: string;
                    organizer: string;
                    start_time: string;
                    end_time: string;
                    capacity: string;
                    current_attendees: string;
                    state: string;
                    assignee: string;
                    fee_amount: string;
                    metadata_uri: string;
                  };
                  
                  // Check if this event is assigned to the user
                  if (fields.assignee === assignee) {
                    events.push({
                      id: eventData.event_id,
                      name: fields.name,
                      description: fields.description || "",
                      location: fields.location || "",
                      organizer: fields.organizer,
                      start_time: parseInt(fields.start_time),
                      end_time: parseInt(fields.end_time),
                      capacity: parseInt(fields.capacity),
                      current_attendees: parseInt(fields.current_attendees),
                      state: parseInt(fields.state),
                      fee_amount: parseInt(fields.fee_amount),
                      metadata_uri: fields.metadata_uri || "",
                    });
                  }
                }
              }
            }
          }
        }
      }

      return events;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get child events of a parent event
   */
  async getChildEvents(
    parentEventId: string,
    eventRegistryId: string
  ): Promise<EventInfo[]> {
    try {
      const { data } = await suiClient.getDynamicFields({
        parentId: eventRegistryId,
      });

      const childEvents: EventInfo[] = [];
      
      for (const field of data) {
        // Since getDynamicFields doesn't return content, we need to fetch each object separately
        try {
          const objectResponse = await suiClient.getObject({
            id: field.objectId,
            options: { showContent: true },
          });
          
          if (objectResponse.data?.content?.dataType === "moveObject") {
            const fields = objectResponse.data.content.fields as any;
            if (fields?.parent_id === parentEventId) {
              childEvents.push({
                id: field.objectId,
                name: fields.name || "",
                description: fields.description || "",
                location: fields.location || "",
                organizer: fields.organizer || "",
                start_time: parseInt(fields.start_time) || 0,
                end_time: parseInt(fields.end_time) || 0,
                capacity: parseInt(fields.capacity) || 0,
                current_attendees: parseInt(fields.current_attendees) || 0,
                state: parseInt(fields.state) || 0,
                fee_amount: parseInt(fields.fee_amount) || 0,
                metadata_uri: fields.metadata_uri || "",
              });
            }
          }
        } catch (error) {
          // Error fetching object
        }
      }

      return childEvents;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get child events for a parent event (alternative method using direct query)
   */
  async getChildEventsForParent(parentEventId: string): Promise<Event[]> {
    try {
      // Query for all events and filter for children of this parent
      const { data: transactions } = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: this.packageId,
            module: "event_management",
            function: "create_event",
          },
        },
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
        limit: 100,
      });

      const childEvents: Event[] = [];

      for (const txn of transactions) {
        if (txn.events) {
          for (const event of txn.events) {
            if (event.type?.includes("EventCreated")) {
              const eventData = event.parsedJson as {
                event_id: string;
                organizer: string;
              };
              if (eventData && eventData.event_id) {
                // Get the full event object
                const eventResponse = await suiClient.getObject({
                  id: eventData.event_id,
                  options: {
                    showContent: true,
                    showType: true,
                  },
                });

                if (eventResponse.data?.content?.dataType === "moveObject") {
                  const fields = eventResponse.data.content.fields as {
                    id: { id: string };
                    name: string;
                    description: string;
                    location: string;
                    start_time: string;
                    end_time: string;
                    capacity: string;
                    current_attendees: string;
                    organizer: string;
                    sponsors: string[];
                    assignee: string;
                    is_child: boolean;
                    parent_id: string;
                    state: string;
                    created_at: string;
                    sponsor_conditions: any;
                    metadata_uri: string;
                    fee_amount: string;
                  };
                  
                  // Check if this is a child event of the specified parent
                  if (fields.is_child && fields.parent_id === parentEventId) {
                    childEvents.push({
                      id: fields.id.id,
                      name: fields.name,
                      description: fields.description,
                      location: fields.location,
                      start_time: parseInt(fields.start_time),
                      end_time: parseInt(fields.end_time),
                      capacity: parseInt(fields.capacity),
                      current_attendees: parseInt(fields.current_attendees),
                      organizer: fields.organizer,
                      sponsors: fields.sponsors || [],
                      assignee: fields.assignee || "",
                      is_child: fields.is_child,
                      parent_id: fields.parent_id,
                      state: parseInt(fields.state),
                      created_at: parseInt(fields.created_at),
                      sponsor_conditions: fields.sponsor_conditions,
                      metadata_uri: fields.metadata_uri,
                      fee_amount: parseInt(fields.fee_amount),
                    });
                  }
                }
              }
            }
          }
        }
      }

      return childEvents;
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if X username exists in profile registry
   */
  async hasXUsername(
    xUsername: string,
    profileRegistryId: string
  ): Promise<boolean> {
    try {
      const { data } = await suiClient.getDynamicFields({
        parentId: profileRegistryId,
      });

      for (const field of data) {
        try {
          const objectResponse = await suiClient.getObject({
            id: field.objectId,
            options: { showContent: true },
          });
          
          if (objectResponse.data?.content?.dataType === "moveObject") {
            const fields = objectResponse.data.content.fields as any;
            if (fields?.value === xUsername) {
              return true;
            }
          }
        } catch (error) {
          // Error fetching object
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Telegram username exists in profile registry
   */
  async hasTelegramUsername(
    telegramUsername: string,
    profileRegistryId: string
  ): Promise<boolean> {
    try {
      const { data } = await suiClient.getDynamicFields({
        parentId: profileRegistryId,
      });

      for (const field of data) {
        try {
          const objectResponse = await suiClient.getObject({
            id: field.objectId,
            options: { showContent: true },
          });
          
          if (objectResponse.data?.content?.dataType === "moveObject") {
            const fields = objectResponse.data.content.fields as any;
            if (fields?.value === telegramUsername) {
              return true;
            }
          }
        } catch (error) {
          // Error fetching object
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get address from X username
   */
  async getAddressFromX(
    xUsername: string,
    profileRegistryId: string
  ): Promise<string | null> {
    try {
      const { data } = await suiClient.getDynamicFields({
        parentId: profileRegistryId,
      });

      for (const field of data) {
        try {
          const objectResponse = await suiClient.getObject({
            id: field.objectId,
            options: { showContent: true },
          });
          
          if (objectResponse.data?.content?.dataType === "moveObject") {
            const fields = objectResponse.data.content.fields as any;
            if (fields?.value === xUsername) {
              // The field name should contain the address
              return String(field.name.value);
            }
          }
        } catch (error) {
          // Error fetching object
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get address from Telegram username
   */
  async getAddressFromTelegram(
    telegramUsername: string,
    profileRegistryId: string
  ): Promise<string | null> {
    try {
      const { data } = await suiClient.getDynamicFields({
        parentId: profileRegistryId,
       
      });

      for (const field of data) {
        try {
          const objectResponse = await suiClient.getObject({
            id: field.objectId,
            options: { showContent: true },
          });
          
          if (objectResponse.data?.content?.dataType === "moveObject") {
            const fields = objectResponse.data.content.fields as any;
            if (fields?.value === telegramUsername) {
              // The field name should contain the address
              return String(field.name.value);
            }
          }
        } catch (error) {
          // Error fetching object
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get custom benchmarks from sponsor conditions
   */
  async getCustomBenchmarks(
    eventId: string
  ): Promise<CustomBenchmark[]> {
    try {
      const event = await this.getEvent(eventId);
      if (!event) return [];

      return event.sponsor_conditions.custom_benchmarks || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Get benchmark metric name
   */
  getBenchmarkMetricName(benchmark: CustomBenchmark): string {
    return benchmark.metric_name;
  }

  /**
   * Get benchmark target value
   */
  getBenchmarkTargetValue(benchmark: CustomBenchmark): number {
    return benchmark.target_value;
  }

  /**
   * Get benchmark comparison type
   */
  getBenchmarkComparisonType(benchmark: CustomBenchmark): number {
    return benchmark.comparison_type;
  }

  /**
   * Update event assignee
   */
  updateEventAssignee(
    eventId: string,
    assignee: string,
    eventRegistryId: string
  ): Transaction {
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.packageId}::event_management::update_event_assignee`,
      arguments: [
        tx.object(eventId),
        tx.pure.string(assignee),
        tx.object(eventRegistryId),
      ],
    });
    tx.setGasBudget(50000000); // 50,000,000 MIST = 0.05 SUI
    return tx;
  }

  /**
   * Validate assignee input (address, X username, or Telegram username)
   */
  async validateAssignee(
    input: string,
    profileRegistryId: string
  ): Promise<{
    isValid: boolean;
    address: string | null;
    error?: string;
    displayName?: string;
  }> {
    try {
      // Check if input is a valid Sui address
      if (input.startsWith('0x') && input.length === 66) {
        const hasProfile = await this.hasProfile(input, profileRegistryId);
        if (hasProfile) {
          const profile = await this.getUserProfileByAddress(input, profileRegistryId);
          return {
            isValid: true,
            address: input,
            displayName: profile?.name || input,
          };
        }
        return {
          isValid: false,
          address: null,
          error: 'Address does not have a profile',
        };
      }

      // Check if input is X username (starts with @ or contains @)
      if (input.startsWith('@') || input.includes('@')) {
        const xUsername = input.startsWith('@') ? input.slice(1) : input;
        const hasXUsername = await this.hasXUsername(xUsername, profileRegistryId);
        if (hasXUsername) {
          const address = await this.getAddressFromX(xUsername, profileRegistryId);
          if (address) {
            const profile = await this.getUserProfileByAddress(address, profileRegistryId);
            return {
              isValid: true,
              address,
              displayName: profile?.name || `@${xUsername}`,
            };
          }
        }
        return {
          isValid: false,
          address: null,
          error: 'X username not found',
        };
      }

      // Check if input is Telegram username (starts with t.me/ or @)
      if (input.startsWith('t.me/') || input.startsWith('@')) {
        const telegramUsername = input.replace('t.me/', '').replace('@', '');
        const hasTelegramUsername = await this.hasTelegramUsername(telegramUsername, profileRegistryId);
        if (hasTelegramUsername) {
          const address = await this.getAddressFromTelegram(telegramUsername, profileRegistryId);
          if (address) {
            const profile = await this.getUserProfileByAddress(address, profileRegistryId);
            return {
              isValid: true,
              address,
              displayName: profile?.name || `@${telegramUsername}`,
            };
          }
        }
        return {
          isValid: false,
          address: null,
          error: 'Telegram username not found',
        };
      }

      // Check if input is just a username (try both X and Telegram)
      const hasXUsername = await this.hasXUsername(input, profileRegistryId);
      if (hasXUsername) {
        const address = await this.getAddressFromX(input, profileRegistryId);
        if (address) {
          const profile = await this.getUserProfileByAddress(address, profileRegistryId);
          return {
            isValid: true,
            address,
            displayName: profile?.name || `@${input}`,
          };
        }
      }

      const hasTelegramUsername = await this.hasTelegramUsername(input, profileRegistryId);
      if (hasTelegramUsername) {
        const address = await this.getAddressFromTelegram(input, profileRegistryId);
        if (address) {
          const profile = await this.getUserProfileByAddress(address, profileRegistryId);
          return {
            isValid: true,
            address,
            displayName: profile?.name || `@${input}`,
          };
        }
      }

      return {
        isValid: false,
        address: null,
        error: 'Invalid assignee format. Use address, @username, or t.me/username',
      };
    } catch (error) {
      return {
        isValid: false,
        address: null,
        error: 'Error validating assignee',
      };
    }
  }

  /**
   * Get events assigned to current user
   */
  async getMyAssignedEvents(
    userAddress: string,
    eventRegistryId: string
  ): Promise<EventInfo[]> {
    try {
      // Get events assigned to user by address
      const addressEvents = await this.getEventsAssignedToUser(userAddress, eventRegistryId);
      
      // Get events assigned to user by X username
      const profile = await this.getUserProfileByAddress(userAddress, eventRegistryId);
      
      let xUsernameEvents: EventInfo[] = [];
      if (profile?.x_username) {
        xUsernameEvents = await this.getEventsAssignedToUser(profile.x_username, eventRegistryId);
      }

      // Get events assigned to user by Telegram username
      let telegramUsernameEvents: EventInfo[] = [];
      if (profile?.telegram_username) {
        telegramUsernameEvents = await this.getEventsAssignedToUser(profile.telegram_username, eventRegistryId);
      }

      // Combine and deduplicate events
      const allEvents = [...addressEvents, ...xUsernameEvents, ...telegramUsernameEvents];
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );

      return uniqueEvents;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get username from address (reverse lookup)
   */
  async getUsernameFromAddress(
    address: string,
    profileRegistryId: string
  ): Promise<{
    name: string;
    x_username: string;
    telegram_username: string;
  } | null> {
    try {
      // Get user profile by address
      const profile = await this.getUserProfileByAddress(address, profileRegistryId);
      
      if (profile) {
        return {
          name: profile.name,
          x_username: profile.x_username,
          telegram_username: profile.telegram_username,
        };
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}
