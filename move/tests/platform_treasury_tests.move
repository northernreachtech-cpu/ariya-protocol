#[test_only]
module ariya::platform_treasury_tests;

use std::string;
use sui::test_scenario::{Self, Scenario};
use sui::clock;
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use ariya::platform_treasury::{
    Self, 
    PlatformTreasury, 
    TreasuryAdminCap,
    // Error codes
    ENotAdmin,
    EInsufficientBalance,
    EInvalidAmount,
};

// Test addresses
const ADMIN: address = @0xA1;
const USER: address = @0xB2;
const NEW_ADMIN: address = @0xC3;

// Test constants
const INITIAL_BALANCE: u64 = 1000000000; // 1 SUI
const PLATFORM_FEE: u64 = 20000000;      // 0.02 SUI (2% of 1 SUI)
const SUBSCRIPTION_FEE: u64 = 50000000;  // 0.05 SUI

// ========== Test Helper Functions ==========

#[test_only]
fun setup_test(scenario: &mut Scenario) {
    // Initialize the treasury module
    test_scenario::next_tx(scenario, ADMIN);
    {
        platform_treasury::init_for_testing(test_scenario::ctx(scenario));
    };
}

#[test_only]
fun mint_sui_for_testing(scenario: &mut Scenario, recipient: address, amount: u64): Coin<SUI> {
    test_scenario::next_tx(scenario, recipient);
    {
        coin::mint_for_testing<SUI>(amount, test_scenario::ctx(scenario))
    }
}

// ========== Core Functionality Tests ==========

#[test]
fun test_init_treasury() {
    let mut scenario = test_scenario::begin(ADMIN);
    
    setup_test(&mut scenario);
    
    // Verify treasury was created with correct initial state
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        
        assert!(platform_treasury::get_treasury_balance(&treasury) == 0, 0);
        assert!(platform_treasury::get_treasury_admin(&treasury) == ADMIN, 1);
        assert!(platform_treasury::is_admin(&treasury, ADMIN), 2);
        assert!(!platform_treasury::is_admin(&treasury, USER), 3);
        
        let (platform_fees, subscription_fees) = platform_treasury::get_fee_totals(&treasury);
        assert!(platform_fees == 0, 4);
        assert!(subscription_fees == 0, 5);
        
        test_scenario::return_shared(treasury);
        test_scenario::return_to_sender(&scenario, admin_cap);
    };
    
    test_scenario::end(scenario);
}

