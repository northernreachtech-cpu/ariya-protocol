# Ariya Document Flow Contract Documentation

## Overview

The ariya Document Flow contract manages hierarchical document approval workflows within the Ephemeral Identity & Attendance (ariya) Protocol. This contract enables event organizers to submit documents (budgets, proposals, reports) that must be approved through a customizable chain of command before funding is released.

## Module Information

- **Module**: `ariya::document_flow`
- **Network**: Sui Blockchain
- **Language**: Move
- **Dependencies**: `ariya::event_management`

## Core Data Structures

### ChainParticipant
Represents a participant in the approval chain with their role and hierarchy level.

```move
public struct ChainParticipant has store, drop, copy {
    address: address,        // Participant's wallet address
    name: String,           // Display name
    hierarchy_level: u64,   // Lower numbers = higher priority
    role: String,          // Role description (e.g., "Finance Manager")
}
```

### DocumentFlow
Configuration object that defines the approval workflow for an event.

```move
public struct DocumentFlow has key, store {
    id: UID,
    event_id: ID,                              // Associated event
    organizer: address,                        // Event organizer
    chain_of_command: vector<ChainParticipant>, // Approval hierarchy
    is_active: bool,                           // Workflow status
    created_at: u64,                          // Creation timestamp
}
```

### DocumentSubmission
Individual document submission that progresses through the approval chain.

```move
public struct DocumentSubmission has key, store {
    id: UID,
    flow_id: ID,                    // Associated workflow
    event_id: ID,                   // Associated event
    organizer: address,             // Document submitter
    title: String,                  // Document title
    description: String,            // Document description
    document_uri: String,           // Walrus storage reference
    document_type: String,          // File type ("pdf", "docx", "xlsx")
    current_reviewer_level: u64,    // Current approval level
    state: u8,                     // Document state (0-3)
    approval_history: vector<ApprovalRecord>, // Complete approval trail
    submitted_at: u64,             // Submission timestamp
    last_updated: u64,             // Last modification timestamp
}
```

### ApprovalRecord
Records each approval or rejection action in the document's history.

```move
public struct ApprovalRecord has store, drop, copy {
    reviewer: address,       // Reviewer's address
    reviewer_name: String,   // Reviewer's name
    hierarchy_level: u64,    // Reviewer's level in chain
    action: u8,             // 0: pending, 1: approved, 2: rejected
    comments: String,        // Reviewer comments
    timestamp: u64,         // Action timestamp
}
```

### DocumentFlowRegistry
Global registry for discovering and managing document flows.

```move
public struct DocumentFlowRegistry has key {
    id: UID,
    flows_by_event: Table<ID, ID>,           // event_id -> flow_id
    submissions_by_event: Table<ID, vector<ID>>, // event_id -> submission_ids
    submissions_by_user: Table<address, vector<ID>>, // user_address -> submission_ids
}
```

### FlowManagerCap
Capability object for managing document flows.

```move
public struct FlowManagerCap has key, store {
    id: UID,
    flow_id: ID,
}
```

## Document States

| State | Value | Description |
|-------|-------|-------------|
| `DOC_STATE_IN_REVIEW` | 0 | Document is under review |
| `DOC_STATE_APPROVED` | 1 | Document fully approved |
| `DOC_STATE_REJECTED` | 2 | Document rejected |
| `DOC_STATE_FUNDED` | 3 | Document approved and funded |

## Error Codes

| Error | Code | Description |
|-------|------|-------------|
| `ENotAuthorized` | 100 | Caller not authorized for this action |
| `EInvalidHierarchy` | 101 | Invalid hierarchy configuration |
| `EDocumentNotPending` | 102 | Document not in reviewable state |
| `EInvalidApprover` | 103 | Invalid approver for current level |

## Public Functions

### Chain Participant Management

#### `create_chain_participant`
Creates a new chain participant for the approval workflow.

```move
public fun create_chain_participant(
    participant_address: address,
    name: String,
    hierarchy_level: u64,
    role: String,
): ChainParticipant
```

