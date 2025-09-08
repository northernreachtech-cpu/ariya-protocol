# Rating & Reputation Module - Caching Specifications

## Module: `ariya::rating_reputation`

## Event Ratings & Feedback

### Event Average Rating
- **Functions**: `get_event_ratings()`
- **TTL**: 10 minutes
- **Cache Key**: `rating:event:{event_id}:average`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "rating_summary": {
      "total_rating_sum": 4500,
      "total_ratings": 10,
      "average_rating": 450,
      "average_rating_formatted": 4.5,
      "rating_distribution": {
        "5_star": 6,
        "4_star": 3,
        "3_star": 1,
        "2_star": 0,
        "1_star": 0
      }
    },
    "rating_deadline": 1234567890,
    "can_still_rate": true,
    "last_updated": 1234567890
  }
  ```

### Individual User Rating
- **Functions**: User-specific rating queries
- **TTL**: 15 minutes
- **Cache Key**: `rating:event:{event_id}:user:{address}`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "user_address": "0x...",
    "rating_data": {
      "event_rating": 500,
      "convener_rating": 450,
      "feedback": "Great event, well organized!",
      "timestamp": 1234567890,
      "has_rated": true
    },
    "rating_eligibility": {
      "can_rate": false,
      "reason": "Already rated",
      "rating_period_expired": false
    },
    "last_updated": 1234567890
  }
  ```

### Event Rating Details
- **Functions**: Detailed rating queries
- **TTL**: 10 minutes
- **Cache Key**: `rating:event:{event_id}:details`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "rating_details": {
      "total_ratings": 10,
      "event_ratings": [
        {
          "rater": "0x...",
          "event_rating": 500,
          "convener_rating": 450,
          "feedback": "Excellent event",
          "timestamp": 1234567890
        }
      ],
      "convener_ratings": [
        {
          "rater": "0x...",
          "convener_rating": 450,
          "feedback": "Great organizer",
          "timestamp": 1234567890
        }
      ]
    },
    "rating_deadline": 1234567890,
    "last_updated": 1234567890
  }
  ```

## Organizer Reputation

### Organizer Reputation Score
- **Functions**: `get_organizer_stats()`, `get_organizer_profile()`
- **TTL**: 20 minutes
- **Cache Key**: `rating:organizer:{address}:reputation`
- **Data Structure**:
  ```json
  {
    "organizer_address": "0x...",
    "reputation_summary": {
      "total_events": 15,
      "successful_events": 12,
      "total_attendees_served": 800,
      "avg_rating": 460,
      "avg_rating_formatted": 4.6,
      "success_rate": 80.0
    },
    "rating_history": [
      {
        "event_id": "event_id",
        "rating": 450,
        "rater_count": 25,
        "timestamp": 1234567890
      }
    ],
    "reputation_tier": "gold",
    "last_updated": 1234567890
  }
  ```

### Convener Reputation Tracking
- **Functions**: Convener-specific reputation
- **TTL**: 15 minutes
- **Cache Key**: `rating:convener:{address}:reputation`
- **Data Structure**:
  ```json
  {
    "convener_address": "0x...",
    "convener_stats": {
      "total_events_rated": 10,
      "total_rating_sum": 4500,
      "average_rating": 450,
      "rating_history": [
        {
          "event_id": "event_id",
          "rating": 450,
          "rater_count": 25,
          "timestamp": 1234567890
        }
      ]
    },
    "reputation_metrics": {
      "consistency_score": 85,
      "improvement_trend": "positive",
      "last_updated": 1234567890
    }
  }
  ```

## User Rating History

### User Rating History
- **Functions**: `get_user_ratings()`
- **TTL**: 15 minutes
- **Cache Key**: `rating:user:{address}:history`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "rating_history": [
      {
        "event_id": "event_id",
        "rating_given": 500,
        "timestamp": 1234567890,
        "event_name": "Event Name"
      }
    ],
    "rating_statistics": {
      "total_ratings_given": 8,
      "average_rating_given": 470,
      "rating_distribution": {
        "5_star": 5,
        "4_star": 2,
        "3_star": 1
      },
      "last_rating": 1234567890
    },
    "last_updated": 1234567890
  }
  ```

### User Rating Preferences
- **Functions**: Rating pattern analysis
- **TTL**: 30 minutes
- **Cache Key**: `rating:user:{address}:preferences`
- **Data Structure**:
  ```json
  {
    "user_address": "0x...",
    "rating_preferences": {
      "preferred_event_types": ["conference", "workshop"],
      "rating_consistency": 0.85,
      "feedback_style": "detailed",
      "average_rating_given": 470,
      "rating_trend": "consistent"
    },
    "rating_behavior": {
      "rates_quickly": true,
      "provides_feedback": true,
      "rating_frequency": "high"
    },
    "last_updated": 1234567890
  }
  ```

