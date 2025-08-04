module ariya::subscription;

use std::string::String;
use sui::clock::{Self, Clock};
use sui::table::{Self, Table};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::event;
use ariya::platform_treasury::{Self, PlatformTreasury};
use ariya::event_management::{Self, OrganizerProfile};

// Error codes
const ENotAuthorized: u64 = 300;
const ESubscriptionNotActive: u64 = 301;
const EAttendeeLimitExceeded: u64 = 302;
const EInsufficientPayment: u64 = 303;
const EAlreadySubscribed: u64 = 304;

// Subscription types
const SUBSCRIPTION_FREE: u8 = 0;
const SUBSCRIPTION_BASIC: u8 = 1;
const SUBSCRIPTION_PRO: u8 = 2;

// Subscription limits
const FREE_ATTENDEE_LIMIT: u64 = 501;
const U64_MAX: u64 = 18446744073709551615;

// User subscription record
public struct UserSubscription has key, store {
    id: UID,
    user: address,
    subscription_type: u8,
    start_date: u64,
    end_date: u64, // 0 for free (never expires), timestamp for paid subscriptions
    is_active: bool,
    created_at: u64,
    last_updated: u64,
}

// Subscription pricing configuration
public struct SubscriptionConfig has key {
    id: UID,
    basic_monthly_price: u64,
    basic_yearly_price: u64,
    pro_monthly_price: u64,
    pro_yearly_price: u64,
    admin: address,
}

// Subscription registry
public struct SubscriptionRegistry has key {
    id: UID,
    user_subscriptions: Table<address, ID>, // user_address -> subscription_id
    active_subscriptions_count: Table<u8, u64>, // subscription_type -> count
}

// Admin capability for subscription management
public struct SubscriptionAdminCap has key, store {
    id: UID,
    config_id: ID,
}

// Events
public struct SubscriptionCreated has copy, drop {
    subscription_id: ID,
    user: address,
    subscription_type: u8,
    start_date: u64,
    end_date: u64,
}

public struct SubscriptionUpgraded has copy, drop {
    subscription_id: ID,
    user: address,
    old_type: u8,
    new_type: u8,
    timestamp: u64,
}

public struct AttendeeCountUpdated has copy, drop {
    subscription_id: ID,
    user: address,
    total_attendees_served: u64,
    timestamp: u64,
}

public struct SubscriptionExpired has copy, drop {
    subscription_id: ID,
    user: address,
    subscription_type: u8,
    timestamp: u64,
}

// Initialize the subscription module
fun init(ctx: &mut TxContext) {
    let admin = tx_context::sender(ctx);
    
    // Default pricing (in SUI units, adjust as needed)
    let config = SubscriptionConfig {
        id: object::new(ctx),
        basic_monthly_price: 10_000_000_000, // 10 SUI
        basic_yearly_price: 100_000_000_000, // 100 SUI (2 months free)
        pro_monthly_price: 25_000_000_000,   // 25 SUI
        pro_yearly_price: 250_000_000_000,   // 250 SUI (2 months free)
        admin,
    };
    
    let config_id = object::id(&config);
    
    let admin_cap = SubscriptionAdminCap {
        id: object::new(ctx),
        config_id,
    };
    
    let mut registry = SubscriptionRegistry {
        id: object::new(ctx),
        user_subscriptions: table::new(ctx),
        active_subscriptions_count: table::new(ctx),
    };
    
    // Initialize counters
    table::add(&mut registry.active_subscriptions_count, SUBSCRIPTION_FREE, 0);
    table::add(&mut registry.active_subscriptions_count, SUBSCRIPTION_BASIC, 0);
    table::add(&mut registry.active_subscriptions_count, SUBSCRIPTION_PRO, 0);
    
    transfer::transfer(admin_cap, admin);
    transfer::share_object(config);
    transfer::share_object(registry);
}

// Create free subscription (automatically assigned when user creates profile)
public fun create_free_subscription(
    user: address,
    clock: &Clock,
    registry: &mut SubscriptionRegistry,
    ctx: &mut TxContext
): ID {
    assert!(!table::contains(&registry.user_subscriptions, user), EAlreadySubscribed);
    
    let subscription = UserSubscription {
        id: object::new(ctx),
        user,
        subscription_type: SUBSCRIPTION_FREE,
        start_date: clock::timestamp_ms(clock),
        end_date: 0, // Never expires
        is_active: true,
        created_at: clock::timestamp_ms(clock),
        last_updated: clock::timestamp_ms(clock),
    };
    
    let subscription_id = object::id(&subscription);
    
    // Update registry
    table::add(&mut registry.user_subscriptions, user, subscription_id);
    let free_count = table::borrow_mut(&mut registry.active_subscriptions_count, SUBSCRIPTION_FREE);
    *free_count = *free_count + 1;
    
    event::emit(SubscriptionCreated {
        subscription_id,
        user,
        subscription_type: SUBSCRIPTION_FREE,
        start_date: subscription.start_date,
        end_date: 0,
    });
    
    transfer::share_object(subscription);
    subscription_id
}