**Parameters:**
- `participant_address`: Wallet address of the participant
- `name`: Display name for the participant
- `hierarchy_level`: Position in hierarchy (lower = higher priority)
- `role`: Role description (e.g., "Department Head", "Finance Manager")

**Returns:** `ChainParticipant` - The created participant struct

**Frontend Usage:**
```typescript
// Create chain participants for approval workflow
const participants = [
    {
        address: "0x123...",
        name: "John Smith",
        hierarchyLevel: 1,
        role: "Department Manager"
    },
    {
        address: "0x456...",
        name: "Jane Doe", 
        hierarchyLevel: 2,
        role: "Finance Director"
    },
    {
        address: "0x789...",
        name: "Bob Wilson",
        hierarchyLevel: 3,
        role: "CEO"
    }
];

// Convert to Move calls
const chainParticipants = participants.map(p => 
    tx.moveCall({
        target: `${PACKAGE_ID}::document_flow::create_chain_participant`,
        arguments: [
            tx.pure.address(p.address),
            tx.pure.string(p.name),
            tx.pure.u64(p.hierarchyLevel),
            tx.pure.string(p.role),
        ],
    })
);
```

### Document Flow Management

#### `create_document_flow`
Creates a new document approval workflow for an event.

```move
public fun create_document_flow(
    event: &Event,
    participants: vector<ChainParticipant>,
    clock: &Clock,
    registry: &mut DocumentFlowRegistry,
    ctx: &mut TxContext
): FlowManagerCap
```

**Parameters:**
- `event`: Reference to the associated event
- `participants`: Vector of chain participants in approval order
- `clock`: System clock reference
- `registry`: Document flow registry
- `ctx`: Transaction context

**Returns:** `FlowManagerCap` - Capability for managing the workflow

**Requirements:**
- Caller must be the event organizer
- Hierarchy levels must be unique
- At least one participant required

**Frontend Usage:**
```typescript
const tx = new Transaction();

// First create participants
const participants = [
    tx.moveCall({
        target: `${PACKAGE_ID}::document_flow::create_chain_participant`,
        arguments: [
            tx.pure.address("0x123..."),
            tx.pure.string("Finance Manager"),
            tx.pure.u64(1),
            tx.pure.string("Reviews budget allocations"),
        ],
    }),
    // ... more participants
];

// Create the document flow
const [flowManagerCap] = tx.moveCall({
    target: `${PACKAGE_ID}::document_flow::create_document_flow`,
    arguments: [
        tx.object(EVENT_ID),
        tx.makeMoveVec({ elements: participants }),
        tx.object(CLOCK_ID),
        tx.object(REGISTRY_ID),
    ],
});

// Transfer capability to organizer
tx.transferObjects([flowManagerCap], tx.pure.address(organizerAddress));
```

### Document Submission

#### `submit_document`
Submits a document for approval through the workflow.

```move
public fun submit_document(
    flow: &DocumentFlow,
    title: String,
    description: String,
    document_uri: String,
    document_type: String,
    clock: &Clock,
    registry: &mut DocumentFlowRegistry,
    ctx: &mut TxContext
): ID
```

**Parameters:**
- `flow`: Reference to the document flow
- `title`: Document title
- `description`: Document description
- `document_uri`: Walrus storage URI for the document
- `document_type`: File type ("pdf", "docx", "xlsx", etc.)
- `clock`: System clock reference
- `registry`: Document flow registry
- `ctx`: Transaction context

**Returns:** `ID` - The created document submission ID

**Requirements:**
- Caller must be the event organizer
- Document flow must be active

**Frontend Usage:**
```typescript
const tx = new Transaction();

// Upload document to Walrus first
const documentUri = await uploadToWalrus(documentFile);

const submissionId = tx.moveCall({
    target: `${PACKAGE_ID}::document_flow::submit_document`,
    arguments: [
        tx.object(FLOW_ID),
        tx.pure.string("Event Budget Proposal"),
        tx.pure.string("Detailed budget breakdown for Tech Conference 2024"),
        tx.pure.string(documentUri),
        tx.pure.string("pdf"),
        tx.object(CLOCK_ID),
        tx.object(REGISTRY_ID),
    ],
});

const result = await signAndExecuteTransaction({ transaction: tx });
console.log('Document submitted:', result);
```