## Rating Analytics & Trends

### Event Rating Trends
- **Functions**: Rating trend analysis
- **TTL**: 20 minutes
- **Cache Key**: `rating:event:{event_id}:trends`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "rating_trends": {
      "rating_over_time": [
        {
          "timestamp": 1234567890,
          "average_rating": 450,
          "total_ratings": 5
        }
      ],
      "rating_velocity": 2.5,
      "rating_stability": 0.85,
      "trend_direction": "improving"
    },
    "feedback_analysis": {
      "common_themes": ["organization", "content", "venue"],
      "sentiment_score": 0.8,
      "improvement_areas": ["timing", "communication"]
    },
    "last_updated": 1234567890
  }
  ```

### Platform Rating Statistics
- **Functions**: Platform-wide rating stats
- **TTL**: 1 hour
- **Cache Key**: `rating:platform:statistics`
- **Data Structure**:
  ```json
  {
    "platform_rating_stats": {
      "total_events_rated": 500,
      "total_ratings_given": 5000,
      "average_platform_rating": 460,
      "rating_distribution": {
        "5_star": 3000,
        "4_star": 1500,
        "3_star": 400,
        "2_star": 80,
        "1_star": 20
      }
    },
    "rating_quality_metrics": {
      "rating_completion_rate": 75.0,
      "feedback_provided_rate": 60.0,
      "average_rating_consistency": 0.82
    },
    "last_updated": 1234567890
  }
  ```

## Rating Eligibility & Deadlines

### Rating Period Status
- **Functions**: Rating deadline checks
- **TTL**: 5 minutes
- **Cache Key**: `rating:event:{event_id}:deadline`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "rating_period": {
      "start_time": 1234567890,
      "end_time": 1234567890,
      "duration_days": 7,
      "time_remaining": 86400,
      "is_active": true,
      "is_expired": false
    },
    "user_eligibility": {
      "can_rate": true,
      "has_rated": false,
      "rating_deadline_passed": false,
      "reason": "Eligible to rate"
    },
    "last_updated": 1234567890
  }
  ```

### Rating Eligibility Matrix
- **Functions**: Eligibility checks
- **TTL**: 10 minutes
- **Cache Key**: `rating:eligibility:matrix`
- **Data Structure**:
  ```json
  {
    "eligibility_rules": {
      "attendance_required": true,
      "completion_required": false,
      "min_duration_required": 1800,
      "rating_period_days": 7,
      "one_rating_per_user": true
    },
    "eligibility_exceptions": {
      "organizer_can_rate": false,
      "assignee_can_rate": true,
      "sponsor_can_rate": true
    },
    "last_updated": 1234567890
  }
  ```

## Feedback Analysis

### Feedback Sentiment Analysis
- **Functions**: Feedback processing
- **TTL**: 30 minutes
- **Cache Key**: `rating:feedback:sentiment:{event_id}`
- **Data Structure**:
  ```json
  {
    "event_id": "event_id",
    "sentiment_analysis": {
      "overall_sentiment": "positive",
      "sentiment_score": 0.8,
      "sentiment_distribution": {
        "positive": 0.7,
        "neutral": 0.2,
        "negative": 0.1
      },
      "key_phrases": ["well organized", "great content", "friendly staff"],
      "improvement_suggestions": ["better timing", "more breaks"]
    },
    "feedback_categories": {
      "organization": 0.9,
      "content": 0.8,
      "venue": 0.7,
      "staff": 0.9
    },
    "last_updated": 1234567890
  }
  ```

## Cache Invalidation Triggers

### Rating Changes
- New rating submitted → Invalidate: `rating:event:{event_id}:average`, `rating:event:{event_id}:details`, `rating:organizer:{address}:reputation`
- Rating updated → Invalidate: `rating:event:{event_id}:average`, `rating:event:{event_id}:details`, `rating:user:{address}:history`

### Reputation Updates
- Organizer stats changed → Invalidate: `rating:organizer:{address}:reputation`, `rating:platform:statistics`
- Convener reputation updated → Invalidate: `rating:convener:{address}:reputation`

### User Changes
- User rating history updated → Invalidate: `rating:user:{address}:history`, `rating:user:{address}:preferences`
- Rating eligibility changed → Invalidate: `rating:event:{event_id}:deadline`, `rating:event:{event_id}:user:{address}`

### Analytics Updates
- Rating trends changed → Invalidate: `rating:event:{event_id}:trends`, `rating:platform:statistics`
- Feedback analysis updated → Invalidate: `rating:feedback:sentiment:{event_id}`

## Performance Metrics to Track

- Cache hit rate for rating queries
- Cache hit rate for reputation data
- Average response time for rating calculations
- Memory usage for rating-related caches
- Invalidation frequency by trigger type
- Rating analytics performance
- Feedback processing efficiency 