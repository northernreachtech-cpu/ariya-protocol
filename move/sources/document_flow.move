module ariya::document_flow;

use std::string::String;
use sui::clock::{Self, Clock};
use sui::table::{Self, Table};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::event;
use ariya::event_management::{Self, Event};

// Error codes
const ENotAuthorized: u64 = 100;
const EInvalidHierarchy: u64 = 101;
const EDocumentNotPending: u64 = 102;
const EInvalidApprover: u64 = 103;

// Document states
const DOC_STATE_IN_REVIEW: u8 = 0;
const DOC_STATE_APPROVED: u8 = 1;
const DOC_STATE_REJECTED: u8 = 2;
const DOC_STATE_FUNDED: u8 = 3;

// Chain of command participant
public struct ChainParticipant has store, drop, copy {
    address: address,
    name: String,
    hierarchy_level: u64, // Lower numbers = higher priority in chain
    role: String,
}

// Document flow configuration for an event
public struct DocumentFlow has key, store {
    id: UID,
    event_id: ID,
    organizer: address,
    chain_of_command: vector<ChainParticipant>,
    is_active: bool,
    created_at: u64,
}

// Individual document submission
public struct DocumentSubmission has key, store {
    id: UID,
    flow_id: ID,
    event_id: ID,
    organizer: address,
    title: String,
    description: String,
    document_uri: String, // Walrus storage reference
    document_type: String, // "pdf", "docx", "xlsx", etc.
    current_reviewer_level: u64,
    state: u8,
    approval_history: vector<ApprovalRecord>,
    submitted_at: u64,
    last_updated: u64,
}

// Approval/rejection record
public struct ApprovalRecord has store, drop, copy {
    reviewer: address,
    reviewer_name: String,
    hierarchy_level: u64,
    action: u8, // 0: pending, 1: approved, 2: rejected
    comments: String,
    timestamp: u64,
}

// Remove the BudgetEscrow struct as it's no longer needed

// Registry for all document flows
public struct DocumentFlowRegistry has key {
    id: UID,
    flows_by_event: Table<ID, ID>, // event_id -> flow_id
    submissions_by_event: Table<ID, vector<ID>>, // event_id -> submission_ids
    submissions_by_user: Table<address, vector<ID>>, // user_address -> submission_ids
}

// Capabilities for document flow management
public struct FlowManagerCap has key, store {
    id: UID,
    flow_id: ID,
}

// Events
public struct DocumentFlowCreated has copy, drop {
    flow_id: ID,
    event_id: ID,
    organizer: address,
    chain_size: u64,
}

public struct DocumentSubmitted has copy, drop {
    submission_id: ID,
    flow_id: ID,
    event_id: ID,
    organizer: address,
    title: String,
}

public struct DocumentApproved has copy, drop {
    submission_id: ID,
    reviewer: address,
    hierarchy_level: u64,
    timestamp: u64,
}

public struct DocumentRejected has copy, drop {
    submission_id: ID,
    reviewer: address,
    hierarchy_level: u64,
    reason: String,
    timestamp: u64,
}

public struct DocumentFullyApproved has copy, drop {
    submission_id: ID,
    event_id: ID,
    organizer: address,
}

public struct BudgetReleased has copy, drop {
    submission_id: ID,
    organizer: address,
    amount: u64,
    funded_by: address,
}

// Initialize module
fun init(ctx: &mut TxContext) {
    let registry = DocumentFlowRegistry {
        id: object::new(ctx),
        flows_by_event: table::new(ctx),
        submissions_by_event: table::new(ctx),
        submissions_by_user: table::new(ctx),
    };
    transfer::share_object(registry);
}

// Create a chain participant (called by organizer during setup)
public fun create_chain_participant(
    participant_address: address,
    name: String,
    hierarchy_level: u64,
    role: String,
): ChainParticipant {
    ChainParticipant {
        address: participant_address,
        name,
        hierarchy_level,
        role,
    }
}

