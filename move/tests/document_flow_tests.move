#[test_only]
module ariya::document_flow_tests;

use std::string;
use sui::test_scenario::{Self, Scenario};
use sui::clock::{Self, Clock};
use sui::coin::mint_for_testing;
use sui::sui::SUI;
use ariya::document_flow::{
    Self, 
    DocumentFlow, 
    DocumentSubmission, 
    DocumentFlowRegistry,
    ChainParticipant,

    // Error codes
    ENotAuthorized,
    EDocumentNotPending,
    EInvalidApprover,
};
use ariya::event_management::{Self, Event, EventRegistry, OrganizerProfile};

// Document states
const DOC_STATE_IN_REVIEW: u8 = 0;
const DOC_STATE_APPROVED: u8 = 1;
const DOC_STATE_REJECTED: u8 = 2;
const DOC_STATE_FUNDED: u8 = 3;

// Test addresses
const ORGANIZER: address = @0xA1;
const REVIEWER1: address = @0xB1;
const REVIEWER2: address = @0xB2;
const REVIEWER3: address = @0xB3;
const FUNDER: address = @0xC1;

// Test constants
const DAY_IN_MS: u64 = 86400000;
const HOUR_IN_MS: u64 = 3600000;

// ========== Test Helper Functions ==========

#[test_only]
fun setup_test(scenario: &mut Scenario, _clock: &mut Clock) {
    // Initialize both modules
    test_scenario::next_tx(scenario, ORGANIZER);
    {
        event_management::init_for_testing(test_scenario::ctx(scenario));
        document_flow::init_for_testing(test_scenario::ctx(scenario));
    };
}

#[test_only]
fun create_test_event(
    scenario: &mut Scenario,
    clock: &Clock,
    organizer: address
): ID {
    test_scenario::next_tx(scenario, organizer);
    {
        // Create organizer profile first
        let cap = event_management::create_organizer_profile(
            string::utf8(b"Test Organizer"),
            string::utf8(b"Bio"),
            clock,
            test_scenario::ctx(scenario)
        );
        transfer::public_transfer(cap, organizer);
    };
    
    test_scenario::next_tx(scenario, organizer);
    {
        let mut registry = test_scenario::take_shared<EventRegistry>(scenario);
        let mut profile = test_scenario::take_shared<OrganizerProfile>(scenario);
        
        let event_id = event_management::create_event(
            string::utf8(b"Test Event"),
            string::utf8(b"Description"),
            string::utf8(b"Location"),
            clock::timestamp_ms(clock) + DAY_IN_MS,
            clock::timestamp_ms(clock) + DAY_IN_MS + (4 * HOUR_IN_MS),
            100,
            0,
            10,
            8000,
            400,
            string::utf8(b"https://walrus.example/metadata"),
            clock,
            &mut registry,
            &mut profile,
            test_scenario::ctx(scenario)
        );
        
        test_scenario::return_shared(registry);
        test_scenario::return_shared(profile);
        
        event_id
    }
}

#[test_only]
fun create_test_chain(): vector<ChainParticipant> {
    let mut chain = vector::empty<ChainParticipant>();
    
    vector::push_back(&mut chain, document_flow::create_chain_participant(
        REVIEWER1,
        string::utf8(b"Junior Reviewer"),
        1, // Lowest level (reviews first)
        string::utf8(b"Junior")
    ));
    
    vector::push_back(&mut chain, document_flow::create_chain_participant(
        REVIEWER2,
        string::utf8(b"Senior Reviewer"),
        2,
        string::utf8(b"Senior")
    ));
    
    vector::push_back(&mut chain, document_flow::create_chain_participant(
        REVIEWER3,
        string::utf8(b"Director"),
        3, // Highest level (final approval)
        string::utf8(b"Director")
    ));
    
    chain
}

// ========== Core Functionality Tests ==========

#[test]
fun test_create_chain_participant() {
    let participant = document_flow::create_chain_participant(
        REVIEWER1,
        string::utf8(b"Test Reviewer"),
        5,
        string::utf8(b"Manager")
    );
    
    assert!(document_flow::get_participant_address(&participant) == REVIEWER1, 0);
    assert!(document_flow::get_participant_name(&participant) == string::utf8(b"Test Reviewer"), 1);
    assert!(document_flow::get_participant_hierarchy_level(&participant) == 5, 2);
    assert!(document_flow::get_participant_role(&participant) == string::utf8(b"Manager"), 3);
    
    let (addr, name, level, role) = document_flow::get_participant_details(&participant);
    assert!(addr == REVIEWER1, 4);
    assert!(name == string::utf8(b"Test Reviewer"), 5);
    assert!(level == 5, 6);
    assert!(role == string::utf8(b"Manager"), 7);
}

