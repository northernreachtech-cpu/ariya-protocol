# Attendance Verification Module - Caching Specifications

## Module: `ariya::attendance_verification`

## Real-Time Attendance Data

### Event Attendance Count
- **Functions**: Real-time attendance tracking
- **TTL**: 10 seconds
- **Cache Key**: `attendance:event:{event_id}:checkin_count`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "check_in_count": 45,
    "check_out_count": 30,
    "current_attending": 15,
    "total_registered": 50,
    "attendance_rate": 90.0,
    "completion_rate": 60.0,
    "last_updated": 1234567890
  }
  ```

### User Check-in Status
- **Functions**: `check_in()`, `check_out()`
- **TTL**: 30 seconds
- **Cache Key**: `attendance:event:{event_id}:user:{address}`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "user_address": "0x...",
    "state": 1,
    "state_name": "checked_in",
    "check_in_time": 1234567890,
    "check_out_time": 0,
    "attendance_duration": 0,
    "device_fingerprint": "0x...",
    "location_proof": "0x...",
    "last_updated": 1234567890
  }
  ```

### Real-Time Attendance List
- **Functions**: Live attendance queries
- **TTL**: 5 seconds
- **Cache Key**: `attendance:event:{event_id}:live_list`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "currently_attending": [
      {
        "address": "0x...",
        "check_in_time": 1234567890,
        "duration_minutes": 30
      }
    ],
    "total_currently_attending": 15,
    "last_updated": 1234567890
  }
  ```

## Attendance Records & History

### User Attendance History
- **Functions**: `get_user_attendances()`
- **TTL**: 5 minutes
- **Cache Key**: `attendance:user:{address}:events`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "attendance_records": [
      {
        "event_id": "event_id",
        "state": 2,
        "state_name": "checked_out",
        "check_in_time": 1234567890,
        "check_out_time": 1234567890,
        "attendance_duration": 7200,
        "event_name": "Event Name"
      }
    ],
    "total_events_attended": 5,
    "total_events_completed": 3,
    "completion_rate": 60.0,
    "last_updated": 1234567890
  }
  ```

### Event Attendance Registry
- **Functions**: Event attendance queries
- **TTL**: 2 minutes
- **Cache Key**: `attendance:event:{event_id}:registry`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "attendance_records": [
      {
        "wallet": "0x...",
        "state": 1,
        "check_in_time": 1234567890,
        "check_out_time": 0,
        "device_fingerprint": "0x...",
        "location_proof": "0x..."
      }
    ],
    "check_in_count": 45,
    "check_out_count": 30,
    "unique_devices": 40,
    "attendee_addresses": ["0x...", "0x..."],
    "last_updated": 1234567890
  }
  ```

### Attendance Statistics
- **Functions**: Statistical queries
- **TTL**: 1 minute
- **Cache Key**: `attendance:event:{event_id}:statistics`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "total_registered": 50,
    "total_checkins": 45,
    "total_checkouts": 30,
    "current_attending": 15,
    "attendance_rate": 90.0,
    "completion_rate": 60.0,
    "average_duration_minutes": 45,
    "peak_attendance": 45,
    "last_updated": 1234567890
  }
  ```

## Device & Location Tracking

### Device Fingerprint Registry
- **Functions**: Device tracking
- **TTL**: 10 minutes
- **Cache Key**: `attendance:event:{event_id}:devices`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "unique_devices": {
      "0x...": {
        "first_seen": 1234567890,
        "last_seen": 1234567890,
        "user_address": "0x...",
        "check_in_count": 1
      }
    },
    "total_unique_devices": 40,
    "last_updated": 1234567890
  }
  ```

### Location Verification Data
- **Functions**: Location proof validation
- **TTL**: 5 minutes
- **Cache Key**: `attendance:event:{event_id}:location_verification`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "location_proofs": {
      "0x...": {
        "user_address": "0x...",
        "location_hash": "0x...",
        "timestamp": 1234567890,
        "verified": true
      }
    },
    "total_location_proofs": 45,
    "verified_proofs": 45,
    "last_updated": 1234567890
  }
  ```