// Subscribe to basic plan
public fun subscribe_basic(
    subscription: &mut UserSubscription,
    is_yearly: bool,
    payment: Coin<SUI>,
    config: &SubscriptionConfig,
    registry: &mut SubscriptionRegistry,
    treasury: &mut PlatformTreasury,
    clock: &Clock,
    ctx: &mut TxContext
): ID {
    let user = tx_context::sender(ctx);
    assert!(subscription.user == user, ENotAuthorized);
    
    let required_amount = if (is_yearly) { 
        config.basic_yearly_price 
    } else { 
        config.basic_monthly_price 
    };
    
    assert!(coin::value(&payment) >= required_amount, EInsufficientPayment);
    
    let duration_ms = if (is_yearly) { 
        365 * 24 * 60 * 60 * 1000 // 1 year in milliseconds
    } else { 
        30 * 24 * 60 * 60 * 1000  // 30 days in milliseconds
    };
    
    let current_time = clock::timestamp_ms(clock);
    let end_date = current_time + duration_ms;
    
    // Upgrade existing subscription
    let subscription_id = upgrade_subscription(
        subscription, 
        SUBSCRIPTION_BASIC, 
        end_date, 
        registry, 
        clock, 
    );
    
    // Send payment to treasury
    platform_treasury::deposit_platform_fee(
        treasury, 
        payment, 
        std::string::utf8(b"subscription"),
        clock,
        ctx
    );
    
    subscription_id
}

// Subscribe to pro plan
public fun subscribe_pro(
    subscription: &mut UserSubscription,
    is_yearly: bool,
    payment: Coin<SUI>,
    config: &SubscriptionConfig,
    registry: &mut SubscriptionRegistry,
    treasury: &mut PlatformTreasury,
    clock: &Clock,
    ctx: &mut TxContext
): ID {
    let user = tx_context::sender(ctx);
    assert!(subscription.user == user, ENotAuthorized);
    
    let required_amount = if (is_yearly) { 
        config.pro_yearly_price 
    } else { 
        config.pro_monthly_price 
    };
    
    assert!(coin::value(&payment) >= required_amount, EInsufficientPayment);
    
    let duration_ms = if (is_yearly) { 
        365 * 24 * 60 * 60 * 1000 // 1 year in milliseconds
    } else { 
        30 * 24 * 60 * 60 * 1000  // 30 days in milliseconds
    };
    
    let current_time = clock::timestamp_ms(clock);
    let end_date = current_time + duration_ms;
    
    // Upgrade existing subscription
    let subscription_id = upgrade_subscription(
        subscription, 
        SUBSCRIPTION_PRO, 
        end_date, 
        registry, 
        clock, 
    );
    
    // Send payment to treasury
    platform_treasury::deposit_platform_fee(
        treasury, 
        payment, 
        std::string::utf8(b"subscription"),
        clock,
        ctx
    );
    
    subscription_id
}

// Helper function to upgrade existing subscription
fun upgrade_subscription(
    subscription: &mut UserSubscription,
    new_type: u8,
    new_end_date: u64,
    registry: &mut SubscriptionRegistry,
    clock: &Clock,
): ID {
    let old_type = subscription.subscription_type;
    let subscription_id = object::id(subscription);
    
    // Update subscription counters in registry
    let old_count = table::borrow_mut(&mut registry.active_subscriptions_count, old_type);
    *old_count = *old_count - 1;
    
    let new_count = table::borrow_mut(&mut registry.active_subscriptions_count, new_type);
    *new_count = *new_count + 1;
    
    // Update subscription details
    subscription.subscription_type = new_type;
    subscription.end_date = new_end_date;
    subscription.is_active = true;
    subscription.last_updated = clock::timestamp_ms(clock);
    
    event::emit(SubscriptionUpgraded {
        subscription_id,
        user: subscription.user,
        old_type,
        new_type,
        timestamp: clock::timestamp_ms(clock),
    });
    
    subscription_id
}

// Check if user can add attendees (for free tier limit)
public fun can_add_attendees(
    subscription: &UserSubscription,
    organizer_profile: &OrganizerProfile,
    additional_attendees: u64,
    clock: &Clock
): bool {
    // Check if subscription is active
    if (!subscription.is_active) {
        return false
    };
    
    // Check if subscription has expired
    if (subscription.end_date > 0 && clock::timestamp_ms(clock) > subscription.end_date) {
        return false
    };
    
    // For free tier, check attendee limit using organizer profile
    if (subscription.subscription_type == SUBSCRIPTION_FREE) {
        let (_, _, current_total_attendees, _) = event_management::get_organizer_stats(organizer_profile);
        return (current_total_attendees + additional_attendees) <= FREE_ATTENDEE_LIMIT
    };
    
    // Basic and Pro have unlimited attendees
    true
}

