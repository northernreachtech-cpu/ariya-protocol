# Escrow Settlement Module - Caching Specifications

## Module: `ariya::escrow_settlement`

## Escrow Status & Balances

### Escrow Balance
- **Functions**: `get_escrow_balance()`
- **TTL**: 2 minutes
- **Cache Key**: `escrow:event:{event_id}:balance`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "escrow_details": {
      "organizer": "0x...",
      "sponsor": "0x...",
      "balance": 5000000000,
      "balance_formatted": "5.0 SUI",
      "created_at": 1234567890,
      "settled": false
    },
    "balance_history": [
      {
        "timestamp": 1234567890,
        "balance": 5000000000,
        "change": 0,
        "reason": "Initial deposit"
      }
    ],
    "last_updated": 1234567890
  }
  ```

### Escrow Settlement Status
- **Functions**: Settlement result checks
- **TTL**: 5 minutes
- **Cache Key**: `escrow:event:{event_id}:settlement`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "settlement_status": {
      "settled": false,
      "settlement_time": 0,
      "settlement_result": null,
      "settlement_pending": true
    },
    "settlement_conditions": {
      "conditions_met": false,
      "settlement_ready": false,
      "grace_period_expired": false
    },
    "last_updated": 1234567890
  }
  ```

## Settlement Conditions & Requirements

### Sponsor Performance Conditions
- **Functions**: `get_sponsor_conditions()`
- **TTL**: 10 minutes
- **Cache Key**: `escrow:event:{event_id}:conditions`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "sponsor_conditions": {
      "min_attendees": 50,
      "min_completion_rate": 8000,
      "min_avg_rating": 450,
      "custom_benchmarks_count": 2,
      "conditions_summary": {
        "attendees_required": 50,
        "completion_rate_required": 80.0,
        "rating_required": 4.5
      }
    },
    "condition_weights": {
      "attendees": 0.4,
      "completion": 0.4,
      "rating": 0.2
    },
    "last_updated": 1234567890
  }
  ```

### Custom Benchmark Requirements
- **Functions**: Custom metric tracking
- **TTL**: 10 minutes
- **Cache Key**: `escrow:event:{event_id}:custom_benchmarks`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "custom_benchmarks": [
      {
        "metric_name": "social_media_engagement",
        "target_value": 1000,
        "comparison_type": 0,
        "comparison_operator": ">=",
        "current_value": 0,
        "is_met": false
      }
    ],
    "benchmark_summary": {
      "total_benchmarks": 2,
      "met_benchmarks": 0,
      "benchmark_completion_rate": 0.0
    },
    "last_updated": 1234567890
  }
  ```

## Performance Metrics & Tracking

### Event Performance Metrics
- **Functions**: Performance tracking
- **TTL**: 2 minutes
- **Cache Key**: `escrow:event:{event_id}:metrics`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "performance_metrics": {
      "attendees_actual": 45,
      "attendees_required": 50,
      "attendees_percentage": 90.0,
      "completion_rate_actual": 7500,
      "completion_rate_required": 8000,
      "completion_percentage": 93.75,
      "avg_rating_actual": 460,
      "avg_rating_required": 450,
      "rating_percentage": 102.22
    },
    "overall_performance": {
      "total_score": 85.0,
      "conditions_met": false,
      "performance_gap": 15.0
    },
    "last_updated": 1234567890
  }
  ```

### Custom Metrics Tracking
- **Functions**: Custom metric calculations
- **TTL**: 5 minutes
- **Cache Key**: `escrow:event:{event_id}:custom_metrics`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "custom_metrics": {
      "social_media_engagement": {
        "target": 1000,
        "actual": 850,
        "percentage": 85.0,
        "is_met": false,
        "gap": 150
      },
      "email_open_rate": {
        "target": 25,
        "actual": 30,
        "percentage": 120.0,
        "is_met": true,
        "gap": -5
      }
    },
    "metrics_summary": {
      "total_metrics": 2,
      "met_metrics": 1,
      "overall_metrics_score": 102.5
    },
    "last_updated": 1234567890
  }
  ```

## Settlement Results & Outcomes

