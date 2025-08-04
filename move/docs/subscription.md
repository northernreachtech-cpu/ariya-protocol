# Ariya Subscription Contract Documentation

## Overview

The ariya Subscription contract manages user subscription tiers within the Ephemeral Identity & Attendance (ariya) Protocol. This contract provides a tiered subscription system with different limits and features for event organizers, handling subscription payments, upgrades, and attendee limits enforcement.

## Module Information

- **Module**: `ariya::subscription`
- **Network**: Sui Blockchain
- **Language**: Move
- **Dependencies**: `ariya::platform_treasury`, `ariya::event_management`

## Subscription Tiers

| Tier | Value | Attendee Limit | Platform Fee | Description |
|------|-------|----------------|--------------|-------------|
| `Free` | 0 | 501 attendees | Yes (5%) | Basic event management |
| `Basic` | 1 | Unlimited | Yes (3%) | Advanced features with platform fees |
| `Pro` | 2 | Unlimited | No | Premium features without platform fees |

## Core Data Structures

### UserSubscription
Individual user subscription record tracking subscription status and limits.

```move
public struct UserSubscription has key, store {
    id: UID,
    user: address,              // Subscriber's wallet address
    subscription_type: u8,      // Subscription tier (0-2)
    start_date: u64,           // Subscription start timestamp
    end_date: u64,             // Expiration timestamp (0 = never expires)
    is_active: bool,           // Current subscription status
    created_at: u64,           // Creation timestamp
    last_updated: u64,         // Last modification timestamp
}
```

### SubscriptionConfig
Global configuration for subscription pricing and settings.

```move
public struct SubscriptionConfig has key {
    id: UID,
    basic_monthly_price: u64,   // Basic tier monthly price in SUI
    basic_yearly_price: u64,    // Basic tier yearly price in SUI
    pro_monthly_price: u64,     // Pro tier monthly price in SUI
    pro_yearly_price: u64,      // Pro tier yearly price in SUI
    admin: address,             // Configuration administrator
}
```

### SubscriptionRegistry
Global registry for subscription discovery and management.

```move
public struct SubscriptionRegistry has key {
    id: UID,
    user_subscriptions: Table<address, ID>,    // user_address -> subscription_id
    active_subscriptions_count: Table<u8, u64>, // subscription_type -> count
}
```

### SubscriptionAdminCap
Administrative capability for subscription configuration management.

```move
public struct SubscriptionAdminCap has key, store {
    id: UID,
    config_id: ID,    // Reference to associated configuration
}
```

## Error Codes

| Error | Code | Description |
|-------|------|-------------|
| `ENotAuthorized` | 300 | Caller not authorized for this action |
| `ESubscriptionNotActive` | 301 | Subscription is not active |
| `EAttendeeLimitExceeded` | 302 | Free tier attendee limit exceeded |
| `EInsufficientPayment` | 303 | Payment amount insufficient for subscription |
| `EAlreadySubscribed` | 304 | User already has a subscription |

## Constants

```move
// Subscription types
const SUBSCRIPTION_FREE: u8 = 0;
const SUBSCRIPTION_BASIC: u8 = 1;
const SUBSCRIPTION_PRO: u8 = 2;

// Limits
const FREE_ATTENDEE_LIMIT: u64 = 501;
const U64_MAX: u64 = 18446744073709551615; // Unlimited for paid tiers
```

## Public Functions

### Subscription Creation and Management

#### `create_free_subscription`
Creates a free subscription for new users (automatically called during profile creation).

```move
public fun create_free_subscription(
    user: address,
    clock: &Clock,
    registry: &mut SubscriptionRegistry,
    ctx: &mut TxContext
): ID
```

**Parameters:**
- `user`: User's wallet address
- `clock`: System clock reference
- `registry`: Subscription registry
- `ctx`: Transaction context

**Returns:** `ID` - Created subscription object ID

**Requirements:**
- User must not already have a subscription

**Frontend Usage:**
```typescript
// Usually called automatically during organizer profile creation
const tx = new Transaction();

const subscriptionId = tx.moveCall({
    target: `${PACKAGE_ID}::subscription::create_free_subscription`,
    arguments: [
        tx.pure.address(userAddress),
        tx.object(CLOCK_ID),
        tx.object(REGISTRY_ID),
    ],
});

const result = await signAndExecuteTransaction({ transaction: tx });
console.log('Free subscription created:', result);
```

#### `subscribe_basic`
Upgrades user to Basic subscription tier.

```move
public fun subscribe_basic(
    subscription: &mut UserSubscription,
    is_yearly: bool,
    payment: Coin<SUI>,
    config: &SubscriptionConfig,
    registry: &mut SubscriptionRegistry,
    treasury: &mut PlatformTreasury,
    clock: &Clock,
    ctx: &mut TxContext
): ID
```

