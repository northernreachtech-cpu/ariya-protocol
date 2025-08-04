module ariya::identity_access;

use sui::table::{Self, Table};
use sui::clock::{Self, Clock};
use sui::event;
use sui::hash;
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use std::bcs;
use ariya::event_management::{Self, Event, OrganizerProfile};
use ariya::subscription::{Self, UserSubscription};
use ariya::platform_treasury::{Self, PlatformTreasury};

// Error codes
const EEventNotActive: u64 = 1;
const EAlreadyRegistered: u64 = 2;
const ECapacityReached: u64 = 3;
const ENotRegistered: u64 = 4;
const EAttendeeLimitExceeded: u64 = 5;
const EInsufficientPayment: u64 = 6;
const EPlatformFeeRequired: u64 = 7;

// Pass validity duration (24 hours in milliseconds)
const PASS_VALIDITY_DURATION: u64 = 86400000;

// Platform fee percentages
const FREE_PLATFORM_FEE_BPS: u64 = 500;   // 5% for free subscription
const BASIC_PLATFORM_FEE_BPS: u64 = 300;  // 3% for basic subscription
const BASIS_POINTS_DENOMINATOR: u64 = 10000;

// Registration storage
public struct RegistrationRegistry has key {
    id: UID,
    // event_id -> registrations
    event_registrations: Table<ID, EventRegistrations>,
    // wallet -> registered events
    user_registrations: Table<address, vector<ID>>,
}

public struct EventRegistrations has store {
    registrations: Table<address, Registration>,
    pass_mappings: Table<vector<u8>, PassInfo>, // pass_hash -> info
    total_registered: u64,
}

public struct Registration has store, drop, copy {
    wallet: address,
    registered_at: u64,
    pass_hash: vector<u8>,
    checked_in: bool,
    platform_fee_paid: u64, // Track platform fee paid by this registration
}

public struct PassInfo has store, drop, copy {
    wallet: address,
    event_id: ID,
    created_at: u64,
    expires_at: u64,
    used: bool,
    pass_id: u64, // Unique identifier for the pass
}

// Events emitted
public struct UserRegistered has copy, drop {
    event_id: ID,
    wallet: address,
    registered_at: u64,
    platform_fee_paid: u64,
}

public struct PassGenerated has copy, drop {
    event_id: ID,
    wallet: address,
    pass_id: u64,
    expires_at: u64,
}

public struct PassValidated has copy, drop {
    event_id: ID,
    wallet: address,
    pass_id: u64,
}

public struct PlatformFeeCollected has copy, drop {
    event_id: ID,
    attendee: address,
    organizer: address,
    fee_amount: u64,
    registration_fee: u64,
    timestamp: u64,
}

// Initialize the module
fun init(ctx: &mut TxContext) {
    let registry = RegistrationRegistry {
        id: object::new(ctx),
        event_registrations: table::new(ctx),
        user_registrations: table::new(ctx),
    };
    transfer::share_object(registry);
}

