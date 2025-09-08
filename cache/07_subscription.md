# Subscription Module - Caching Specifications

## Module: `ariya::subscription`

## Subscription Status & Details

### User Subscription Status
- **Functions**: `get_subscription_type()`, `get_subscription_status()`
- **TTL**: 10 minutes
- **Cache Key**: `subscription:user:{address}:status`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "subscription_id": "subscription_id",
    "subscription_type": 1,
    "subscription_name": "BASIC",
    "start_date": 1234567890,
    "end_date": 1234567890,
    "is_active": true,
    "is_expired": false,
    "days_remaining": 25,
    "created_at": 1234567890,
    "last_updated": 1234567890
  }
  ```

### Subscription Limits & Capabilities
- **Functions**: Attendee limit checks
- **TTL**: 15 minutes
- **Cache Key**: `subscription:user:{address}:limits`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "subscription_type": 1,
    "subscription_name": "BASIC",
    "max_attendees": 1000,
    "current_attendees_served": 500,
    "remaining_attendees": 500,
    "can_add_attendees": true,
    "attendee_limit_reached": false,
    "last_updated": 1234567890
  }
  ```

### Subscription Pricing Configuration
- **Functions**: Pricing queries
- **TTL**: 2 hours
- **Cache Key**: `subscription:pricing:config`
- **Data Structure**:
  ```json
  {
    "pricing_config": {
      "basic_monthly_price": 10000000,
      "basic_yearly_price": 100000000,
      "pro_monthly_price": 25000000,
      "pro_yearly_price": 250000000
    },
    "currency": "SUI",
    "billing_cycles": ["monthly", "yearly"],
    "discounts": {
      "yearly_discount": 0.17,
      "pro_discount": 0.25
    },
    "last_updated": 1234567890
  }
  ```

## Platform Fee Calculations

### Platform Fee by Subscription Type
- **Functions**: Fee calculations based on subscription type
- **TTL**: 1 hour
- **Cache Key**: `subscription:platform_fee:{subscription_type}`
- **Data Structure**:
  ```json
  {
    "subscription_type": 0,
    "subscription_name": "FREE",
    "platform_fee_percentage": 5.0,
    "platform_fee_bps": 500,
    "basis_points_denominator": 10000,
    "fee_calculation": "5% of event fee",
    "last_updated": 1234567890
  }
  ```

### Fee Calculation Examples
- **Functions**: Fee examples and calculations
- **TTL**: 2 hours
- **Cache Key**: `subscription:fee_examples`
- **Data Structure**:
  ```json
  {
    "fee_examples": {
      "free_subscription": {
        "event_fee": 1000000,
        "platform_fee": 50000,
        "organizer_receives": 950000,
        "percentage": 5.0
      },
      "basic_subscription": {
        "event_fee": 1000000,
        "platform_fee": 30000,
        "organizer_receives": 970000,
        "percentage": 3.0
      },
      "pro_subscription": {
        "event_fee": 1000000,
        "platform_fee": 0,
        "organizer_receives": 1000000,
        "percentage": 0.0
      }
    },
    "last_updated": 1234567890
  }
  ```

## Subscription Management

