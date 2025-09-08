# Ariya Protocol - Specific Caching Guide

## Event Management Module

### Event Details
- **Function**: `get_event_by_id()`, `get_event_info_fields()`
- **TTL**: 15 minutes
- **Cache Key**: `event:{event_id}:info`
- **Data**: Event name, description, location, timing, capacity, fee

### Event State
- **Function**: `get_event_state()`, `is_event_active()`, `is_event_completed()`
- **TTL**: 2 minutes
- **Cache Key**: `event:{event_id}:state`
- **Data**: Current state (created/active/completed/settled)

### Event Registry Queries
- **Function**: `get_organizer_event_ids()`, `get_events_assigned_to_user()`, `get_child_events()`
- **TTL**: 10 minutes
- **Cache Key**: `registry:events_by_organizer:{address}`, `registry:events_by_assignee:{assignee}`, `registry:events_by_parent:{parent_id}`
- **Data**: List of event IDs

### Event Discovery
- **Function**: Custom queries by location, date, capacity
- **TTL**: 20 minutes
- **Cache Key**: `discovery:events:{query_hash}`
- **Data**: Filtered event results

## Identity & Access Module

### User Registration Status
- **Function**: Registration checks, pass validation
- **TTL**: 5 minutes
- **Cache Key**: `registration:event:{event_id}:user:{address}`
- **Data**: Registration status, pass hash, check-in status

### Event Registration Count
- **Function**: `get_current_attendees()`
- **TTL**: 1 minute
- **Cache Key**: `registration:event:{event_id}:count`
- **Data**: Current attendee count

### Subscription Status
- **Function**: `get_subscription_type()`, `get_subscription_status()`
- **TTL**: 10 minutes
- **Cache Key**: `subscription:user:{address}:status`
- **Data**: Subscription type, expiry, active status

### Platform Fee Calculations
- **Function**: Fee calculations based on subscription type
- **TTL**: 1 hour
- **Cache Key**: `subscription:platform_fee:{subscription_type}`
- **Data**: Fee percentages (5% free, 3% basic, 0% pro)

## NFT Module

### NFT Ownership
- **Function**: `get_user_nfts()`, ownership checks
- **TTL**: 30 minutes
- **Cache Key**: `nft:user:{address}:owned`
- **Data**: List of owned NFT IDs

### Event NFT Metadata
- **Function**: `get_event_metadata_uri()`
- **TTL**: 1 hour
- **Cache Key**: `nft:event:{event_id}:metadata`
- **Data**: NFT metadata, image URLs, descriptions

### Minting Capabilities
- **Function**: `MintPoACapability`, `MintCompletionCapability`
- **TTL**: 15 minutes
- **Cache Key**: `nft:minting:capability:{event_id}:{address}`
- **Data**: Minting permission status

## Attendance Module

### Check-in Status
- **Function**: `check_in()`, `check_out()`
- **TTL**: 30 seconds
- **Cache Key**: `attendance:event:{event_id}:user:{address}`
- **Data**: Check-in/out status, timestamps, device fingerprint

### Event Attendance Count
- **Function**: Real-time attendance tracking
- **TTL**: 10 seconds
- **Cache Key**: `attendance:event:{event_id}:checkin_count`
- **Data**: Current check-in count

### User Attendance History
- **Function**: `get_user_attendances()`
- **TTL**: 5 minutes
- **Cache Key**: `attendance:user:{address}:events`
- **Data**: List of attended events

## Document Flow Module

### Document Status
- **Function**: Document state checks
- **TTL**: 5 minutes
- **Cache Key**: `document:submission:{submission_id}:status`
- **Data**: Current state (pending/approved/rejected/funded)

### Approval Chain
- **Function**: Chain of command hierarchy
- **TTL**: 15 minutes
- **Cache Key**: `document:approval:chain:{flow_id}`
- **Data**: Reviewer hierarchy, current level

### User Submissions
- **Function**: `get_submissions_by_user()`
- **TTL**: 10 minutes
- **Cache Key**: `document:user:{address}:submissions`
- **Data**: List of user's document submissions

## Rating & Reputation Module

