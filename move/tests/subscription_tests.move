#[test_only]
module ariya::subscription_tests;

use std::string;
use sui::test_scenario::{Self, Scenario};
use sui::clock::{Self, Clock};
use sui::coin::mint_for_testing;
use sui::sui::SUI;
use ariya::subscription::{
    Self,
    UserSubscription,
    SubscriptionConfig,
    SubscriptionRegistry,
    SubscriptionAdminCap,
    // Error codes
    ENotAuthorized,
    ESubscriptionNotActive,
    EInsufficientPayment,
    EAlreadySubscribed,
};
use ariya::event_management::{Self, OrganizerProfile};
use ariya::platform_treasury::{Self, PlatformTreasury};

// Subscription types
const SUBSCRIPTION_FREE: u8 = 0;
const SUBSCRIPTION_BASIC: u8 = 1;
const SUBSCRIPTION_PRO: u8 = 2;

// Test addresses
const USER1: address = @0xA1;
const USER2: address = @0xA2;
const ADMIN: address = @0xA3;

// Test constants
const DAY_IN_MS: u64 = 86400000;
const YEAR_IN_MS: u64 = 365 * 86400000;
const FREE_ATTENDEE_LIMIT: u64 = 501;

// ========== Test Helper Functions ==========

#[test_only]
fun setup_test(scenario: &mut Scenario) {
    // Initialize subscription module
    test_scenario::next_tx(scenario, ADMIN);
    {
        subscription::init_for_testing(test_scenario::ctx(scenario));
    };

    // Initialize event management and platform treasury for integration tests
    test_scenario::next_tx(scenario, ADMIN);
    {
        event_management::init_for_testing(test_scenario::ctx(scenario));
        platform_treasury::init_for_testing(test_scenario::ctx(scenario));
    };
}

#[test_only]
fun create_test_organizer_profile(
    scenario: &mut Scenario,
    clock: &Clock,
    user: address
) {
    test_scenario::next_tx(scenario, user);
    {
        let cap = event_management::create_organizer_profile(
            string::utf8(b"Test Organizer"),
            string::utf8(b"Test bio"),
            clock,
            test_scenario::ctx(scenario)
        );
        transfer::public_transfer(cap, user);
    };
}

// ========== Core Functionality Tests ==========

