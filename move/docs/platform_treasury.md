# Ariya Platform Treasury Contract Documentation

## Overview

The ariya Platform Treasury contract manages the central treasury for the Ephemeral Identity & Attendance (ariya) Protocol. This contract collects and manages platform fees from event registrations and subscription payments, providing secure fund management with admin controls for withdrawals and treasury operations.

## Module Information

- **Module**: `ariya::platform_treasury`
- **Network**: Sui Blockchain
- **Language**: Move

## Core Data Structures

### PlatformTreasury
The main treasury object that holds all platform funds and manages fee collection.

```move
public struct PlatformTreasury has key {
    id: UID,
    balance: Balance<SUI>,           // Total SUI balance in treasury
    admin: address,                  // Treasury administrator address
    total_platform_fees: u64,       // Cumulative platform fees collected
    total_subscription_fees: u64,    // Cumulative subscription fees collected
}
```

### TreasuryAdminCap
Administrative capability for treasury management operations.

```move
public struct TreasuryAdminCap has key, store {
    id: UID,
    treasury_id: ID,    // Reference to associated treasury
}
```

## Fee Types

The treasury supports two main categories of fees:

| Fee Type | Description | Source |
|----------|-------------|---------|
| `event_registration` | Fees collected from event registration processes | Event management operations |
| `subscription` | Fees collected from platform subscription payments | User subscription services |

## Error Codes

| Error | Code | Description |
|-------|------|-------------|
| `ENotAdmin` | 200 | Caller is not the treasury administrator |
| `EInsufficientBalance` | 201 | Treasury has insufficient funds for operation |
| `EInvalidAmount` | 202 | Invalid amount provided (zero or negative) |

## Public Functions

### Treasury Initialization

The treasury is automatically initialized when the module is deployed. The deployer becomes the initial admin and receives the `TreasuryAdminCap`.

```move
fun init(ctx: &mut TxContext)
```

**Behavior:**
- Creates a new `PlatformTreasury` with zero balance
- Sets the deployer as the initial admin
- Creates and transfers `TreasuryAdminCap` to the deployer
- Shares the treasury object for public access

### Fee Collection

#### `deposit_platform_fee`
Deposits platform fees into the treasury from various protocol operations.

```move
public fun deposit_platform_fee(
    treasury: &mut PlatformTreasury,
    payment: Coin<SUI>,
    fee_type: String,
    clock: &Clock,
    ctx: &mut TxContext
)
```

**Parameters:**
- `treasury`: Mutable reference to the platform treasury
- `payment`: SUI coin containing the fee payment
- `fee_type`: Type of fee ("event_registration" or "subscription")
- `clock`: System clock reference for timestamping
- `ctx`: Transaction context

**Requirements:**
- Payment amount must be greater than zero
- Valid fee type string

**Frontend Usage:**
```typescript
const tx = new Transaction();

// Create coin for platform fee (e.g., 1% of event registration)
const feeAmount = Math.floor(registrationAmount * 0.01); // 1% platform fee
const [feeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(feeAmount)]);

tx.moveCall({
    target: `${PACKAGE_ID}::platform_treasury::deposit_platform_fee`,
    arguments: [
        tx.object(TREASURY_ID),
        feeCoin,
        tx.pure.string("event_registration"),
        tx.object(CLOCK_ID),
    ],
});

const result = await signAndExecuteTransaction({ transaction: tx });
console.log('Platform fee deposited:', result);
```

### Treasury Management

#### `withdraw_treasury_funds`
Allows admin to withdraw funds from the treasury.

```move
public fun withdraw_treasury_funds(
    treasury: &mut PlatformTreasury,
    admin_cap: &TreasuryAdminCap,
    amount: u64,
    clock: &Clock,
    ctx: &mut TxContext
): Coin<SUI>
```

**Parameters:**
- `treasury`: Mutable reference to the platform treasury
- `admin_cap`: Admin capability for authorization
- `amount`: Amount to withdraw in SUI
- `clock`: System clock reference
- `ctx`: Transaction context

**Returns:** `Coin<SUI>` - The withdrawn SUI coin

**Requirements:**
- Caller must be the treasury admin
- Admin capability must match the treasury
- Treasury must have sufficient balance
- Amount must be greater than zero

