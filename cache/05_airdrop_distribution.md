# Airdrop Distribution Module - Caching Specifications

## Module: `ariya::airdrop_distribution`

## Airdrop Eligibility & Status

### User Eligibility Status
- **Functions**: Eligibility checks
- **TTL**: 5 minutes
- **Cache Key**: `airdrop:{airdrop_id}:eligibility:{address}`
- **Data Structure**:
  ```json
  {
    "airdrop_id": "airdrop_id",
    "user_address": "0x...",
    "is_eligible": true,
    "eligibility_reasons": ["attendance", "completion", "rating"],
    "requirements_met": {
      "require_attendance": true,
      "require_completion": true,
      "require_rating_submitted": true,
      "min_duration": 3600
    },
    "last_updated": 1234567890
  }
  ```

### Airdrop Pool Status
- **Functions**: Pool balance queries
- **TTL**: 1 minute
- **Cache Key**: `airdrop:{airdrop_id}:pool_balance`
- **Data Structure**:
  ```json
  {
    "airdrop_id": "airdrop_id",
    "total_pool": 1000000000,
    "remaining_balance": 750000000,
    "distributed_amount": 250000000,
    "total_recipients": 50,
    "claimed_count": 25,
    "unclaimed_count": 25,
    "last_updated": 1234567890
  }
  ```

### Airdrop Configuration
- **Functions**: Airdrop settings queries
- **TTL**: 1 hour
- **Cache Key**: `airdrop:{airdrop_id}:config`
- **Data Structure**:
  ```json
  {
    "airdrop_id": "airdrop_id",
    "event_id": "event_id",
    "organizer": "0x...",
    "name": "Airdrop Name",
    "description": "Airdrop Description",
    "distribution_type": 1,
    "distribution_name": "WEIGHTED_BY_DURATION",
    "per_user_amount": 0,
    "total_recipients": 100,
    "created_at": 1234567890,
    "expires_at": 1234567890,
    "active": true,
    "last_updated": 1234567890
  }
  ```

## Claim Status & History

### User Claim Status
- **Functions**: Claim tracking
- **TTL**: 2 minutes
- **Cache Key**: `airdrop:user:{address}:claims`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "claims": [
      {
        "airdrop_id": "airdrop_id",
        "event_id": "event_id",
        "amount": 5000000,
        "claimed_at": 1234567890,
        "transaction_id": "tx_id",
        "status": "claimed"
      }
    ],
    "total_claimed": 5000000,
    "total_airdrops": 1,
    "last_claim": 1234567890,
    "last_updated": 1234567890
  }
  ```

### Event Airdrop Claims
- **Functions**: Event-specific claim tracking
- **TTL**: 5 minutes
- **Cache Key**: `airdrop:event:{event_id}:claims`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "airdrops": [
      {
        "airdrop_id": "airdrop_id",
        "name": "Airdrop Name",
        "total_amount": 1000000000,
        "claimed_amount": 250000000,
        "recipients": 50,
        "claimed_count": 25,
        "status": "active"
      }
    ],
    "total_airdrops": 1,
    "total_distributed": 1000000000,
    "total_claimed": 250000000,
    "last_updated": 1234567890
  }
  ```

### Airdrop Distribution Details
- **Functions**: Distribution calculation queries
- **TTL**: 10 minutes
- **Cache Key**: `airdrop:{airdrop_id}:distribution`
- **Data Structure**:
  ```json
  {
    "airdrop_id": "airdrop_id",
    "distribution_type": 1,
    "distribution_calculation": {
      "total_eligible_users": 100,
      "attendance_weight": 0.4,
      "completion_weight": 0.4,
      "rating_weight": 0.2,
      "base_amount": 10000000
    },
    "user_distributions": {
      "0x...": {
        "attendance_score": 100,
        "completion_score": 80,
        "rating_score": 90,
        "total_score": 88,
        "calculated_amount": 8800000
      }
    },
    "last_updated": 1234567890
  }
  ```

## Eligibility Criteria & Calculations

### Eligibility Requirements
- **Functions**: Requirement checks
- **TTL**: 30 minutes
- **Cache Key**: `airdrop:{airdrop_id}:requirements`
- **Data Structure**:
  ```json
  {
    "airdrop_id": "airdrop_id",
    "eligibility_criteria": {
      "require_attendance": true,
      "require_completion": true,
      "min_duration": 3600,
      "require_rating_submitted": true,
      "min_rating": 400
    },
    "scoring_weights": {
      "attendance": 0.4,
      "completion": 0.4,
      "rating": 0.2
    },
    "last_updated": 1234567890
  }
  ```

### User Eligibility Scores
- **Functions**: Score calculations
- **TTL**: 5 minutes
- **Cache Key**: `airdrop:{airdrop_id}:user_scores:{address}`
- **Data Structure**:
  ```json
  {
    "airdrop_id": "airdrop_id",
    "user_address": "0x...",
    "eligibility_scores": {
      "attendance_score": 100,
      "completion_score": 80,
      "rating_score": 90,
      "duration_score": 95
    },
    "total_score": 88,
    "rank": 15,
    "is_eligible": true,
    "last_updated": 1234567890
  }
  ```