## Fraud Detection & Security

### Fraud Detection Flags
- **Functions**: Fraud monitoring
- **TTL**: 1 minute
- **Cache Key**: `attendance:event:{event_id}:fraud_flags`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "fraud_attempts": [
      {
        "wallet": "0x...",
        "reason": "Multiple device check-ins",
        "timestamp": 1234567890,
        "severity": "high"
      }
    ],
    "total_fraud_attempts": 2,
    "high_severity_flags": 1,
    "last_updated": 1234567890
  }
  ```

### Security Metrics
- **Functions**: Security monitoring
- **TTL**: 5 minutes
- **Cache Key**: `attendance:event:{event_id}:security_metrics`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "suspicious_activities": 3,
    "multiple_device_attempts": 2,
    "location_mismatches": 1,
    "rapid_check_ins": 0,
    "security_score": 85,
    "last_updated": 1234567890
  }
  ```

## Attendance Analytics

### Time-Based Analytics
- **Functions**: Time tracking queries
- **TTL**: 2 minutes
- **Cache Key**: `attendance:event:{event_id}:time_analytics`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "hourly_checkins": {
      "9": 15,
      "10": 20,
      "11": 10
    },
    "peak_hour": 10,
    "peak_attendance": 20,
    "average_checkin_duration": 7200,
    "early_arrivals": 15,
    "late_arrivals": 5,
    "last_updated": 1234567890
  }
  ```

### User Behavior Analytics
- **Functions**: Behavior tracking
- **TTL**: 5 minutes
- **Cache Key**: `attendance:event:{event_id}:behavior_analytics`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "user_behavior": {
      "early_arrivals": 15,
      "on_time_arrivals": 20,
      "late_arrivals": 5,
      "early_departures": 10,
      "on_time_departures": 15,
      "late_departures": 5
    },
    "punctuality_score": 75.0,
    "completion_score": 60.0,
    "last_updated": 1234567890
  }
  ```

## Verification Status

### Check-in Verification Status
- **Functions**: Verification queries
- **TTL**: 30 seconds
- **Cache Key**: `attendance:verification:checkin:{event_id}:{address}`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "user_address": "0x...",
    "verification_status": "verified",
    "check_in_verified": true,
    "device_verified": true,
    "location_verified": true,
    "verification_timestamp": 1234567890,
    "last_updated": 1234567890
  }
  ```

### Check-out Verification Status
- **Functions**: Check-out verification
- **TTL**: 30 seconds
- **Cache Key**: `attendance:verification:checkout:{event_id}:{address}`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "user_address": "0x...",
    "verification_status": "verified",
    "check_out_verified": true,
    "duration_verified": true,
    "completion_verified": true,
    "verification_timestamp": 1234567890,
    "last_updated": 1234567890
  }
  ```

## Cache Invalidation Triggers

### Real-Time Changes
- Check-in → Invalidate: `attendance:event:{event_id}:checkin_count`, `attendance:event:{event_id}:live_list`, `attendance:event:{event_id}:statistics`
- Check-out → Invalidate: `attendance:event:{event_id}:checkin_count`, `attendance:event:{event_id}:live_list`, `attendance:event:{event_id}:statistics`

### User Status Changes
- User check-in/out → Invalidate: `attendance:event:{event_id}:user:{address}`, `attendance:user:{address}:events`
- Device change → Invalidate: `attendance:event:{event_id}:devices`

### Security Events
- Fraud detected → Invalidate: `attendance:event:{event_id}:fraud_flags`, `attendance:event:{event_id}:security_metrics`
- Location verification → Invalidate: `attendance:event:{event_id}:location_verification`

### Analytics Updates
- Time-based changes → Invalidate: `attendance:event:{event_id}:time_analytics`
- Behavior changes → Invalidate: `attendance:event:{event_id}:behavior_analytics`

## Performance Metrics to Track

- Cache hit rate for real-time attendance data
- Cache hit rate for attendance history
- Average response time for attendance queries
- Memory usage for attendance-related caches
- Invalidation frequency by trigger type
- Real-time data freshness metrics
- Fraud detection response time 