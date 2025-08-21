# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-dark-mode-theme/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Theme Preferences Management

#### GET /api/themes/preferences/
Retrieve current user's theme preferences.

**Response:**
```json
{
  "theme_mode": "auto",
  "resolved_theme": "dark",
  "high_contrast": false,
  "reduced_motion": false,
  "device_preferences": {
    "desktop": {
      "theme_mode": "dark",
      "last_used": "2025-08-21T10:00:00Z"
    },
    "mobile": {
      "theme_mode": "auto",
      "last_used": "2025-08-20T15:30:00Z"
    }
  },
  "usage_stats": {
    "theme_switches_count": 15,
    "last_theme_change": "2025-08-21T09:45:00Z",
    "most_used_theme": "dark"
  },
  "system_detection": {
    "supports_prefers_color_scheme": true,
    "current_system_theme": "dark",
    "supports_reduced_motion": true,
    "current_reduced_motion": false
  },
  "created_at": "2025-08-01T00:00:00Z",
  "updated_at": "2025-08-21T09:45:00Z"
}
```

#### PUT /api/themes/preferences/
Update user's theme preferences.

**Request Body:**
```json
{
  "theme_mode": "dark",
  "high_contrast": true,
  "reduced_motion": false,
  "device_preferences": {
    "desktop": {
      "theme_mode": "dark"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Theme preferences updated successfully",
  "theme_mode": "dark",
  "resolved_theme": "dark",
  "high_contrast": true,
  "reduced_motion": false,
  "updated_fields": ["theme_mode", "high_contrast"],
  "cache_cleared": true
}
```

#### POST /api/themes/preferences/reset/
Reset theme preferences to default values.

**Response:**
```json
{
  "success": true,
  "message": "Theme preferences reset to defaults",
  "theme_mode": "auto",
  "resolved_theme": "light",
  "high_contrast": false,
  "reduced_motion": false
}
```

### Theme Switching & Analytics

#### POST /api/themes/switch/
Record a theme switch and update analytics.

**Request Body:**
```json
{
  "from_theme": "light",
  "to_theme": "dark",
  "trigger": "user_manual",
  "device_type": "desktop",
  "browser": "Chrome",
  "system_theme": "dark",
  "timestamp": "2025-08-21T10:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Theme switch recorded",
  "switch_id": "switch-uuid",
  "analytics_updated": true,
  "switch_count": 16,
  "performance_metrics": {
    "switch_duration": "45ms",
    "success": true
  }
}
```

#### GET /api/themes/system-detection/
Get current system theme preferences (client-side detection helper).

**Response:**
```json
{
  "system_theme": "dark",
  "reduced_motion": false,
  "high_contrast": false,
  "supports_prefers_color_scheme": true,
  "supports_reduced_motion": true,
  "supports_high_contrast": true,
  "color_gamut": "p3",
  "display_mode": "standalone"
}
```

### Theme Analytics & Usage

#### GET /api/themes/analytics/
Get theme usage analytics for current user.

**Query Parameters:**
- `period`: Time period (day, week, month, quarter, year)
- `date_from`: Start date (YYYY-MM-DD)
- `date_to`: End date (YYYY-MM-DD)
- `device_type`: Filter by device type (desktop, mobile, tablet)

**Response:**
```json
{
  "period": "month",
  "date_range": {
    "from": "2025-08-01",
    "to": "2025-08-31"
  },
  "summary": {
    "total_switches": 45,
    "most_used_theme": "dark",
    "avg_switches_per_day": 1.5,
    "theme_distribution": {
      "light": 30,
      "dark": 65,
      "auto": 5
    }
  },
  "by_device": {
    "desktop": {
      "switches": 30,
      "most_used": "dark",
      "avg_session_duration": "02:15:30"
    },
    "mobile": {
      "switches": 15,
      "most_used": "auto",
      "avg_session_duration": "00:45:20"
    }
  },
  "trends": [
    {
      "date": "2025-08-21",
      "light_usage": 20,
      "dark_usage": 80,
      "switches": 2
    }
  ],
  "accessibility_usage": {
    "high_contrast": {
      "enabled_sessions": 5,
      "total_time": "01:30:00"
    },
    "reduced_motion": {
      "enabled_sessions": 2,
      "total_time": "00:20:00"
    }
  }
}
```