// Create document flow for an event (only organizer can do this)
public fun create_document_flow(
    event: &Event,
    participants: vector<ChainParticipant>,
    clock: &Clock,
    registry: &mut DocumentFlowRegistry,
    ctx: &mut TxContext
): FlowManagerCap {
    let organizer = event_management::get_event_organizer(event);
    assert!(organizer == tx_context::sender(ctx), ENotAuthorized);
    
    // Validate hierarchy levels are unique and properly ordered
    validate_chain_hierarchy(&participants);
    
    let event_id = event_management::get_event_id(event);
    
    let flow = DocumentFlow {
        id: object::new(ctx),
        event_id,
        organizer,
        chain_of_command: participants,
        is_active: true,
        created_at: clock::timestamp_ms(clock),
    };
    
    let flow_id = object::id(&flow);
    
    // Update registry
    table::add(&mut registry.flows_by_event, event_id, flow_id);
    table::add(&mut registry.submissions_by_event, event_id, vector::empty());
    
    // Emit event
    event::emit(DocumentFlowCreated {
        flow_id,
        event_id,
        organizer,
        chain_size: vector::length(&participants),
    });
    
    transfer::share_object(flow);
    
    FlowManagerCap {
        id: object::new(ctx),
        flow_id,
    }
}

// Submit document for approval
public fun submit_document(
    flow: &DocumentFlow,
    title: String,
    description: String,
    document_uri: String,
    document_type: String,
    clock: &Clock,
    registry: &mut DocumentFlowRegistry,
    ctx: &mut TxContext
): ID {
    assert!(flow.organizer == tx_context::sender(ctx), ENotAuthorized);
    assert!(flow.is_active, ENotAuthorized);
    
    // Find the starting reviewer (lowest hierarchy level)
    let starting_level = get_lowest_hierarchy_level(&flow.chain_of_command);
    
    let submission = DocumentSubmission {
        id: object::new(ctx),
        flow_id: object::id(flow),
        event_id: flow.event_id,
        organizer: flow.organizer,
        title,
        description,
        document_uri,
        document_type,
        current_reviewer_level: starting_level,
        state: DOC_STATE_IN_REVIEW,
        approval_history: vector::empty(),
        submitted_at: clock::timestamp_ms(clock),
        last_updated: clock::timestamp_ms(clock),
    };
    
    let submission_id = object::id(&submission);
    
    // Update registry
    let event_submissions = table::borrow_mut(&mut registry.submissions_by_event, flow.event_id);
    vector::push_back(event_submissions, submission_id);
    
    if (!table::contains(&registry.submissions_by_user, flow.organizer)) {
        table::add(&mut registry.submissions_by_user, flow.organizer, vector::empty());
    };
    let user_submissions = table::borrow_mut(&mut registry.submissions_by_user, flow.organizer);
    vector::push_back(user_submissions, submission_id);
    
    // Emit event
    event::emit(DocumentSubmitted {
        submission_id,
        flow_id: object::id(flow),
        event_id: flow.event_id,
        organizer: flow.organizer,
        title: submission.title,
    });
    
    transfer::share_object(submission);
    submission_id
}

