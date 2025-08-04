# Ariya Event Management Contract Documentation

## Overview

The ariya Event Management contract is the core module for creating, managing, and tracking events within the Ephemeral Identity & Attendance (ariya) Protocol. This contract handles event lifecycle management, user profiles, organizer profiles, and sponsor conditions for decentralized event attendance verification.

## Module Information

- **Module**: `ariya::event_management`
- **Network**: Sui Blockchain
- **Language**: Move

## Core Data Structures

### Event
The main event object that stores all event-related information.

```move
public struct Event has key, store {
    id: UID,
    name: String,
    description: String,
    location: String,
    start_time: u64,          // Unix timestamp in milliseconds
    end_time: u64,            // Unix timestamp in milliseconds
    capacity: u64,            // Maximum attendees
    current_attendees: u64,   // Current number of attendees
    organizer: address,       // Event organizer's wallet address
    state: u8,               // Current event state (0-3)
    created_at: u64,         // Creation timestamp
    sponsor_conditions: SponsorConditions,
    metadata_uri: String,    // Walrus storage reference
    fee_amount: u64,         // Event fee (0 for free events)
}
```

### Profile
General user profile for all platform users.

```move
public struct Profile has key, store {
    id: UID,
    address: address,
    name: String,
    bio: String,
    photo_url: String,
    telegram_username: String,
    x_username: String,
    created_at: u64,
}
```

### ProfileCap
Capability object that proves ownership of a profile.

```move
public struct ProfileCap has key, store {
    id: UID,
    profile_id: ID,
    owner: address,
}
```

### OrganizerProfile
Tracks organizer reputation and statistics across all events.

```move
public struct OrganizerProfile has key, store {
    id: UID,
    address: address,
    name: String,
    bio: String,
    total_events: u64,
    successful_events: u64,
    total_attendees_served: u64,
    avg_rating: u64,         // Rating * 100 (e.g., 450 = 4.5/5)
    created_at: u64,
}
```

### OrganizerCap
Capability object for managing organizer profiles.

```move
public struct OrganizerCap has key, store {
    id: UID,
    profile_id: ID,
}
```

### SponsorConditions
Defines performance benchmarks for sponsor fund release.

```move
public struct SponsorConditions has store, drop, copy {
    min_attendees: u64,
    min_completion_rate: u64,    // Percentage * 100 (e.g., 8000 = 80%)
    min_avg_rating: u64,         // Rating * 100 (e.g., 450 = 4.5/5)
    custom_benchmarks: vector<CustomBenchmark>,
}
```

### CustomBenchmark
Custom performance metrics for sponsor conditions.

```move
public struct CustomBenchmark has store, drop, copy {
    metric_name: String,
    target_value: u64,
    comparison_type: u8,    // 0: >=, 1: <=, 2: ==
}
```

### ProfileRegistry
Global registry for profile discovery and validation.

```move
public struct ProfileRegistry has key {
    id: UID,
    profiles: Table<address, ID>,    // address -> profile_id
}
```

### EventRegistry
Global registry for event discovery and indexing.

```move
public struct EventRegistry has key {
    id: UID,
    events: Table<ID, EventInfo>,
    events_by_organizer: Table<address, vector<ID>>,
}
```

### EventInfo
Lightweight event information for registry storage.

```move
public struct EventInfo has store, drop, copy {
    event_id: ID,
    name: String,
    start_time: u64,
    organizer: address,
    state: u8,
}
```

## Event States

| State | Value | Description |
|-------|-------|-------------|
| `STATE_CREATED` | 0 | Event created but not yet active for registration |
| `STATE_ACTIVE` | 1 | Event is live and accepting registrations |
| `STATE_COMPLETED` | 2 | Event has ended |
| `STATE_SETTLED` | 3 | Event has been settled (funds released/withheld) |

## Error Codes

| Error | Code | Description |
|-------|------|-------------|
| `ENotOrganizer` | 1 | Caller is not the event organizer |
| `EEventNotActive` | 2 | Event is not in the correct state for this operation |
| `EEventAlreadyCompleted` | 3 | Event has already been completed |
| `EInvalidCapacity` | 4 | Invalid capacity value |
| `EInvalidTimestamp` | 5 | Invalid timestamp (e.g., start time in past) |
| `ENotAuthorized` | 6 | User is not authorized for this operation |

## Public Functions

### Profile Management

#### `create_profile`
Creates a new user profile and returns capability object.