#[test]
fun test_create_document_flow() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create document flow
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let chain = create_test_chain();
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        // Verify capability was created
        assert!(object::id(&cap) != object::id_from_address(@0x0), 8);
        transfer::public_transfer(cap, ORGANIZER);
        
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = ENotAuthorized)]
fun test_submit_document_not_organizer() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create flow
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let chain = create_test_chain();
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    // Try to submit as non-organizer
    test_scenario::next_tx(&mut scenario, REVIEWER1);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let _submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Unauthorized Doc"),
            string::utf8(b"Should fail"),
            string::utf8(b"https://walrus.example/fail.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = EInvalidApprover)]
fun test_approve_document_wrong_reviewer() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create flow and submit document
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let chain = create_test_chain();
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let _submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Test Doc"),
            string::utf8(b"Description"),
            string::utf8(b"https://walrus.example/doc.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    // Try to approve with wrong reviewer (REVIEWER2 when REVIEWER1 should review)
    test_scenario::next_tx(&mut scenario, REVIEWER2);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"Wrong reviewer"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = EDocumentNotPending)]
fun test_approve_already_approved_document() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create single-level flow
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let mut chain = vector::empty<ChainParticipant>();
        
        vector::push_back(&mut chain, document_flow::create_chain_participant(
            REVIEWER1, string::utf8(b"Solo Reviewer"), 1, string::utf8(b"Manager")
        ));
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let _submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Test Doc"),
            string::utf8(b"Description"),
            string::utf8(b"https://walrus.example/doc.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    // Approve once
    test_scenario::next_tx(&mut scenario, REVIEWER1);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"First approval"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    // Try to approve again
    test_scenario::next_tx(&mut scenario, REVIEWER1);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"Second approval - should fail"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = EDocumentNotPending)]
fun test_fund_unapproved_document() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create flow and submit document
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let mut chain = vector::empty<ChainParticipant>();
        
        vector::push_back(&mut chain, document_flow::create_chain_participant(
            FUNDER, string::utf8(b"Funder"), 1, string::utf8(b"Treasurer")
        ));
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let _submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Unapproved Doc"),
            string::utf8(b"Not yet approved"),
            string::utf8(b"https://walrus.example/doc.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    // Try to fund without approval
    test_scenario::next_tx(&mut scenario, FUNDER);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        let payment = mint_for_testing<SUI>(1000000, test_scenario::ctx(&mut scenario));
        
        document_flow::fund_organizer_directly(
            &mut submission,
            &flow,
            payment,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = ENotAuthorized)]