#[test]
fun test_create_free_subscription() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Create free subscription
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        
        let subscription_id = subscription::create_free_subscription(
            USER1,
            &clock,
            &mut registry,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(subscription::has_subscription(&registry, USER1), 0);
        assert!(subscription::get_user_subscription_id(&registry, USER1) == subscription_id, 1);
        
        test_scenario::return_shared(registry);
    };
    
    // Verify subscription details
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        
        assert!(subscription::get_subscription_type(&subscription) == SUBSCRIPTION_FREE, 2);
        let (is_active, is_expired) = subscription::get_subscription_status(&subscription, &clock);
        assert!(is_active, 3);
        assert!(!is_expired, 4);
        
        let (user, sub_type, _, end_date, active) = subscription::get_subscription_details(&subscription);
        assert!(user == USER1, 5);
        assert!(sub_type == SUBSCRIPTION_FREE, 6);
        assert!(end_date == 0, 7); // Never expires
        assert!(active, 8);
        
        test_scenario::return_shared(subscription);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_subscribe_basic_monthly() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Create free subscription first
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    // Upgrade to basic monthly
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
        
        let (basic_monthly, _, _, _) = subscription::get_pricing(&config);
        let payment = mint_for_testing<SUI>(basic_monthly, test_scenario::ctx(&mut scenario));
        
        subscription::subscribe_basic(
            &mut subscription,
            false, // monthly
            payment,
            &config,
            &mut registry,
            &mut treasury,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(subscription::get_subscription_type(&subscription) == SUBSCRIPTION_BASIC, 9);
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(treasury);
        test_scenario::return_shared(config);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_subscribe_pro_yearly() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Create free subscription first
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    // Upgrade to pro yearly
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
        
        let (_, _, _, pro_yearly) = subscription::get_pricing(&config);
        let payment = mint_for_testing<SUI>(pro_yearly, test_scenario::ctx(&mut scenario));
        
        subscription::subscribe_pro(
            &mut subscription,
            true, // yearly
            payment,
            &config,
            &mut registry,
            &mut treasury,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(subscription::get_subscription_type(&subscription) == SUBSCRIPTION_PRO, 10);
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(treasury);
        test_scenario::return_shared(config);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_expire_subscription() {
    let mut scenario = test_scenario::begin(ADMIN);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Create and upgrade to basic subscription
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
        
        let (basic_monthly, _, _, _) = subscription::get_pricing(&config);
        let payment = mint_for_testing<SUI>(basic_monthly, test_scenario::ctx(&mut scenario));
        
        subscription::subscribe_basic(
            &mut subscription,
            false,
            payment,
            &config,
            &mut registry,
            &mut treasury,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(treasury);
        test_scenario::return_shared(config);
    };
    
    // Fast forward past expiration
    clock::increment_for_testing(&mut clock, 31 * DAY_IN_MS);
    
    // Expire subscription
    test_scenario::next_tx(&mut scenario, USER2); // Can be called by anyone
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        
        subscription::expire_subscription(
            &mut subscription,
            &mut registry,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        let (is_active, is_expired) = subscription::get_subscription_status(&subscription, &clock);
        assert!(!is_active, 11);
        assert!(is_expired, 12);
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_can_add_attendees_free_tier() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    create_test_organizer_profile(&mut scenario, &clock, USER1);
    
    // Create free subscription
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    // Test attendee limits
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let profile = test_scenario::take_shared<OrganizerProfile>(&scenario);
        
        // Should be able to add up to limit
        assert!(subscription::can_add_attendees(&subscription, &profile, 500, &clock), 13);
        
        // Should not be able to exceed limit
        assert!(!subscription::can_add_attendees(&subscription, &profile, 502, &clock), 14);
        
        // Check remaining attendees
        let remaining = subscription::get_remaining_attendees(&subscription, &profile);
        assert!(remaining == FREE_ATTENDEE_LIMIT, 15);
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(profile);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_platform_fee_logic() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Test free subscription - no platform fee
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        assert!(subscription::should_pay_platform_fee(&subscription), 16);
        test_scenario::return_shared(subscription);
    };
    
    // Upgrade to basic - should pay platform fee
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
        
        let (basic_monthly, _, _, _) = subscription::get_pricing(&config);
        let payment = mint_for_testing<SUI>(basic_monthly, test_scenario::ctx(&mut scenario));
        
        subscription::subscribe_basic(
            &mut subscription,
            false,
            payment,
            &config,
            &mut registry,
            &mut treasury,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(subscription::should_pay_platform_fee(&subscription), 17);
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(treasury);
        test_scenario::return_shared(config);
    };
    
    // Upgrade to pro - no platform fee
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
        
        let (_, _, _, pro_yearly) = subscription::get_pricing(&config);
        let payment = mint_for_testing<SUI>(pro_yearly, test_scenario::ctx(&mut scenario));
        
        subscription::subscribe_pro(
            &mut subscription,
            true,
            payment,
            &config,
            &mut registry,
            &mut treasury,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(!subscription::should_pay_platform_fee(&subscription), 18);
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(treasury);
        test_scenario::return_shared(config);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_subscription_type_names() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    test_scenario::next_tx(&mut scenario, USER1);
    {
        assert!(subscription::get_subscription_type_name(SUBSCRIPTION_FREE) == string::utf8(b"Free"), 19);
        assert!(subscription::get_subscription_type_name(SUBSCRIPTION_BASIC) == string::utf8(b"Basic"), 20);
        assert!(subscription::get_subscription_type_name(SUBSCRIPTION_PRO) == string::utf8(b"Pro"), 21);
        assert!(subscription::get_subscription_type_name(99) == string::utf8(b"Unknown"), 22);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_admin_update_pricing() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Update pricing as admin
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let mut config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
        let admin_cap = test_scenario::take_from_sender<SubscriptionAdminCap>(&scenario);
        
        subscription::update_pricing(
            &mut config,
            &admin_cap,
            15_000_000_000, // new basic monthly
            150_000_000_000, // new basic yearly
            30_000_000_000, // new pro monthly
            300_000_000_000, // new pro yearly
            test_scenario::ctx(&mut scenario)
        );
        
        let (basic_monthly, basic_yearly, pro_monthly, pro_yearly) = subscription::get_pricing(&config);
        assert!(basic_monthly == 15_000_000_000, 23);
        assert!(basic_yearly == 150_000_000_000, 24);
        assert!(pro_monthly == 30_000_000_000, 25);
        assert!(pro_yearly == 300_000_000_000, 26);
        
        test_scenario::return_to_sender(&scenario, admin_cap);
        test_scenario::return_shared(config);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

// ========== Error Case Tests ==========

#[test]
#[expected_failure(abort_code = EAlreadySubscribed)]
fun test_create_duplicate_free_subscription() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Create first subscription
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    // Try to create another - should fail
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = EInsufficientPayment)]
fun test_insufficient_payment() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Create free subscription first
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    // Try to upgrade with insufficient payment
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
        
        let insufficient_payment = mint_for_testing<SUI>(1000, test_scenario::ctx(&mut scenario));
        
        subscription::subscribe_basic(
            &mut subscription,
            false,
            insufficient_payment,
            &config,
            &mut registry,
            &mut treasury,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(treasury);
        test_scenario::return_shared(config);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = ENotAuthorized)]
fun test_unauthorized_subscription_upgrade() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Create subscription for USER1
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    // Try to upgrade USER1's subscription as USER2
    test_scenario::next_tx(&mut scenario, USER2);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
        
        let (basic_monthly, _, _, _) = subscription::get_pricing(&config);
        let payment = mint_for_testing<SUI>(basic_monthly, test_scenario::ctx(&mut scenario));
        
        subscription::subscribe_basic(
            &mut subscription,
            false,
            payment,
            &config,
            &mut registry,
            &mut treasury,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(treasury);
        test_scenario::return_shared(config);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = ENotAuthorized)]
fun test_unauthorized_admin_functions() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Try to update pricing as non-admin
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
        let admin_cap = test_scenario::take_from_address<SubscriptionAdminCap>(&scenario, ADMIN);
        
        subscription::update_pricing(
            &mut config,
            &admin_cap,
            15_000_000_000,
            150_000_000_000,
            30_000_000_000,
            300_000_000_000,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_to_address(ADMIN, admin_cap);
        test_scenario::return_shared(config);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = ESubscriptionNotActive)]
