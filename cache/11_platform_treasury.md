# Platform Treasury Module - Caching Specifications

## Module: `ariya::platform_treasury`

## Treasury Balance & Status

### Treasury Balance
- **Functions**: `get_treasury_balance()`
- **TTL**: 30 minutes
- **Cache Key**: `treasury:balance`
- **Data Structure**:
  ```json
  {
    "treasury_balance": {
      "current_balance": 50000000000,
      "balance_formatted": "50.0 SUI",
      "currency": "SUI",
      "last_updated": 1234567890
    },
    "balance_history": [
      {
        "timestamp": 1234567890,
        "balance": 50000000000,
        "change": 1000000000,
        "transaction_type": "deposit",
        "description": "Platform fee deposit"
      }
    ],
    "balance_summary": {
      "highest_balance": 55000000000,
      "lowest_balance": 45000000000,
      "average_balance": 50000000000
    }
  }
  ```

### Treasury Admin Status
- **Functions**: `get_treasury_admin()`, `is_admin()`
- **TTL**: 1 hour
- **Cache Key**: `treasury:admin:{address}`
- **Data Structure**:
  ```json
  {
    "admin_address": "0x...",
    "admin_status": {
      "is_admin": true,
      "admin_since": 1234567890,
      "permissions": ["withdraw", "transfer_admin", "view_balance"]
    },
    "admin_history": [
      {
        "admin_address": "0x...",
        "transfer_timestamp": 1234567890,
        "transfer_type": "initial"
      }
    ],
    "last_updated": 1234567890
  }
  ```

## Fee Collection & Revenue

### Platform Fee Totals
- **Functions**: `get_fee_totals()`
- **TTL**: 1 hour
- **Cache Key**: `treasury:fees:platform`
- **Data Structure**:
  ```json
  {
    "platform_fee_summary": {
      "total_platform_fees": 25000000000,
      "total_formatted": "25.0 SUI",
      "currency": "SUI",
      "last_updated": 1234567890
    },
    "fee_breakdown": {
      "event_registration_fees": 20000000000,
      "subscription_fees": 5000000000,
      "other_fees": 0
    },
    "fee_trends": {
      "daily_average": 1000000000,
      "weekly_total": 7000000000,
      "monthly_total": 30000000000
    }
  }
  ```

### Subscription Fee Totals
- **Functions**: Subscription revenue tracking
- **TTL**: 1 hour
- **Cache Key**: `treasury:fees:subscription`
- **Data Structure**:
  ```json
  {
    "subscription_fee_summary": {
      "total_subscription_fees": 5000000000,
      "total_formatted": "5.0 SUI",
      "currency": "SUI",
      "last_updated": 1234567890
    },
    "subscription_breakdown": {
      "basic_monthly": 2000000000,
      "basic_yearly": 1500000000,
      "pro_monthly": 1000000000,
      "pro_yearly": 500000000
    },
    "subscription_trends": {
      "monthly_recurring_revenue": 5000000000,
      "annual_recurring_revenue": 60000000000,
      "growth_rate": 0.15
    }
  }
  ```

### Event Registration Fee Collection
- **Functions**: Event fee tracking
- **TTL**: 30 minutes
- **Cache Key**: `treasury:fees:event_registration`
- **Data Structure**:
  ```json
  {
    "event_registration_fees": {
      "total_collected": 20000000000,
      "total_formatted": "20.0 SUI",
      "currency": "SUI",
      "last_updated": 1234567890
    },
    "fee_breakdown_by_subscription": {
      "free_subscription": {
        "fee_percentage": 5.0,
        "total_collected": 10000000000,
        "event_count": 100
      },
      "basic_subscription": {
        "fee_percentage": 3.0,
        "total_collected": 6000000000,
        "event_count": 60
      },
      "pro_subscription": {
        "fee_percentage": 0.0,
        "total_collected": 0,
        "event_count": 40
      }
    },
    "recent_collections": [
      {
        "event_id": "event_id",
        "amount": 50000,
        "timestamp": 1234567890
      }
    ]
  }
  ```

## Transaction History & Tracking