### Document Review Actions

#### `approve_document`
Approves a document at the current review level.

```move
public fun approve_document(
    submission: &mut DocumentSubmission,
    flow: &DocumentFlow,
    comments: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Parameters:**
- `submission`: Mutable reference to document submission
- `flow`: Reference to document flow
- `comments`: Approval comments
- `clock`: System clock reference
- `ctx`: Transaction context

**Requirements:**
- Document must be in review state
- Caller must be the current reviewer
- Reviewer must match current hierarchy level

**Frontend Usage:**
```typescript
const tx = new Transaction();

tx.moveCall({
    target: `${PACKAGE_ID}::document_flow::approve_document`,
    arguments: [
        tx.object(SUBMISSION_ID),
        tx.object(FLOW_ID),
        tx.pure.string("Budget looks good. Approved for next level."),
        tx.object(CLOCK_ID),
    ],
});

const result = await signAndExecuteTransaction({ transaction: tx });
console.log('Document approved:', result);
```

#### `reject_document`
Rejects a document and sends it back in the approval chain.

```move
public fun reject_document(
    submission: &mut DocumentSubmission,
    flow: &DocumentFlow,
    reason: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Parameters:**
- `submission`: Mutable reference to document submission
- `flow`: Reference to document flow
- `reason`: Rejection reason/comments
- `clock`: System clock reference
- `ctx`: Transaction context

**Requirements:**
- Document must be in review state
- Caller must be the current reviewer
- Reviewer must match current hierarchy level

**Behavior:**
- If rejected at first level: Document marked as rejected
- If rejected at higher level: Sent back to previous level

**Frontend Usage:**
```typescript
const tx = new Transaction();

tx.moveCall({
    target: `${PACKAGE_ID}::document_flow::reject_document`,
    arguments: [
        tx.object(SUBMISSION_ID),
        tx.object(FLOW_ID),
        tx.pure.string("Budget exceeds allocated limits. Please revise."),
        tx.object(CLOCK_ID),
    ],
});

const result = await signAndExecuteTransaction({ transaction: tx });
console.log('Document rejected:', result);
```

### Funding

#### `fund_organizer_directly`
Releases funds directly to the organizer after full approval.

```move
public fun fund_organizer_directly(
    submission: &mut DocumentSubmission,
    flow: &DocumentFlow,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Parameters:**
- `submission`: Mutable reference to document submission
- `flow`: Reference to document flow
- `payment`: SUI coin for funding
- `clock`: System clock reference
- `ctx`: Transaction context

**Requirements:**
- Document must be fully approved
- Caller must be the top-level approver
- Document state must be `DOC_STATE_APPROVED`

**Frontend Usage:**
```typescript
const tx = new Transaction();

// Create coin object for funding
const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(fundingAmount)]);

tx.moveCall({
    target: `${PACKAGE_ID}::document_flow::fund_organizer_directly`,
    arguments: [
        tx.object(SUBMISSION_ID),
        tx.object(FLOW_ID),
        coin,
        tx.object(CLOCK_ID),
    ],
});

const result = await signAndExecuteTransaction({ transaction: tx });
console.log('Funding released:', result);
```

## Query Functions (Read-Only)

### Participant Information
```move
public fun get_participant_address(participant: &ChainParticipant): address
public fun get_participant_name(participant: &ChainParticipant): String
public fun get_participant_hierarchy_level(participant: &ChainParticipant): u64
public fun get_participant_role(participant: &ChainParticipant): String
public fun get_participant_details(participant: &ChainParticipant): (address, String, u64, String)
```

### Document Submission Status
```move
public fun get_submission_state(submission: &DocumentSubmission): u8
public fun get_current_reviewer_level(submission: &DocumentSubmission): u64
public fun get_document_uri(submission: &DocumentSubmission): String
public fun get_approval_history(submission: &DocumentSubmission): &vector<ApprovalRecord>
```

### Workflow Information
```move
public fun get_chain_participants(flow: &DocumentFlow): &vector<ChainParticipant>