fun test_fund_wrong_funder() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create flow with FUNDER as approver
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let mut chain = vector::empty<ChainParticipant>();
        
        vector::push_back(&mut chain, document_flow::create_chain_participant(
            FUNDER, string::utf8(b"Funder"), 1, string::utf8(b"Treasurer")
        ));
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    // Submit and approve document
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let _submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Budget Request"),
            string::utf8(b"Need funding"),
            string::utf8(b"https://walrus.example/budget.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, FUNDER);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"Approved for funding"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    // Try to fund with wrong person (not the top-level approver)
    test_scenario::next_tx(&mut scenario, REVIEWER1);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        let payment = mint_for_testing<SUI>(1000000, test_scenario::ctx(&mut scenario));
        
        document_flow::fund_organizer_directly(
            &mut submission,
            &flow,
            payment,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

// ========== Integration Tests ==========

#[test]
fun test_full_document_lifecycle() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // 1. Create document flow
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let chain = create_test_chain();
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    // 2. Submit document
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let _submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Complete Lifecycle Doc"),
            string::utf8(b"Full approval and funding cycle"),
            string::utf8(b"https://walrus.example/lifecycle.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    // 3. First approval
    test_scenario::next_tx(&mut scenario, REVIEWER1);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"Junior approval - looks good"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    // 4. Second approval
    test_scenario::next_tx(&mut scenario, REVIEWER2);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"Senior approval - budget verified"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    // 5. Final approval
    test_scenario::next_tx(&mut scenario, REVIEWER3);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"Director approval - funding authorized"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(document_flow::get_submission_state(&submission) == DOC_STATE_APPROVED, 31);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    // 6. Fund organizer
    test_scenario::next_tx(&mut scenario, REVIEWER3);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        let payment = mint_for_testing<SUI>(5000000, test_scenario::ctx(&mut scenario));
        
        document_flow::fund_organizer_directly(
            &mut submission,
            &flow,
            payment,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(document_flow::get_submission_state(&submission) == DOC_STATE_FUNDED, 32);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    // 7. Verify approval history
    test_scenario::next_tx(&mut scenario, @0x0);
    {
        let submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let approval_history = document_flow::get_approval_history(&submission);
        
        // Should have 3 approval records
        assert!(vector::length(approval_history) == 3, 33);
        
        test_scenario::return_shared(submission);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_complex_hierarchy_levels() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create flow with non-sequential hierarchy levels
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let mut chain = vector::empty<ChainParticipant>();
        
        // Use levels 10, 25, 100 to test non-sequential ordering
        vector::push_back(&mut chain, document_flow::create_chain_participant(
            REVIEWER1, string::utf8(b"Level 10"), 10, string::utf8(b"First")
        ));
        vector::push_back(&mut chain, document_flow::create_chain_participant(
            REVIEWER2, string::utf8(b"Level 25"), 25, string::utf8(b"Second")
        ));
        vector::push_back(&mut chain, document_flow::create_chain_participant(
            REVIEWER3, string::utf8(b"Level 100"), 100, string::utf8(b"Final")
        ));
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    // Submit and verify it starts at level 10
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let _submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Complex Hierarchy Doc"),
            string::utf8(b"Testing non-sequential levels"),
            string::utf8(b"https://walrus.example/complex.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, @0x0);
    {
        let submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        
        // Should start at lowest level (10)
        assert!(document_flow::get_current_reviewer_level(&submission) == 10, 34);
        
        test_scenario::return_shared(submission);
    };
    
    // Approve through the chain
    test_scenario::next_tx(&mut scenario, REVIEWER1); // Level 10
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"Level 10 approval"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        // Should move to next level (25)
        assert!(document_flow::get_current_reviewer_level(&submission) == 25, 35);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    test_scenario::next_tx(&mut scenario, REVIEWER2); // Level 25
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"Level 25 approval"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        // Should move to final level (100)
        assert!(document_flow::get_current_reviewer_level(&submission) == 100, 36);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    test_scenario::next_tx(&mut scenario, REVIEWER3); // Level 100
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"Final approval"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        // Should be fully approved
        assert!(document_flow::get_submission_state(&submission) == DOC_STATE_APPROVED, 37);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_submit_document() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create document flow
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let chain = create_test_chain();
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    // Submit document
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Budget Proposal"),
            string::utf8(b"Q4 event budget"),
            string::utf8(b"https://walrus.example/budget.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(submission_id != object::id_from_address(@0x0), 10);
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    // Verify submission was created
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        
        assert!(document_flow::get_submission_state(&submission) == DOC_STATE_IN_REVIEW, 11);
        assert!(document_flow::get_current_reviewer_level(&submission) == 1, 12); // Should start at lowest level
        assert!(document_flow::get_document_uri(&submission) == string::utf8(b"https://walrus.example/budget.pdf"), 13);
        
        test_scenario::return_shared(submission);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_approve_document_single_level() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create flow with single reviewer
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let mut chain = vector::empty<ChainParticipant>();
        
        vector::push_back(&mut chain, document_flow::create_chain_participant(
            REVIEWER1,
            string::utf8(b"Solo Reviewer"),
            1,
            string::utf8(b"Manager")
        ));
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    // Submit and approve document
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let _submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Simple Doc"),
            string::utf8(b"Description"),
            string::utf8(b"https://walrus.example/doc.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    // Approve as the single reviewer
    test_scenario::next_tx(&mut scenario, REVIEWER1);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"Looks good!"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        // Should be fully approved since it's the only level
        assert!(document_flow::get_submission_state(&submission) == DOC_STATE_APPROVED, 14);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_approve_document_multi_level() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create flow and submit document
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let chain = create_test_chain();
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let _submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Multi-level Doc"),
            string::utf8(b"Needs multiple approvals"),
            string::utf8(b"https://walrus.example/doc.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    // First approval (REVIEWER1 - level 1)
    test_scenario::next_tx(&mut scenario, REVIEWER1);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        assert!(document_flow::get_current_reviewer_level(&submission) == 1, 15);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"First approval"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        // Should move to next level, not fully approved yet
        assert!(document_flow::get_submission_state(&submission) == DOC_STATE_IN_REVIEW, 16);
        assert!(document_flow::get_current_reviewer_level(&submission) == 2, 17);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    // Second approval (REVIEWER2 - level 2)
    test_scenario::next_tx(&mut scenario, REVIEWER2);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"Second approval"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        // Should move to final level
        assert!(document_flow::get_submission_state(&submission) == DOC_STATE_IN_REVIEW, 18);
        assert!(document_flow::get_current_reviewer_level(&submission) == 3, 19);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    // Final approval (REVIEWER3 - level 3)
    test_scenario::next_tx(&mut scenario, REVIEWER3);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"Final approval"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        // Should be fully approved now
        assert!(document_flow::get_submission_state(&submission) == DOC_STATE_APPROVED, 20);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_reject_document() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create flow and submit document
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let chain = create_test_chain();
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let _submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Doc to Reject"),
            string::utf8(b"This will be rejected"),
            string::utf8(b"https://walrus.example/bad.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    // Reject at first level
    test_scenario::next_tx(&mut scenario, REVIEWER1);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::reject_document(
            &mut submission,
            &flow,
            string::utf8(b"Insufficient information"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        // Should be marked as rejected since it's at the lowest level
        assert!(document_flow::get_submission_state(&submission) == DOC_STATE_REJECTED, 21);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_reject_and_send_back() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create flow and submit document
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let chain = create_test_chain();
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let _submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Doc to Send Back"),
            string::utf8(b"Will be approved then sent back"),
            string::utf8(b"https://walrus.example/sendback.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    // Approve at first level
    test_scenario::next_tx(&mut scenario, REVIEWER1);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"First approval"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(document_flow::get_current_reviewer_level(&submission) == 2, 22);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    // Reject at second level - should send back to first level
    test_scenario::next_tx(&mut scenario, REVIEWER2);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::reject_document(
            &mut submission,
            &flow,
            string::utf8(b"Need more details"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        // Should be sent back to previous level, not rejected
        assert!(document_flow::get_submission_state(&submission) == DOC_STATE_IN_REVIEW, 23);
        assert!(document_flow::get_current_reviewer_level(&submission) == 1, 24);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_fund_organizer_directly() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create flow, submit, and fully approve document
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let mut chain = vector::empty<ChainParticipant>();
        
        vector::push_back(&mut chain, document_flow::create_chain_participant(
            FUNDER,
            string::utf8(b"Funder Reviewer"),
            1,
            string::utf8(b"Treasurer")
        ));
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let _submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Budget Request"),
            string::utf8(b"Funding needed"),
            string::utf8(b"https://walrus.example/budget.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    // Approve to make it fundable
    test_scenario::next_tx(&mut scenario, FUNDER);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        document_flow::approve_document(
            &mut submission,
            &flow,
            string::utf8(b"Approved for funding"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(document_flow::get_submission_state(&submission) == DOC_STATE_APPROVED, 25);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    // Fund the organizer
    test_scenario::next_tx(&mut scenario, FUNDER);
    {
        let mut submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        let payment = mint_for_testing<SUI>(1000000, test_scenario::ctx(&mut scenario));
        
        document_flow::fund_organizer_directly(
            &mut submission,
            &flow,
            payment,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(document_flow::get_submission_state(&submission) == DOC_STATE_FUNDED, 26);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_is_user_current_reviewer() {
    let mut scenario = test_scenario::begin(ORGANIZER);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario, &mut clock);
    let _event_id = create_test_event(&mut scenario, &clock, ORGANIZER);
    
    // Create flow and submit document
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let event = test_scenario::take_shared<Event>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        let chain = create_test_chain();
        
        let cap = document_flow::create_document_flow(
            &event,
            chain,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        transfer::public_transfer(cap, ORGANIZER);
        test_scenario::return_shared(event);
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, ORGANIZER);
    {
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        let mut registry = test_scenario::take_shared<DocumentFlowRegistry>(&scenario);
        
        let _submission_id = document_flow::submit_document(
            &flow,
            string::utf8(b"Test Doc"),
            string::utf8(b"For reviewer check"),
            string::utf8(b"https://walrus.example/test.pdf"),
            string::utf8(b"pdf"),
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(flow);
        test_scenario::return_shared(registry);
    };
    
    // Check current reviewer
    test_scenario::next_tx(&mut scenario, @0x0);
    {
        let submission = test_scenario::take_shared<DocumentSubmission>(&scenario);
        let flow = test_scenario::take_shared<DocumentFlow>(&scenario);
        
        // REVIEWER1 should be current reviewer (level 1)
        assert!(document_flow::is_user_current_reviewer(&submission, &flow, REVIEWER1), 27);
        assert!(!document_flow::is_user_current_reviewer(&submission, &flow, REVIEWER2), 28);
        assert!(!document_flow::is_user_current_reviewer(&submission, &flow, REVIEWER3), 29);
        assert!(!document_flow::is_user_current_reviewer(&submission, &flow, ORGANIZER), 30);
        
        test_scenario::return_shared(submission);
        test_scenario::return_shared(flow);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}