**Parameters:**
- `subscription`: Mutable reference to user's subscription
- `is_yearly`: Whether to subscribe for a year (vs monthly)
- `payment`: SUI coin for subscription payment
- `config`: Subscription configuration for pricing
- `registry`: Subscription registry
- `treasury`: Platform treasury for payment processing
- `clock`: System clock reference
- `ctx`: Transaction context

**Returns:** `ID` - Updated subscription object ID

**Requirements:**
- Caller must be the subscription owner
- Payment must meet the required amount
- Subscription must exist

**Frontend Usage:**
```typescript
const tx = new Transaction();

// Get pricing first
const pricing = await getSubscriptionPricing();
const isYearly = true;
const requiredAmount = isYearly ? pricing.basicYearly : pricing.basicMonthly;

// Create payment coin
const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(requiredAmount)]);

const subscriptionId = tx.moveCall({
    target: `${PACKAGE_ID}::subscription::subscribe_basic`,
    arguments: [
        tx.object(USER_SUBSCRIPTION_ID),
        tx.pure.bool(isYearly),
        paymentCoin,
        tx.object(CONFIG_ID),
        tx.object(REGISTRY_ID),
        tx.object(TREASURY_ID),
        tx.object(CLOCK_ID),
    ],
});

const result = await signAndExecuteTransaction({ transaction: tx });
console.log('Upgraded to Basic:', result);
```

#### `subscribe_pro`
Upgrades user to Pro subscription tier.

```move
public fun subscribe_pro(
    subscription: &mut UserSubscription,
    is_yearly: bool,
    payment: Coin<SUI>,
    config: &SubscriptionConfig,
    registry: &mut SubscriptionRegistry,
    treasury: &mut PlatformTreasury,
    clock: &Clock,
    ctx: &mut TxContext
): ID
```

**Parameters:** Same as `subscribe_basic` but for Pro tier pricing

**Frontend Usage:**
```typescript
const tx = new Transaction();

// Get Pro tier pricing
const pricing = await getSubscriptionPricing();
const isYearly = false; // Monthly subscription
const requiredAmount = pricing.proMonthly;

const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(requiredAmount)]);

const subscriptionId = tx.moveCall({
    target: `${PACKAGE_ID}::subscription::subscribe_pro`,
    arguments: [
        tx.object(USER_SUBSCRIPTION_ID),
        tx.pure.bool(isYearly),
        paymentCoin,
        tx.object(CONFIG_ID),
        tx.object(REGISTRY_ID),
        tx.object(TREASURY_ID),
        tx.object(CLOCK_ID),
    ],
});

const result = await signAndExecuteTransaction({ transaction: tx });
console.log('Upgraded to Pro:', result);
```

### Subscription Validation and Limits

#### `can_add_attendees`
Checks if user can add more attendees based on their subscription limits.

```move
public fun can_add_attendees(
    subscription: &UserSubscription,
    organizer_profile: &OrganizerProfile,
    additional_attendees: u64,
    clock: &Clock
): bool
```

**Parameters:**
- `subscription`: User's subscription reference
- `organizer_profile`: User's organizer profile for current attendee count
- `additional_attendees`: Number of attendees to be added
- `clock`: System clock reference

**Returns:** `bool` - Whether the user can add the specified number of attendees

**Frontend Usage:**
```typescript
// Check if user can register attendees for an event
const checkLimitTx = new Transaction();
checkLimitTx.moveCall({
    target: `${PACKAGE_ID}::subscription::can_add_attendees`,
    arguments: [
        checkLimitTx.object(USER_SUBSCRIPTION_ID),
        checkLimitTx.object(ORGANIZER_PROFILE_ID),
        checkLimitTx.pure.u64(eventCapacity),
        checkLimitTx.object(CLOCK_ID),
    ],
});

const result = await client.devInspectTransactionBlock({
    transactionBlock: checkLimitTx,
    sender: userAddress,
});

const canAdd = result.results?.[0]?.returnValues?.[0]?.[0] === 1;
if (!canAdd) {
    alert('Subscription limit exceeded. Please upgrade your subscription.');
}
```

#### `should_pay_platform_fee`
Determines if user should pay platform fees based on subscription tier.

```move
public fun should_pay_platform_fee(subscription: &UserSubscription): bool
```