public fun is_user_current_reviewer(
    submission: &DocumentSubmission,
    flow: &DocumentFlow, 
    user: address
): bool
```

**Frontend Usage:**
```typescript
// Check if user can review document
const canReview = await client.devInspectTransactionBlock({
    transactionBlock: (() => {
        const tx = new Transaction();
        return tx.moveCall({
            target: `${PACKAGE_ID}::document_flow::is_user_current_reviewer`,
            arguments: [
                tx.object(SUBMISSION_ID),
                tx.object(FLOW_ID),
                tx.pure.address(userAddress),
            ],
        });
    })(),
    sender: userAddress,
});

const isCurrentReviewer = canReview.results?.[0]?.returnValues?.[0]?.[0] === 1;
```

## Events Emitted

### DocumentFlowCreated
```move
public struct DocumentFlowCreated has copy, drop {
    flow_id: ID,
    event_id: ID,
    organizer: address,
    chain_size: u64,
}
```

### DocumentSubmitted
```move
public struct DocumentSubmitted has copy, drop {
    submission_id: ID,
    flow_id: ID,
    event_id: ID,
    organizer: address,
    title: String,
}
```

### DocumentApproved
```move
public struct DocumentApproved has copy, drop {
    submission_id: ID,
    reviewer: address,
    hierarchy_level: u64,
    timestamp: u64,
}
```

### DocumentRejected
```move
public struct DocumentRejected has copy, drop {
    submission_id: ID,
    reviewer: address,
    hierarchy_level: u64,
    reason: String,
    timestamp: u64,
}
```

### DocumentFullyApproved
```move
public struct DocumentFullyApproved has copy, drop {
    submission_id: ID,
    event_id: ID,
    organizer: address,
}
```

### BudgetReleased
```move
public struct BudgetReleased has copy, drop {
    submission_id: ID,
    organizer: address,
    amount: u64,
    funded_by: address,
}
```

## Frontend Integration Examples

### Complete Document Workflow Setup

```typescript
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

class DocumentFlowManager {
    constructor(private client: SuiClient, private packageId: string) {}

    // Create approval workflow
    async createDocumentFlow(
        eventId: string,
        approvalChain: Array<{
            address: string;
            name: string;
            hierarchyLevel: number;
            role: string;
        }>,
        organizerKeypair: any
    ) {
        const tx = new Transaction();

        // Create chain participants
        const participants = approvalChain.map(participant =>
            tx.moveCall({
                target: `${this.packageId}::document_flow::create_chain_participant`,
                arguments: [
                    tx.pure.address(participant.address),
                    tx.pure.string(participant.name),
                    tx.pure.u64(participant.hierarchyLevel),
                    tx.pure.string(participant.role),
                ],
            })
        );

        // Create document flow
        const [flowManagerCap] = tx.moveCall({
            target: `${this.packageId}::document_flow::create_document_flow`,
            arguments: [
                tx.object(eventId),
                tx.makeMoveVec({ elements: participants }),
                tx.object(CLOCK_ID),
                tx.object(REGISTRY_ID),
            ],
        });

        const result = await this.client.signAndExecuteTransaction({
            transaction: tx,
            signer: organizerKeypair,
            options: { showEffects: true, showEvents: true },
        });

        return this.extractObjectId(result, 'FlowManagerCap');
    }

