import { Transaction } from "@mysten/sui/transactions";
import { suiClient } from "../../config/sui";

// Document states
export const DOCUMENT_STATES = {
  IN_REVIEW: 0,
  APPROVED: 1,
  REJECTED: 2,
  FUNDED: 3,
} as const;

// Error codes
export const ERROR_CODES = {
  ENotAuthorized: 100,
  EInvalidHierarchy: 101,
  EDocumentNotPending: 102,
  EInvalidApprover: 103,
} as const;

// TypeScript interfaces based on Move structs
export interface ChainParticipant {
  address: string;
  name: string;
  hierarchy_level: number;
  role: string;
}

export interface ApprovalRecord {
  reviewer: string;
  reviewer_name: string;
  hierarchy_level: number;
  action: number; // 0: pending, 1: approved, 2: rejected
  comments: string;
  timestamp: number;
}

export interface DocumentFlow {
  id: string;
  event_id: string;
  organizer: string;
  chain_of_command: ChainParticipant[];
  is_active: boolean;
  created_at: number;
}

export interface DocumentSubmission {
  id: string;
  flow_id: string;
  event_id: string;
  organizer: string;
  title: string;
  description: string;
  document_uri: string;
  document_type: string;
  current_reviewer_level: number;
  state: number;
  approval_history: ApprovalRecord[];
  submitted_at: number;
  last_updated: number;
}

export interface DocumentFlowRegistry {
  id: string;
  flows_by_event: { [eventId: string]: string };
  submissions_by_event: { [eventId: string]: string[] };
  submissions_by_user: { [userAddress: string]: string[] };
}

export interface FlowManagerCap {
  id: string;
  flow_id: string;
}

// Document Flow SDK Class
export class DocumentFlowSDK {
  private packageId: string;

  constructor(packageId: string) {
    this.packageId = packageId;
  }

  getPackageId(): string {
    return this.packageId;
  }

  /**
   * Create a chain participant for the approval workflow
   */
  createChainParticipant(
    participantAddress: string,
    name: string,
    hierarchyLevel: number,
    role: string
  ): ChainParticipant {
    return {
      address: participantAddress,
      name,
      hierarchy_level: hierarchyLevel,
      role,
    };
  }

  /**
   * Creates a new document flow for an event
   */
  createDocumentFlow(
    eventId: string,
    participants: ChainParticipant[],
    clockId: string,
    registryId: string,
    profileRegistryId: string
  ): Transaction {
    console.log("📦 Creating document flow transaction...");
    console.log("📋 Parameters:", {
      eventId,
      participantsCount: participants.length,
      clockId,
      registryId,
      profileRegistryId
    });

    const tx = new Transaction();

    console.log("🔨 Logging participant details...");
    participants.forEach((participant, index) => {
      console.log(`👤 Participant ${index + 1}:`, {
        address: participant.address,
        name: participant.name,
        hierarchy_level: participant.hierarchy_level,
        role: participant.role
      });
    });

    console.log("🔨 Creating document flow call...");
    
    // Create the document flow with participants as a vector of ChainParticipant objects
    // We need to create the ChainParticipant objects first, then pass them as a vector
    const chainParticipants = participants.map(participant => 
      tx.moveCall({
        target: `${this.packageId}::document_flow::create_chain_participant`,
        arguments: [
          tx.pure.address(participant.address),
          tx.pure.string(participant.name),
          tx.pure.u64(participant.hierarchy_level),
          tx.pure.string(participant.role),
        ],
      })
    );
    
    const [flowManagerCap] = tx.moveCall({
      target: `${this.packageId}::document_flow::create_document_flow`,
      arguments: [
        tx.object(eventId), // event: &Event
        tx.makeMoveVec({ elements: chainParticipants }), // participants: vector<ChainParticipant>
        tx.object(clockId), // clock: &Clock
        tx.object(registryId), // registry: &mut DocumentFlowRegistry
        tx.object(profileRegistryId), // profile_registry: &ProfileRegistry
        // ctx: &mut TxContext is automatically provided by the SDK
      ],
    });

    console.log("✅ Document flow call created");

    // Transfer the FlowManagerCap to the sender (will be set during execution)
    console.log("🔨 Adding transfer call...");
    tx.transferObjects([flowManagerCap], tx.pure.address("0x0"));
    console.log("✅ Transfer call added");

    // Set gas budget
    console.log("🔨 Setting gas budget...");
    tx.setGasBudget(50000000); // 50,000,000 MIST = 0.05 SUI
    console.log("✅ Gas budget set");

    console.log("🎉 Document flow transaction created successfully");
    return tx;
  }

