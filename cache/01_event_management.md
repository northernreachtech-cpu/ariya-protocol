# Event Management Module - Caching Specifications

## Module: `ariya::event_management`

## Core Event Data

### Event Details
- **Functions**: `get_event_by_id()`, `get_event_info_fields()`
- **TTL**: 15 minutes
- **Cache Key**: `event:{event_id}:details`
- **Data Structure**:
  ```json
  {
    "id": "event_id",
    "name": "Event Name",
    "description": "Event Description",
    "location": "Event Location",
    "start_time": 1234567890,
    "end_time": 1234567890,
    "capacity": 100,
    "current_attendees": 50,
    "organizer": "0x...",
    "sponsors": ["sponsor1", "sponsor2"],
    "assignee": "assignee_name",
    "is_child": false,
    "parent_id": "parent_event_id",
    "state": 1,
    "created_at": 1234567890,
    "fee_amount": 1000000,
    "metadata_uri": "ipfs://..."
  }
  ```

### Event State
- **Functions**: `get_event_state()`, `is_event_active()`, `is_event_completed()`
- **TTL**: 2 minutes
- **Cache Key**: `event:{event_id}:state`
- **Data Structure**:
  ```json
  {
    "state": 1,
    "is_active": true,
    "is_completed": false,
    "last_updated": 1234567890
  }
  ```

### Event Capacity & Attendance
- **Functions**: `get_event_capacity()`, `get_current_attendees()`
- **TTL**: 1 minute
- **Cache Key**: `event:{event_id}:capacity`
- **Data Structure**:
  ```json
  {
    "capacity": 100,
    "current_attendees": 50,
    "available_spots": 50,
    "last_updated": 1234567890
  }
  ```

### Event Financial Data
- **Functions**: `get_event_fee_amount()`, `is_event_free()`
- **TTL**: 1 hour
- **Cache Key**: `event:{event_id}:financial`
- **Data Structure**:
  ```json
  {
    "fee_amount": 1000000,
    "is_free": false,
    "currency": "SUI",
    "last_updated": 1234567890
  }
  ```

### Event Location & Timing
- **Functions**: `get_event_location()`, `get_event_timing()`
- **TTL**: 1 hour
- **Cache Key**: `event:{event_id}:location_timing`
- **Data Structure**:
  ```json
  {
    "location": "Event Location",
    "start_time": 1234567890,
    "end_time": 1234567890,
    "created_at": 1234567890,
    "duration_minutes": 120
  }
  ```

### Event Metadata
- **Functions**: `get_event_metadata_uri()`
- **TTL**: 2 hours
- **Cache Key**: `event:{event_id}:metadata`
- **Data Structure**:
  ```json
  {
    "metadata_uri": "ipfs://...",
    "metadata_hash": "hash_value",
    "last_updated": 1234567890
  }
  ```

## Registry Queries

### Events by Organizer
- **Functions**: `get_organizer_event_ids()`
- **TTL**: 10 minutes
- **Cache Key**: `registry:events_by_organizer:{organizer_address}`
- **Data Structure**:
  ```json
  {
    "organizer": "0x...",
    "event_ids": ["event_id_1", "event_id_2"],
    "total_events": 2,
    "last_updated": 1234567890
  }
  ```

### Events by Assignee
- **Functions**: `get_events_assigned_to_user()`
- **TTL**: 10 minutes
- **Cache Key**: `registry:events_by_assignee:{assignee_name}`
- **Data Structure**:
  ```json
  {
    "assignee": "assignee_name",
    "event_ids": ["event_id_1", "event_id_2"],
    "total_events": 2,
    "last_updated": 1234567890
  }
  ```

### Events by Parent
- **Functions**: `get_child_events()`
- **TTL**: 10 minutes
- **Cache Key**: `registry:events_by_parent:{parent_event_id}`
- **Data Structure**:
  ```json
  {
    "parent_id": "parent_event_id",
    "child_event_ids": ["child_1", "child_2"],
    "total_children": 2,
    "last_updated": 1234567890
  }
  ```