// Register for an event with subscription and fee checks
#[allow(lint(self_transfer))]
public fun register_for_event(
    event: &mut Event,
    registry: &mut RegistrationRegistry,
    organizer_subscription: &UserSubscription,
    organizer_profile: &OrganizerProfile,
    treasury: &mut PlatformTreasury,
    payment: Coin<SUI>, // Payment for event registration + platform fee
    clock: &Clock,
    ctx: &mut TxContext
) {
    let wallet = tx_context::sender(ctx);
    let event_id = event_management::get_event_id(event);
    let organizer = event_management::get_event_organizer(event);
    let event_fee = event_management::get_event_fee_amount(event);
    
    // Verify event is active
    assert!(event_management::is_event_active(event), EEventNotActive);
    
    // Check capacity
    assert!(
        event_management::get_current_attendees(event) < event_management::get_event_capacity(event),
        ECapacityReached
    );

    // Check organizer's subscription limits and calculate fees
    let subscription_type = subscription::get_subscription_type(organizer_subscription);
    let (subscription_active, subscription_expired) = subscription::get_subscription_status(organizer_subscription, clock);
    
    // Ensure subscription is active
    assert!(subscription_active && !subscription_expired, EAttendeeLimitExceeded);
    
    // Check attendee limits for free subscription
    if (subscription_type == 0) { // SUBSCRIPTION_FREE
        assert!(
            subscription::can_add_attendees(organizer_subscription, organizer_profile, 1, clock),
            EAttendeeLimitExceeded
        );
    };
    
    // Calculate platform fee based on subscription type
    let platform_fee = if (event_fee > 0) {
        if (subscription_type == 0) { // SUBSCRIPTION_FREE
            // 5% platform fee for free subscription
            (event_fee * FREE_PLATFORM_FEE_BPS) / BASIS_POINTS_DENOMINATOR
        } else if (subscription_type == 1) { // SUBSCRIPTION_BASIC
            // 3% platform fee for basic subscription
            (event_fee * BASIC_PLATFORM_FEE_BPS) / BASIS_POINTS_DENOMINATOR
        } else {
            // No platform fee for Pro subscription
            0
        }
    } else {
        0 // No platform fee for free events
    };
    
    let payment_amount = coin::value(&payment);
    
    // Check if payment covers the event fee (attendee only pays event fee)
    assert!(payment_amount >= event_fee, EInsufficientPayment);
    
    // Split payment: platform fee deducted from event fee
    let (mut event_payment, platform_payment) = if (platform_fee > 0) {
        let mut payment_coin = payment;
        let platform_coin = coin::split(&mut payment_coin, platform_fee, ctx);
        (payment_coin, platform_coin)
    } else {
        (payment, coin::zero(ctx))
    };

    // Initialize event registrations if needed
    if (!table::contains(&registry.event_registrations, event_id)) {
        let event_regs = EventRegistrations {
            registrations: table::new(ctx),
            pass_mappings: table::new(ctx),
            total_registered: 0,
        };
        table::add(&mut registry.event_registrations, event_id, event_regs);
    };

    let event_regs = table::borrow_mut(&mut registry.event_registrations, event_id);
    
    // Check if already registered
    assert!(!table::contains(&event_regs.registrations, wallet), EAlreadyRegistered);

    let registered_at = clock::timestamp_ms(clock);
    let pass_id = generate_pass_id(wallet, event_id, registered_at);
    let pass_hash = generate_pass_hash(pass_id, event_id, wallet);

    // Create registration with platform fee tracking
    let registration = Registration {
        wallet,
        registered_at,
        pass_hash,
        checked_in: false,
        platform_fee_paid: platform_fee,
    };

    // Store registration
    table::add(&mut event_regs.registrations, wallet, registration);
    event_regs.total_registered = event_regs.total_registered + 1;

    // Update user's registration list
    if (!table::contains(&registry.user_registrations, wallet)) {
        table::add(&mut registry.user_registrations, wallet, vector::empty());
    };
    let user_events = table::borrow_mut(&mut registry.user_registrations, wallet);
    vector::push_back(user_events, event_id);

    // Generate and store pass info
    let expires_at = registered_at + PASS_VALIDITY_DURATION;
    let pass_info = PassInfo {
        wallet,
        event_id,
        created_at: registered_at,
        expires_at,
        used: false,
        pass_id,
    };
    table::add(&mut event_regs.pass_mappings, pass_hash, pass_info);

    // Handle payments
    // Send platform fee to treasury if applicable (deducted from event fee)
    if (platform_fee > 0) {
        platform_treasury::deposit_platform_fee(
            treasury,
            platform_payment,
            std::string::utf8(b"event_registration"),
            clock,
            ctx
        );

        event::emit(PlatformFeeCollected {
            event_id,
            attendee: wallet,
            organizer,
            fee_amount: platform_fee,
            registration_fee: event_fee,
            timestamp: registered_at,
        });
    } else {
        // Destroy empty coin
        coin::destroy_zero(platform_payment);
    };

    // Handle event registration fee (organizer receives event_fee - platform_fee)
    let organizer_amount = event_fee - platform_fee;
    if (organizer_amount > 0) {
        // Transfer remaining amount to organizer after platform fee deduction
        let organizer_payment = coin::split(&mut event_payment, organizer_amount, ctx);
        transfer::public_transfer(organizer_payment, organizer);
    };
    
    // Handle any remaining payment (should return excess to attendee)
    if (coin::value(&event_payment) > 0) {
        transfer::public_transfer(event_payment, wallet);
    } else {
        coin::destroy_zero(event_payment);
    };

    // Emit events
    event::emit(UserRegistered {
        event_id,
        wallet,
        registered_at,
        platform_fee_paid: platform_fee,
    });

    event::emit(PassGenerated {
        event_id,
        wallet,
        pass_id,
        expires_at,
    });
}