## Distribution Types & Calculations

### Equal Distribution Data
- **Functions**: Equal distribution queries
- **TTL**: 15 minutes
- **Cache Key**: `airdrop:{airdrop_id}:equal_distribution`
- **Data Structure**:
  ```json
  {
    "airdrop_id": "airdrop_id",
    "distribution_type": 0,
    "per_user_amount": 10000000,
    "total_eligible_users": 100,
    "total_distribution": 1000000000,
    "user_amounts": {
      "0x...": 10000000,
      "0x...": 10000000
    },
    "last_updated": 1234567890
  }
  ```

### Weighted Distribution Data
- **Functions**: Weighted distribution queries
- **TTL**: 15 minutes
- **Cache Key**: `airdrop:{airdrop_id}:weighted_distribution`
- **Data Structure**:
  ```json
  {
    "airdrop_id": "airdrop_id",
    "distribution_type": 1,
    "weighting_factors": {
      "attendance_duration": 0.6,
      "completion_bonus": 0.3,
      "rating_bonus": 0.1
    },
    "user_weighted_amounts": {
      "0x...": {
        "base_amount": 10000000,
        "attendance_bonus": 6000000,
        "completion_bonus": 3000000,
        "rating_bonus": 1000000,
        "total_amount": 20000000
      }
    },
    "last_updated": 1234567890
  }
  ```

### Completion Bonus Distribution
- **Functions**: Completion bonus queries
- **TTL**: 15 minutes
- **Cache Key**: `airdrop:{airdrop_id}:completion_bonus`
- **Data Structure**:
  ```json
  {
    "airdrop_id": "airdrop_id",
    "distribution_type": 2,
    "completion_bonus": {
      "base_amount": 10000000,
      "completion_multiplier": 2.0,
      "min_duration_required": 3600
    },
    "user_completion_bonuses": {
      "0x...": {
        "attended": true,
        "completed": true,
        "duration": 7200,
        "bonus_multiplier": 2.0,
        "final_amount": 20000000
      }
    },
    "last_updated": 1234567890
  }
  ```

## Airdrop Analytics

### Airdrop Performance Metrics
- **Functions**: Performance tracking
- **TTL**: 10 minutes
- **Cache Key**: `airdrop:{airdrop_id}:performance`
- **Data Structure**:
  ```json
  {
    "airdrop_id": "airdrop_id",
    "performance_metrics": {
      "total_eligible": 100,
      "total_claimed": 75,
      "claim_rate": 75.0,
      "total_distributed": 750000000,
      "average_claim_amount": 10000000,
      "largest_claim": 20000000,
      "smallest_claim": 5000000
    },
    "time_metrics": {
      "first_claim": 1234567890,
      "last_claim": 1234567890,
      "average_claim_time": 3600,
      "peak_claim_hour": 14
    },
    "last_updated": 1234567890
  }
  ```

### Platform Airdrop Statistics
- **Functions**: Platform-wide stats
- **TTL**: 30 minutes
- **Cache Key**: `airdrop:platform:statistics`
- **Data Structure**:
  ```json
  {
    "platform_stats": {
      "total_airdrops": 50,
      "total_distributed": 50000000000,
      "total_recipients": 5000,
      "active_airdrops": 10,
      "completed_airdrops": 40
    },
    "distribution_types": {
      "equal": 20,
      "weighted": 25,
      "completion_bonus": 5
    },
    "last_updated": 1234567890
  }
  ```

## Cache Invalidation Triggers

### Airdrop Status Changes
- Airdrop created → Invalidate: `airdrop:platform:statistics`
- Airdrop activated/deactivated → Invalidate: `airdrop:{airdrop_id}:config`
- Airdrop expired → Invalidate: `airdrop:{airdrop_id}:config`, `airdrop:{airdrop_id}:pool_balance`

### Claim Changes
- New claim → Invalidate: `airdrop:{airdrop_id}:pool_balance`, `airdrop:user:{address}:claims`, `airdrop:event:{event_id}:claims`
- Claim processed → Invalidate: `airdrop:{airdrop_id}:performance`

### Eligibility Updates
- User eligibility changed → Invalidate: `airdrop:{airdrop_id}:eligibility:{address}`, `airdrop:{airdrop_id}:user_scores:{address}`
- Requirements updated → Invalidate: `airdrop:{airdrop_id}:requirements`

### Distribution Updates
- Distribution calculation changed → Invalidate: `airdrop:{airdrop_id}:distribution`, `airdrop:{airdrop_id}:equal_distribution`, `airdrop:{airdrop_id}:weighted_distribution`
- Pool balance changed → Invalidate: `airdrop:{airdrop_id}:pool_balance`

## Performance Metrics to Track

- Cache hit rate for eligibility checks
- Cache hit rate for claim status
- Average response time for airdrop queries
- Memory usage for airdrop-related caches
- Invalidation frequency by trigger type
- Distribution calculation performance
- Pool balance query efficiency 