```move
public fun create_profile(
    name: String,
    bio: String,
    photo_url: String,
    telegram_username: String,
    x_username: String,
    clock: &Clock,
    profile_registry: &mut ProfileRegistry,
    ctx: &mut TxContext
): ProfileCap
```

**Parameters:**
- `name`: User's display name
- `bio`: User's biography/description
- `photo_url`: URL to profile photo
- `telegram_username`: Telegram username (optional)
- `x_username`: X (Twitter) username (optional)
- `clock`: System clock reference
- `profile_registry`: Profile registry object
- `ctx`: Transaction context

**Returns:** `ProfileCap` - Capability object for managing the profile

**Frontend Usage:**
```typescript
const tx = new Transaction();
const [profileCap] = tx.moveCall({
    target: `${PACKAGE_ID}::event_management::create_profile`,
    arguments: [
        tx.pure.string("John Doe"),
        tx.pure.string("Tech enthusiast and event organizer"),
        tx.pure.string("https://example.com/photo.jpg"),
        tx.pure.string("johndoe"),
        tx.pure.string("@johndoe"),
        tx.object(CLOCK_ID),
        tx.object(PROFILE_REGISTRY_ID),
    ],
});
```

#### `update_profile`
Updates user profile information (requires ProfileCap).

```move
public fun update_profile(
    profile: &mut Profile,
    profile_cap: &ProfileCap,
    name: String,
    bio: String,
    photo_url: String,
    telegram_username: String,
    x_username: String,
    ctx: &mut TxContext
)
```

### Organizer Profile Management

#### `create_organizer_profile`
Creates a new organizer profile and returns capability object.

```move
public fun create_organizer_profile(
    name: String,
    bio: String,
    clock: &Clock,
    ctx: &mut TxContext
): OrganizerCap
```

**Parameters:**
- `name`: Organizer's display name
- `bio`: Organizer's biography/description
- `clock`: System clock reference
- `ctx`: Transaction context

**Returns:** `OrganizerCap` - Capability object for managing the organizer profile

**Frontend Usage:**
```typescript
const tx = new Transaction();
const [organizerCap] = tx.moveCall({
    target: `${PACKAGE_ID}::event_management::create_organizer_profile`,
    arguments: [
        tx.pure.string("EventCorp LLC"),
        tx.pure.string("Professional event organizer with 5+ years experience"),
        tx.object(CLOCK_ID),
    ],
});
```

### Event Creation and Management

#### `create_event`
Creates a new event with sponsor conditions.

```move
public fun create_event(
    name: String,
    description: String,
    location: String,
    start_time: u64,
    end_time: u64,
    capacity: u64,
    fee_amount: u64,
    min_attendees: u64,
    min_completion_rate: u64,
    min_avg_rating: u64,
    metadata_uri: String,
    clock: &Clock,
    registry: &mut EventRegistry,
    profile: &mut OrganizerProfile,
    ctx: &mut TxContext
): ID
```

**Parameters:**
- `name`: Event name
- `description`: Event description
- `location`: Event location
- `start_time`: Event start time (Unix timestamp in ms)
- `end_time`: Event end time (Unix timestamp in ms)
- `capacity`: Maximum number of attendees
- `fee_amount`: Event fee in smallest unit (0 for free events)
- `min_attendees`: Minimum attendees for sponsor success
- `min_completion_rate`: Minimum completion rate (percentage * 100)
- `min_avg_rating`: Minimum average rating (rating * 100)
- `metadata_uri`: Walrus storage URI for additional metadata
- `clock`: System clock reference
- `registry`: Event registry object
- `profile`: Organizer's profile object
- `ctx`: Transaction context

**Returns:** `ID` - The created event's object ID

**Frontend Usage:**
```typescript
const tx = new Transaction();
const eventId = tx.moveCall({
    target: `${PACKAGE_ID}::event_management::create_event`,
    arguments: [
        tx.pure.string("Tech Conference 2024"),
        tx.pure.string("Annual technology conference"),
        tx.pure.string("San Francisco, CA"),
        tx.pure.u64(Date.now() + 86400000), // Tomorrow
        tx.pure.u64(Date.now() + 172800000), // Day after tomorrow
        tx.pure.u64(100), // Capacity
        tx.pure.u64(50000), // Fee: 0.05 SUI (50,000 MIST)
        tx.pure.u64(50),  // Min attendees
        tx.pure.u64(8000), // 80% completion rate
        tx.pure.u64(400),  // 4.0/5.0 rating
        tx.pure.string("walrus://metadata-hash"),
        tx.object(CLOCK_ID),
        tx.object(REGISTRY_ID),
        tx.object(PROFILE_ID),
    ],
});
```

