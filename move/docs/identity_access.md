# Ariya Identity Access Contract Documentation

## Overview

The ariya Identity Access contract manages ephemeral access passes, user registration, and payment processing for events within the Ephemeral Identity & Attendance (ariya) Protocol. This contract provides secure, time-limited access passes with integrated subscription management and platform fee collection, ensuring privacy while enabling verifiable event attendance with monetization support.

## Module Information

- **Module**: `ariya::identity_access`
- **Network**: Sui Blockchain
- **Language**: Move
- **Dependencies**: 
  - `ariya::event_management`
  - `ariya::subscription`
  - `ariya::platform_treasury`
  - `sui::coin`

## Core Data Structures

### RegistrationRegistry
Central registry for managing all event registrations and pass mappings.

```move
public struct RegistrationRegistry has key {
    id: UID,
    event_registrations: Table<ID, EventRegistrations>,  // event_id -> registrations
    user_registrations: Table<address, vector<ID>>,      // wallet -> registered events
}
```

### EventRegistrations
Stores all registration data for a specific event.

```move
public struct EventRegistrations has store {
    registrations: Table<address, Registration>,         // wallet -> registration
    pass_mappings: Table<vector<u8>, PassInfo>,         // pass_hash -> pass info
    total_registered: u64,                              // Total registrations count
}
```

### Registration
Individual user registration record for an event with payment tracking.

```move
public struct Registration has store, drop, copy {
    wallet: address,              // User's wallet address
    registered_at: u64,           // Registration timestamp (ms)
    pass_hash: vector<u8>,        // Current pass hash
    checked_in: bool,             // Check-in status
    platform_fee_paid: u64,      // Platform fee paid by this registration
}
```

### PassInfo
Ephemeral access pass information with time-based validity.

```move
public struct PassInfo has store, drop, copy {
    wallet: address,       // Pass owner's wallet
    event_id: ID,         // Associated event ID
    created_at: u64,      // Pass creation timestamp (ms)
    expires_at: u64,      // Pass expiration timestamp (ms)
    used: bool,           // Whether pass has been used
    pass_id: u64,         // Unique pass identifier
}
```

## Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `PASS_VALIDITY_DURATION` | 86400000 | Pass validity duration (24 hours in milliseconds) |
| `FREE_PLATFORM_FEE_BPS` | 500 | Platform fee for free subscription (5%) |
| `BASIC_PLATFORM_FEE_BPS` | 300 | Platform fee for basic subscription (3%) |
| `BASIS_POINTS_DENOMINATOR` | 10000 | Denominator for basis points calculations |

## Error Codes

| Error | Code | Description |
|-------|------|-------------|
| `EEventNotActive` | 1 | Event is not in active state |
| `EAlreadyRegistered` | 2 | User is already registered for this event |
| `ECapacityReached` | 3 | Event has reached maximum capacity |
| `ENotRegistered` | 4 | User is not registered for this event |
| `EAttendeeLimitExceeded` | 4 | Organizer's subscription attendee limit exceeded |
| `EInsufficientPayment` | 5 | Payment amount is insufficient |
| `EPlatformFeeRequired` | 6 | Platform fee is required but not provided |

## Platform Fee Structure

The platform fee is deducted from the organizer's share of event fees based on their subscription tier:

| Subscription Type | Platform Fee | Notes |
|------------------|--------------|-------|
| Free (0) | 5% of event fee | Only for paid events |
| Basic (1) | 3% of event fee | Only for paid events |
| Pro (2) | 0% | No platform fee |

**Important**: Attendees always pay only the event fee. The platform fee is deducted from the organizer's revenue share.

## Public Functions

### Registration Management

#### `register_for_event`
Registers a user for a paid event with subscription validation and fee processing.