// Update attendee count tracking (called when event is completed)
public fun track_attendee_update(
    subscription: &mut UserSubscription,
    organizer_profile: &OrganizerProfile,
    clock: &Clock,
    _ctx: &mut TxContext
) {
    assert!(subscription.is_active, ESubscriptionNotActive);
    
    // Get current total from organizer profile
    let (_, _, total_attendees_served, _) = event_management::get_organizer_stats(organizer_profile);
    
    // Check limits for free tier
    if (subscription.subscription_type == SUBSCRIPTION_FREE) {
        assert!(total_attendees_served <= FREE_ATTENDEE_LIMIT, EAttendeeLimitExceeded);
    };
    
    subscription.last_updated = clock::timestamp_ms(clock);
    
    event::emit(AttendeeCountUpdated {
        subscription_id: object::id(subscription),
        user: subscription.user,
        total_attendees_served,
        timestamp: clock::timestamp_ms(clock),
    });
}

// Check if user should pay platform fee
public fun should_pay_platform_fee(subscription: &UserSubscription): bool {
    // Only Free and Basic tier pays platform fee, Pro don't
    subscription.subscription_type == SUBSCRIPTION_BASIC || subscription.subscription_type == SUBSCRIPTION_FREE
}

// Expire subscription (can be called by anyone, checks timestamp)
public fun expire_subscription(
    subscription: &mut UserSubscription,
    registry: &mut SubscriptionRegistry,
    clock: &Clock,
    _ctx: &mut TxContext
) {
    let current_time = clock::timestamp_ms(clock);
    assert!(subscription.end_date > 0 && current_time > subscription.end_date, ESubscriptionNotActive);
    assert!(subscription.is_active, ESubscriptionNotActive);
    
    subscription.is_active = false;
    subscription.last_updated = current_time;
    
    // Update counters
    let count = table::borrow_mut(&mut registry.active_subscriptions_count, subscription.subscription_type);
    *count = *count - 1;
    
    event::emit(SubscriptionExpired {
        subscription_id: object::id(subscription),
        user: subscription.user,
        subscription_type: subscription.subscription_type,
        timestamp: current_time,
    });
}

// Admin functions
public fun update_pricing(
    config: &mut SubscriptionConfig,
    admin_cap: &SubscriptionAdminCap,
    basic_monthly: u64,
    basic_yearly: u64,
    pro_monthly: u64,
    pro_yearly: u64,
    ctx: &mut TxContext
) {
    assert!(config.admin == tx_context::sender(ctx), ENotAuthorized);
    assert!(admin_cap.config_id == object::id(config), ENotAuthorized);
    
    config.basic_monthly_price = basic_monthly;
    config.basic_yearly_price = basic_yearly;
    config.pro_monthly_price = pro_monthly;
    config.pro_yearly_price = pro_yearly;
}

// Getters
public fun get_subscription_type(subscription: &UserSubscription): u8 {
    subscription.subscription_type
}

public fun get_subscription_status(subscription: &UserSubscription, clock: &Clock): (bool, bool) {
    let is_active = subscription.is_active;
    let is_expired = if (subscription.end_date == 0) {
        false
    } else {
        clock::timestamp_ms(clock) > subscription.end_date
    };
    (is_active, is_expired)
}

public fun get_attendee_count(organizer_profile: &OrganizerProfile): u64 {
    let (_, _, total_attendees_served, _) = event_management::get_organizer_stats(organizer_profile);
    total_attendees_served
}

public fun get_remaining_attendees(subscription: &UserSubscription, organizer_profile: &OrganizerProfile): u64 {
    if (subscription.subscription_type == SUBSCRIPTION_FREE) {
        let (_, _, total_attendees_served, _) = event_management::get_organizer_stats(organizer_profile);
        if (total_attendees_served >= FREE_ATTENDEE_LIMIT) {
            0
        } else {
            FREE_ATTENDEE_LIMIT - total_attendees_served
        }
    } else {
        U64_MAX // Unlimited for Basic and Pro
    }
}

public fun get_subscription_details(subscription: &UserSubscription): (address, u8, u64, u64, bool) {
    (
        subscription.user,
        subscription.subscription_type,
        subscription.start_date,
        subscription.end_date,
        subscription.is_active
    )
}

public fun get_pricing(config: &SubscriptionConfig): (u64, u64, u64, u64) {
    (
        config.basic_monthly_price,
        config.basic_yearly_price,
        config.pro_monthly_price,
        config.pro_yearly_price
    )
}

public fun has_subscription(registry: &SubscriptionRegistry, user: address): bool {
    table::contains(&registry.user_subscriptions, user)
}

public fun get_user_subscription_id(registry: &SubscriptionRegistry, user: address): ID {
    *table::borrow(&registry.user_subscriptions, user)
}

public fun get_subscription_type_name(subscription_type: u8): String {
    if (subscription_type == SUBSCRIPTION_FREE) {
        std::string::utf8(b"Free")
    } else if (subscription_type == SUBSCRIPTION_BASIC) {
        std::string::utf8(b"Basic")
    } else if (subscription_type == SUBSCRIPTION_PRO) {
        std::string::utf8(b"Pro")
    } else {
        std::string::utf8(b"Unknown")
    }
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}