**Frontend Usage:**
```typescript
const tx = new Transaction();

// Withdraw funds from treasury
const withdrawnCoin = tx.moveCall({
    target: `${PACKAGE_ID}::platform_treasury::withdraw_treasury_funds`,
    arguments: [
        tx.object(TREASURY_ID),
        tx.object(ADMIN_CAP_ID),
        tx.pure.u64(withdrawAmount),
        tx.object(CLOCK_ID),
    ],
});

// Transfer to admin's address or use for other purposes
tx.transferObjects([withdrawnCoin], tx.pure.address(adminAddress));

const result = await signAndExecuteTransaction({ transaction: tx });
console.log('Treasury withdrawal:', result);
```

#### `transfer_admin`
Transfers treasury administration to a new admin.

```move
public fun transfer_admin(
    treasury: &mut PlatformTreasury,
    admin_cap: TreasuryAdminCap,
    new_admin: address,
    ctx: &mut TxContext
)
```

**Parameters:**
- `treasury`: Mutable reference to the platform treasury
- `admin_cap`: Admin capability (consumed in transfer)
- `new_admin`: Address of the new treasury administrator
- `ctx`: Transaction context

**Requirements:**
- Caller must be the current treasury admin
- Admin capability must match the treasury

**Frontend Usage:**
```typescript
const tx = new Transaction();

tx.moveCall({
    target: `${PACKAGE_ID}::platform_treasury::transfer_admin`,
    arguments: [
        tx.object(TREASURY_ID),
        tx.object(ADMIN_CAP_ID),
        tx.pure.address(newAdminAddress),
    ],
});

const result = await signAndExecuteTransaction({ transaction: tx });
console.log('Admin transferred:', result);
```

## Query Functions (Read-Only)

### Treasury Information

#### `get_treasury_balance`
Returns the current treasury balance.

```move
public fun get_treasury_balance(treasury: &PlatformTreasury): u64
```

#### `get_treasury_admin`
Returns the current treasury administrator address.

```move
public fun get_treasury_admin(treasury: &PlatformTreasury): address
```

#### `get_fee_totals`
Returns cumulative fee totals by category.

```move
public fun get_fee_totals(treasury: &PlatformTreasury): (u64, u64)
```

**Returns:** `(u64, u64)` - (total_platform_fees, total_subscription_fees)

#### `get_treasury_details`
Returns comprehensive treasury information.

```move
public fun get_treasury_details(treasury: &PlatformTreasury): (u64, address, u64, u64)
```

**Returns:** `(u64, address, u64, u64)` - (balance, admin, total_platform_fees, total_subscription_fees)

### Authorization Check

#### `is_admin`
Checks if a given address is the treasury administrator.

```move
public fun is_admin(treasury: &PlatformTreasury, user: address): bool
```

**Frontend Usage:**
```typescript
// Check if user is treasury admin
const checkAdminTx = new Transaction();
checkAdminTx.moveCall({
    target: `${PACKAGE_ID}::platform_treasury::is_admin`,
    arguments: [
        checkAdminTx.object(TREASURY_ID),
        checkAdminTx.pure.address(userAddress),
    ],
});

const result = await client.devInspectTransactionBlock({
    transactionBlock: checkAdminTx,
    sender: userAddress,
});

const isAdmin = result.results?.[0]?.returnValues?.[0]?.[0] === 1;
console.log('User is admin:', isAdmin);
```

## Events Emitted

### PlatformFeeDeposited
Emitted when platform fees are deposited into the treasury.

```move
public struct PlatformFeeDeposited has copy, drop {
    amount: u64,        // Amount deposited
    fee_type: String,   // Type of fee
    depositor: address, // Address that deposited the fee
    timestamp: u64,     // Deposit timestamp
}
```

### TreasuryWithdrawal
Emitted when admin withdraws funds from the treasury.

```move
public struct TreasuryWithdrawal has copy, drop {
    amount: u64,    // Amount withdrawn
    admin: address, // Admin who withdrew
    timestamp: u64, // Withdrawal timestamp
}
```

### AdminTransferred
Emitted when treasury administration is transferred.

```move
public struct AdminTransferred has copy, drop {
    old_admin: address, // Previous admin address
    new_admin: address, // New admin address
    timestamp: u64,     // Transfer timestamp
}
```

## Frontend Integration Examples

### Treasury Management Dashboard