#### GET /api/themes/analytics/system/ (Admin)
System-wide theme analytics for administrators.

**Response:**
```json
{
  "global_stats": {
    "total_users": 2500,
    "active_users_today": 1800,
    "theme_preferences": {
      "auto": 1200,
      "light": 800,
      "dark": 500
    },
    "accessibility_users": {
      "high_contrast": 125,
      "reduced_motion": 200
    }
  },
  "usage_trends": {
    "dark_mode_adoption": {
      "current_month": 45.2,
      "last_month": 42.1,
      "growth": 3.1
    },
    "auto_detection_usage": 65.5,
    "manual_overrides": 34.5
  },
  "device_breakdown": {
    "desktop": {
      "users": 1500,
      "dark_mode_usage": 52.3,
      "avg_switches_per_user": 2.1
    },
    "mobile": {
      "users": 800,
      "dark_mode_usage": 38.7,
      "avg_switches_per_user": 1.4
    },
    "tablet": {
      "users": 200,
      "dark_mode_usage": 45.0,
      "avg_switches_per_user": 1.8
    }
  },
  "performance_metrics": {
    "avg_switch_time": "42ms",
    "success_rate": 99.8,
    "error_rate": 0.2
  }
}
```

### Theme Feedback & Support

#### POST /api/themes/feedback/
Submit theme-related feedback or bug report.

**Request Body:**
```json
{
  "feedback_type": "bug_report",
  "subject": "Dark mode calendar contrast issue",
  "description": "Calendar events are hard to read in dark mode on mobile devices",
  "severity": "medium",
  "theme_context": {
    "current_theme": "dark",
    "high_contrast": false,
    "reduced_motion": false,
    "device_type": "mobile",
    "browser": "Safari",
    "page_url": "/calendar",
    "viewport": {
      "width": 375,
      "height": 667
    }
  },
  "screenshot_data": "data:image/png;base64,..."
}
```

**Response:**
```json
{
  "success": true,
  "feedback_id": "feedback-uuid",
  "message": "Feedback submitted successfully",
  "ticket_number": "THEME-2025-001",
  "estimated_response_time": "2-3 business days",
  "tracking_url": "/feedback/feedback-uuid"
}
```

#### GET /api/themes/feedback/
List user's theme feedback submissions.

**Query Parameters:**
- `status`: Filter by status (new, in_progress, resolved, closed)
- `type`: Filter by feedback type
- `page`: Page number for pagination
- `limit`: Items per page

**Response:**
```json
{
  "count": 3,
  "results": [
    {
      "id": "feedback-uuid",
      "ticket_number": "THEME-2025-001",
      "feedback_type": "bug_report",
      "subject": "Dark mode calendar contrast issue",
      "severity": "medium",
      "status": "in_progress",
      "submitted_at": "2025-08-21T10:00:00Z",
      "last_update": "2025-08-21T14:30:00Z",
      "resolution": null
    }
  ]
}
```

### Theme Configuration (Admin)

#### GET /api/themes/config/
Get global theme configuration (admin only).

**Response:**
```json
{
  "default_theme": "auto",
  "allow_user_override": true,
  "enable_high_contrast": true,
  "enable_reduced_motion": true,
  "transition_duration": 300,
  "enable_system_detection": true,
  "supported_browsers": ["Chrome", "Firefox", "Safari", "Edge"],
  "accessibility_compliance": {
    "wcag_level": "AA",
    "min_contrast_ratio": 4.5,
    "large_text_ratio": 3.0
  },
  "performance_targets": {
    "max_switch_time": 50,
    "success_rate_threshold": 99.0
  },
  "analytics_retention": {
    "detailed_data_days": 90,
    "summary_data_days": 365
  }
}
```

