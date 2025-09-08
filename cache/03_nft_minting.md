# NFT Minting Module - Caching Specifications

## Module: `ariya::nft_minting`

## NFT Ownership & Metadata

### User NFT Collection
- **Functions**: `get_user_nfts()`, ownership checks
- **TTL**: 30 minutes
- **Cache Key**: `nft:user:{address}:owned`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "poa_tokens": ["nft_id_1", "nft_id_2"],
    "completion_tokens": ["nft_id_3"],
    "total_poa": 2,
    "total_completions": 1,
    "total_nfts": 3,
    "last_updated": 1234567890
  }
  ```

### Event NFT Collection
- **Functions**: Event-specific NFT queries
- **TTL**: 20 minutes
- **Cache Key**: `nft:event:{event_id}:collection`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "poa_minted": {
      "0x...": "nft_id_1",
      "0x...": "nft_id_2"
    },
    "completion_minted": {
      "0x...": "nft_id_3"
    },
    "total_poa": 2,
    "total_completions": 1,
    "total_nfts": 3,
    "last_updated": 1234567890
  }
  ```

### NFT Metadata
- **Functions**: `get_event_metadata_uri()`
- **TTL**: 1 hour
- **Cache Key**: `nft:event:{event_id}:metadata`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "event_name": "Event Name",
    "image_url": "https://...",
    "location": "Event Location",
    "organizer": "0x...",
    "description": "NFT Description",
    "attributes": [
      {
        "trait_type": "Event Type",
        "value": "Conference"
      }
    ],
    "last_updated": 1234567890
  }
  ```

### Individual NFT Details
- **Functions**: NFT-specific queries
- **TTL**: 15 minutes
- **Cache Key**: `nft:{nft_id}:details`
- **Data Structure**:
  ```json
  {
    "nft_id": "nft_id",
    "event_id": "event_id",
    "event_name": "Event Name",
    "attendee": "0x...",
    "check_in_time": 1234567890,
    "check_out_time": 1234567890,
    "attendance_duration": 7200,
    "nft_type": "poa",
    "metadata": {
      "description": "Proof of Attendance",
      "image_url": "https://...",
      "location": "Event Location",
      "organizer": "0x...",
      "attributes": []
    },
    "last_updated": 1234567890
  }
  ```

## Minting Capabilities & Status

### PoA Minting Capability
- **Functions**: `MintPoACapability`
- **TTL**: 15 minutes
- **Cache Key**: `nft:minting:poa_capability:{event_id}:{address}`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "user_address": "0x...",
    "has_capability": true,
    "capability_id": "capability_id",
    "check_in_time": 1234567890,
    "can_mint": true,
    "last_updated": 1234567890
  }
  ```

### Completion Minting Capability
- **Functions**: `MintCompletionCapability`
- **TTL**: 15 minutes
- **Cache Key**: `nft:minting:completion_capability:{event_id}:{address}`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "user_address": "0x...",
    "has_capability": true,
    "capability_id": "capability_id",
    "check_in_time": 1234567890,
    "check_out_time": 1234567890,
    "attendance_duration": 7200,
    "can_mint": true,
    "last_updated": 1234567890
  }
  ```

### Minting Eligibility Status
- **Functions**: Eligibility checks
- **TTL**: 10 minutes
- **Cache Key**: `nft:minting:eligibility:{event_id}:{address}`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "user_address": "0x...",
    "can_mint_poa": true,
    "can_mint_completion": false,
    "poa_requirements_met": true,
    "completion_requirements_met": false,
    "reason": "Must check out to mint completion",
    "last_updated": 1234567890
  }
  ```

## NFT Registry Data

### NFT Registry Statistics
- **Functions**: Registry stats queries
- **TTL**: 30 minutes
- **Cache Key**: `nft:registry:statistics`
- **Data Structure**:
  ```json
  {
    "total_poa_minted": 1000,
    "total_completion_minted": 500,
    "total_nfts": 1500,
    "unique_holders": 800,
    "total_events_with_nfts": 50,
    "last_updated": 1234567890
  }
  ```