    // Submit document for approval
    async submitDocument(
        flowId: string,
        documentData: {
            title: string;
            description: string;
            documentUri: string;
            documentType: string;
        },
        organizerKeypair: any
    ) {
        const tx = new Transaction();

        const submissionId = tx.moveCall({
            target: `${this.packageId}::document_flow::submit_document`,
            arguments: [
                tx.object(flowId),
                tx.pure.string(documentData.title),
                tx.pure.string(documentData.description),
                tx.pure.string(documentData.documentUri),
                tx.pure.string(documentData.documentType),
                tx.object(CLOCK_ID),
                tx.object(REGISTRY_ID),
            ],
        });

        const result = await this.client.signAndExecuteTransaction({
            transaction: tx,
            signer: organizerKeypair,
            options: { showEffects: true, showEvents: true },
        });

        return this.extractSubmissionId(result);
    }

    // Approve document
    async approveDocument(
        submissionId: string,
        flowId: string,
        comments: string,
        reviewerKeypair: any
    ) {
        const tx = new Transaction();

        tx.moveCall({
            target: `${this.packageId}::document_flow::approve_document`,
            arguments: [
                tx.object(submissionId),
                tx.object(flowId),
                tx.pure.string(comments),
                tx.object(CLOCK_ID),
            ],
        });

        return await this.client.signAndExecuteTransaction({
            transaction: tx,
            signer: reviewerKeypair,
            options: { showEffects: true, showEvents: true },
        });
    }

    // Get document status
    async getDocumentStatus(submissionId: string) {
        const submission = await this.client.getObject({
            id: submissionId,
            options: { showContent: true },
        });

        if (!submission.data?.content) {
            throw new Error('Document submission not found');
        }

        const fields = submission.data.content.fields;
        return {
            id: submissionId,
            title: fields.title,
            description: fields.description,
            state: parseInt(fields.state),
            currentReviewerLevel: parseInt(fields.current_reviewer_level),
            approvalHistory: fields.approval_history,
            documentUri: fields.document_uri,
            documentType: fields.document_type,
        };
    }

    // Get pending reviews for user
    async getPendingReviews(userAddress: string) {
        // Query for documents where user is current reviewer
        const events = await this.client.queryEvents({
            query: {
                MoveEventType: `${this.packageId}::document_flow::DocumentSubmitted`,
            },
            limit: 50,
        });

        const pendingReviews = [];
        
        for (const event of events.data) {
            const submissionId = event.parsedJson.submission_id;
            const flowId = event.parsedJson.flow_id;
            
            // Check if user is current reviewer
            const isCurrentReviewer = await this.isUserCurrentReviewer(
                submissionId,
                flowId,
                userAddress
            );
            
            if (isCurrentReviewer) {
                const status = await this.getDocumentStatus(submissionId);
                pendingReviews.push(status);
            }
        }

        return pendingReviews;
    }

    private async isUserCurrentReviewer(
        submissionId: string,
        flowId: string,
        userAddress: string
    ): Promise<boolean> {
        const tx = new Transaction();
        tx.moveCall({
            target: `${this.packageId}::document_flow::is_user_current_reviewer`,
            arguments: [
                tx.object(submissionId),
                tx.object(flowId),
                tx.pure.address(userAddress),
            ],
        });

        const result = await this.client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: userAddress,
        });

        return result.results?.[0]?.returnValues?.[0]?.[0] === 1;
    }

    private extractObjectId(result: any, objectType: string): string {
        // Extract object ID from transaction result
        const createdObjects = result.effects?.created || [];
        const targetObject = createdObjects.find(obj => 
            obj.owner?.ObjectOwner || obj.owner?.Shared
        );
        return targetObject?.reference?.objectId || '';
    }

    private extractSubmissionId(result: any): string {
        // Extract submission ID from events
        const events = result.events || [];
        const submitEvent = events.find(event => 
            event.type.includes('DocumentSubmitted')
        );
        return submitEvent?.parsedJson?.submission_id || '';
    }
}
```

### React Components for Document Flow

```typescript
// Document submission component
function DocumentSubmissionForm({ flowId, onSubmit }) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        file: null,
    });
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);

        try {
            // Upload to Walrus
            const documentUri = await uploadToWalrus(formData.file);
            
            // Submit document
            await onSubmit({
                title: formData.title,
                description: formData.description,
                documentUri,
                documentType: formData.file.type,
            });

        } catch (error) {
            console.error('Submission failed:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="document-submission-form">
            <div className="form-group">
                <label>Document Title</label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                />
            </div>

            <div className="form-group">
                <label>Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                />
            </div>

            <div className="form-group">
                <label>Document File</label>
                <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                    required
                />
            </div>

            <button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Submit Document'}
            </button>
        </form>
    );
}