#### PUT /api/themes/config/
Update global theme configuration (admin only).

**Request Body:**
```json
{
  "default_theme": "auto",
  "transition_duration": 250,
  "accessibility_compliance": {
    "min_contrast_ratio": 4.5
  }
}
```

#### GET /api/themes/health/
Get theme system health status (admin only).

**Response:**
```json
{
  "status": "healthy",
  "last_check": "2025-08-21T15:00:00Z",
  "metrics": {
    "css_load_time": "25ms",
    "avg_switch_time": "42ms",
    "error_rate": 0.2,
    "cache_hit_rate": 94.5
  },
  "issues": [
    {
      "severity": "warning",
      "message": "CSS custom property fallback used in 3 browsers",
      "count": 15,
      "first_seen": "2025-08-21T12:00:00Z"
    }
  ],
  "performance_alerts": [],
  "accessibility_violations": []
}
```

## Controllers

### ThemePreferencesController
Manages user theme preferences and system detection.

```python
class ThemePreferencesController:
    def get_user_preferences(self, user):
        """Get comprehensive user theme preferences"""
        try:
            preferences = UserThemePreferences.objects.get(user=user)
            
            # Get current system theme if available
            system_theme = self.detect_system_theme(request)
            resolved_theme = self.resolve_theme(preferences.theme_mode, system_theme)
            
            return {
                'theme_mode': preferences.theme_mode,
                'resolved_theme': resolved_theme,
                'high_contrast': preferences.high_contrast,
                'reduced_motion': preferences.reduced_motion,
                'device_preferences': preferences.device_preferences,
                'usage_stats': self.get_usage_stats(preferences),
                'system_detection': self.get_system_capabilities(request),
                'created_at': preferences.created_at,
                'updated_at': preferences.updated_at
            }
        except UserThemePreferences.DoesNotExist:
            return self.create_default_preferences(user)
    
    def update_preferences(self, user, preference_data):
        """Update user theme preferences with validation"""
        preferences, created = UserThemePreferences.objects.get_or_create(
            user=user,
            defaults=self.get_default_preference_values()
        )
        
        # Validate preference data
        validated_data = self.validate_preferences(preference_data)
        
        # Track what changed
        changed_fields = []
        for field, value in validated_data.items():
            if hasattr(preferences, field) and getattr(preferences, field) != value:
                setattr(preferences, field, value)
                changed_fields.append(field)
        
        if 'theme_mode' in changed_fields:
            preferences.increment_switch_count()
        
        preferences.save(update_fields=changed_fields + ['updated_at'])
        
        # Clear cache
        self.clear_preference_cache(user.id)
        
        # Update analytics
        self.record_preference_change(user, changed_fields, preference_data)
        
        return {
            'success': True,
            'updated_fields': changed_fields,
            'cache_cleared': True
        }
```

### ThemeAnalyticsController
Handles theme usage analytics and reporting.

```python
class ThemeAnalyticsController:
    def record_theme_switch(self, user, switch_data):
        """Record a theme switch event"""
        # Create usage session if needed
        session = self.get_or_create_session(user, switch_data)
        
        # Update session with switch
        session.theme_switches_in_session += 1
        session.final_theme = switch_data['to_theme']
        session.save()
        
        # Update user preferences counter
        if user and hasattr(user, 'theme_preferences'):
            user.theme_preferences.increment_switch_count()
        
        # Update daily analytics
        self.update_daily_analytics(switch_data)
        
        # Record performance metrics
        performance_data = self.extract_performance_metrics(switch_data)
        
        return {
            'success': True,
            'switch_id': str(uuid.uuid4()),
            'analytics_updated': True,
            'performance_metrics': performance_data
        }
    
    def get_user_analytics(self, user, filters):
        """Get theme analytics for a specific user"""
        # Get user's theme sessions and switches
        sessions = ThemeUsageSession.objects.filter(
            user=user,
            session_start__range=[filters['date_from'], filters['date_to']]
        )
        
        # Calculate metrics
        total_switches = sessions.aggregate(
            total=Sum('theme_switches_in_session')
        )['total'] or 0
        
        # Theme distribution
        theme_distribution = self.calculate_theme_distribution(sessions)
        
        # Device breakdown
        device_breakdown = self.calculate_device_breakdown(sessions)
        
        # Generate trends
        trends = self.generate_usage_trends(sessions, filters)
        
        return {
            'period': filters['period'],
            'date_range': filters,
            'summary': {
                'total_switches': total_switches,
                'most_used_theme': theme_distribution['most_used'],
                'theme_distribution': theme_distribution['percentages']
            },
            'by_device': device_breakdown,
            'trends': trends
        }
```