**Returns:** `bool` - True only for Basic tier (Pro and Free don't pay platform fees)

#### `track_attendee_update`
Updates attendee count tracking when events are completed.

```move
public fun track_attendee_update(
    subscription: &mut UserSubscription,
    organizer_profile: &OrganizerProfile,
    clock: &Clock,
    _ctx: &mut TxContext
)
```

**Requirements:**
- Subscription must be active
- For free tier: total attendees must not exceed limit

### Subscription Lifecycle

#### `expire_subscription`
Marks an expired subscription as inactive (can be called by anyone).

```move
public fun expire_subscription(
    subscription: &mut UserSubscription,
    registry: &mut SubscriptionRegistry,
    clock: &Clock,
    _ctx: &mut TxContext
)
```

**Requirements:**
- Subscription must have an end date (not free tier)
- Current time must be past the end date
- Subscription must currently be active

**Frontend Usage:**
```typescript
// Check for expired subscriptions and expire them
const tx = new Transaction();

tx.moveCall({
    target: `${PACKAGE_ID}::subscription::expire_subscription`,
    arguments: [
        tx.object(SUBSCRIPTION_ID),
        tx.object(REGISTRY_ID),
        tx.object(CLOCK_ID),
    ],
});

const result = await signAndExecuteTransaction({ transaction: tx });
console.log('Subscription expired:', result);
```

### Administrative Functions

#### `update_pricing`
Updates subscription pricing configuration (admin only).

```move
public fun update_pricing(
    config: &mut SubscriptionConfig,
    admin_cap: &SubscriptionAdminCap,
    basic_monthly: u64,
    basic_yearly: u64,
    pro_monthly: u64,
    pro_yearly: u64,
    ctx: &mut TxContext
)
```

**Parameters:**
- `config`: Mutable reference to subscription configuration
- `admin_cap`: Admin capability for authorization
- `basic_monthly`: New Basic monthly price in SUI
- `basic_yearly`: New Basic yearly price in SUI
- `pro_monthly`: New Pro monthly price in SUI
- `pro_yearly`: New Pro yearly price in SUI
- `ctx`: Transaction context

**Requirements:**
- Caller must be the configuration admin
- Admin capability must match the configuration

**Frontend Usage:**
```typescript
// Admin updates pricing
const tx = new Transaction();

tx.moveCall({
    target: `${PACKAGE_ID}::subscription::update_pricing`,
    arguments: [
        tx.object(CONFIG_ID),
        tx.object(ADMIN_CAP_ID),
        tx.pure.u64(15_000_000_000), // 15 SUI for Basic monthly
        tx.pure.u64(150_000_000_000), // 150 SUI for Basic yearly
        tx.pure.u64(30_000_000_000), // 30 SUI for Pro monthly
        tx.pure.u64(300_000_000_000), // 300 SUI for Pro yearly
    ],
});

const result = await signAndExecuteTransaction({ transaction: tx });
console.log('Pricing updated:', result);
```

## Query Functions (Read-Only)

### Subscription Information
```move
public fun get_subscription_type(subscription: &UserSubscription): u8
public fun get_subscription_status(subscription: &UserSubscription, clock: &Clock): (bool, bool)
public fun get_subscription_details(subscription: &UserSubscription): (address, u8, u64, u64, bool)
public fun get_subscription_type_name(subscription_type: u8): String
```

### Attendee Management
```move
public fun get_attendee_count(organizer_profile: &OrganizerProfile): u64
public fun get_remaining_attendees(subscription: &UserSubscription, organizer_profile: &OrganizerProfile): u64
```

### Configuration and Registry
```move
public fun get_pricing(config: &SubscriptionConfig): (u64, u64, u64, u64)
public fun has_subscription(registry: &SubscriptionRegistry, user: address): bool
public fun get_user_subscription_id(registry: &SubscriptionRegistry, user: address): ID
```

## Events Emitted

### SubscriptionCreated
```move
public struct SubscriptionCreated has copy, drop {
    subscription_id: ID,
    user: address,
    subscription_type: u8,
    start_date: u64,
    end_date: u64,
}
```

### SubscriptionUpgraded
```move
public struct SubscriptionUpgraded has copy, drop {
    subscription_id: ID,
    user: address,
    old_type: u8,
    new_type: u8,
    timestamp: u64,
}
```

### AttendeeCountUpdated
```move
public struct AttendeeCountUpdated has copy, drop {
    subscription_id: ID,
    user: address,
    total_attendees_served: u64,
    timestamp: u64,
}
```

### SubscriptionExpired
```move
public struct SubscriptionExpired has copy, drop {
    subscription_id: ID,
    user: address,
    subscription_type: u8,
    timestamp: u64,
}
```

## Frontend Integration Examples

### Subscription Management System

```typescript
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

class SubscriptionManager {
    constructor(private client: SuiClient, private packageId: string) {}

    // Get user's subscription status
    async getUserSubscription(userAddress: string) {
        try {
            // Check if user has subscription
            const hasSubTx = new Transaction();
            hasSubTx.moveCall({
                target: `${this.packageId}::subscription::has_subscription`,
                arguments: [
                    hasSubTx.object(REGISTRY_ID),
                    hasSubTx.pure.address(userAddress),
                ],
            });

            const hasSubResult = await this.client.devInspectTransactionBlock({
                transactionBlock: hasSubTx,
                sender: userAddress,
            });

            const hasSubscription = hasSubResult.results?.[0]?.returnValues?.[0]?.[0] === 1;
            
            if (!hasSubscription) {
                return null;
            }

            // Get subscription ID
            const getIdTx = new Transaction();
            getIdTx.moveCall({
                target: `${this.packageId}::subscription::get_user_subscription_id`,
                arguments: [
                    getIdTx.object(REGISTRY_ID),
                    getIdTx.pure.address(userAddress),
                ],
            });

            const idResult = await this.client.devInspectTransactionBlock({
                transactionBlock: getIdTx,
                sender: userAddress,
            });

            const subscriptionId = this.extractObjectId(idResult);

            // Get subscription details
            const subscription = await this.client.getObject({
                id: subscriptionId,
                options: { showContent: true },
            });

            if (!subscription.data?.content) {
                return null;
            }

            const fields = subscription.data.content.fields;
            return {
                id: subscriptionId,
                user: fields.user,
                subscriptionType: parseInt(fields.subscription_type),
                subscriptionTypeName: this.getSubscriptionTypeName(parseInt(fields.subscription_type)),
                startDate: new Date(parseInt(fields.start_date)),
                endDate: parseInt(fields.end_date) === 0 ? null : new Date(parseInt(fields.end_date)),
                isActive: fields.is_active,
                createdAt: new Date(parseInt(fields.created_at)),
                lastUpdated: new Date(parseInt(fields.last_updated)),
            };

        } catch (error) {
            console.error('Error fetching user subscription:', error);
            return null;
        }
    }

    // Get subscription pricing
    async getSubscriptionPricing() {
        try {
            const config = await this.client.getObject({
                id: CONFIG_ID,
                options: { showContent: true },
            });

            if (!config.data?.content) {
                throw new Error('Configuration not found');
            }

            const fields = config.data.content.fields;
            return {
                basicMonthly: parseInt(fields.basic_monthly_price) / 1e9, // Convert to SUI
                basicYearly: parseInt(fields.basic_yearly_price) / 1e9,
                proMonthly: parseInt(fields.pro_monthly_price) / 1e9,
                proYearly: parseInt(fields.pro_yearly_price) / 1e9,
            };

        } catch (error) {
            console.error('Error fetching pricing:', error);
            return null;
        }
    }

    // Create free subscription
    async createFreeSubscription(userAddress: string, signerKeypair: any) {
        const tx = new Transaction();

        const subscriptionId = tx.moveCall({
            target: `${this.packageId}::subscription::create_free_subscription`,
            arguments: [
                tx.pure.address(userAddress),
                tx.object(CLOCK_ID),
                tx.object(REGISTRY_ID),
            ],
        });

        return await this.client.signAndExecuteTransaction({
            transaction: tx,
            signer: signerKeypair,
            options: { showEffects: true, showEvents: true },
        });
    }

    // Upgrade to Basic subscription
    async upgradeToBasic(
        subscriptionId: string,
        isYearly: boolean,
        userKeypair: any
    ) {
        const pricing = await this.getSubscriptionPricing();
        if (!pricing) throw new Error('Failed to fetch pricing');

        const requiredAmount = isYearly ? pricing.basicYearly : pricing.basicMonthly;
        const amountInMist = Math.floor(requiredAmount * 1e9);

        const tx = new Transaction();

        // Create payment coin
        const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);

        tx.moveCall({
            target: `${this.packageId}::subscription::subscribe_basic`,
            arguments: [
                tx.object(subscriptionId),
                tx.pure.bool(isYearly),
                paymentCoin,
                tx.object(CONFIG_ID),
                tx.object(REGISTRY_ID),
                tx.object(TREASURY_ID),
                tx.object(CLOCK_ID),
            ],
        });

        return await this.client.signAndExecuteTransaction({
            transaction: tx,
            signer: userKeypair,
            options: { showEffects: true, showEvents: true },
        });
    }

    // Upgrade to Pro subscription
    async upgradeToPro(
        subscriptionId: string,
        isYearly: boolean,
        userKeypair: any
    ) {
        const pricing = await this.getSubscriptionPricing();
        if (!pricing) throw new Error('Failed to fetch pricing');

        const requiredAmount = isYearly ? pricing.proYearly : pricing.proMonthly;
        const amountInMist = Math.floor(requiredAmount * 1e9);

        const tx = new Transaction();

        const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);

        tx.moveCall({
            target: `${this.packageId}::subscription::subscribe_pro`,
            arguments: [
                tx.object(subscriptionId),
                tx.pure.bool(isYearly),
                paymentCoin,
                tx.object(CONFIG_ID),
                tx.object(REGISTRY_ID),
                tx.object(TREASURY_ID),
                tx.object(CLOCK_ID),
            ],
        });

        return await this.client.signAndExecuteTransaction({
            transaction: tx,
            signer: userKeypair,
            options: { showEffects: true, showEvents: true },
        });
    }

    // Check attendee limits
    async checkAttendeeLimit(
        subscriptionId: string,
        organizerProfileId: string,
        additionalAttendees: number,
        userAddress: string
    ) {
        const tx = new Transaction();
        tx.moveCall({
            target: `${this.packageId}::subscription::can_add_attendees`,
            arguments: [
                tx.object(subscriptionId),
                tx.object(organizerProfileId),
                tx.pure.u64(additionalAttendees),
                tx.object(CLOCK_ID),
            ],
        });

        const result = await this.client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: userAddress,
        });

        return result.results?.[0]?.returnValues?.[0]?.[0] === 1;
    }

    // Get remaining attendee capacity
    async getRemainingAttendees(
        subscriptionId: string,
        organizerProfileId: string,
        userAddress: string
    ) {
        const tx = new Transaction();
        tx.moveCall({
            target: `${this.packageId}::subscription::get_remaining_attendees`,
            arguments: [
                tx.object(subscriptionId),
                tx.object(organizerProfileId),
            ],
        });

        const result = await this.client.devInspectTransactionBlock({
            transactionBlock: tx,
            sender: userAddress,
        });

        const remaining = this.extractU64(result);
        return remaining === '18446744073709551615' ? 'Unlimited' : parseInt(remaining);
    }

    private getSubscriptionTypeName(type: number): string {
        switch (type) {
            case 0: return 'Free';
            case 1: return 'Basic';
            case 2: return 'Pro';
            default: return 'Unknown';
        }
    }

    private extractObjectId(result: any): string {
        // Implementation to extract object ID from result
        return result.results?.[0]?.returnValues?.[0]?.[0] || '';
    }

    private extractU64(result: any): string {
        // Implementation to extract u64 value
        return result.results?.[0]?.returnValues?.[0]?.[0] || '0';
    }
}
```

### React Components for Subscription Management

```typescript
// Subscription status display component
function SubscriptionStatus({ userAddress }) {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSubscription();
    }, [userAddress]);

    const loadSubscription = async () => {
        try {
            const subscriptionManager = new SubscriptionManager(client, PACKAGE_ID);
            const sub = await subscriptionManager.getUserSubscription(userAddress);
            setSubscription(sub);
        } catch (error) {
            console.error('Error loading subscription:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading subscription...</div>;
    if (!subscription) return <div>No subscription found</div>;

    const isExpired = subscription.endDate && new Date() > subscription.endDate;

    return (
        <div className="subscription-status">
            <div className="subscription-header">
                <h3>Subscription Status</h3>
                <span className={`subscription-badge ${subscription.subscriptionTypeName.toLowerCase()}`}>
                    {subscription.subscriptionTypeName}
                </span>
            </div>

            <div className="subscription-details">
                <div className="detail-row">
                    <span>Status:</span>
                    <span className={subscription.isActive && !isExpired ? 'active' : 'inactive'}>
                        {subscription.isActive && !isExpired ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {subscription.subscriptionType === 0 && (
                    <AttendeeCounter 
                        subscriptionId={subscription.id}
                        userAddress={userAddress}
                    />
                )}

                {subscription.endDate && (
                    <div className="detail-row">
                        <span>Expires:</span>
                        <span className={isExpired ? 'expired' : ''}>
                            {subscription.endDate.toLocaleDateString()}
                        </span>
                    </div>
                )}

                <div className="detail-row">
                    <span>Since:</span>
                    <span>{subscription.startDate.toLocaleDateString()}</span>
                </div>
            </div>

            {subscription.subscriptionType < 2 && (
                <UpgradeOptions 
                    currentSubscription={subscription}
                    onUpgrade={loadSubscription}
                />
            )}
        </div>
    );
}

// Subscription upgrade component
function UpgradeOptions({ currentSubscription, onUpgrade }) {
    const [pricing, setPricing] = useState(null);
    const [upgrading, setUpgrading] = useState(false);

    useEffect(() => {
        loadPricing();
    }, []);

    const loadPricing = async () => {
        const subscriptionManager = new SubscriptionManager(client, PACKAGE_ID);
        const prices = await subscriptionManager.getSubscriptionPricing();
        setPricing(prices);
    };

    const handleUpgrade = async (tier: 'basic' | 'pro', isYearly: boolean) => {
        setUpgrading(true);
        try {
            const subscriptionManager = new SubscriptionManager(client, PACKAGE_ID);
            
            if (tier === 'basic') {
                await subscriptionManager.upgradeToBasic(
                    currentSubscription.id,
                    isYearly,
                    userKeypair
                );
            } else {
                await subscriptionManager.upgradeToPro(
                    currentSubscription.id,
                    isYearly,
                    userKeypair
                );
            }

            onUpgrade();
            alert('Subscription upgraded successfully!');

        } catch (error) {
            console.error('Upgrade failed:', error);
            alert('Upgrade failed: ' + error.message);
        } finally {
            setUpgrading(false);
        }
    };

    if (!pricing) return <div>Loading pricing...</div>;

    return (
        <div className="upgrade-options">
            <h4>Upgrade Your Subscription</h4>
            
            {currentSubscription.subscriptionType === 0 && (
                <div className="upgrade-tier">
                    <h5>Basic Plan</h5>
                    <ul>
                        <li>Unlimited attendees</li>
                        <li>Priority support</li>
                        <li>Low platform fees apply</li>
                    </ul>
                    <div className="pricing-options">
                        <button
                            onClick={() => handleUpgrade('basic', false)}
                            disabled={upgrading}
                        >
                            Monthly: {pricing.basicMonthly} SUI
                        </button>
                        <button
                            onClick={() => handleUpgrade('basic', true)}
                            disabled={upgrading}
                            className="yearly-option"
                        >
                            Yearly: {pricing.basicYearly} SUI (Save 2 months!)
                        </button>
                    </div>
                </div>
            )}

            <div className="upgrade-tier">
                <h5>Pro Plan</h5>
                <ul>
                    <li>Unlimited attendees</li>
                    <li>Priority support</li>
                    <li>No platform fees</li>
                </ul>
                <div className="pricing-options">
                    <button
                        onClick={() => handleUpgrade('pro', false)}
                        disabled={upgrading}
                    >
                        Monthly: {pricing.proMonthly} SUI
                    </button>
                    <button
                        onClick={() => handleUpgrade('pro', true)}
                        disabled={upgrading}
                        className="yearly-option"
                    >
                        Yearly: {pricing.proYearly} SUI (Save 2 months!)
                    </button>
                </div>
            </div>
        </div>
    );
}

// Attendee counter for free tier
function AttendeeCounter({ subscriptionId, userAddress }) {
    const [remaining, setRemaining] = useState('Loading...');

    useEffect(() => {
        loadRemainingAttendees();
    }, []);

    const loadRemainingAttendees = async () => {
        try {
            const subscriptionManager = new SubscriptionManager(client, PACKAGE_ID);
            const remainingCount = await subscriptionManager.getRemainingAttendees(
                subscriptionId,
                ORGANIZER_PROFILE_ID,
                userAddress
            );
            setRemaining(remainingCount.toString());
        } catch (error) {
            console.error('Error loading attendee count:', error);
            setRemaining('Error');
        }
    };

    return (
        <div className="attendee-counter">
            <div className="detail-row">
                <span>Remaining Attendees:</span>
                <span className={parseInt(remaining) < 50 ? 'warning' : ''}>
                    {remaining} / 501
                </span>
            </div>
            {parseInt(remaining) < 50 && (
                <div className="warning-message">
                    You're approaching your attendee limit. Consider upgrading to avoid restrictions.
                </div>
            )}
        </div>
    );
}
```

### Event Listening for Subscription Changes

```typescript
// Set up subscription event listeners
function setupSubscriptionEventListeners(client: SuiClient, packageId: string) {
    // Listen for new subscriptions
    client.subscribeEvent({
        filter: {
            MoveEventType: `${packageId}::subscription::SubscriptionCreated`,
        },
        onMessage: (event) => {
            const { subscription_id, user, subscription_type, start_date, end_date } = event.parsedJson;
            
            console.log('New subscription created:', {
                subscriptionId: subscription_id,
                user,
                subscriptionType: subscription_type,
                startDate: new Date(parseInt(start_date)),
                endDate: end_date === 0 ? 'Never expires' : new Date(parseInt(end_date)),
            });

            // Update UI to reflect new subscription
            updateUserSubscriptionStatus(user);
            showNotification(`Welcome! Free subscription created for ${user.slice(0, 6)}...`);
        },
    });

    // Listen for subscription upgrades
    client.subscribeEvent({
        filter: {
            MoveEventType: `${packageId}::subscription::SubscriptionUpgraded`,
        },
        onMessage: (event) => {
            const { subscription_id, user, old_type, new_type, timestamp } = event.parsedJson;
            
            const getTypeName = (type) => {
                switch (parseInt(type)) {
                    case 0: return 'Free';
                    case 1: return 'Basic';
                    case 2: return 'Pro';
                    default: return 'Unknown';
                }
            };

            console.log('Subscription upgraded:', {
                subscriptionId: subscription_id,
                user,
                oldType: getTypeName(old_type),
                newType: getTypeName(new_type),
                timestamp: new Date(parseInt(timestamp)),
            });

            // Update subscription display
            updateUserSubscriptionStatus(user);
            showNotification(`Subscription upgraded to ${getTypeName(new_type)}!`);
        },
    });

    // Listen for attendee count updates
    client.subscribeEvent({
        filter: {
            MoveEventType: `${packageId}::subscription::AttendeeCountUpdated`,
        },
        onMessage: (event) => {
            const { subscription_id, user, total_attendees_served, timestamp } = event.parsedJson;
            
            console.log('Attendee count updated:', {
                subscriptionId: subscription_id,
                user,
                totalAttendeesServed: parseInt(total_attendees_served),
                timestamp: new Date(parseInt(timestamp)),
            });

            // Update attendee counter in UI
            updateAttendeeCounter(user, parseInt(total_attendees_served));
        },
    });

    // Listen for subscription expirations
    client.subscribeEvent({
        filter: {
            MoveEventType: `${packageId}::subscription::SubscriptionExpired`,
        },
        onMessage: (event) => {
            const { subscription_id, user, subscription_type, timestamp } = event.parsedJson;
            
            console.log('Subscription expired:', {
                subscriptionId: subscription_id,
                user,
                subscriptionType: parseInt(subscription_type),
                timestamp: new Date(parseInt(timestamp)),
            });

            // Update UI to show expired status
            updateUserSubscriptionStatus(user);
            showNotification(`Subscription has expired. Please renew to continue.`);
        },
    });
}
```

### Integration with Event Management

```typescript
// Check subscription limits before event creation
async function createEventWithSubscriptionCheck(
    eventData: {
        name: string;
        capacity: number;
        // ... other event fields
    },
    organizerKeypair: any
) {
    const organizerAddress = organizerKeypair.getPublicKey().toSuiAddress();
    
    try {
        // Get user's subscription
        const subscriptionManager = new SubscriptionManager(client, PACKAGE_ID);
        const subscription = await subscriptionManager.getUserSubscription(organizerAddress);
        
        if (!subscription) {
            throw new Error('No subscription found. Please create an organizer profile first.');
        }

        // Check if user can add attendees for this event
        const canAddAttendees = await subscriptionManager.checkAttendeeLimit(
            subscription.id,
            ORGANIZER_PROFILE_ID,
            eventData.capacity,
            organizerAddress
        );

        if (!canAddAttendees) {
            const remaining = await subscriptionManager.getRemainingAttendees(
                subscription.id,
                ORGANIZER_PROFILE_ID,
                organizerAddress
            );
            
            throw new Error(
                `Attendee limit exceeded. You have ${remaining} attendees remaining. ` +
                `Please upgrade your subscription or reduce event capacity.`
            );
        }

        // Proceed with event creation
        const tx = new Transaction();
        
        const eventId = tx.moveCall({
            target: `${PACKAGE_ID}::event_management::create_event`,
            arguments: [
                // ... event creation arguments
            ],
        });

        // Check if platform fee should be charged
        const shouldPayFee = subscription.subscriptionType === 1; // Basic tier
        
        if (shouldPayFee) {
            // Calculate and charge platform fee (e.g., 1% of expected revenue)
            const expectedRevenue = eventData.capacity * eventData.ticketPrice;
            const platformFee = Math.floor(expectedRevenue * 0.01);
            
            const [feeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(platformFee)]);
            
            tx.moveCall({
                target: `${PACKAGE_ID}::platform_treasury::deposit_platform_fee`,
                arguments: [
                    tx.object(TREASURY_ID),
                    feeCoin,
                    tx.pure.string("event_registration"),
                    tx.object(CLOCK_ID),
                ],
            });
        }

        const result = await client.signAndExecuteTransaction({
            transaction: tx,
            signer: organizerKeypair,
            options: { showEffects: true, showEvents: true },
        });

        return result;

    } catch (error) {
        console.error('Event creation failed:', error);
        throw error;
    }
}

// Automatic subscription validation during event completion
async function completeEventWithSubscriptionUpdate(
    eventId: string,
    organizerKeypair: any
) {
    const organizerAddress = organizerKeypair.getPublicKey().toSuiAddress();
    
    const tx = new Transaction();

    // Complete the event
    tx.moveCall({
        target: `${PACKAGE_ID}::event_management::complete_event`,
        arguments: [
            tx.object(eventId),
            tx.object(CLOCK_ID),
            tx.object(REGISTRY_ID),
            tx.object(ORGANIZER_PROFILE_ID),
        ],
    });

    // Update subscription attendee tracking
    tx.moveCall({
        target: `${PACKAGE_ID}::subscription::track_attendee_update`,
        arguments: [
            tx.object(USER_SUBSCRIPTION_ID),
            tx.object(ORGANIZER_PROFILE_ID),
            tx.object(CLOCK_ID),
        ],
    });

    return await client.signAndExecuteTransaction({
        transaction: tx,
        signer: organizerKeypair,
        options: { showEffects: true, showEvents: true },
    });
}
```

### Subscription Analytics Dashboard

```typescript
// Analytics component for subscription metrics
function SubscriptionAnalytics({ isAdmin }) {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAdmin) {
            loadAnalytics();
        }
    }, [isAdmin]);

    const loadAnalytics = async () => {
        try {
            // Get subscription statistics from events
            const subscriptionEvents = await client.queryEvents({
                query: {
                    MoveEventModule: `${PACKAGE_ID}::subscription`,
                },
                limit: 1000,
            });

            const analytics = processSubscriptionEvents(subscriptionEvents.data);
            setAnalytics(analytics);

        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const processSubscriptionEvents = (events) => {
        const stats = {
            totalSubscriptions: 0,
            activeSubscriptions: { free: 0, basic: 0, pro: 0 },
            monthlyRevenue: 0,
            upgrades: 0,
            expirations: 0,
            recentActivity: [],
        };

        events.forEach(event => {
            const eventType = event.type.split('::').pop();
            
            switch (eventType) {
                case 'SubscriptionCreated':
                    stats.totalSubscriptions++;
                    const subType = parseInt(event.parsedJson.subscription_type);
                    if (subType === 0) stats.activeSubscriptions.free++;
                    else if (subType === 1) stats.activeSubscriptions.basic++;
                    else if (subType === 2) stats.activeSubscriptions.pro++;
                    break;
                    
                case 'SubscriptionUpgraded':
                    stats.upgrades++;
                    // Update counters based on old/new types
                    break;
                    
                case 'SubscriptionExpired':
                    stats.expirations++;
                    break;
            }

            stats.recentActivity.push({
                type: eventType,
                timestamp: new Date(parseInt(event.timestampMs)),
                data: event.parsedJson,
            });
        });

        // Sort recent activity by timestamp
        stats.recentActivity.sort((a, b) => b.timestamp - a.timestamp);
        stats.recentActivity = stats.recentActivity.slice(0, 20);

        return stats;
    };

    if (!isAdmin) {
        return <div>Access denied. Admin only.</div>;
    }

    if (loading) return <div>Loading analytics...</div>;

    return (
        <div className="subscription-analytics">
            <h2>Subscription Analytics</h2>
            
            <div className="analytics-grid">
                <div className="metric-card">
                    <h3>Total Subscriptions</h3>
                    <div className="metric-value">{analytics.totalSubscriptions}</div>
                </div>
                
                <div className="metric-card">
                    <h3>Active Free</h3>
                    <div className="metric-value">{analytics.activeSubscriptions.free}</div>
                </div>
                
                <div className="metric-card">
                    <h3>Active Basic</h3>
                    <div className="metric-value">{analytics.activeSubscriptions.basic}</div>
                </div>
                
                <div className="metric-card">
                    <h3>Active Pro</h3>
                    <div className="metric-value">{analytics.activeSubscriptions.pro}</div>
                </div>
                
                <div className="metric-card">
                    <h3>Total Upgrades</h3>
                    <div className="metric-value">{analytics.upgrades}</div>
                </div>
                
                <div className="metric-card">
                    <h3>Expirations</h3>
                    <div className="metric-value">{analytics.expirations}</div>
                </div>
            </div>

            <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                    {analytics.recentActivity.map((activity, index) => (
                        <div key={index} className="activity-item">
                            <div className="activity-type">{activity.type}</div>
                            <div className="activity-time">
                                {activity.timestamp.toLocaleString()}
                            </div>
                            <div className="activity-details">
                                {JSON.stringify(activity.data, null, 2)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
```

## Important Notes

1. **Subscription Tiers**: The system uses a three-tier approach with different limits and features for each tier

2. **Attendee Limits**: Only the Free tier has attendee limits (501 attendees total across all events)

3. **Platform Fees**: Only Basic tier users pay platform fees; Free and Pro users are exempt

4. **Automatic Expiration**: Subscriptions can be expired by anyone once they're past their end date

5. **Upgrade Path**: Users can upgrade from Free to Basic/Pro or from Basic to Pro, but downgrades require manual intervention

6. **Integration Dependencies**: This contract closely integrates with the event management and platform treasury contracts

7. **Payment Processing**: All subscription payments go directly to the platform treasury

8. **Duration Calculation**: Subscription durations are calculated in milliseconds for precise timing


The subscription system provides the economic foundation for the ariya protocol, enabling sustainable revenue while offering clear value propositions for different user types.