### Recent Treasury Transactions
- **Functions**: Transaction queries
- **TTL**: 15 minutes
- **Cache Key**: `treasury:transactions:recent`
- **Data Structure**:
  ```json
  {
    "recent_transactions": [
      {
        "transaction_id": "tx_id",
        "type": "deposit",
        "amount": 1000000000,
        "fee_type": "event_registration",
        "depositor": "0x...",
        "timestamp": 1234567890,
        "description": "Platform fee from event registration"
      }
    ],
    "transaction_summary": {
      "total_transactions": 1000,
      "deposits": 800,
      "withdrawals": 200,
      "last_transaction": 1234567890
    },
    "transaction_types": {
      "platform_fee_deposits": 800,
      "subscription_payments": 150,
      "admin_withdrawals": 50
    }
  }
  ```

### Fee Collection History
- **Functions**: Fee collection tracking
- **TTL**: 30 minutes
- **Cache Key**: `treasury:fees:collection_history`
- **Data Structure**:
  ```json
  {
    "fee_collection_history": [
      {
        "event_id": "event_id",
        "attendee": "0x...",
        "organizer": "0x...",
        "fee_amount": 50000,
        "registration_fee": 1000000,
        "timestamp": 1234567890,
        "fee_type": "event_registration"
      }
    ],
    "collection_summary": {
      "total_collections": 1000,
      "total_amount": 25000000000,
      "average_fee": 25000,
      "highest_fee": 100000,
      "lowest_fee": 5000
    },
    "collection_trends": {
      "daily_average": 1000000000,
      "weekly_pattern": "increasing",
      "monthly_growth": 0.1
    }
  }
  ```

## Treasury Analytics & Metrics

### Revenue Analytics
- **Functions**: Revenue analysis
- **TTL**: 1 hour
- **Cache Key**: `treasury:analytics:revenue`
- **Data Structure**:
  ```json
  {
    "revenue_analytics": {
      "total_revenue": 30000000000,
      "revenue_breakdown": {
        "platform_fees": 25000000000,
        "subscription_fees": 5000000000
      },
      "revenue_trends": {
        "daily_revenue": 1000000000,
        "weekly_revenue": 7000000000,
        "monthly_revenue": 30000000000,
        "growth_rate": 0.15
      },
      "revenue_forecast": {
        "next_month": 34500000000,
        "next_quarter": 100000000000,
        "confidence_level": 0.85
      }
    },
    "last_updated": 1234567890
  }
  ```

### Treasury Performance Metrics
- **Functions**: Performance tracking
- **TTL**: 2 hours
- **Cache Key**: `treasury:analytics:performance`
- **Data Structure**:
  ```json
  {
    "treasury_performance": {
      "efficiency_metrics": {
        "fee_collection_rate": 0.98,
        "processing_time_avg": 5000,
        "error_rate": 0.02
      },
      "risk_metrics": {
        "balance_volatility": 0.1,
        "liquidity_ratio": 0.8,
        "reserve_adequacy": 0.9
      },
      "operational_metrics": {
        "transaction_volume": 1000,
        "unique_users": 500,
        "active_events": 100
      }
    },
    "last_updated": 1234567890
  }
  ```

## Cache Invalidation Triggers

### Balance Changes
- New deposit → Invalidate: `treasury:balance`, `treasury:transactions:recent`, `treasury:fees:platform`
- Withdrawal made → Invalidate: `treasury:balance`, `treasury:transactions:recent`

### Fee Collections
- New fee collected → Invalidate: `treasury:fees:platform`, `treasury:fees:event_registration`, `treasury:fees:collection_history`
- Fee calculation changed → Invalidate: `treasury:fees:platform`, `treasury:fees:event_registration`

### Admin Changes
- Admin transferred → Invalidate: `treasury:admin:{address}`, `treasury:transactions:recent`
- Admin permissions changed → Invalidate: `treasury:admin:{address}`

### Analytics Updates
- Revenue data updated → Invalidate: `treasury:analytics:revenue`, `treasury:analytics:performance`
- Performance metrics changed → Invalidate: `treasury:analytics:performance`

## Performance Metrics to Track

- Cache hit rate for treasury balance
- Cache hit rate for fee totals
- Average response time for treasury queries
- Memory usage for treasury-related caches
- Invalidation frequency by trigger type
- Transaction history query performance
- Revenue analytics calculation efficiency 