#### `edit_event`
Edits event details (only organizer, only before completion).

```move
public fun edit_event(
    event: &mut Event,
    name: String,
    description: String,
    location: String,
    start_time: u64,
    end_time: u64,
    capacity: u64,
    fee_amount: u64,
    metadata_uri: String,
    clock: &Clock,
    registry: &mut EventRegistry,
    ctx: &mut TxContext
)
```

#### `delete_event`
Deletes an event (only if not active and no attendees).

```move
public fun delete_event(
    event: Event,
    registry: &mut EventRegistry,
    ctx: &mut TxContext
)
```

#### `activate_event`
Activates an event for registration.

```move
public fun activate_event(
    event: &mut Event,
    clock: &Clock,
    registry: &mut EventRegistry,
    ctx: &mut TxContext
)
```

**Frontend Usage:**
```typescript
const tx = new Transaction();
tx.moveCall({
    target: `${PACKAGE_ID}::event_management::activate_event`,
    arguments: [
        tx.object(EVENT_ID),
        tx.object(CLOCK_ID),
        tx.object(REGISTRY_ID),
    ],
});
```

#### `complete_event`
Marks an event as completed (only callable after end time).

```move
public fun complete_event(
    event: &mut Event,
    clock: &Clock,
    registry: &mut EventRegistry,
    profile: &mut OrganizerProfile,
    ctx: &mut TxContext
)
```

#### `add_custom_benchmark`
Adds custom performance benchmarks to sponsor conditions.

```move
public fun add_custom_benchmark(
    event: &mut Event,
    metric_name: String,
    target_value: u64,
    comparison_type: u8,
    ctx: &mut TxContext
)
```

**Comparison Types:**
- `0`: Greater than or equal (>=)
- `1`: Less than or equal (<=)
- `2`: Equal to (==)

### Contract Integration Functions

These functions are called by other contracts in the protocol:

#### `mark_event_settled`
Marks an event as settled (called by escrow contract).

```move
public fun mark_event_settled(
    event: &mut Event,
    success: bool,
    profile: &mut OrganizerProfile,
)
```

#### `increment_attendees`
Increments attendee count (called by attendance contract).

```move
public fun increment_attendees(event: &mut Event)
```

#### `update_organizer_rating`
Updates organizer's average rating (called by rating contract).

```move
public fun update_organizer_rating(
    profile: &mut OrganizerProfile,
    new_rating_sum: u64,
    total_ratings: u64,
)
```

### Query Functions (Read-Only)

#### Event Information
```move
public fun get_event_state(event: &Event): u8
public fun get_event_organizer(event: &Event): address
public fun get_event_capacity(event: &Event): u64
public fun get_event_fee_amount(event: &Event): u64
public fun is_event_free(event: &Event): bool
public fun get_event_location(event: &Event): String
public fun get_current_attendees(event: &Event): u64
public fun get_event_id(event: &Event): ID
public fun get_event_metadata_uri(event: &Event): String
public fun get_event_timing(event: &Event): (u64, u64, u64) // start, end, created
```

#### Event Status Checks
```move
public fun is_event_active(event: &Event): bool
public fun is_event_completed(event: &Event): bool
public fun event_exists(registry: &EventRegistry, event_id: ID): bool
```

#### Sponsor Conditions
```move
public fun get_sponsor_conditions(event: &Event): &SponsorConditions
public fun get_condition_details(conditions: &SponsorConditions): (u64, u64, u64, u64)
public fun get_event_sponsor_conditions(event: &Event): (u64, u64, u64, u64)
// Returns: (min_attendees, min_completion_rate, min_avg_rating, custom_benchmarks_count)
```

#### Custom Benchmark Access
```move
public fun get_custom_benchmarks(conditions: &SponsorConditions): &vector<CustomBenchmark>
public fun get_benchmark_metric_name(benchmark: &CustomBenchmark): String
public fun get_benchmark_target_value(benchmark: &CustomBenchmark): u64
public fun get_benchmark_comparison_type(benchmark: &CustomBenchmark): u8
```

#### Profile Information
```move
public fun get_profile_details(profile: &Profile): (address, String, String, String, String, String, u64)
public fun get_profile_name(profile: &Profile): String
public fun get_profile_bio(profile: &Profile): String
public fun get_profile_photo_url(profile: &Profile): String
public fun get_profile_telegram(profile: &Profile): String
public fun get_profile_x_username(profile: &Profile): String

public fun has_profile(profile_registry: &ProfileRegistry, user: address): bool
public fun get_user_profile_id(profile_registry: &ProfileRegistry, user: address): ID
```