#[test]
fun test_deposit_platform_fee_event_registration() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Deposit platform fee for event registration
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let payment = mint_sui_for_testing(&mut scenario, USER, PLATFORM_FEE);
        
        platform_treasury::deposit_platform_fee(
            &mut treasury,
            payment,
            string::utf8(b"event_registration"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(platform_treasury::get_treasury_balance(&treasury) == PLATFORM_FEE, 6);
        
        let (platform_fees, subscription_fees) = platform_treasury::get_fee_totals(&treasury);
        assert!(platform_fees == PLATFORM_FEE, 7);
        assert!(subscription_fees == 0, 8);
        
        test_scenario::return_shared(treasury);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_deposit_subscription_fee() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Deposit subscription fee
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let payment = mint_sui_for_testing(&mut scenario, USER, SUBSCRIPTION_FEE);
        
        platform_treasury::deposit_platform_fee(
            &mut treasury,
            payment,
            string::utf8(b"subscription"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(platform_treasury::get_treasury_balance(&treasury) == SUBSCRIPTION_FEE, 9);
        
        let (platform_fees, subscription_fees) = platform_treasury::get_fee_totals(&treasury);
        assert!(platform_fees == 0, 10);
        assert!(subscription_fees == SUBSCRIPTION_FEE, 11);
        
        test_scenario::return_shared(treasury);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_multiple_deposits() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Make multiple deposits of different types
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        
        // First deposit - event registration
        let payment1 = mint_sui_for_testing(&mut scenario, USER, PLATFORM_FEE);
        platform_treasury::deposit_platform_fee(
            &mut treasury,
            payment1,
            string::utf8(b"event_registration"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        // Second deposit - subscription
        let payment2 = mint_sui_for_testing(&mut scenario, USER, SUBSCRIPTION_FEE);
        platform_treasury::deposit_platform_fee(
            &mut treasury,
            payment2,
            string::utf8(b"subscription"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        // Third deposit - another event registration
        let payment3 = mint_sui_for_testing(&mut scenario, USER, PLATFORM_FEE);
        platform_treasury::deposit_platform_fee(
            &mut treasury,
            payment3,
            string::utf8(b"event_registration"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        let expected_total = PLATFORM_FEE + SUBSCRIPTION_FEE + PLATFORM_FEE;
        assert!(platform_treasury::get_treasury_balance(&treasury) == expected_total, 12);
        
        let (platform_fees, subscription_fees) = platform_treasury::get_fee_totals(&treasury);
        assert!(platform_fees == 2 * PLATFORM_FEE, 13);
        assert!(subscription_fees == SUBSCRIPTION_FEE, 14);
        
        test_scenario::return_shared(treasury);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_withdraw_treasury_funds() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // First deposit some funds
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let payment = mint_sui_for_testing(&mut scenario, USER, INITIAL_BALANCE);
        
        platform_treasury::deposit_platform_fee(
            &mut treasury,
            payment,
            string::utf8(b"event_registration"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(treasury);
    };
    
    // Admin withdraws funds
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        
        let withdraw_amount = INITIAL_BALANCE / 2;
        let withdrawn_coin = platform_treasury::withdraw_treasury_funds(
            &mut treasury,
            &admin_cap,
            withdraw_amount,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(coin::value(&withdrawn_coin) == withdraw_amount, 15);
        assert!(platform_treasury::get_treasury_balance(&treasury) == withdraw_amount, 16);
        
        coin::burn_for_testing(withdrawn_coin);
        test_scenario::return_shared(treasury);
        test_scenario::return_to_sender(&scenario, admin_cap);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_transfer_admin() {
    let mut scenario = test_scenario::begin(ADMIN);
    
    setup_test(&mut scenario);
    
    // Transfer admin to new address
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        
        platform_treasury::transfer_admin(
            &mut treasury,
            admin_cap,
            NEW_ADMIN,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(platform_treasury::get_treasury_admin(&treasury) == NEW_ADMIN, 17);
        assert!(platform_treasury::is_admin(&treasury, NEW_ADMIN), 18);
        assert!(!platform_treasury::is_admin(&treasury, ADMIN), 19);
        
        test_scenario::return_shared(treasury);
    };
    
    // Verify new admin received the capability
    test_scenario::next_tx(&mut scenario, NEW_ADMIN);
    {
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        test_scenario::return_to_sender(&scenario, admin_cap);
    };
    
    test_scenario::end(scenario);
}

#[test]
fun test_get_treasury_details() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Add some funds
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        
        let payment1 = mint_sui_for_testing(&mut scenario, USER, PLATFORM_FEE);
        platform_treasury::deposit_platform_fee(
            &mut treasury,
            payment1,
            string::utf8(b"event_registration"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        let payment2 = mint_sui_for_testing(&mut scenario, USER, SUBSCRIPTION_FEE);
        platform_treasury::deposit_platform_fee(
            &mut treasury,
            payment2,
            string::utf8(b"subscription"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        let (balance, admin, platform_fees, subscription_fees) = platform_treasury::get_treasury_details(&treasury);
        assert!(balance == PLATFORM_FEE + SUBSCRIPTION_FEE, 20);
        assert!(admin == ADMIN, 21);
        assert!(platform_fees == PLATFORM_FEE, 22);
        assert!(subscription_fees == SUBSCRIPTION_FEE, 23);
        
        test_scenario::return_shared(treasury);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = EInvalidAmount)]
fun test_deposit_zero_amount() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let payment = mint_sui_for_testing(&mut scenario, USER, 0);
        
        platform_treasury::deposit_platform_fee(
            &mut treasury,
            payment,
            string::utf8(b"event_registration"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(treasury);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = ENotAdmin)]
fun test_withdraw_not_admin() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Add some funds first
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let payment = mint_sui_for_testing(&mut scenario, USER, INITIAL_BALANCE);
        
        platform_treasury::deposit_platform_fee(
            &mut treasury,
            payment,
            string::utf8(b"event_registration"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(treasury);
    };
    
    // Non-admin tries to withdraw
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_address<TreasuryAdminCap>(&scenario, ADMIN);
        
        let withdrawn_coin = platform_treasury::withdraw_treasury_funds(
            &mut treasury,
            &admin_cap,
            1000,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        // This should never execute due to the expected failure, but we need it for compilation
        coin::burn_for_testing(withdrawn_coin);

        test_scenario::return_shared(treasury);
        test_scenario::return_to_address(ADMIN, admin_cap);

    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = EInsufficientBalance)]
fun test_withdraw_insufficient_balance() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Try to withdraw from empty treasury
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        
        let withdrawn_coin = platform_treasury::withdraw_treasury_funds(
            &mut treasury,
            &admin_cap,
            1000,
            &clock,
            test_scenario::ctx(&mut scenario)
        );

        // This should never execute due to the expected failure, but we need it for compilation
        coin::burn_for_testing(withdrawn_coin);
        
        test_scenario::return_shared(treasury);
        test_scenario::return_to_sender(&scenario, admin_cap);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = EInvalidAmount)]
fun test_withdraw_zero_amount() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Add some funds first
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let payment = mint_sui_for_testing(&mut scenario, USER, INITIAL_BALANCE);
        
        platform_treasury::deposit_platform_fee(
            &mut treasury,
            payment,
            string::utf8(b"event_registration"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(treasury);
    };
    
    // Try to withdraw zero amount
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        
        let withdrawn_coin = platform_treasury::withdraw_treasury_funds(
            &mut treasury,
            &admin_cap,
            0,
            &clock,
            test_scenario::ctx(&mut scenario)
        );

        // This should never execute due to the expected failure, but we need it for compilation
        coin::burn_for_testing(withdrawn_coin);
        
        test_scenario::return_shared(treasury);
        test_scenario::return_to_sender(&scenario, admin_cap);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
#[expected_failure(abort_code = ENotAdmin)]
fun test_transfer_admin_not_admin() {
    let mut scenario = test_scenario::begin(ADMIN);
    
    setup_test(&mut scenario);
    
    // Non-admin tries to transfer admin
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_address<TreasuryAdminCap>(&scenario, ADMIN);
        
        platform_treasury::transfer_admin(
            &mut treasury,
            admin_cap,
            NEW_ADMIN,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(treasury);
    };
    
    test_scenario::end(scenario);
}

// ========== Integration Tests ==========

#[test]
fun test_full_treasury_lifecycle() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // 1. Deposit various fees
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        
        // Multiple event registration fees
        let mut i = 0;
        while (i < 5) {
            let payment = mint_sui_for_testing(&mut scenario, USER, PLATFORM_FEE);
            platform_treasury::deposit_platform_fee(
                &mut treasury,
                payment,
                string::utf8(b"event_registration"),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            i = i + 1;
        };
        
        // Multiple subscription fees
        let mut j = 0;
        while (j < 3) {
            let payment = mint_sui_for_testing(&mut scenario, USER, SUBSCRIPTION_FEE);
            platform_treasury::deposit_platform_fee(
                &mut treasury,
                payment,
                string::utf8(b"subscription"),
                &clock,
                test_scenario::ctx(&mut scenario)
            );
            j = j + 1;
        };
        
        let expected_total = (5 * PLATFORM_FEE) + (3 * SUBSCRIPTION_FEE);
        assert!(platform_treasury::get_treasury_balance(&treasury) == expected_total, 24);
        
        let (platform_fees, subscription_fees) = platform_treasury::get_fee_totals(&treasury);
        assert!(platform_fees == 5 * PLATFORM_FEE, 25);
        assert!(subscription_fees == 3 * SUBSCRIPTION_FEE, 26);
        
        test_scenario::return_shared(treasury);
    };
    
    // 2. Admin makes partial withdrawal
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        
        let withdraw_amount = PLATFORM_FEE * 2;
        let withdrawn_coin = platform_treasury::withdraw_treasury_funds(
            &mut treasury,
            &admin_cap,
            withdraw_amount,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(coin::value(&withdrawn_coin) == withdraw_amount, 27);
        
        coin::burn_for_testing(withdrawn_coin);
        test_scenario::return_shared(treasury);
        test_scenario::return_to_sender(&scenario, admin_cap);
    };
    
    // 3. Transfer admin to new address
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        
        platform_treasury::transfer_admin(
            &mut treasury,
            admin_cap,
            NEW_ADMIN,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(platform_treasury::get_treasury_admin(&treasury) == NEW_ADMIN, 28);
        
        test_scenario::return_shared(treasury);
    };
    
    // 4. New admin makes withdrawal
    test_scenario::next_tx(&mut scenario, NEW_ADMIN);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        
        let remaining_balance = platform_treasury::get_treasury_balance(&treasury);
        let withdraw_amount = remaining_balance / 2;
        
        let withdrawn_coin = platform_treasury::withdraw_treasury_funds(
            &mut treasury,
            &admin_cap,
            withdraw_amount,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(coin::value(&withdrawn_coin) == withdraw_amount, 29);
        assert!(platform_treasury::get_treasury_balance(&treasury) == remaining_balance - withdraw_amount, 30);
        
        coin::burn_for_testing(withdrawn_coin);
        test_scenario::return_shared(treasury);
        test_scenario::return_to_sender(&scenario, admin_cap);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

// ========== Edge Case Tests ==========

#[test]
fun test_unknown_fee_type() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Deposit with unknown fee type (should not increment either counter)
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let payment = mint_sui_for_testing(&mut scenario, USER, PLATFORM_FEE);
        
        platform_treasury::deposit_platform_fee(
            &mut treasury,
            payment,
            string::utf8(b"unknown_type"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(platform_treasury::get_treasury_balance(&treasury) == PLATFORM_FEE, 31);
        
        let (platform_fees, subscription_fees) = platform_treasury::get_fee_totals(&treasury);
        assert!(platform_fees == 0, 32);
        assert!(subscription_fees == 0, 33);
        
        test_scenario::return_shared(treasury);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_withdraw_exact_balance() {
    let mut scenario = test_scenario::begin(ADMIN);
    let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
    
    setup_test(&mut scenario);
    
    // Add funds
    test_scenario::next_tx(&mut scenario, USER);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let payment = mint_sui_for_testing(&mut scenario, USER, INITIAL_BALANCE);
        
        platform_treasury::deposit_platform_fee(
            &mut treasury,
            payment,
            string::utf8(b"event_registration"),
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        test_scenario::return_shared(treasury);
    };
    
    // Withdraw exact balance
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        
        let balance = platform_treasury::get_treasury_balance(&treasury);
        let withdrawn_coin = platform_treasury::withdraw_treasury_funds(
            &mut treasury,
            &admin_cap,
            balance,
            &clock,
            test_scenario::ctx(&mut scenario)
        );
        
        assert!(coin::value(&withdrawn_coin) == balance, 34);
        assert!(platform_treasury::get_treasury_balance(&treasury) == 0, 35);
        
        coin::burn_for_testing(withdrawn_coin);
        test_scenario::return_shared(treasury);
        test_scenario::return_to_sender(&scenario, admin_cap);
    };
    
    clock::destroy_for_testing(clock);
    test_scenario::end(scenario);
}

#[test]
fun test_multiple_admin_transfers() {
    let mut scenario = test_scenario::begin(ADMIN);
    
    setup_test(&mut scenario);
    
    let second_admin = @0xD4;
    let third_admin = @0xE5;
    
    // First transfer: ADMIN -> NEW_ADMIN
    test_scenario::next_tx(&mut scenario, ADMIN);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        
        platform_treasury::transfer_admin(&mut treasury, admin_cap, NEW_ADMIN, test_scenario::ctx(&mut scenario));
        assert!(platform_treasury::get_treasury_admin(&treasury) == NEW_ADMIN, 36);
        
        test_scenario::return_shared(treasury);
    };
    
    // Second transfer: NEW_ADMIN -> second_admin
    test_scenario::next_tx(&mut scenario, NEW_ADMIN);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        
        platform_treasury::transfer_admin(&mut treasury, admin_cap, second_admin, test_scenario::ctx(&mut scenario));
        assert!(platform_treasury::get_treasury_admin(&treasury) == second_admin, 37);
        
        test_scenario::return_shared(treasury);
    };
    
    // Third transfer: second_admin -> third_admin
    test_scenario::next_tx(&mut scenario, second_admin);
    {
        let mut treasury = test_scenario::take_shared<PlatformTreasury>(&scenario);
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        
        platform_treasury::transfer_admin(&mut treasury, admin_cap, third_admin, test_scenario::ctx(&mut scenario));
        assert!(platform_treasury::get_treasury_admin(&treasury) == third_admin, 38);
        
        test_scenario::return_shared(treasury);
    };
    
    // Verify final admin has capability
    test_scenario::next_tx(&mut scenario, third_admin);
    {
        let admin_cap = test_scenario::take_from_sender<TreasuryAdminCap>(&scenario);
        test_scenario::return_to_sender(&scenario, admin_cap);
    };
    
    test_scenario::end(scenario);
}