### Settlement Result Details
- **Functions**: Settlement result queries
- **TTL**: 5 minutes
- **Cache Key**: `escrow:event:{event_id}:settlement_result`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "settlement_result": {
      "conditions_met": false,
      "settlement_summary": {
        "attendees_actual": 45,
        "attendees_required": 50,
        "completion_rate_actual": 7500,
        "completion_rate_required": 8000,
        "avg_rating_actual": 460,
        "avg_rating_required": 450
      },
      "funds_status": {
        "amount_released": 0,
        "amount_refunded": 0,
        "amount_held": 5000000000
      },
      "settlement_reason": "Conditions not met",
      "settlement_timestamp": 0
    },
    "last_updated": 1234567890
  }
  ```

### Fund Release/Refund Status
- **Functions**: Fund status tracking
- **TTL**: 1 minute
- **Cache Key**: `escrow:event:{event_id}:fund_status`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "fund_status": {
      "total_escrowed": 5000000000,
      "amount_released": 0,
      "amount_refunded": 0,
      "amount_held": 5000000000,
      "release_status": "pending",
      "refund_status": "pending"
    },
    "fund_movements": [
      {
        "timestamp": 1234567890,
        "type": "escrow",
        "amount": 5000000000,
        "balance_after": 5000000000
      }
    ],
    "last_updated": 1234567890
  }
  ```

## Escrow Registry & Analytics

### Platform Escrow Statistics
- **Functions**: Registry stats queries
- **TTL**: 30 minutes
- **Cache Key**: `escrow:platform:statistics`
- **Data Structure**:
  ```json
  {
    "platform_escrow_stats": {
      "total_escrowed": 100000000000,
      "total_released": 60000000000,
      "total_refunded": 20000000000,
      "currently_escrowed": 20000000000,
      "total_escrows": 100,
      "active_escrows": 20,
      "settled_escrows": 80
    },
    "settlement_metrics": {
      "successful_settlements": 60,
      "failed_settlements": 20,
      "success_rate": 75.0,
      "average_settlement_time": 86400
    },
    "last_updated": 1234567890
  }
  ```

### Organizer Escrow History
- **Functions**: Organizer-specific escrow data
- **TTL**: 15 minutes
- **Cache Key**: `escrow:organizer:{address}:history`
- **Data Structure**:
  ```json
  {
    "organizer_address": "0x...",
    "escrow_history": [
      {
        "event_id": "event_id",
        "escrow_amount": 5000000000,
        "settlement_result": "pending",
        "created_at": 1234567890,
        "settled_at": 0
      }
    ],
    "escrow_summary": {
      "total_escrowed": 15000000000,
      "total_released": 10000000000,
      "total_refunded": 2000000000,
      "currently_escrowed": 3000000000,
      "success_rate": 80.0
    },
    "last_updated": 1234567890
  }
  ```

## Settlement Timeline & Deadlines

### Settlement Timeline
- **Functions**: Timeline tracking
- **TTL**: 5 minutes
- **Cache Key**: `escrow:event:{event_id}:timeline`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "settlement_timeline": {
      "event_end_time": 1234567890,
      "grace_period_end": 1234567890,
      "settlement_deadline": 1234567890,
      "current_time": 1234567890,
      "time_remaining": 86400,
      "grace_period_expired": false
    },
    "settlement_stages": [
      {
        "stage": "event_completed",
        "timestamp": 1234567890,
        "status": "completed"
      },
      {
        "stage": "grace_period",
        "timestamp": 1234567890,
        "status": "active"
      }
    ],
    "last_updated": 1234567890
  }
  ```

## Cache Invalidation Triggers

### Escrow Changes
- New escrow created → Invalidate: `escrow:platform:statistics`, `escrow:organizer:{address}:history`
- Escrow balance changed → Invalidate: `escrow:event:{event_id}:balance`, `escrow:event:{event_id}:fund_status`

### Settlement Updates
- Settlement completed → Invalidate: `escrow:event:{event_id}:settlement`, `escrow:event:{event_id}:settlement_result`, `escrow:platform:statistics`
- Settlement result changed → Invalidate: `escrow:event:{event_id}:settlement_result`, `escrow:event:{event_id}:fund_status`

### Performance Changes
- Metrics updated → Invalidate: `escrow:event:{event_id}:metrics`, `escrow:event:{event_id}:custom_metrics`
- Conditions changed → Invalidate: `escrow:event:{event_id}:conditions`, `escrow:event:{event_id}:custom_benchmarks`

### Timeline Updates
- Timeline progressed → Invalidate: `escrow:event:{event_id}:timeline`
- Grace period expired → Invalidate: `escrow:event:{event_id}:timeline`, `escrow:event:{event_id}:settlement`

## Performance Metrics to Track

- Cache hit rate for escrow balances
- Cache hit rate for settlement status
- Average response time for escrow queries
- Memory usage for escrow-related caches
- Invalidation frequency by trigger type
- Settlement calculation performance
- Fund status query efficiency 