#### Organizer Information
```move
public fun get_organizer_stats(profile: &OrganizerProfile): (u64, u64, u64, u64)
// Returns: (total_events, successful_events, total_attendees_served, avg_rating)

public fun get_organizer_profile(profile: &OrganizerProfile): (address, String, String, u64, u64, u64, u64)
// Returns: (address, name, bio, total_events, successful_events, total_attendees_served, avg_rating)

public fun get_organizer_event_ids(registry: &EventRegistry, organizer: address): vector<ID>
```

#### Registry Queries
```move
public fun get_event_info_fields(registry: &EventRegistry, id: ID): (ID, String, u64, address, u8)
// Returns: (event_id, name, start_time, organizer, state)
```

#### Capability Management
```move
public fun transfer_profile_cap(profile_cap: ProfileCap, new_owner: address)
public fun get_profile_cap_details(profile_cap: &ProfileCap): (ID, address)
```

## Events Emitted

### EventCreated
```move
public struct EventCreated has copy, drop {
    event_id: ID,
    name: String,
    organizer: address,
    start_time: u64,
    capacity: u64,
}
```

### EventActivated
```move
public struct EventActivated has copy, drop {
    event_id: ID,
    activated_at: u64,
}
```

### EventCompleted
```move
public struct EventCompleted has copy, drop {
    event_id: ID,
    total_attendees: u64,
    completed_at: u64,
}
```

## Frontend Integration Examples

### Creating a User Profile
```typescript
// Create user profile
const createProfileTx = new Transaction();
const [profileCap] = createProfileTx.moveCall({
    target: `${PACKAGE_ID}::event_management::create_profile`,
    arguments: [
        createProfileTx.pure.string("John Doe"),
        createProfileTx.pure.string("Tech enthusiast"),
        createProfileTx.pure.string("https://example.com/photo.jpg"),
        createProfileTx.pure.string("johndoe"),
        createProfileTx.pure.string("@johndoe"),
        createProfileTx.object(CLOCK_ID),
        createProfileTx.object(PROFILE_REGISTRY_ID),
    ],
});

const result = await suiClient.executeTransactionBlock({
    transactionBlock: createProfileTx,
    signer: keypair,
    options: { showEffects: true, showEvents: true },
});
```

### Creating an Event Flow
```typescript
// Import the correct SDK classes
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

// 1. Create organizer profile (if not exists)
const createOrganizerTx = new Transaction();
const [organizerCap] = createOrganizerTx.moveCall({
    target: `${PACKAGE_ID}::event_management::create_organizer_profile`,
    arguments: [
        createOrganizerTx.pure.string(organizerName),
        createOrganizerTx.pure.string(organizerBio),
        createOrganizerTx.object(CLOCK_ID),
    ],
});

// 2. Create event
const createEventTx = new Transaction();
const eventId = createEventTx.moveCall({
    target: `${PACKAGE_ID}::event_management::create_event`,
    arguments: [
        createEventTx.pure.string(eventData.name),
        createEventTx.pure.string(eventData.description),
        createEventTx.pure.string(eventData.location),
        createEventTx.pure.u64(eventData.startTime),
        createEventTx.pure.u64(eventData.endTime),
        createEventTx.pure.u64(eventData.capacity),
        createEventTx.pure.u64(eventData.feeAmount),
        createEventTx.pure.u64(sponsorConditions.minAttendees),
        createEventTx.pure.u64(sponsorConditions.minCompletionRate),
        createEventTx.pure.u64(sponsorConditions.minAvgRating),
        createEventTx.pure.string(eventData.metadataUri),
        createEventTx.object(CLOCK_ID),
        createEventTx.object(REGISTRY_ID),
        createEventTx.object(PROFILE_ID),
    ],
});

// 3. Activate event
const activateEventTx = new Transaction();
activateEventTx.moveCall({
    target: `${PACKAGE_ID}::event_management::activate_event`,
    arguments: [
        activateEventTx.object(eventId),
        activateEventTx.object(CLOCK_ID),
        activateEventTx.object(REGISTRY_ID),
    ],
});
```

### Checking User Profile
```typescript
// Check if user has profile
async function checkUserProfile(userAddress: string) {
    const tx = new Transaction();
    const hasProfile = tx.moveCall({
        target: `${PACKAGE_ID}::event_management::has_profile`,
        arguments: [
            tx.object(PROFILE_REGISTRY_ID),
            tx.pure.address(userAddress),
        ],
    });
    
    // Execute read-only transaction
    const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: userAddress,
    });
    
    return result.results?.[0]?.returnValues?.[0]?.[0] === 1; // true if has profile
}
```