### ThemeFeedbackController
Manages theme-related feedback and bug reports.

```python
class ThemeFeedbackController:
    def submit_feedback(self, user, feedback_data):
        """Submit theme feedback with context"""
        # Extract technical context
        technical_context = self.extract_technical_context(feedback_data)
        
        # Process screenshot if provided
        screenshot_url = None
        if 'screenshot_data' in feedback_data:
            screenshot_url = self.process_screenshot(feedback_data['screenshot_data'])
        
        # Create feedback record
        feedback = ThemeFeedback.objects.create(
            user=user,
            feedback_type=feedback_data['feedback_type'],
            subject=feedback_data['subject'],
            description=feedback_data['description'],
            severity=feedback_data.get('severity', 'medium'),
            theme_when_submitted=feedback_data['theme_context']['current_theme'],
            high_contrast_enabled=feedback_data['theme_context']['high_contrast'],
            reduced_motion_enabled=feedback_data['theme_context']['reduced_motion'],
            browser_info=technical_context['browser'],
            device_info=technical_context['device'],
            page_url=feedback_data['theme_context'].get('page_url'),
            screenshot_url=screenshot_url
        )
        
        # Generate ticket number
        ticket_number = f"THEME-{datetime.now().year}-{feedback.id.hex[:3].upper()}"
        
        # Send notification to support team
        self.notify_support_team(feedback, ticket_number)
        
        return {
            'success': True,
            'feedback_id': feedback.id,
            'ticket_number': ticket_number,
            'estimated_response_time': '2-3 business days'
        }
```

## Security & Performance

### Authentication & Authorization
- **JWT Authentication**: All endpoints require valid user authentication
- **Role-Based Access**: Admin-only endpoints protected by role verification
- **Rate Limiting**: API endpoints limited to prevent abuse (100 requests/minute/user)
- **Input Validation**: All preference and feedback data validated and sanitized

### Data Protection
- **Preference Encryption**: Sensitive preference data encrypted at rest
- **Analytics Anonymization**: Personal data anonymized in aggregate analytics
- **Secure File Upload**: Screenshot uploads validated and virus-scanned
- **Audit Logging**: All preference changes and admin actions logged

### Performance Optimization
- **Preference Caching**: User preferences cached for 1 hour to reduce database load
- **CDN Delivery**: Theme CSS files served via CDN for optimal performance
- **Lazy Loading**: Non-critical theme assets loaded asynchronously
- **Bundle Splitting**: Theme-specific JavaScript bundled separately

### Error Handling
```python
class ThemeAPIException(APIException):
    """Custom exception for theme-related errors"""
    status_code = 400
    default_detail = 'Theme operation failed'
    
class ThemeValidationError(ThemeAPIException):
    """Validation error for theme preferences"""
    default_detail = 'Invalid theme preference data'

class ThemeSystemError(ThemeAPIException):
    """System-level theme error"""
    status_code = 500
    default_detail = 'Theme system temporarily unavailable'
```

The API provides comprehensive theme management capabilities with robust analytics, user feedback collection, and administrative controls while maintaining high performance and security standards.