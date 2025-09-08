# Identity & Access Module - Caching Specifications

## Module: `ariya::identity_access`

## Registration Data

### User Registration Status
- **Functions**: Registration checks, pass validation
- **TTL**: 5 minutes
- **Cache Key**: `registration:event:{event_id}:user:{address}`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "user_address": "0x...",
    "registered_at": 1234567890,
    "pass_hash": "0x...",
    "checked_in": false,
    "platform_fee_paid": 50000,
    "registration_status": "active",
    "last_updated": 1234567890
  }
  ```

### Event Registration Count
- **Functions**: `get_current_attendees()`
- **TTL**: 1 minute
- **Cache Key**: `registration:event:{event_id}:count`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "total_registered": 50,
    "capacity": 100,
    "available_spots": 50,
    "last_updated": 1234567890
  }
  ```

### User's Registered Events
- **Functions**: User registration list queries
- **TTL**: 10 minutes
- **Cache Key**: `registration:user:{address}:events`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "registered_events": [
      {
        "event_id": "event_id_1",
        "registered_at": 1234567890,
        "status": "active"
      }
    ],
    "total_registrations": 1,
    "last_updated": 1234567890
  }
  ```

### Pass Validation Data
- **Functions**: Pass hash validation
- **TTL**: 2 minutes
- **Cache Key**: `pass:validation:{pass_hash}`
- **Data Structure**:
  ```json
  {
    "pass_hash": "0x...",
    "wallet": "0x...",
    "event_id": "event_id",
    "created_at": 1234567890,
    "expires_at": 1234567890,
    "used": false,
    "pass_id": 12345,
    "is_valid": true,
    "last_updated": 1234567890
  }
  ```

### Event Registration Registry
- **Functions**: Event registration queries
- **TTL**: 5 minutes
- **Cache Key**: `registration:event:{event_id}:registry`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "registrations": [
      {
        "wallet": "0x...",
        "registered_at": 1234567890,
        "status": "active"
      }
    ],
    "total_registered": 50,
    "last_updated": 1234567890
  }
  ```

## Subscription Management

### User Subscription Status
- **Functions**: `get_subscription_type()`, `get_subscription_status()`
- **TTL**: 10 minutes
- **Cache Key**: `subscription:user:{address}:status`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "subscription_type": 1,
    "subscription_name": "BASIC",
    "start_date": 1234567890,
    "end_date": 1234567890,
    "is_active": true,
    "is_expired": false,
    "days_remaining": 25,
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
    "max_attendees": 1000,
    "current_attendees_served": 500,
    "remaining_attendees": 500,
    "can_add_attendees": true,
    "last_updated": 1234567890
  }
  ```

### Platform Fee Calculations
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
    "last_updated": 1234567890
  }
  ```

### Subscription Pricing
- **Functions**: Subscription cost queries
- **TTL**: 2 hours
- **Cache Key**: `subscription:pricing:config`
- **Data Structure**:
  ```json
  {
    "basic_monthly_price": 10000000,
    "basic_yearly_price": 100000000,
    "pro_monthly_price": 25000000,
    "pro_yearly_price": 250000000,
    "currency": "SUI",
    "last_updated": 1234567890
  }
  ```

## Access Control

### User Permissions per Event
- **Functions**: Permission checks
- **TTL**: 5 minutes
- **Cache Key**: `access:event:{event_id}:user:{address}:permissions`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "user_address": "0x...",
    "is_organizer": false,
    "is_attendee": true,
    "is_assignee": false,
    "can_check_in": true,
    "can_rate": false,
    "permissions": ["view", "check_in"],
    "last_updated": 1234567890
  }
  ```

### Event Access Control List
- **Functions**: Event access queries
- **TTL**: 10 minutes
- **Cache Key**: `access:event:{event_id}:control_list`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "organizer": "0x...",
    "assignee": "assignee_name",
    "registered_users": ["0x...", "0x..."],
    "total_registered": 50,
    "access_control": "public",
    "last_updated": 1234567890
  }
  ```

## Payment & Fee Tracking

### Platform Fee Collection
- **Functions**: Fee tracking queries
- **TTL**: 5 minutes
- **Cache Key**: `fees:event:{event_id}:platform_collection`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "total_platform_fees": 250000,
    "fee_per_registration": 50000,
    "registrations_count": 5,
    "currency": "SUI",
    "last_updated": 1234567890
  }
  ```

### User Payment History
- **Functions**: Payment tracking
- **TTL**: 15 minutes
- **Cache Key**: `fees:user:{address}:payment_history`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "payments": [
      {
        "event_id": "event_id",
        "amount": 1000000,
        "platform_fee": 50000,
        "timestamp": 1234567890
      }
    ],
    "total_paid": 1000000,
    "total_platform_fees": 50000,
    "last_updated": 1234567890
  }
  ```

## Pass Management

### Pass Generation History
- **Functions**: Pass tracking
- **TTL**: 10 minutes
- **Cache Key**: `pass:user:{address}:generation_history`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "passes": [
      {
        "pass_id": 12345,
        "event_id": "event_id",
        "created_at": 1234567890,
        "expires_at": 1234567890,
        "status": "active"
      }
    ],
    "total_passes": 1,
    "active_passes": 1,
    "expired_passes": 0,
    "last_updated": 1234567890
  }
  ```

### Event Pass Registry
- **Functions**: Event pass queries
- **TTL**: 5 minutes
- **Cache Key**: `pass:event:{event_id}:registry`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "passes": [
      {
        "pass_hash": "0x...",
        "wallet": "0x...",
        "pass_id": 12345,
        "status": "active"
      }
    ],
    "total_passes": 50,
    "active_passes": 50,
    "used_passes": 0,
    "last_updated": 1234567890
  }
  ```

## Cache Invalidation Triggers

### Registration Changes
- New registration → Invalidate: `registration:event:{event_id}:count`, `registration:user:{address}:events`
- Registration cancelled → Invalidate: `registration:event:{event_id}:count`, `registration:event:{event_id}:registry`
- Pass used → Invalidate: `pass:validation:{pass_hash}`, `pass:event:{event_id}:registry`

### Subscription Updates
- Subscription created/updated → Invalidate: `subscription:user:{address}:status`, `subscription:user:{address}:limits`
- Subscription expired → Invalidate: `subscription:user:{address}:status`, `subscription:user:{address}:limits`

### Payment Changes
- New payment → Invalidate: `fees:event:{event_id}:platform_collection`, `fees:user:{address}:payment_history`
- Fee calculation change → Invalidate: `subscription:platform_fee:{subscription_type}`

### Access Control Changes
- Permission change → Invalidate: `access:event:{event_id}:user:{address}:permissions`
- Event access change → Invalidate: `access:event:{event_id}:control_list`

## Performance Metrics to Track

- Cache hit rate for registration status
- Cache hit rate for subscription data
- Average response time for access control checks
- Memory usage for user-related caches
- Invalidation frequency by trigger type
- Platform fee calculation cache efficiency 