// Document review component
function DocumentReview({ submission, flow, onAction }) {
    const [comments, setComments] = useState('');
    const [action, setAction] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onAction(action, comments);
        setComments('');
        setAction('');
    };

    return (
        <div className="document-review">
            <div className="document-info">
                <h3>{submission.title}</h3>
                <p>{submission.description}</p>
                <a href={submission.documentUri} target="_blank" rel="noopener noreferrer">
                    View Document
                </a>
            </div>

            <div className="approval-history">
                <h4>Approval History</h4>
                {submission.approvalHistory.map((record, index) => (
                    <div key={index} className="approval-record">
                        <div className="reviewer">{record.reviewer_name}</div>
                        <div className="action">
                            {record.action === 1 ? 'Approved' : 
                             record.action === 2 ? 'Rejected' : 'Pending'}
                        </div>
                        <div className="comments">{record.comments}</div>
                        <div className="timestamp">
                            {new Date(record.timestamp).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="review-form">
                <div className="form-group">
                    <label>Comments</label>
                    <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add your review comments..."
                        required
                    />
                </div>

                <div className="action-buttons">
                    <button
                        type="button"
                        onClick={() => {
                            setAction('approve');
                            handleSubmit();
                        }}
                        className="approve-btn"
                    >
                        Approve
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setAction('reject');
                            handleSubmit();
                        }}
                        className="reject-btn"
                    >
                        Reject
                    </button>
                </div>
            </form>
        </div>
    );
}
```

### Event Listening

```typescript
// Listen for document flow events
function setupEventListeners(client: SuiClient, packageId: string) {
    // Document submitted events
    client.subscribeEvent({
        filter: {
            MoveEventType: `${packageId}::document_flow::DocumentSubmitted`,
        },
        onMessage: (event) => {
            console.log('Document submitted:', event.parsedJson);
            // Update UI, send notifications, etc.
        },
    });

    // Document approved events
    client.subscribeEvent({
        filter: {
            MoveEventType: `${packageId}::document_flow::DocumentApproved`,
        },
        onMessage: (event) => {
            console.log('Document approved:', event.parsedJson);
            // Update approval status in UI
        },
    });

    // Document fully approved events
    client.subscribeEvent({
        filter: {
            MoveEventType: `${packageId}::document_flow::DocumentFullyApproved`,
        },
        onMessage: (event) => {
            console.log('Document fully approved:', event.parsedJson);
            // Enable funding options
        },
    });

    // Budget released events
    client.subscribeEvent({
        filter: {
            MoveEventType: `${packageId}::document_flow::BudgetReleased`,
        },
        onMessage: (event) => {
            console.log('Budget released:', event.parsedJson);
            // Update funding status
        },
    });
}
```

## Important Notes

1. **Hierarchy Levels**: Lower numbers indicate higher priority in the chain (1 = first reviewer, 2 = second reviewer, etc.)

2. **Document Storage**: Documents are stored off-chain using Walrus storage, with only URIs stored on-chain

3. **Approval Flow**: Documents must be approved at each level sequentially - no skipping levels allowed

4. **Rejection Handling**: 
   - Rejected at first level: Document marked as rejected
   - Rejected at higher levels: Sent back to previous level for revision

5. **Funding**: Only the highest-level approver can release funds after full approval

6. **Capability Management**: FlowManagerCap objects must be properly stored and managed by organizers

7. **Registry Updates**: All submissions are automatically tracked in the registry for discoverability

8. **Event Integration**: Document flows are tightly coupled with events from the event_management module


The document flow system provides a robust foundation for managing approval workflows in decentralized event management systems.