```move
public fun register_for_event(
    event: &mut Event,
    registry: &mut RegistrationRegistry,
    organizer_subscription: &UserSubscription,
    organizer_profile: &OrganizerProfile,
    treasury: &mut PlatformTreasury,
    payment: Coin<SUI>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Parameters:**
- `event`: Mutable reference to the event object
- `registry`: Mutable reference to registration registry
- `organizer_subscription`: Organizer's subscription object
- `organizer_profile`: Organizer's profile for attendee limit checking
- `treasury`: Platform treasury for fee collection
- `payment`: SUI coin for event fee payment
- `clock`: System clock reference
- `ctx`: Transaction context

**Validation:**
- Event must be active
- Event must not be at capacity
- User must not already be registered
- Organizer's subscription must be active
- Payment must cover event fee
- Attendee limits must not be exceeded (for free subscriptions)

**Payment Flow:**
1. Validates payment covers event fee
2. Calculates platform fee based on subscription tier
3. Deducts platform fee from event fee
4. Sends platform fee to treasury
5. Transfers remaining amount to organizer
6. Returns any excess payment to attendee

**Frontend Usage:**
```typescript
const tx = new Transaction();
tx.moveCall({
    target: `${PACKAGE_ID}::identity_access::register_for_event`,
    arguments: [
        tx.object(EVENT_ID),
        tx.object(REGISTRY_ID),
        tx.object(ORGANIZER_SUBSCRIPTION_ID),
        tx.object(ORGANIZER_PROFILE_ID),
        tx.object(TREASURY_ID),
        tx.object(PAYMENT_COIN_ID), // SUI coin for payment
        tx.object(CLOCK_ID),
    ],
});
```

#### `register_for_free_event`
Registers a user for a free event with subscription validation.

```move
public fun register_for_free_event(
    event: &mut Event,
    registry: &mut RegistrationRegistry,
    organizer_subscription: &UserSubscription,
    organizer_profile: &OrganizerProfile,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Parameters:**
- `event`: Mutable reference to the event object (must have fee_amount = 0)
- `registry`: Mutable reference to registration registry
- `organizer_subscription`: Organizer's subscription object
- `organizer_profile`: Organizer's profile for attendee limit checking
- `clock`: System clock reference
- `ctx`: Transaction context

**Validation:**
- Event fee must be 0
- Event must be active
- User must not already be registered
- Organizer's subscription must be active
- Attendee limits must not be exceeded (for free subscriptions)

**Frontend Usage:**
```typescript
const tx = new Transaction();
tx.moveCall({
    target: `${PACKAGE_ID}::identity_access::register_for_free_event`,
    arguments: [
        tx.object(EVENT_ID),
        tx.object(REGISTRY_ID),
        tx.object(ORGANIZER_SUBSCRIPTION_ID),
        tx.object(ORGANIZER_PROFILE_ID),
        tx.object(CLOCK_ID),
    ],
});
```

#### `regenerate_pass`
Generates a new ephemeral pass for an already registered user.

```move
public fun regenerate_pass(
    event: &Event,
    registry: &mut RegistrationRegistry,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Use Cases:**
- Pass has expired
- Pass was compromised
- User needs fresh access credentials

**Process:**
1. Validates user is registered
2. Removes old pass mapping
3. Generates new pass with fresh expiration
4. Updates registration record
5. Emits `PassGenerated` event

**Frontend Usage:**
```typescript
const tx = new Transaction();
tx.moveCall({
    target: `${PACKAGE_ID}::identity_access::regenerate_pass`,
    arguments: [
        tx.object(EVENT_ID),
        tx.object(REGISTRY_ID),
        tx.object(CLOCK_ID),
    ],
});
```

### Pass Validation

#### `validate_pass`
Validates an ephemeral pass and marks it as used (called by verifier systems).

```move
public fun validate_pass(
    pass_hash: vector<u8>,
    event_id: ID,
    registry: &mut RegistrationRegistry,
    clock: &Clock,
): (bool, address)
```

**Parameters:**
- `pass_hash`: Hash of the ephemeral pass to validate
- `event_id`: ID of the event
- `registry`: Mutable reference to registration registry
- `clock`: System clock reference

**Returns:** `(bool, address)` - Validation success and wallet address

**Validation Checks:**
- Pass exists in registry
- Pass has not been used
- Pass has not expired
- Event exists

**Frontend Usage:**
```typescript
const tx = new Transaction();
const [isValid, wallet] = tx.moveCall({
    target: `${PACKAGE_ID}::identity_access::validate_pass`,
    arguments: [
        tx.pure(bcs.vector(bcs.U8).serialize(passHash)),
        tx.pure.id(eventId),
        tx.object(REGISTRY_ID),
        tx.object(CLOCK_ID),
    ],
});
```

### Fee Calculation Functions

#### `calculate_registration_cost`
Calculates the cost breakdown for event registration.

```move
public fun calculate_registration_cost(
    event: &Event,
    organizer_subscription: &UserSubscription,
): (u64, u64, u64)
```

**Returns:** `(event_fee, platform_fee, attendee_pays)`
- `event_fee`: The base event fee
- `platform_fee`: Platform fee (deducted from organizer's share)
- `attendee_pays`: Amount attendee needs to pay (always equals event_fee)

**Frontend Usage:**
```typescript
// Get cost breakdown before registration
const tx = new Transaction();
const [eventFee, platformFee, attendeePays] = tx.moveCall({
    target: `${PACKAGE_ID}::identity_access::calculate_registration_cost`,
    arguments: [
        tx.object(EVENT_ID),
        tx.object(ORGANIZER_SUBSCRIPTION_ID),
    ],
});

const result = await client.devInspectTransactionBlock({
    transactionBlock: tx,
    sender: userAddress,
});
```

#### `calculate_organizer_revenue`
Calculates the organizer's net revenue after platform fees.

```move
public fun calculate_organizer_revenue(
    event: &Event,
    organizer_subscription: &UserSubscription,
): (u64, u64, u64)
```

**Returns:** `(event_fee, platform_fee_deducted, organizer_receives)`
- `event_fee`: The base event fee
- `platform_fee_deducted`: Platform fee amount
- `organizer_receives`: Net amount organizer receives per registration

### Integration Functions

#### `mark_checked_in`
Marks a user as checked in (called by attendance contract).

```move
public fun mark_checked_in(
    wallet: address,
    event_id: ID,
    registry: &mut RegistrationRegistry,
)
```

**Note:** This function is typically called by other contracts in the ariya protocol.

### Query Functions (Read-Only)

#### `is_registered`
Checks if a wallet is registered for an event.

```move
public fun is_registered(
    wallet: address,
    event_id: ID,
    registry: &RegistrationRegistry,
): bool
```

#### `get_registration`
Gets registration details for a specific user and event.

```move
public fun get_registration(
    wallet: address,
    event_id: ID,
    registry: &RegistrationRegistry,
): (u64, bool, u64)
```

**Returns:** `(registered_at, checked_in, platform_fee_paid)`
- `registered_at`: Registration timestamp
- `checked_in`: Check-in status
- `platform_fee_paid`: Platform fee paid for this registration

#### `get_user_events`
Gets all events a user is registered for.

```move
public fun get_user_events(
    wallet: address,
    registry: &RegistrationRegistry,
): vector<ID>
```

## Events Emitted

### UserRegistered
```move
public struct UserRegistered has copy, drop {
    event_id: ID,
    wallet: address,
    registered_at: u64,
    platform_fee_paid: u64,
}
```

### PassGenerated
```move
public struct PassGenerated has copy, drop {
    event_id: ID,
    wallet: address,
    pass_id: u64,
    expires_at: u64,
}
```

### PassValidated
```move
public struct PassValidated has copy, drop {
    event_id: ID,
    wallet: address,
    pass_id: u64,
}
```

### PlatformFeeCollected
```move
public struct PlatformFeeCollected has copy, drop {
    event_id: ID,
    attendee: address,
    organizer: address,
    fee_amount: u64,
    registration_fee: u64,
    timestamp: u64,
}
```

## Frontend Integration Examples

### Complete Registration Flow with Payment
```typescript
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { bcs } from '@mysten/sui/bcs';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// 1. Check event fee and calculate costs
async function getRegistrationCost(eventId: string, organizerSubscriptionId: string) {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::identity_access::calculate_registration_cost`,
        arguments: [
            tx.object(eventId),
            tx.object(organizerSubscriptionId),
        ],
    });
    
    const result = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: userAddress,
    });
    
    // Parse result to get [eventFee, platformFee, attendeePays]
    return result;
}

// 2. Register for paid event
async function registerForPaidEvent(eventId: string, paymentCoinId: string) {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::identity_access::register_for_event`,
        arguments: [
            tx.object(eventId),
            tx.object(REGISTRY_ID),
            tx.object(ORGANIZER_SUBSCRIPTION_ID),
            tx.object(ORGANIZER_PROFILE_ID),
            tx.object(TREASURY_ID),
            tx.object(paymentCoinId),
            tx.object(CLOCK_ID),
        ],
    });
    
    const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
            showEffects: true,
            showEvents: true,
        },
    });
    
    return result;
}