// Approve document at current level
public fun approve_document(
    submission: &mut DocumentSubmission,
    flow: &DocumentFlow,
    comments: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    assert!(submission.state == DOC_STATE_IN_REVIEW, EDocumentNotPending);
    
    // Verify sender is the current reviewer
    let current_reviewer = get_participant_at_level(&flow.chain_of_command, submission.current_reviewer_level);
    assert!(current_reviewer.address == sender, EInvalidApprover);
    
    // Add approval record
    let approval_record = ApprovalRecord {
        reviewer: sender,
        reviewer_name: current_reviewer.name,
        hierarchy_level: submission.current_reviewer_level,
        action: 1, // approved
        comments,
        timestamp: clock::timestamp_ms(clock),
    };
    vector::push_back(&mut submission.approval_history, approval_record);
    
    // Check if this is the final approval (highest hierarchy level)
    let highest_level = get_highest_hierarchy_level(&flow.chain_of_command);
    if (submission.current_reviewer_level == highest_level) {
        // Document fully approved
        submission.state = DOC_STATE_APPROVED;
        
        event::emit(DocumentFullyApproved {
            submission_id: object::id(submission),
            event_id: submission.event_id,
            organizer: submission.organizer,
        });
    } else {
        // Move to next level
        submission.current_reviewer_level = get_next_hierarchy_level(&flow.chain_of_command, submission.current_reviewer_level);
    };
    
    submission.last_updated = clock::timestamp_ms(clock);
    
    event::emit(DocumentApproved {
        submission_id: object::id(submission),
        reviewer: sender,
        hierarchy_level: current_reviewer.hierarchy_level,
        timestamp: clock::timestamp_ms(clock),
    });
}

// Reject document and send back to previous level or organizer
public fun reject_document(
    submission: &mut DocumentSubmission,
    flow: &DocumentFlow,
    reason: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    assert!(submission.state == DOC_STATE_IN_REVIEW, EDocumentNotPending);
    
    // Verify sender is the current reviewer
    let current_reviewer = get_participant_at_level(&flow.chain_of_command, submission.current_reviewer_level);
    assert!(current_reviewer.address == sender, EInvalidApprover);
    
    // Add rejection record
    let rejection_record = ApprovalRecord {
        reviewer: sender,
        reviewer_name: current_reviewer.name,
        hierarchy_level: submission.current_reviewer_level,
        action: 2, // rejected
        comments: reason,
        timestamp: clock::timestamp_ms(clock),
    };
    vector::push_back(&mut submission.approval_history, rejection_record);
    
    // Send back to previous level or mark as rejected
    let lowest_level = get_lowest_hierarchy_level(&flow.chain_of_command);
    if (submission.current_reviewer_level == lowest_level) {
        // Rejected at first level, mark as rejected
        submission.state = DOC_STATE_REJECTED;
    } else {
        // Send back to previous level
        submission.current_reviewer_level = get_previous_hierarchy_level(&flow.chain_of_command, submission.current_reviewer_level);
    };
    
    submission.last_updated = clock::timestamp_ms(clock);
    
    event::emit(DocumentRejected {
        submission_id: object::id(submission),
        reviewer: sender,
        hierarchy_level: current_reviewer.hierarchy_level,
        reason,
        timestamp: clock::timestamp_ms(clock),
    });
}

// Direct funding to organizer (replaces escrow system)
public fun fund_organizer_directly(
    submission: &mut DocumentSubmission,
    flow: &DocumentFlow,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    assert!(submission.state == DOC_STATE_APPROVED, EDocumentNotPending);
    
    // Verify sender is top-level approver
    let highest_level = get_highest_hierarchy_level(&flow.chain_of_command);
    let top_approver = get_participant_at_level(&flow.chain_of_command, highest_level);
    assert!(top_approver.address == sender, ENotAuthorized);
    
    let payment_amount = coin::value(&payment);
    
    // Transfer directly to organizer
    transfer::public_transfer(payment, submission.organizer);
    
    submission.state = DOC_STATE_FUNDED;
    submission.last_updated = clock::timestamp_ms(clock);
    
    event::emit(BudgetReleased {
        submission_id: object::id(submission),
        organizer: submission.organizer,
        amount: payment_amount,
        funded_by: sender,
    });
}

// Helper functions
fun validate_chain_hierarchy(participants: &vector<ChainParticipant>) {
    let len = vector::length(participants);
    let mut i = 0;
    while (i < len) {
        let current = vector::borrow(participants, i);
        let mut j = i + 1;
        while (j < len) {
            let other = vector::borrow(participants, j);
            assert!(current.hierarchy_level != other.hierarchy_level, EInvalidHierarchy);
            j = j + 1;
        };
        i = i + 1;
    };
}