### Event Average Rating
- **Function**: `get_event_ratings()`
- **TTL**: 10 minutes
- **Cache Key**: `rating:event:{event_id}:average`
- **Data**: Average rating, total ratings count

### Organizer Reputation
- **Function**: `get_organizer_stats()`, `get_organizer_profile()`
- **TTL**: 20 minutes
- **Cache Key**: `rating:organizer:{address}:reputation`
- **Data**: Total events, success rate, average rating

### User Rating History
- **Function**: `get_user_ratings()`
- **TTL**: 15 minutes
- **Cache Key**: `rating:user:{address}:history`
- **Data**: User's rating history

## Escrow Module

### Escrow Balance
- **Function**: `get_escrow_balance()`
- **TTL**: 2 minutes
- **Cache Key**: `escrow:event:{event_id}:balance`
- **Data**: Current escrow balance

### Settlement Conditions
- **Function**: `get_sponsor_conditions()`
- **TTL**: 10 minutes
- **Cache Key**: `escrow:event:{event_id}:conditions`
- **Data**: Min attendees, completion rate, rating requirements

### Settlement Status
- **Function**: Settlement result checks
- **TTL**: 5 minutes
- **Cache Key**: `escrow:event:{event_id}:settlement`
- **Data**: Settlement result, conditions met status

## Community Access Module

### Community Membership
- **Function**: `get_community_members()`
- **TTL**: 10 minutes
- **Cache Key**: `community:event:{event_id}:members`
- **Data**: Member list, access levels

### User Access Rights
- **Function**: Access permission checks
- **TTL**: 5 minutes
- **Cache Key**: `community:access:verification:{community_id}:{address}`
- **Data**: Access permissions, expiry dates

### Community Features
- **Function**: Feature availability checks
- **TTL**: 30 minutes
- **Cache Key**: `community:features:{community_id}`
- **Data**: Forum, resources, calendar, governance status

## Platform Treasury Module

### Treasury Balance
- **Function**: `get_treasury_balance()`
- **TTL**: 30 minutes
- **Cache Key**: `treasury:balance`
- **Data**: Current treasury balance

### Fee Totals
- **Function**: `get_fee_totals()`
- **TTL**: 1 hour
- **Cache Key**: `treasury:fees:platform`, `treasury:fees:subscription`
- **Data**: Platform fees, subscription revenue

## Airdrop Module

### User Eligibility
- **Function**: Eligibility checks
- **TTL**: 5 minutes
- **Cache Key**: `airdrop:{airdrop_id}:eligibility:{address}`
- **Data**: Eligibility status, requirements met

### Claim Status
- **Function**: Claim tracking
- **TTL**: 2 minutes
- **Cache Key**: `airdrop:user:{address}:claims`
- **Data**: Claimed amounts, timestamps

### Pool Balance
- **Function**: Airdrop pool status
- **TTL**: 1 minute
- **Cache Key**: `airdrop:{airdrop_id}:pool_balance`
- **Data**: Remaining pool balance

## Cache Key Patterns

### Standard Format
```
{module}:{entity_type}:{entity_id}:{data_type}:{identifier}
```

### Examples
- `event:123:state` - Event 123's current state
- `registration:123:user:0xabc:status` - User 0xabc's registration status for event 123
- `nft:user:0xabc:owned` - User 0xabc's owned NFTs
- `attendance:123:checkin_count` - Event 123's current check-in count

## TTL Guidelines

### Ultra-Fast (30 seconds - 2 minutes)
- Real-time attendance counts
- Check-in/out status
- Escrow balances
- Airdrop pool balances

### Fast (2-10 minutes)
- Event states
- Registration counts
- Document status
- Settlement results

### Medium (10-30 minutes)
- Event details
- User profiles
- NFT ownership
- Community memberships

### Slow (30 minutes - 2 hours)
- Historical data
- Analytics
- Treasury balances
- Fee totals

## Implementation Priority

### Phase 1 (Immediate Impact)
1. Event state and details
2. User registration status
3. Attendance counts
4. Subscription status

### Phase 2 (High Impact)
1. NFT ownership
2. Document flow status
3. Rating averages
4. Community access

### Phase 3 (Optimization)
1. Analytics and statistics
2. Historical data
3. Complex queries
4. Advanced features 