### User Subscription History
- **Functions**: Subscription tracking
- **TTL**: 20 minutes
- **Cache Key**: `subscription:user:{address}:history`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "subscription_history": [
      {
        "subscription_id": "subscription_id",
        "type": 1,
        "type_name": "BASIC",
        "start_date": 1234567890,
        "end_date": 1234567890,
        "status": "expired",
        "payment_amount": 100000000,
        "billing_cycle": "yearly"
      }
    ],
    "total_subscriptions": 3,
    "current_subscription": "subscription_id",
    "last_updated": 1234567890
  }
  ```

### Subscription Upgrade/Downgrade Paths
- **Functions**: Upgrade options
- **TTL**: 1 hour
- **Cache Key**: `subscription:upgrade_paths`
- **Data Structure**:
  ```json
  {
    "upgrade_paths": {
      "free_to_basic": {
        "from": "FREE",
        "to": "BASIC",
        "monthly_cost": 10000000,
        "yearly_cost": 100000000,
        "benefits": ["Reduced platform fees", "Higher attendee limits"]
      },
      "basic_to_pro": {
        "from": "BASIC",
        "to": "PRO",
        "monthly_cost": 25000000,
        "yearly_cost": 250000000,
        "benefits": ["No platform fees", "Unlimited attendees", "Priority support"]
      }
    },
    "last_updated": 1234567890
  }
  ```

## Subscription Analytics

### Platform Subscription Statistics
- **Functions**: Platform-wide stats
- **TTL**: 30 minutes
- **Cache Key**: `subscription:platform:statistics`
- **Data Structure**:
  ```json
  {
    "platform_stats": {
      "total_subscriptions": 1000,
      "active_subscriptions": 850,
      "expired_subscriptions": 150,
      "subscription_types": {
        "free": 400,
        "basic": 350,
        "pro": 100
      },
      "total_revenue": 50000000000,
      "monthly_recurring_revenue": 5000000000
    },
    "conversion_rates": {
      "free_to_basic": 0.15,
      "basic_to_pro": 0.25,
      "retention_rate": 0.85
    },
    "last_updated": 1234567890
  }
  ```

### Subscription Performance Metrics
- **Functions**: Performance tracking
- **TTL**: 15 minutes
- **Cache Key**: `subscription:performance:metrics`
- **Data Structure**:
  ```json
  {
    "performance_metrics": {
      "average_subscription_duration": 180,
      "churn_rate": 0.15,
      "upgrade_rate": 0.20,
      "downgrade_rate": 0.05,
      "renewal_rate": 0.80
    },
    "revenue_metrics": {
      "average_monthly_revenue_per_user": 50000000,
      "lifetime_value": 300000000,
      "acquisition_cost": 100000000
    },
    "last_updated": 1234567890
  }
  ```

## Billing & Payment Tracking

### User Payment History
- **Functions**: Payment tracking
- **TTL**: 15 minutes
- **Cache Key**: `subscription:user:{address}:payments`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "payment_history": [
      {
        "subscription_id": "subscription_id",
        "amount": 100000000,
        "billing_cycle": "yearly",
        "payment_date": 1234567890,
        "status": "completed",
        "transaction_id": "tx_id"
      }
    ],
    "total_paid": 300000000,
    "last_payment": 1234567890,
    "next_payment_due": 1234567890,
    "last_updated": 1234567890
  }
  ```

### Subscription Billing Cycles
- **Functions**: Billing management
- **TTL**: 1 hour
- **Cache Key**: `subscription:billing:cycles`
- **Data Structure**:
  ```json
  {
    "billing_cycles": {
      "monthly": {
        "duration_days": 30,
        "discount": 0.0,
        "popularity": 0.6
      },
      "yearly": {
        "duration_days": 365,
        "discount": 0.17,
        "popularity": 0.4
      }
    },
    "auto_renewal": {
      "enabled": true,
      "grace_period_days": 7,
      "retry_attempts": 3
    },
    "last_updated": 1234567890
  }
  ```

## Cache Invalidation Triggers

### Subscription Status Changes
- Subscription created → Invalidate: `subscription:user:{address}:status`, `subscription:platform:statistics`
- Subscription updated → Invalidate: `subscription:user:{address}:status`, `subscription:user:{address}:limits`
- Subscription expired → Invalidate: `subscription:user:{address}:status`, `subscription:user:{address}:limits`

### Payment Changes
- New payment → Invalidate: `subscription:user:{address}:payments`, `subscription:platform:statistics`
- Payment failed → Invalidate: `subscription:user:{address}:status`, `subscription:user:{address}:limits`

### Configuration Updates
- Pricing changed → Invalidate: `subscription:pricing:config`, `subscription:platform_fee:{subscription_type}`
- Fee structure updated → Invalidate: `subscription:platform_fee:{subscription_type}`, `subscription:fee_examples`

### Analytics Updates
- Statistics changed → Invalidate: `subscription:platform:statistics`, `subscription:performance:metrics`
- Performance metrics updated → Invalidate: `subscription:performance:metrics`

## Performance Metrics to Track

- Cache hit rate for subscription status
- Cache hit rate for fee calculations
- Average response time for subscription queries
- Memory usage for subscription-related caches
- Invalidation frequency by trigger type
- Platform fee calculation efficiency
- Subscription analytics performance 