fun test_expire_already_inactive_subscription() {
    let mut scenario = test_scenario::begin(ADMIN);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Create and upgrade subscription
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
        
        let (basic_monthly, _, _, _) = subscription::get_pricing(&config);
        let payment = mint_for_testing<SUI>(basic_monthly, test_scenario::ctx(&mut scenario));
        
        subscription::subscribe_basic(
            &mut subscription,
            false,
            payment,
            &config,
            &mut registry,
            &mut treasury,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(treasury);
        test_scenario::return_shared(config);
    };
    
    // Fast forward and expire once
    clock::increment_for_testing(&mut clock, 31 * DAY_IN_MS);
    
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        
        subscription::expire_subscription(&mut subscription, &mut registry, &clock, test_scenario::ctx(&mut scenario));
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
    };
    
    // Try to expire again - should fail
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        
        subscription::expire_subscription(&mut subscription, &mut registry, &clock, test_scenario::ctx(&mut scenario));
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

// ========== Integration Tests ==========

#[test]
fun test_full_subscription_lifecycle() {
    let mut scenario = test_scenario::begin(ADMIN);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    create_test_organizer_profile(&mut scenario, &clock, USER1);
    
    // 1. Start with free subscription
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    // 2. Upgrade to basic
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
        
        let (basic_monthly, _, _, _) = subscription::get_pricing(&config);
        let payment = mint_for_testing<SUI>(basic_monthly, test_scenario::ctx(&mut scenario));
        
        subscription::subscribe_basic(
            &mut subscription,
            false,
            payment,
            &config,
            &mut registry,
            &mut treasury,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(subscription::get_subscription_type(&subscription) == SUBSCRIPTION_BASIC, 27);
        assert!(subscription::should_pay_platform_fee(&subscription), 28);
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(treasury);
        test_scenario::return_shared(config);
    };
    
    // 3. Upgrade to pro
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
        
        let (_, _, pro_monthly, _) = subscription::get_pricing(&config);
        let payment = mint_for_testing<SUI>(pro_monthly, test_scenario::ctx(&mut scenario));
        
        subscription::subscribe_pro(
            &mut subscription,
            false,
            payment,
            &config,
            &mut registry,
            &mut treasury,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(subscription::get_subscription_type(&subscription) == SUBSCRIPTION_PRO, 29);
        assert!(!subscription::should_pay_platform_fee(&subscription), 30);
        
        // Pro has unlimited attendees
        let profile = test_scenario::take_shared<OrganizerProfile>(&scenario);
        assert!(subscription::can_add_attendees(&subscription, &profile, 10000, &clock), 31);
        test_scenario::return_shared(profile);
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(treasury);
        test_scenario::return_shared(config);
    };
    
    // 4. Let subscription expire
    clock::increment_for_testing(&mut clock, 31 * DAY_IN_MS);
    
    test_scenario::next_tx(&mut scenario, USER2);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        
        subscription::expire_subscription(&mut subscription, &mut registry, &clock, test_scenario::ctx(&mut scenario));
        
        let (is_active, is_expired) = subscription::get_subscription_status(&subscription, &clock);
        assert!(!is_active, 32);
        assert!(is_expired, 33);
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_multiple_users_subscriptions() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    create_test_organizer_profile(&mut scenario, &clock, USER1);
    create_test_organizer_profile(&mut scenario, &clock, USER2);
    
    // Create subscriptions for both users
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    test_scenario::next_tx(&mut scenario, USER2);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER2, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    // Verify both exist
    test_scenario::next_tx(&mut scenario, @0x0);
    {
        let registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        assert!(subscription::has_subscription(&registry, USER1), 34);
        assert!(subscription::has_subscription(&registry, USER2), 35);
        test_scenario::return_shared(registry);
    };
    
    // Upgrade USER1 to basic, USER2 to pro
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription1 = test_scenario::take_shared<UserSubscription>(&scenario);
        
        // Skip if this is USER2's subscription
        let (user, _, _, _, _) = subscription::get_subscription_details(&subscription1);
        if (user == USER1) {
            let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
            let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
            let config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
            
            let (basic_monthly, _, _, _) = subscription::get_pricing(&config);
            let payment = mint_for_testing<SUI>(basic_monthly, test_scenario::ctx(&mut scenario));
            
            subscription::subscribe_basic(
                &mut subscription1,
                false,
                payment,
                &config,
                &mut registry,
                &mut treasury,
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(registry);
            test_scenario::return_shared(treasury);
            test_scenario::return_shared(config);
        };
        
        test_scenario::return_shared(subscription1);
    };
    
    test_scenario::next_tx(&mut scenario, USER2);
    {
        let mut subscription2 = test_scenario::take_shared<UserSubscription>(&scenario);
        
        // Skip if this is USER1's subscription
        let (user, _, _, _, _) = subscription::get_subscription_details(&subscription2);
        if (user == USER2) {
            let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
            let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
            let config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
            
            let (_, _, pro_monthly, _) = subscription::get_pricing(&config);
            let payment = mint_for_testing<SUI>(pro_monthly, test_scenario::ctx(&mut scenario));
            
            subscription::subscribe_pro(
                &mut subscription2,
                false,
                payment,
                &config,
                &mut registry,
                &mut treasury,
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(registry);
            test_scenario::return_shared(treasury);
            test_scenario::return_shared(config);
        };
        
        test_scenario::return_shared(subscription2);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_yearly_vs_monthly_pricing() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Test that yearly subscriptions have expected duration
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    let start_time = clock::timestamp_ms(&clock);
    
    // Subscribe to yearly basic
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let config = test_scenario::take_shared<SubscriptionConfig>(&scenario);
        
        let (_, basic_yearly, _, _) = subscription::get_pricing(&config);
        let payment = mint_for_testing<SUI>(basic_yearly, test_scenario::ctx(&mut scenario));
        
        subscription::subscribe_basic(
            &mut subscription,
            true, // yearly
            payment,
            &config,
            &mut registry,
            &mut treasury,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        let (_, _, _, end_date, _) = subscription::get_subscription_details(&subscription);
        // Should be approximately 1 year from start
        assert!(end_date > start_time + (360 * DAY_IN_MS), 36);
        assert!(end_date < start_time + (370 * DAY_IN_MS), 37);
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(registry);
        test_scenario::return_shared(treasury);
        test_scenario::return_shared(config);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_track_attendee_update() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    create_test_organizer_profile(&mut scenario, &clock, USER1);
    
    // Create subscription
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    // Track attendee update
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let profile = test_scenario::take_shared<OrganizerProfile>(&scenario);
        
        subscription::track_attendee_update(
            &mut subscription,
            &profile,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        // Should complete without error for free tier with 0 attendees
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(profile);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_edge_cases() {
    let mut scenario = test_scenario::begin(ADMIN);
    let mut clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    create_test_organizer_profile(&mut scenario, &clock, USER1);
    
    // Create subscription
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let mut registry = test_scenario::take_shared<SubscriptionRegistry>(&scenario);
        subscription::create_free_subscription(USER1, &clock, &mut registry, test_scenario::ctx(&mut scenario));
        test_scenario::return_shared(registry);
    };
    
    // Test edge case: exactly at attendee limit
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        let profile = test_scenario::take_shared<OrganizerProfile>(&scenario);
        
        // Should be able to add exactly the limit
        assert!(subscription::can_add_attendees(&subscription, &profile, FREE_ATTENDEE_LIMIT, &clock), 38);
        
        // Should not be able to add one more
        assert!(!subscription::can_add_attendees(&subscription, &profile, FREE_ATTENDEE_LIMIT + 1, &clock), 39);
        
        test_scenario::return_shared(subscription);
        test_scenario::return_shared(profile);
    };
    
    // Test subscription status edge cases
    test_scenario::next_tx(&mut scenario, USER1);
    {
        let subscription = test_scenario::take_shared<UserSubscription>(&scenario);
        
        // Free subscription never expires
        let (is_active, is_expired) = subscription::get_subscription_status(&subscription, &clock);
        assert!(is_active, 40);
        assert!(!is_expired, 41);
        
        // Fast forward time - free should still not expire
        clock::increment_for_testing(&mut clock, 10 * YEAR_IN_MS);
        let (is_active, is_expired) = subscription::get_subscription_status(&subscription, &clock);
        assert!(is_active, 42);
        assert!(!is_expired, 43);
        
        test_scenario::return_shared(subscription);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}