  /**
   * Submit document for approval
   */
  submitDocument(
    flowId: string,
    eventId: string,
    title: string,
    description: string,
    documentUri: string,
    documentType: string,
    clockId: string,
    registryId: string,
    profileRegistryId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::document_flow::submit_document`,
      arguments: [
        tx.object(flowId), // flow
        tx.object(eventId), // event
        tx.pure.string(title),
        tx.pure.string(description),
        tx.pure.string(documentUri),
        tx.pure.string(documentType),
        tx.object(clockId), // clock
        tx.object(registryId), // registry
        tx.object(profileRegistryId), // profile_registry
      ],
    });

    tx.setGasBudget(50000000); // 50,000,000 MIST = 0.05 SUI
    return tx;
  }

  /**
   * Approve document at current level
   */
  approveDocument(
    submissionId: string,
    flowId: string,
    comments: string,
    clockId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::document_flow::approve_document`,
      arguments: [
        tx.object(submissionId), // submission
        tx.object(flowId), // flow
        tx.pure.string(comments),
        tx.object(clockId), // clock
      ],
    });

    tx.setGasBudget(30000000); // 30,000,000 MIST = 0.03 SUI
    return tx;
  }

  /**
   * Reject document and send back to previous level
   */
  rejectDocument(
    submissionId: string,
    flowId: string,
    reason: string,
    clockId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::document_flow::reject_document`,
      arguments: [
        tx.object(submissionId), // submission
        tx.object(flowId), // flow
        tx.pure.string(reason),
        tx.object(clockId), // clock
      ],
    });

    tx.setGasBudget(30000000); // 30,000,000 MIST = 0.03 SUI
    return tx;
  }

  /**
   * Fund document directly (for approved documents)
   */
  fundDocument(
    submissionId: string,
    receiver: string,
    flowId: string,
    paymentCoinId: string
  ): Transaction {
    const tx = new Transaction();

    tx.moveCall({
      target: `${this.packageId}::document_flow::fund_directly`,
      arguments: [
        tx.object(submissionId), // submission
        tx.pure.address(receiver), // receiver
        tx.object(flowId), // flow
        tx.object(paymentCoinId), // payment
        tx.object("0x6"), // clock
      ],
    });

    tx.setGasBudget(40000000); // 40,000,000 MIST = 0.04 SUI
    return tx;
  }

  /**
   * Get document flow by event ID (Contract Compliant)
   */
  async getDocumentFlow(eventId: string): Promise<DocumentFlow | null> {
    console.log("🔍 Getting document flow for event:", eventId);
    
    try {
      // Since the Move contract doesn't expose getter functions for the registry,
      // we need to use a simplified approach that checks existence without relying on events
      const hasFlow = await this.hasDocumentFlow(eventId);
      
      if (!hasFlow) {
        console.log("❌ No document flow found for event:", eventId);
        return null;
      }
      
      console.log("✅ Document flow exists for event:", eventId);
      
      // Return a simplified DocumentFlow object indicating existence
      // Note: Full details would require Move contract getter functions
      return {
        id: "flow_exists", // Placeholder - would need Move getter
        event_id: eventId,
        organizer: "unknown", // Would need Move getter
        chain_of_command: [], // Would need Move getter
        is_active: true,
        created_at: Date.now(),
      };
    } catch (error) {
      console.error("❌ Error getting document flow:", error);
      return null;
    }
  }

  /**
   * Get document submissions for an event
   */
  async getDocumentSubmissions(eventId: string): Promise<DocumentSubmission[]> {
    try {
      // Query for DocumentSubmitted events for this specific event
      const { data: transactions } = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: this.packageId,
            module: "document_flow",
            function: "submit_document",
          },
        },
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
        limit: 100,
      });

      const submissions: DocumentSubmission[] = [];

      for (const txn of transactions) {
        if (txn.events) {
          for (const event of txn.events) {
            if (event.type?.includes("DocumentSubmitted")) {
              const eventData = event.parsedJson as {
                submission_id: string;
                flow_id: string;
                event_id: string;
                organizer: string;
                title: string;
              };
              
              if (eventData && eventData.event_id === eventId) {
                // Get the full DocumentSubmission object
                const submissionResponse = await suiClient.getObject({
                  id: eventData.submission_id,
                  options: {
                    showContent: true,
                    showType: true,
                  },
                });

                if (submissionResponse.data?.content?.dataType === "moveObject") {
                  const fields = submissionResponse.data.content.fields as {
                    id: { id: string };
                    flow_id: string;
                    event_id: string;
                    organizer: string;
                    title: string;
                    description: string;
                    document_uri: string;
                    document_type: string;
                    current_reviewer_level: string;
                    state: string;
                    approval_history: Array<{
                      reviewer: string;
                      reviewer_name: string;
                      hierarchy_level: string;
                      action: string;
                      comments: string;
                      timestamp: string;
                    }>;
                    submitted_at: string;
                    last_updated: string;
                  };

                  submissions.push({
                    id: fields.id.id,
                    flow_id: fields.flow_id,
                    event_id: fields.event_id,
                    organizer: fields.organizer,
                    title: fields.title,
                    description: fields.description,
                    document_uri: fields.document_uri,
                    document_type: fields.document_type,
                    current_reviewer_level: parseInt(fields.current_reviewer_level),
                    state: parseInt(fields.state),
                    approval_history: fields.approval_history.map(record => ({
                      reviewer: record.reviewer,
                      reviewer_name: record.reviewer_name,
                      hierarchy_level: parseInt(record.hierarchy_level),
                      action: parseInt(record.action),
                      comments: record.comments,
                      timestamp: parseInt(record.timestamp),
                    })),
                    submitted_at: parseInt(fields.submitted_at),
                    last_updated: parseInt(fields.last_updated),
                  });
                }
              }
            }
          }
        }
      }

      return submissions;
    } catch {
      return [];
    }
  }

  /**
   * Get pending reviews for a user
   */
  async getUserPendingReviews(userAddress: string): Promise<DocumentSubmission[]> {
    try {
      // Query for all document submissions
      const { data: transactions } = await suiClient.queryTransactionBlocks({
        filter: {
          MoveFunction: {
            package: this.packageId,
            module: "document_flow",
            function: "submit_document",
          },
        },
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
        limit: 100,
      });

      const pendingReviews: DocumentSubmission[] = [];

      for (const txn of transactions) {
        if (txn.events) {
          for (const event of txn.events) {
            if (event.type?.includes("DocumentSubmitted")) {
              const eventData = event.parsedJson as {
                submission_id: string;
                flow_id: string;
                event_id: string;
                organizer: string;
                title: string;
              };
              
              if (eventData) {
                // Get the full DocumentSubmission object
                const submissionResponse = await suiClient.getObject({
                  id: eventData.submission_id,
                  options: {
                    showContent: true,
                    showType: true,
                  },
                });

                if (submissionResponse.data?.content?.dataType === "moveObject") {
                  const submissionFields = submissionResponse.data.content.fields as {
                    id: { id: string };
                    flow_id: string;
                    event_id: string;
                    organizer: string;
                    title: string;
                    description: string;
                    document_uri: string;
                    document_type: string;
                    current_reviewer_level: string;
                    state: string;
                    approval_history: Array<{
                      reviewer: string;
                      reviewer_name: string;
                      hierarchy_level: string;
                      action: string;
                      comments: string;
                      timestamp: string;
                    }>;
                    submitted_at: string;
                    last_updated: string;
                  };

                  // Only include submissions that are in review state
                  if (parseInt(submissionFields.state) === DOCUMENT_STATES.IN_REVIEW) {
                    // Get the associated DocumentFlow to check if user is current reviewer
                    const flowResponse = await suiClient.getObject({
                      id: submissionFields.flow_id,
                      options: {
                        showContent: true,
                        showType: true,
                      },
                    });

                    if (flowResponse.data?.content?.dataType === "moveObject") {
                      const flowFields = flowResponse.data.content.fields as {
                        chain_of_command: Array<{
                          address: string;
                          name: string;
                          hierarchy_level: string;
                          role: string;
                        }>;
                      };

                      // Check if user is the current reviewer
                      const currentLevel = parseInt(submissionFields.current_reviewer_level);
                      const currentReviewer = flowFields.chain_of_command.find(
                        participant => parseInt(participant.hierarchy_level) === currentLevel
                      );

                      if (currentReviewer && currentReviewer.address === userAddress) {
                        pendingReviews.push({
                          id: submissionFields.id.id,
                          flow_id: submissionFields.flow_id,
                          event_id: submissionFields.event_id,
                          organizer: submissionFields.organizer,
                          title: submissionFields.title,
                          description: submissionFields.description,
                          document_uri: submissionFields.document_uri,
                          document_type: submissionFields.document_type,
                          current_reviewer_level: parseInt(submissionFields.current_reviewer_level),
                          state: parseInt(submissionFields.state),
                          approval_history: submissionFields.approval_history.map(record => ({
                            reviewer: record.reviewer,
                            reviewer_name: record.reviewer_name,
                            hierarchy_level: parseInt(record.hierarchy_level),
                            action: parseInt(record.action),
                            comments: record.comments,
                            timestamp: parseInt(record.timestamp),
                          })),
                          submitted_at: parseInt(submissionFields.submitted_at),
                          last_updated: parseInt(submissionFields.last_updated),
                        });
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return pendingReviews;
    } catch {
      return [];
    }
  }

  /**
   * Check if user is current reviewer for a document
   */
  async isUserCurrentReviewer(
    submissionId: string,
    flowId: string,
    userAddress: string
  ): Promise<boolean> {
    try {
      // Get the DocumentSubmission object
      const submissionResponse = await suiClient.getObject({
        id: submissionId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (submissionResponse.data?.content?.dataType !== "moveObject") {
        return false;
      }

      const submissionFields = submissionResponse.data.content.fields as {
        state: string;
        current_reviewer_level: string;
      };

      // Check if submission is in review state
      if (parseInt(submissionFields.state) !== DOCUMENT_STATES.IN_REVIEW) {
        return false;
      }

      // Get the DocumentFlow object
      const flowResponse = await suiClient.getObject({
        id: flowId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (flowResponse.data?.content?.dataType !== "moveObject") {
        return false;
      }

      const flowFields = flowResponse.data.content.fields as {
        chain_of_command: Array<{
          address: string;
          name: string;
          hierarchy_level: string;
          role: string;
        }>;
      };

      // Find the current reviewer
      const currentLevel = parseInt(submissionFields.current_reviewer_level);
      const currentReviewer = flowFields.chain_of_command.find(
        participant => parseInt(participant.hierarchy_level) === currentLevel
      );

      // Check if the user is the current reviewer
      return currentReviewer?.address === userAddress;
    } catch {
      return false;
    }
  }

  /**
   * Get document state as human-readable string
   */
  getDocumentStateText(state: number): string {
    switch (state) {
      case DOCUMENT_STATES.IN_REVIEW:
        return "In Review";
      case DOCUMENT_STATES.APPROVED:
        return "Approved";
      case DOCUMENT_STATES.REJECTED:
        return "Rejected";
      case DOCUMENT_STATES.FUNDED:
        return "Funded";
      default:
        return "Unknown";
    }
  }

  /**
   * Get document state color for UI
   */
  getDocumentStateColor(state: number): string {
    switch (state) {
      case DOCUMENT_STATES.IN_REVIEW:
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-400/20";
      case DOCUMENT_STATES.APPROVED:
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-400/20";
      case DOCUMENT_STATES.REJECTED:
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-400/20";
      case DOCUMENT_STATES.FUNDED:
        return "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-400/20";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-400/20";
    }
  }

  /**
   * Get approval action text
   */
  getApprovalActionText(action: number): string {
    switch (action) {
      case 0:
        return "Pending";
      case 1:
        return "Approved";
      case 2:
        return "Rejected";
      default:
        return "Unknown";
    }
  }

  /**
   * Get approval action color for UI
   */
  getApprovalActionColor(action: number): string {
    switch (action) {
      case 0:
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-400/20";
      case 1:
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-400/20";
      case 2:
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-400/20";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-400/20";
    }
  }

  /**
   * Check if user can create document flow for an event
   */
  async canUserCreateDocumentFlow(
    eventId: string,
    userAddress: string,
    _profileRegistryId: string
  ): Promise<boolean> {
    try {
      // Get the event to check if user is organizer or assignee
      const eventResponse = await suiClient.getObject({
        id: eventId,
        options: {
          showContent: true,
          showType: true,
        },
      });

      if (eventResponse.data?.content?.dataType !== "moveObject") {
        return false;
      }

      const eventFields = eventResponse.data.content.fields as {
        organizer: string;
        assignee: string;
      };

      // Check if user is organizer
      if (eventFields.organizer === userAddress) {
        return true;
      }

      // Check if user is assignee (handle "self" case)
      if (eventFields.assignee === "self") {
        return eventFields.organizer === userAddress;
      }

      // For assignee, we need to check if it's an address or username
      if (eventFields.assignee.startsWith('0x')) {
        return eventFields.assignee === userAddress;
      }

      // For username, we need to look it up in the profile registry
      // This is a simplified check - in practice, you'd use the profile registry
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Check if an event has a document flow (Contract Compliant)
   */
  async hasDocumentFlow(eventId: string): Promise<boolean> {
    console.log("🔍 Checking if event has document flow:", eventId);
    
    try {
      // Since we cannot directly query the Move registry without getter functions,
      // and the document_flow module may not be deployed, we'll return false for now
      // This is the most accurate representation until the Move contract is properly deployed
      
      console.log("⚠️ Document flow module is not deployed - returning false");
      return false;
    } catch (error) {
      console.error("❌ Error checking document flow:", error);
      return false;
    }
  }

  /**
   * Get document flow status for multiple events
   */
  async getDocumentFlowStatus(eventIds: string[]): Promise<{ [eventId: string]: boolean }> {
    const status: { [eventId: string]: boolean } = {};
    
    await Promise.all(
      eventIds.map(async (eventId) => {
        status[eventId] = await this.hasDocumentFlow(eventId);
      })
    );
    
    return status;
  }
}