// Register for free events (no payment required)
public fun register_for_free_event(
    event: &mut Event,
    registry: &mut RegistrationRegistry,
    organizer_subscription: &UserSubscription,
    organizer_profile: &OrganizerProfile,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let wallet = tx_context::sender(ctx);
    let event_id = event_management::get_event_id(event);
    let event_fee = event_management::get_event_fee_amount(event);
    
    // Ensure this is actually a free event
    assert!(event_fee == 0, EPlatformFeeRequired);
    
    // Verify event is active
    assert!(event_management::is_event_active(event), EEventNotActive);
    
    // Check capacity
    assert!(
        event_management::get_current_attendees(event) < event_management::get_event_capacity(event),
        ECapacityReached
    );

    // Check organizer's subscription limits
    let subscription_type = subscription::get_subscription_type(organizer_subscription);
    let (subscription_active, subscription_expired) = subscription::get_subscription_status(organizer_subscription, clock);
    
    // Ensure subscription is active
    assert!(subscription_active && !subscription_expired, EAttendeeLimitExceeded);
    
    // Check attendee limits for free subscription
    if (subscription_type == 0) { // SUBSCRIPTION_FREE
        assert!(
            subscription::can_add_attendees(organizer_subscription, organizer_profile, 1, clock),
            EAttendeeLimitExceeded
        );
    };

    // Initialize event registrations if needed
    if (!table::contains(&registry.event_registrations, event_id)) {
        let event_regs = EventRegistrations {
            registrations: table::new(ctx),
            pass_mappings: table::new(ctx),
            total_registered: 0,
        };
        table::add(&mut registry.event_registrations, event_id, event_regs);
    };

    let event_regs = table::borrow_mut(&mut registry.event_registrations, event_id);
    
    // Check if already registered
    assert!(!table::contains(&event_regs.registrations, wallet), EAlreadyRegistered);

    let registered_at = clock::timestamp_ms(clock);
    let pass_id = generate_pass_id(wallet, event_id, registered_at);
    let pass_hash = generate_pass_hash(pass_id, event_id, wallet);

    // Create registration with no platform fee
    let registration = Registration {
        wallet,
        registered_at,
        pass_hash,
        checked_in: false,
        platform_fee_paid: 0,
    };

    // Store registration
    table::add(&mut event_regs.registrations, wallet, registration);
    event_regs.total_registered = event_regs.total_registered + 1;

    // Update user's registration list
    if (!table::contains(&registry.user_registrations, wallet)) {
        table::add(&mut registry.user_registrations, wallet, vector::empty());
    };
    let user_events = table::borrow_mut(&mut registry.user_registrations, wallet);
    vector::push_back(user_events, event_id);

    // Generate and store pass info
    let expires_at = registered_at + PASS_VALIDITY_DURATION;
    let pass_info = PassInfo {
        wallet,
        event_id,
        created_at: registered_at,
        expires_at,
        used: false,
        pass_id,
    };
    table::add(&mut event_regs.pass_mappings, pass_hash, pass_info);

    // Emit events
    event::emit(UserRegistered {
        event_id,
        wallet,
        registered_at,
        platform_fee_paid: 0,
    });

    event::emit(PassGenerated {
        event_id,
        wallet,
        pass_id,
        expires_at,
    });
}

// Generate a new ephemeral pass for registered user
public fun regenerate_pass(
    event: &Event,
    registry: &mut RegistrationRegistry,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let wallet = tx_context::sender(ctx);
    let event_id = event_management::get_event_id(event);
    
    // Verify event is active
    assert!(event_management::is_event_active(event), EEventNotActive);
    
    // Check if event has any registrations first
    assert!(table::contains(&registry.event_registrations, event_id), ENotRegistered);
    
    let event_regs = table::borrow_mut(&mut registry.event_registrations, event_id);
    
    // Check if registered
    assert!(table::contains(&event_regs.registrations, wallet), ENotRegistered);
    
    let registration = table::borrow_mut(&mut event_regs.registrations, wallet);
    
    // Remove old pass mapping
    table::remove(&mut event_regs.pass_mappings, registration.pass_hash);
    
    // Generate new pass
    let current_time = clock::timestamp_ms(clock);
    let pass_id = generate_pass_id(wallet, event_id, current_time);
    let pass_hash = generate_pass_hash(pass_id, event_id, wallet);
    let expires_at = current_time + PASS_VALIDITY_DURATION;
    
    // Update registration
    registration.pass_hash = pass_hash;
    
    // Store new pass info
    let pass_info = PassInfo {
        wallet,
        event_id,
        created_at: current_time,
        expires_at,
        used: false,
        pass_id,
    };
    table::add(&mut event_regs.pass_mappings, pass_hash, pass_info);

    event::emit(PassGenerated {
        event_id,
        wallet,
        pass_id,
        expires_at,
    });
}

// Validate ephemeral pass (called by verifier)
public fun validate_pass(
    pass_hash: vector<u8>,
    event_id: ID,
    registry: &mut RegistrationRegistry,
    clock: &Clock,
): (bool, address) {
    if (!table::contains(&registry.event_registrations, event_id)) {
        return (false, @0x0)
    };

    let event_regs = table::borrow_mut(&mut registry.event_registrations, event_id);
    
    if (!table::contains(&event_regs.pass_mappings, pass_hash)) {
        return (false, @0x0)
    };

    let pass_info = table::borrow_mut(&mut event_regs.pass_mappings, pass_hash);
    let current_time = clock::timestamp_ms(clock);

    // Check if pass is valid
    if (pass_info.used || current_time > pass_info.expires_at) {
        return (false, @0x0)
    };

    // Mark pass as used
    pass_info.used = true;

    event::emit(PassValidated {
        event_id,
        wallet: pass_info.wallet,
        pass_id: pass_info.pass_id,
    });

    (true, pass_info.wallet)
}