```typescript
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

class TreasuryManager {
    constructor(private client: SuiClient, private packageId: string) {}

    // Get complete treasury status
    async getTreasuryStatus(treasuryId: string) {
        try {
            const treasury = await this.client.getObject({
                id: treasuryId,
                options: { showContent: true },
            });

            if (!treasury.data?.content) {
                throw new Error('Treasury not found');
            }

            const fields = treasury.data.content.fields;
            return {
                id: treasuryId,
                balance: parseInt(fields.balance),
                admin: fields.admin,
                totalPlatformFees: parseInt(fields.total_platform_fees),
                totalSubscriptionFees: parseInt(fields.total_subscription_fees),
            };
        } catch (error) {
            console.error('Error fetching treasury status:', error);
            return null;
        }
    }

    // Deposit platform fee
    async depositPlatformFee(
        treasuryId: string,
        amount: number,
        feeType: 'event_registration' | 'subscription',
        signerKeypair: any
    ) {
        const tx = new Transaction();

        // Create coin for fee payment
        const [feeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);

        tx.moveCall({
            target: `${this.packageId}::platform_treasury::deposit_platform_fee`,
            arguments: [
                tx.object(treasuryId),
                feeCoin,
                tx.pure.string(feeType),
                tx.object(CLOCK_ID),
            ],
        });

        return await this.client.signAndExecuteTransaction({
            transaction: tx,
            signer: signerKeypair,
            options: { showEffects: true, showEvents: true },
        });
    }

    // Withdraw treasury funds (admin only)
    async withdrawFunds(
        treasuryId: string,
        adminCapId: string,
        amount: number,
        adminKeypair: any
    ) {
        const tx = new Transaction();

        const [withdrawnCoin] = tx.moveCall({
            target: `${this.packageId}::platform_treasury::withdraw_treasury_funds`,
            arguments: [
                tx.object(treasuryId),
                tx.object(adminCapId),
                tx.pure.u64(amount),
                tx.object(CLOCK_ID),
            ],
        });

        // Transfer withdrawn funds to admin
        tx.transferObjects([withdrawnCoin], tx.pure.address(adminKeypair.getPublicKey().toSuiAddress()));

        return await this.client.signAndExecuteTransaction({
            transaction: tx,
            signer: adminKeypair,
            options: { showEffects: true, showEvents: true },
        });
    }

    // Transfer admin rights
    async transferAdmin(
        treasuryId: string,
        adminCapId: string,
        newAdminAddress: string,
        currentAdminKeypair: any
    ) {
        const tx = new Transaction();

        tx.moveCall({
            target: `${this.packageId}::platform_treasury::transfer_admin`,
            arguments: [
                tx.object(treasuryId),
                tx.object(adminCapId),
                tx.pure.address(newAdminAddress),
            ],
        });

        return await this.client.signAndExecuteTransaction({
            transaction: tx,
            signer: currentAdminKeypair,
            options: { showEffects: true, showEvents: true },
        });
    }

    // Get fee history from events
    async getFeeHistory(treasuryId: string, limit: number = 50) {
        const events = await this.client.queryEvents({
            query: {
                MoveEventType: `${this.packageId}::platform_treasury::PlatformFeeDeposited`,
            },
            limit,
            order: 'descending',
        });

        return events.data.map(event => ({
            amount: event.parsedJson.amount,
            feeType: event.parsedJson.fee_type,
            depositor: event.parsedJson.depositor,
            timestamp: new Date(parseInt(event.parsedJson.timestamp)),
            txDigest: event.id.txDigest,
        }));
    }

    // Get withdrawal history
    async getWithdrawalHistory(treasuryId: string, limit: number = 50) {
        const events = await this.client.queryEvents({
            query: {
                MoveEventType: `${this.packageId}::platform_treasury::TreasuryWithdrawal`,
            },
            limit,
            order: 'descending',
        });

        return events.data.map(event => ({
            amount: event.parsedJson.amount,
            admin: event.parsedJson.admin,
            timestamp: new Date(parseInt(event.parsedJson.timestamp)),
            txDigest: event.id.txDigest,
        }));
    }
}
```

### React Components for Treasury Management