### Querying Event Data
```typescript
// Get event details
const eventObject = await suiClient.getObject({
    id: eventId,
    options: {
        showContent: true,
    },
});

// Check if event is free
function isEventFree(eventData: any): boolean {
    return eventData.content.fields.fee_amount === "0";
}

// Get organizer's events
const organizerEvents = await suiClient.getDynamicFields({
    parentId: REGISTRY_ID,
    cursor: null,
    limit: 50,
});

// Listen for event creation
suiClient.subscribeEvent({
    filter: {
        MoveEventType: `${PACKAGE_ID}::event_management::EventCreated`,
    },
    onMessage: (event) => {
        console.log('New event created:', event.parsedJson);
    },
});
```

### Error Handling
```typescript
try {
    const result = await suiClient.executeTransactionBlock({
        transactionBlock: tx,
        signer: keypair,
        options: {
            showEffects: true,
            showEvents: true,
        },
    });
    
    if (result.effects?.status?.status === 'failure') {
        // Handle specific error codes
        const errorCode = result.effects.status.error;
        switch (errorCode) {
            case 'ENotOrganizer':
                throw new Error('You are not the organizer of this event');
            case 'EEventNotActive':
                throw new Error('Event is not in the correct state');
            case 'EInvalidCapacity':
                throw new Error('Invalid capacity value');
            case 'ENotAuthorized':
                throw new Error('You are not authorized for this operation');
            // ... handle other errors
        }
    }
} catch (error) {
    console.error('Transaction failed:', error);
}
```

## React Component Examples

### Profile Management Component
```typescript
function ProfileManager({ userAddress }: { userAddress: string }) {
    const [hasProfile, setHasProfile] = useState(false);
    const [profile, setProfile] = useState(null);
    
    useEffect(() => {
        checkUserProfile(userAddress).then(setHasProfile);
    }, [userAddress]);
    
    const createProfile = async (profileData: ProfileData) => {
        const tx = new Transaction();
        const [profileCap] = tx.moveCall({
            target: `${PACKAGE_ID}::event_management::create_profile`,
            arguments: [
                tx.pure.string(profileData.name),
                tx.pure.string(profileData.bio),
                tx.pure.string(profileData.photoUrl),
                tx.pure.string(profileData.telegram),
                tx.pure.string(profileData.x),
                tx.object(CLOCK_ID),
                tx.object(PROFILE_REGISTRY_ID),
            ],
        });
        
        // Execute transaction and handle result
        const result = await executeTransaction(tx);
        setHasProfile(true);
        return result;
    };
    
    return (
        <div>
            {hasProfile ? (
                <ProfileDisplay profile={profile} />
            ) : (
                <CreateProfileForm onSubmit={createProfile} />
            )}
        </div>
    );
}
```

### Event Fee Display
```typescript
function EventFeeDisplay({ event }: { event: EventData }) {
    const feeAmount = event.fee_amount;
    const isFree = feeAmount === "0";
    
    return (
        <div className="event-fee">
            {isFree ? (
                <span className="free-badge">FREE</span>
            ) : (
                <span className="fee-amount">
                    {(parseInt(feeAmount) / 1_000_000_000).toFixed(3)} SUI
                </span>
            )}
        </div>
    );
}
```

## Important Notes

1. **Time Handling**: All timestamps are in milliseconds (Unix timestamp * 1000)
2. **Ratings**: Ratings are stored as integers multiplied by 100 (e.g., 4.5 stars = 450)
3. **Percentages**: Completion rates are stored as percentages * 100 (e.g., 80% = 8000)
4. **Fee Handling**: Fee amounts are in MIST (1 SUI = 1,000,000,000 MIST)
5. **Object References**: Most functions require object references to shared objects (Event, Registry, Profile)
6. **Capability Management**: Profile and organizer capabilities must be properly managed and stored by the frontend
7. **Event Lifecycle**: Events must follow the state progression: Created → Active → Completed → Settled
8. **Profile Requirements**: Users must have profiles before they can participate in events

## Integration with Other Contracts

This contract is designed to work with:
- **Attendance Contract**: For check-in/check-out functionality
- **Escrow Contract**: For sponsor fund management and fee collection
- **Rating Contract**: For post-event ratings
- **NFT Contract**: For proof-of-attendance tokens

The contract provides hooks and update functions that other contracts can call to maintain data consistency across the protocol.