// Mark user as checked in (called by attendance contract)
public fun mark_checked_in(
    wallet: address,
    event_id: ID,
    registry: &mut RegistrationRegistry,
) {
    let event_regs = table::borrow_mut(&mut registry.event_registrations, event_id);
    let registration = table::borrow_mut(&mut event_regs.registrations, wallet);
    registration.checked_in = true;
}

// Check if a wallet is registered for an event
public fun is_registered(
    wallet: address,
    event_id: ID,
    registry: &RegistrationRegistry,
): bool {
    if (!table::contains(&registry.event_registrations, event_id)) {
        return false
    };
    
    let event_regs = table::borrow(&registry.event_registrations, event_id);
    table::contains(&event_regs.registrations, wallet)
}

// Get registration details
public fun get_registration(
    wallet: address,
    event_id: ID,
    registry: &RegistrationRegistry,
): (u64, bool, u64) {
    let event_regs = table::borrow(&registry.event_registrations, event_id);
    let registration = table::borrow(&event_regs.registrations, wallet);
    (registration.registered_at, registration.checked_in, registration.platform_fee_paid)
}

// Get user's registered events
public fun get_user_events(
    wallet: address,
    registry: &RegistrationRegistry,
): vector<ID> {
    if (!table::contains(&registry.user_registrations, wallet)) {
        return vector::empty()
    };
    
    *table::borrow(&registry.user_registrations, wallet)
}

// Calculate required payment for event registration
public fun calculate_registration_cost(
    event: &Event,
    organizer_subscription: &UserSubscription,
): (u64, u64, u64) { // (event_fee, platform_fee, attendee_pays)
    let event_fee = event_management::get_event_fee_amount(event);
    let subscription_type = subscription::get_subscription_type(organizer_subscription);
    
    let platform_fee = if (subscription_type == 0 && event_fee > 0) { // SUBSCRIPTION_FREE
        (event_fee * FREE_PLATFORM_FEE_BPS) / BASIS_POINTS_DENOMINATOR
    } else if (subscription_type == 1 && event_fee > 0) { // SUBSCRIPTION_BASIC
        (event_fee * BASIC_PLATFORM_FEE_BPS) / BASIS_POINTS_DENOMINATOR
    } else {
        0
    };
    
    // Attendee always pays just the event fee, platform fee is deducted from organizer's share
    (event_fee, platform_fee, event_fee)
}

// Calculate organizer's net revenue after platform fees
public fun calculate_organizer_revenue(
    event: &Event,
    organizer_subscription: &UserSubscription,
): (u64, u64, u64) { // (event_fee, platform_fee_deducted, organizer_receives)
    let event_fee = event_management::get_event_fee_amount(event);
    let subscription_type = subscription::get_subscription_type(organizer_subscription);
    
    let platform_fee = if (subscription_type == 0 && event_fee > 0) { // SUBSCRIPTION_FREE
        (event_fee * FREE_PLATFORM_FEE_BPS) / BASIS_POINTS_DENOMINATOR
    } else if (subscription_type == 1 && event_fee > 0) { // SUBSCRIPTION_BASIC
        (event_fee * BASIC_PLATFORM_FEE_BPS) / BASIS_POINTS_DENOMINATOR
    } else {
        0
    };
    
    let organizer_receives = event_fee - platform_fee;
    (event_fee, platform_fee, organizer_receives)
}

// Helper function to generate pass ID
fun generate_pass_id(wallet: address, event_id: ID, timestamp: u64): u64 {
    let mut data = vector::empty<u8>();
    vector::append(&mut data, bcs::to_bytes(&wallet));
    vector::append(&mut data, bcs::to_bytes(&event_id));
    vector::append(&mut data, bcs::to_bytes(&timestamp));
    
    let hash = hash::keccak256(&data);
    // Convert first 8 bytes to u64
    let mut result = 0u64;
    let mut i = 0;
    while (i < 8) {
        result = (result << 8) | (*vector::borrow(&hash, i) as u64);
        i = i + 1;
    };
    result
}

// Helper function to generate pass hash
fun generate_pass_hash(pass_id: u64, event_id: ID, wallet: address): vector<u8> {
    let mut data = vector::empty<u8>();
    vector::append(&mut data, bcs::to_bytes(&pass_id));
    vector::append(&mut data, bcs::to_bytes(&event_id));
    vector::append(&mut data, bcs::to_bytes(&wallet));
    
    hash::keccak256(&data)
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}