// 3. Register for free event
async function registerForFreeEvent(eventId: string) {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::identity_access::register_for_free_event`,
        arguments: [
            tx.object(eventId),
            tx.object(REGISTRY_ID),
            tx.object(ORGANIZER_SUBSCRIPTION_ID),
            tx.object(ORGANIZER_PROFILE_ID),
            tx.object(CLOCK_ID),
        ],
    });
    
    const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
    });
    
    return result;
}

// 4. Check if user is registered
async function checkRegistration(wallet: string, eventId: string) {
    const tx = new Transaction();
    tx.moveCall({
        target: `${PACKAGE_ID}::identity_access::is_registered`,
        arguments: [
            tx.pure.address(wallet),
            tx.pure.id(eventId),
            tx.object(REGISTRY_ID),
        ],
    });
    
    const result = await client.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: wallet,
    });
    
    return result;
}
```

### Payment Handling with Coin Management
```typescript
// Create payment coin for event registration
async function createPaymentCoin(amount: number) {
    const tx = new Transaction();
    
    // Split coins to create exact payment amount
    const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    
    return { tx, paymentCoin };
}

// Register with automatic coin creation
async function registerWithPayment(eventId: string, eventFee: number) {
    const tx = new Transaction();
    
    // Create payment coin
    const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(eventFee)]);
    
    // Register for event
    tx.moveCall({
        target: `${PACKAGE_ID}::identity_access::register_for_event`,
        arguments: [
            tx.object(eventId),
            tx.object(REGISTRY_ID),
            tx.object(ORGANIZER_SUBSCRIPTION_ID),
            tx.object(ORGANIZER_PROFILE_ID),
            tx.object(TREASURY_ID),
            paymentCoin,
            tx.object(CLOCK_ID),
        ],
    });
    
    return await wallet.signAndExecuteTransactionBlock({
        transactionBlock: tx,
    });
}
```

### React Component for Registration
```typescript
import React, { useState, useEffect } from 'react';

interface RegistrationComponentProps {
    eventId: string;
    userAddress: string;
    organizerSubscriptionId: string;
}

function EventRegistrationComponent({ 
    eventId, 
    userAddress, 
    organizerSubscriptionId 
}: RegistrationComponentProps) {
    const [isRegistered, setIsRegistered] = useState(false);
    const [eventFee, setEventFee] = useState(0);
    const [platformFee, setPlatformFee] = useState(0);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        // Check registration status
        checkRegistration(userAddress, eventId).then(setIsRegistered);
        
        // Get cost breakdown
        getRegistrationCost(eventId, organizerSubscriptionId).then(result => {
            const [fee, pFee] = result;
            setEventFee(fee);
            setPlatformFee(pFee);
        });
    }, [eventId, userAddress, organizerSubscriptionId]);
    
    const handleRegister = async () => {
        setLoading(true);
        try {
            if (eventFee === 0) {
                await registerForFreeEvent(eventId);
            } else {
                await registerWithPayment(eventId, eventFee);
            }
            setIsRegistered(true);
        } catch (error) {
            console.error('Registration failed:', error);
        } finally {
            setLoading(false);
        }
    };
    
    if (isRegistered) {
        return (
            <div className="registration-success">
                <h3>✅ Successfully Registered!</h3>
                <button onClick={() => regeneratePass(eventId)}>
                    Regenerate Access Pass
                </button>
            </div>
        );
    }
    
    return (
        <div className="registration-form">
            <h3>Event Registration</h3>
            <div className="fee-breakdown">
                {eventFee === 0 ? (
                    <p className="free-event">🆓 Free Event</p>
                ) : (
                    <div className="paid-event">
                        <p>Event Fee: {eventFee / 1_000_000_000} SUI</p>
                        {platformFee > 0 && (
                            <p className="platform-fee">
                                Platform Fee: {platformFee / 1_000_000_000} SUI 
                                (deducted from organizer)
                            </p>
                        )}
                        <p className="total">
                            You Pay: {eventFee / 1_000_000_000} SUI
                        </p>
                    </div>
                )}
            </div>
            <button 
                onClick={handleRegister} 
                disabled={loading}
                className="register-button"
            >
                {loading ? 'Registering...' : 'Register for Event'}
            </button>
        </div>
    );
}
```

### Event Subscription for Real-Time Updates
```typescript
// Listen for registration events with fee tracking
client.subscribeEvent({
    filter: {
        MoveEventType: `${PACKAGE_ID}::identity_access::UserRegistered`,
    },
    onMessage: (event) => {
        const data = event.parsedJson;
        console.log('User registered:', {
            eventId: data.event_id,
            wallet: data.wallet,
            timestamp: data.registered_at,
            platformFeePaid: data.platform_fee_paid,
        });
    },
});

// Listen for platform fee collection
client.subscribeEvent({
    filter: {
        MoveEventType: `${PACKAGE_ID}::identity_access::PlatformFeeCollected`,
    },
    onMessage: (event) => {
        const data = event.parsedJson;
        console.log('Platform fee collected:', {
            eventId: data.event_id,
            attendee: data.attendee,
            organizer: data.organizer,
            feeAmount: data.fee_amount,
            registrationFee: data.registration_fee,
        });
    },
});
```

### Error Handling with Subscription Validation
```typescript
async function safeRegisterForEvent(eventId: string, paymentCoinId?: string) {
    try {
        const tx = new Transaction();
        
        if (paymentCoinId) {
            // Paid event registration
            tx.moveCall({
                target: `${PACKAGE_ID}::identity_access::register_for_event`,
                arguments: [
                    tx.object(eventId),
                    tx.object(REGISTRY_ID),
                    tx.object(ORGANIZER_SUBSCRIPTION_ID),
                    tx.object(ORGANIZER_PROFILE_ID),
                    tx.object(TREASURY_ID),
                    tx.object(paymentCoinId),
                    tx.object(CLOCK_ID),
                ],
            });
        } else {
            // Free event registration
            tx.moveCall({
                target: `${PACKAGE_ID}::identity_access::register_for_free_event`,
                arguments: [
                    tx.object(eventId),
                    tx.object(REGISTRY_ID),
                    tx.object(ORGANIZER_SUBSCRIPTION_ID),
                    tx.object(ORGANIZER_PROFILE_ID),
                    tx.object(CLOCK_ID),
                ],
            });
        }

        const result = await wallet.signAndExecuteTransactionBlock({
            transactionBlock: tx,
            options: {
                showEffects: true,
                showEvents: true,
            },
        });

        if (result.effects?.status?.status === 'failure') {
            const error = result.effects.status.error;
            switch (error) {
                case 'EEventNotActive':
                    throw new Error('Event is not currently active for registration');
                case 'EAlreadyRegistered':
                    throw new Error('You are already registered for this event');
                case 'ECapacityReached':
                    throw new Error('Event has reached maximum capacity');
                case 'EAttendeeLimitExceeded':
                    throw new Error('Organizer has reached attendee limit for their subscription');
                case 'EInsufficientPayment':
                    throw new Error('Payment amount is insufficient');
                case 'EPlatformFeeRequired':
                    throw new Error('This is a paid event, payment is required');
                default:
                    throw new Error(`Registration failed: ${error}`);
            }
        }

        return result;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}
```

## Security Features

### Ephemeral Pass System
- **Time-Limited**: Passes expire after 24 hours
- **Single-Use**: Each pass can only be validated once
- **Cryptographic**: Uses Keccak256 hashing for pass generation
- **Non-Transferable**: Passes are tied to specific wallet addresses

### Payment Security
- **Exact Payments**: System validates exact payment amounts
- **Automatic Refunds**: Excess payments are returned to sender
- **Fee Transparency**: Platform fees are clearly tracked and emitted
- **Subscription Validation**: Organizer subscriptions are validated before processing

### Privacy Protection
- **No PII Storage**: Only wallet addresses are stored
- **Ephemeral Design**: Pass data is temporary and tied to events
- **Hash-Based**: Pass validation uses cryptographic hashes
- **Fee Privacy**: Individual payment details are not stored persistently

## Integration with Other Contracts

This contract integrates with:
- **Event Management Contract**: Validates event state and capacity
- **Subscription Contract**: Checks organizer limits and subscription status
- **Platform Treasury Contract**: Handles platform fee collection
- **Attendance Contract**: Provides check-in status updates
- **Verification Systems**: External QR code scanners and validators

## Important Notes

1. **Payment Flow**: Attendees pay only the event fee; platform fees are deducted from organizer revenue
2. **Subscription Limits**: Free subscriptions have attendee limits that are validated during registration
3. **Fee Structure**: Platform fees vary by subscription tier (5% for Free, 3% for Basic, 0% for Pro)
4. **Pass Validity**: All passes expire after 24 hours regardless of event duration
5. **Revenue Split**: Organizers receive event_fee - platform_fee per registration
6. **Free Events**: No platform fees are charged for free events (fee_amount = 0)
7. **Automatic Refunds**: Excess payments are automatically returned to the attendee

This contract provides a comprehensive, secure foundation for event registration, payment processing, and access control within the ariya Protocol ecosystem.