### Event Discovery Queries
- **Functions**: Custom search queries
- **TTL**: 20 minutes
- **Cache Key**: `discovery:events:{query_hash}`
- **Data Structure**:
  ```json
  {
    "query_hash": "hash_of_search_params",
    "search_params": {
      "location": "location",
      "date_range": "start-end",
      "capacity": "min-max",
      "fee_range": "min-max"
    },
    "results": ["event_id_1", "event_id_2"],
    "total_results": 2,
    "last_updated": 1234567890
  }
  ```

## Sponsor Conditions

### Sponsor Performance Conditions
- **Functions**: `get_sponsor_conditions()`, `get_condition_details()`
- **TTL**: 1 hour
- **Cache Key**: `event:{event_id}:sponsor_conditions`
- **Data Structure**:
  ```json
  {
    "min_attendees": 50,
    "min_completion_rate": 8000,
    "min_avg_rating": 450,
    "custom_benchmarks_count": 2,
    "last_updated": 1234567890
  }
  ```

### Custom Benchmarks
- **Functions**: `get_custom_benchmarks()`
- **TTL**: 1 hour
- **Cache Key**: `event:{event_id}:custom_benchmarks`
- **Data Structure**:
  ```json
  {
    "benchmarks": [
      {
        "metric_name": "social_media_engagement",
        "target_value": 1000,
        "comparison_type": 0
      }
    ],
    "last_updated": 1234567890
  }
  ```

## Profile Data

### User Profile Details
- **Functions**: `get_profile_details()`, `get_profile_name()`, `get_profile_bio()`
- **TTL**: 30 minutes
- **Cache Key**: `profile:{address}:details`
- **Data Structure**:
  ```json
  {
    "address": "0x...",
    "name": "User Name",
    "bio": "User Bio",
    "photo_url": "https://...",
    "telegram_username": "username",
    "x_username": "username",
    "created_at": 1234567890,
    "last_updated": 1234567890
  }
  ```

### Profile Registry Mappings
- **Functions**: `has_profile()`, `get_user_profile_id()`
- **TTL**: 1 hour
- **Cache Key**: `profile:registry:{address}`
- **Data Structure**:
  ```json
  {
    "address": "0x...",
    "has_profile": true,
    "profile_id": "profile_id",
    "last_updated": 1234567890
  }
  ```

### Username to Address Mappings
- **Functions**: `get_address_from_x()`, `get_address_from_telegram()`
- **TTL**: 1 hour
- **Cache Key**: `profile:x_username:{username}`, `profile:telegram:{username}`
- **Data Structure**:
  ```json
  {
    "username": "username",
    "address": "0x...",
    "last_updated": 1234567890
  }
  ```

## Organizer Profiles

### Organizer Statistics
- **Functions**: `get_organizer_stats()`, `get_organizer_profile()`
- **TTL**: 20 minutes
- **Cache Key**: `organizer:{address}:stats`
- **Data Structure**:
  ```json
  {
    "address": "0x...",
    "total_events": 10,
    "successful_events": 8,
    "total_attendees_served": 500,
    "avg_rating": 450,
    "created_at": 1234567890,
    "last_updated": 1234567890
  }
  ```

## Cache Invalidation Triggers

### Event State Changes
- Event activated → Invalidate: `event:{event_id}:state`, `event:{event_id}:capacity`
- Event completed → Invalidate: `event:{event_id}:state`, `event:{event_id}:capacity`
- Event settled → Invalidate: `event:{event_id}:state`

### Registration Changes
- New registration → Invalidate: `event:{event_id}:capacity`, `registry:events_by_organizer:{organizer}`
- Registration cancelled → Invalidate: `event:{event_id}:capacity`

### Profile Updates
- Profile modified → Invalidate: `profile:{address}:details`
- Username changed → Invalidate: `profile:x_username:{old}`, `profile:telegram:{old}`

### Organizer Updates
- Stats updated → Invalidate: `organizer:{address}:stats`

## Performance Metrics to Track

- Cache hit rate for event details
- Cache hit rate for registry queries
- Average response time for cached vs non-cached data
- Memory usage for event-related caches
- Invalidation frequency by trigger type 