```typescript
// Treasury overview dashboard
function TreasuryDashboard({ treasuryId, userAddress, isAdmin }) {
    const [treasuryData, setTreasuryData] = useState(null);
    const [feeHistory, setFeeHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTreasuryData();
    }, [treasuryId]);

    const loadTreasuryData = async () => {
        try {
            const treasuryManager = new TreasuryManager(client, PACKAGE_ID);
            
            // Load treasury status
            const status = await treasuryManager.getTreasuryStatus(treasuryId);
            setTreasuryData(status);

            // Load fee history
            const history = await treasuryManager.getFeeHistory(treasuryId);
            setFeeHistory(history);

        } catch (error) {
            console.error('Error loading treasury data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading treasury data...</div>;
    if (!treasuryData) return <div>Treasury not found</div>;

    return (
        <div className="treasury-dashboard">
            <div className="treasury-overview">
                <h2>Platform Treasury</h2>
                
                <div className="treasury-stats">
                    <div className="stat-card">
                        <h3>Total Balance</h3>
                        <p>{(treasuryData.balance / 1e9).toFixed(2)} SUI</p>
                    </div>
                    
                    <div className="stat-card">
                        <h3>Platform Fees</h3>
                        <p>{(treasuryData.totalPlatformFees / 1e9).toFixed(2)} SUI</p>
                    </div>
                    
                    <div className="stat-card">
                        <h3>Subscription Fees</h3>
                        <p>{(treasuryData.totalSubscriptionFees / 1e9).toFixed(2)} SUI</p>
                    </div>
                </div>

                <div className="admin-info">
                    <p><strong>Admin:</strong> {treasuryData.admin}</p>
                    {userAddress === treasuryData.admin && (
                        <span className="admin-badge">You are the admin</span>
                    )}
                </div>
            </div>

            {isAdmin && (
                <AdminControls 
                    treasuryId={treasuryId}
                    currentBalance={treasuryData.balance}
                    onActionComplete={loadTreasuryData}
                />
            )}

            <FeeHistoryTable history={feeHistory} />
        </div>
    );
}

// Admin control panel
function AdminControls({ treasuryId, currentBalance, onActionComplete }) {
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [newAdminAddress, setNewAdminAddress] = useState('');
    const [loading, setLoading] = useState(false);

    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;

        setLoading(true);
        try {
            const treasuryManager = new TreasuryManager(client, PACKAGE_ID);
            const amountInMist = Math.floor(parseFloat(withdrawAmount) * 1e9);
            
            await treasuryManager.withdrawFunds(
                treasuryId,
                ADMIN_CAP_ID,
                amountInMist,
                adminKeypair
            );

            setWithdrawAmount('');
            onActionComplete();
            alert('Withdrawal successful!');

        } catch (error) {
            console.error('Withdrawal failed:', error);
            alert('Withdrawal failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTransferAdmin = async (e) => {
        e.preventDefault();
        if (!newAdminAddress) return;

        setLoading(true);
        try {
            const treasuryManager = new TreasuryManager(client, PACKAGE_ID);
            
            await treasuryManager.transferAdmin(
                treasuryId,
                ADMIN_CAP_ID,
                newAdminAddress,
                adminKeypair
            );

            setNewAdminAddress('');
            alert('Admin transfer successful!');

        } catch (error) {
            console.error('Admin transfer failed:', error);
            alert('Admin transfer failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-controls">
            <h3>Admin Controls</h3>
            
            <div className="control-section">
                <h4>Withdraw Funds</h4>
                <form onSubmit={handleWithdraw}>
                    <div className="form-group">
                        <label>Amount (SUI)</label>
                        <input
                            type="number"
                            step="0.001"
                            max={currentBalance / 1e9}
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            placeholder="Enter amount to withdraw"
                        />
                        <small>Max: {(currentBalance / 1e9).toFixed(3)} SUI</small>
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : 'Withdraw'}
                    </button>
                </form>
            </div>

            <div className="control-section">
                <h4>Transfer Admin Rights</h4>
                <form onSubmit={handleTransferAdmin}>
                    <div className="form-group">
                        <label>New Admin Address</label>
                        <input
                            type="text"
                            value={newAdminAddress}
                            onChange={(e) => setNewAdminAddress(e.target.value)}
                            placeholder="0x..."
                        />
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Processing...' : 'Transfer Admin'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Fee history table
function FeeHistoryTable({ history }) {
    return (
        <div className="fee-history">
            <h3>Recent Fee Deposits</h3>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Type</th>
                            <th>From</th>
                            <th>Transaction</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((record, index) => (
                            <tr key={index}>
                                <td>{record.timestamp.toLocaleDateString()}</td>
                                <td>{(record.amount / 1e9).toFixed(4)} SUI</td>
                                <td>
                                    <span className={`fee-type ${record.feeType}`}>
                                        {record.feeType.replace('_', ' ')}
                                    </span>
                                </td>
                                <td>
                                    <span className="address">
                                        {record.depositor.slice(0, 6)}...{record.depositor.slice(-4)}
                                    </span>
                                </td>
                                <td>
                                    <a 
                                        href={`https://suiscan.xyz/mainnet/tx/${record.txDigest}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        View
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
```

### Event Listening and Notifications

```typescript
// Set up treasury event listeners
function setupTreasuryEventListeners(client: SuiClient, packageId: string) {
    // Listen for fee deposits
    client.subscribeEvent({
        filter: {
            MoveEventType: `${packageId}::platform_treasury::PlatformFeeDeposited`,
        },
        onMessage: (event) => {
            const { amount, fee_type, depositor, timestamp } = event.parsedJson;
            
            console.log('Platform fee deposited:', {
                amount: amount / 1e9,
                feeType: fee_type,
                depositor,
                timestamp: new Date(parseInt(timestamp)),
            });

            // Update UI, send notifications, etc.
            updateTreasuryBalance();
            showNotification(`New ${fee_type} fee: ${amount / 1e9} SUI`);
        },
    });

    // Listen for withdrawals
    client.subscribeEvent({
        filter: {
            MoveEventType: `${packageId}::platform_treasury::TreasuryWithdrawal`,
        },
        onMessage: (event) => {
            const { amount, admin, timestamp } = event.parsedJson;
            
            console.log('Treasury withdrawal:', {
                amount: amount / 1e9,
                admin,
                timestamp: new Date(parseInt(timestamp)),
            });

            // Update treasury display
            updateTreasuryBalance();
            showNotification(`Treasury withdrawal: ${amount / 1e9} SUI`);
        },
    });

    // Listen for admin transfers
    client.subscribeEvent({
        filter: {
            MoveEventType: `${packageId}::platform_treasury::AdminTransferred`,
        },
        onMessage: (event) => {
            const { old_admin, new_admin, timestamp } = event.parsedJson;
            
            console.log('Admin transferred:', {
                oldAdmin: old_admin,
                newAdmin: new_admin,
                timestamp: new Date(parseInt(timestamp)),
            });

            // Update admin status in UI
            updateAdminStatus(new_admin);
            showNotification('Treasury admin has been transferred');
        },
    });
}
```

### Integration with Event Management

```typescript
// Automatic platform fee collection during event registration
async function registerForEventWithPlatformFee(
    eventId: string,
    registrationAmount: number,
    platformFeePercentage: number = 0.01 // 1%
) {
    const tx = new Transaction();
    
    // Calculate platform fee
    const platformFee = Math.floor(registrationAmount * platformFeePercentage);
    const netRegistrationAmount = registrationAmount - platformFee;

    // Split coins for registration and platform fee
    const [registrationCoin, platformFeeCoin] = tx.splitCoins(tx.gas, [
        tx.pure.u64(netRegistrationAmount),
        tx.pure.u64(platformFee),
    ]);

    // Register for event with net amount
    tx.moveCall({
        target: `${PACKAGE_ID}::event_management::register_for_event`,
        arguments: [
            tx.object(eventId),
            registrationCoin,
            // ... other arguments
        ],
    });

    // Deposit platform fee to treasury
    tx.moveCall({
        target: `${PACKAGE_ID}::platform_treasury::deposit_platform_fee`,
        arguments: [
            tx.object(TREASURY_ID),
            platformFeeCoin,
            tx.pure.string("event_registration"),
            tx.object(CLOCK_ID),
        ],
    });

    return await signAndExecuteTransaction({ transaction: tx });
}
```

## Important Notes

1. **Fee Categories**: The treasury distinguishes between event registration fees and subscription fees for accounting purposes

2. **Admin Security**: The admin capability is transferable but should be handled with extreme care as it controls treasury access

3. **Balance Tracking**: The contract maintains separate counters for different fee types while storing all funds in a single balance

4. **Event Transparency**: All treasury operations emit events for complete audit trail

5. **Withdrawal Limits**: No built-in withdrawal limits - admin has full access to treasury funds

6. **Multi-sig Considerations**: For production use, consider implementing multi-signature requirements for large withdrawals

7. **Fee Calculation**: Platform fees should be calculated off-chain before calling deposit functions

8. **Integration Pattern**: Designed to be called automatically by other protocol contracts during fee collection

The treasury serves as the central financial hub for the ariya protocol, ensuring transparent and secure management of platform revenues.