module ariya::platform_treasury;

use std::string::String;
use sui::balance::{Self, Balance};
use sui::clock::{Self, Clock};
use sui::coin::{Self, Coin};
use sui::sui::SUI;
use sui::event;

// Error codes
const ENotAdmin: u64 = 200;
const EInsufficientBalance: u64 = 201;
const EInvalidAmount: u64 = 202;

// Platform treasury to hold all platform fees and subscription payments
public struct PlatformTreasury has key {
    id: UID,
    balance: Balance<SUI>,
    admin: address,
    total_platform_fees: u64,
    total_subscription_fees: u64,
}

// Admin capability for treasury management
public struct TreasuryAdminCap has key, store {
    id: UID,
    treasury_id: ID,
}

// Events
public struct PlatformFeeDeposited has copy, drop {
    amount: u64,
    fee_type: String, // "event_registration" or "subscription"
    depositor: address,
    timestamp: u64,
}

public struct TreasuryWithdrawal has copy, drop {
    amount: u64,
    admin: address,
    timestamp: u64,
}

public struct AdminTransferred has copy, drop {
    old_admin: address,
    new_admin: address,
    timestamp: u64,
}

// Initialize the treasury module
fun init(ctx: &mut TxContext) {
    let admin = tx_context::sender(ctx);
    
    let treasury = PlatformTreasury {
        id: object::new(ctx),
        balance: balance::zero(),
        admin,
        total_platform_fees: 0,
        total_subscription_fees: 0,
    };
    
    let treasury_id = object::id(&treasury);
    
    let admin_cap = TreasuryAdminCap {
        id: object::new(ctx),
        treasury_id,
    };
    
    transfer::transfer(admin_cap, admin);
    transfer::share_object(treasury);
}

// Deposit platform fee from event registration
public fun deposit_platform_fee(
    treasury: &mut PlatformTreasury,
    payment: Coin<SUI>,
    fee_type: String, // "event_registration" or "subscription"
    clock: &Clock,
    ctx: &mut TxContext
) {
    let amount = coin::value(&payment);
    assert!(amount > 0, EInvalidAmount);
    
    balance::join(&mut treasury.balance, coin::into_balance(payment));
    
    if (fee_type == std::string::utf8(b"event_registration")) {
        treasury.total_platform_fees = treasury.total_platform_fees + amount;
    } else if (fee_type == std::string::utf8(b"subscription")) {
        treasury.total_subscription_fees = treasury.total_subscription_fees + amount;
    };
    
    event::emit(PlatformFeeDeposited {
        amount,
        fee_type,
        depositor: tx_context::sender(ctx),
        timestamp: clock::timestamp_ms(clock),
    });
}

// Admin withdraws funds from treasury
public fun withdraw_treasury_funds(
    treasury: &mut PlatformTreasury,
    admin_cap: &TreasuryAdminCap,
    amount: u64,
    clock: &Clock,
    ctx: &mut TxContext
): Coin<SUI> {
    let sender = tx_context::sender(ctx);
    assert!(treasury.admin == sender, ENotAdmin);
    assert!(admin_cap.treasury_id == object::id(treasury), ENotAdmin);
    assert!(balance::value(&treasury.balance) >= amount, EInsufficientBalance);
    assert!(amount > 0, EInvalidAmount);
    
    event::emit(TreasuryWithdrawal {
        amount,
        admin: sender,
        timestamp: clock::timestamp_ms(clock),
    });
    
    coin::from_balance(balance::split(&mut treasury.balance, amount), ctx)
}

// Transfer admin capability to new admin
public fun transfer_admin(
    treasury: &mut PlatformTreasury,
    admin_cap: TreasuryAdminCap,
    new_admin: address,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    assert!(treasury.admin == sender, ENotAdmin);
    assert!(admin_cap.treasury_id == object::id(treasury), ENotAdmin);
    
    let old_admin = treasury.admin;
    treasury.admin = new_admin;
    
    event::emit(AdminTransferred {
        old_admin,
        new_admin,
        timestamp: 0, // Would use clock if available
    });
    
    transfer::public_transfer(admin_cap, new_admin);
}

// Get current treasury balance
public fun get_treasury_balance(treasury: &PlatformTreasury): u64 {
    balance::value(&treasury.balance)
}

// Get treasury admin
public fun get_treasury_admin(treasury: &PlatformTreasury): address {
    treasury.admin
}

// Get platform fee totals
public fun get_fee_totals(treasury: &PlatformTreasury): (u64, u64) {
    (treasury.total_platform_fees, treasury.total_subscription_fees)
}

// Check if user is admin
public fun is_admin(treasury: &PlatformTreasury, user: address): bool {
    treasury.admin == user
}

// Get treasury details
public fun get_treasury_details(treasury: &PlatformTreasury): (u64, address, u64, u64) {
    (
        balance::value(&treasury.balance),
        treasury.admin,
        treasury.total_platform_fees,
        treasury.total_subscription_fees
    )
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}