fun get_lowest_hierarchy_level(participants: &vector<ChainParticipant>): u64 {
    let len = vector::length(participants);
    let mut min_level = vector::borrow(participants, 0).hierarchy_level;
    let mut i = 1;
    while (i < len) {
        let current_level = vector::borrow(participants, i).hierarchy_level;
        if (current_level < min_level) {
            min_level = current_level;
        };
        i = i + 1;
    };
    min_level
}

fun get_highest_hierarchy_level(participants: &vector<ChainParticipant>): u64 {
    let len = vector::length(participants);
    let mut max_level = vector::borrow(participants, 0).hierarchy_level;
    let mut i = 1;
    while (i < len) {
        let current_level = vector::borrow(participants, i).hierarchy_level;
        if (current_level > max_level) {
            max_level = current_level;
        };
        i = i + 1;
    };
    max_level
}

fun get_participant_at_level(participants: &vector<ChainParticipant>, level: u64): ChainParticipant {
    let len = vector::length(participants);
    let mut i = 0;
    while (i < len) {
        let participant = vector::borrow(participants, i);
        if (participant.hierarchy_level == level) {
            return *participant
        };
        i = i + 1;
    };
    abort EInvalidHierarchy
}

fun get_next_hierarchy_level(participants: &vector<ChainParticipant>, current_level: u64): u64 {
    let len = vector::length(participants);
    let mut next_level = get_highest_hierarchy_level(participants);
    let mut i = 0;
    while (i < len) {
        let participant = vector::borrow(participants, i);
        if (participant.hierarchy_level > current_level && participant.hierarchy_level < next_level) {
            next_level = participant.hierarchy_level;
        };
        i = i + 1;
    };
    next_level
}

fun get_previous_hierarchy_level(participants: &vector<ChainParticipant>, current_level: u64): u64 {
    let len = vector::length(participants);
    let mut prev_level = get_lowest_hierarchy_level(participants);
    let mut i = 0;
    while (i < len) {
        let participant = vector::borrow(participants, i);
        if (participant.hierarchy_level < current_level && participant.hierarchy_level > prev_level) {
            prev_level = participant.hierarchy_level;
        };
        i = i + 1;
    };
    prev_level
}

// Getters for ChainParticipant
public fun get_participant_address(participant: &ChainParticipant): address {
    participant.address
}

public fun get_participant_name(participant: &ChainParticipant): String {
    participant.name
}

public fun get_participant_hierarchy_level(participant: &ChainParticipant): u64 {
    participant.hierarchy_level
}

public fun get_participant_role(participant: &ChainParticipant): String {
    participant.role
}

public fun get_participant_details(participant: &ChainParticipant): (address, String, u64, String) {
    (participant.address, participant.name, participant.hierarchy_level, participant.role)
}

// Getters
public fun get_submission_state(submission: &DocumentSubmission): u8 {
    submission.state
}

public fun get_current_reviewer_level(submission: &DocumentSubmission): u64 {
    submission.current_reviewer_level
}

public fun get_document_uri(submission: &DocumentSubmission): String {
    submission.document_uri
}

public fun get_chain_participants(flow: &DocumentFlow): &vector<ChainParticipant> {
    &flow.chain_of_command
}

public fun get_approval_history(submission: &DocumentSubmission): &vector<ApprovalRecord> {
    &submission.approval_history
}

public fun is_user_current_reviewer(
    submission: &DocumentSubmission,
    flow: &DocumentFlow,
    user: address
): bool {
    if (submission.state != DOC_STATE_IN_REVIEW) {
        return false
    };
    
    let current_reviewer = get_participant_at_level(&flow.chain_of_command, submission.current_reviewer_level);
    current_reviewer.address == user
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}