### Event NFT Statistics
- **Functions**: Event-specific NFT stats
- **TTL**: 15 minutes
- **Cache Key**: `nft:event:{event_id}:statistics`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "poa_minted_count": 50,
    "completion_minted_count": 25,
    "total_nfts": 75,
    "unique_holders": 60,
    "minting_completion_rate": 50.0,
    "last_updated": 1234567890
  }
  ```

### User NFT Statistics
- **Functions**: User-specific NFT stats
- **TTL**: 20 minutes
- **Cache Key**: `nft:user:{address}:statistics`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "total_poa": 5,
    "total_completions": 3,
    "total_nfts": 8,
    "events_attended": 5,
    "events_completed": 3,
    "completion_rate": 60.0,
    "last_updated": 1234567890
  }
  ```

## Minting History & Tracking

### User Minting History
- **Functions**: Minting history queries
- **TTL**: 15 minutes
- **Cache Key**: `nft:user:{address}:minting_history`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "minting_history": [
      {
        "nft_id": "nft_id",
        "event_id": "event_id",
        "event_name": "Event Name",
        "nft_type": "poa",
        "minted_at": 1234567890,
        "transaction_id": "tx_id"
      }
    ],
    "total_mints": 8,
    "last_mint": 1234567890,
    "last_updated": 1234567890
  }
  ```

### Event Minting History
- **Functions**: Event minting tracking
- **TTL**: 10 minutes
- **Cache Key**: `nft:event:{event_id}:minting_history`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "minting_history": [
      {
        "nft_id": "nft_id",
        "user_address": "0x...",
        "nft_type": "poa",
        "minted_at": 1234567890,
        "transaction_id": "tx_id"
      }
    ],
    "total_mints": 75,
    "poa_mints": 50,
    "completion_mints": 25,
    "last_mint": 1234567890,
    "last_updated": 1234567890
  }
  ```

## NFT Display & Metadata

### NFT Display Configuration
- **Functions**: Display settings
- **TTL**: 2 hours
- **Cache Key**: `nft:display:config`
- **Data Structure**:
  ```json
  {
    "display_name": "Ariya Protocol NFTs",
    "description": "Event attendance and completion NFTs",
    "external_url": "https://ariya.protocol",
    "seller_fee_basis_points": 0,
    "fee_recipient": "0x...",
    "last_updated": 1234567890
  }
  ```

### NFT Attribute Templates
- **Functions**: Attribute definitions
- **TTL**: 4 hours
- **Cache Key**: `nft:attributes:templates`
- **Data Structure**:
  ```json
  {
    "templates": {
      "poa": [
        {
          "trait_type": "Event Type",
          "value_type": "string"
        },
        {
          "trait_type": "Attendance Date",
          "value_type": "date"
        }
      ],
      "completion": [
        {
          "trait_type": "Duration",
          "value_type": "duration"
        }
      ]
    },
    "last_updated": 1234567890
  }
  ```

## Cache Invalidation Triggers

### NFT Minting
- New NFT minted → Invalidate: `nft:user:{address}:owned`, `nft:event:{event_id}:collection`, `nft:registry:statistics`
- NFT transferred → Invalidate: `nft:user:{old_address}:owned`, `nft:user:{new_address}:owned`

### Capability Changes
- Capability created → Invalidate: `nft:minting:eligibility:{event_id}:{address}`
- Capability used → Invalidate: `nft:minting:poa_capability:{event_id}:{address}`, `nft:minting:completion_capability:{event_id}:{address}`

### Metadata Updates
- Event metadata changed → Invalidate: `nft:event:{event_id}:metadata`, `nft:event:{event_id}:collection`
- Display config updated → Invalidate: `nft:display:config`

### Statistics Updates
- New mint → Invalidate: `nft:event:{event_id}:statistics`, `nft:user:{address}:statistics`
- Registry changes → Invalidate: `nft:registry:statistics`

## Performance Metrics to Track

- Cache hit rate for NFT ownership queries
- Cache hit rate for minting capabilities
- Average response time for NFT metadata
- Memory usage for NFT-related caches
- Invalidation frequency by trigger type
- NFT collection query performance 