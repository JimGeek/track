# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-email-notifications/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Notification Preferences Management

#### GET /api/notifications/preferences/
Retrieve current user's notification preferences.

**Response:**
```json
{
  "email_enabled": true,
  "time_zone": "America/New_York",
  "preferred_language": "en",
  "work_hours": {
    "start": "09:00",
    "end": "17:00",
    "days": [1, 2, 3, 4, 5],
    "respect_work_hours": true
  },
  "digest_settings": {
    "daily_digest": {
      "enabled": true,
      "time": "09:00"
    },
    "weekly_digest": {
      "enabled": true,
      "day": 1,
      "time": "09:00"
    }
  },
  "batching": {
    "enabled": true,
    "max_per_hour": 10
  },
  "notification_types": {
    "deadline_reminder": {
      "enabled": true,
      "immediate": false,
      "advance_days": [1, 3, 7],
      "batch_allowed": true
    },
    "status_update": {
      "enabled": true,
      "immediate": true,
      "batch_allowed": false
    },
    "assignment_notification": {
      "enabled": true,
      "immediate": true,
      "batch_allowed": false
    },
    "milestone_alert": {
      "enabled": true,
      "immediate": false,
      "batch_allowed": true
    },
    "digest_email": {
      "enabled": true
    },
    "system_notification": {
      "enabled": true,
      "immediate": true
    }
  }
}
```

#### PUT /api/notifications/preferences/
Update user's notification preferences.

**Request Body:**
```json
{
  "email_enabled": true,
  "time_zone": "America/New_York",
  "work_hours": {
    "start": "09:00",
    "end": "17:00",
    "days": [1, 2, 3, 4, 5],
    "respect_work_hours": true
  },
  "notification_types": {
    "deadline_reminder": {
      "enabled": true,
      "advance_days": [1, 3]
    }
  }
}
```

**Response:**
```json
{
  "message": "Preferences updated successfully",
  "updated_fields": ["work_hours", "notification_types"]
}
```

### Notification History

#### GET /api/notifications/history/
Retrieve user's notification history with filtering and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `type`: Filter by notification type
- `status`: Filter by delivery status
- `date_from`: Start date (YYYY-MM-DD)
- `date_to`: End date (YYYY-MM-DD)
- `search`: Search in subject and content

**Response:**
```json
{
  "count": 150,
  "next": "/api/notifications/history/?page=2",
  "previous": null,
  "results": [
    {
      "id": "notification-uuid",
      "notification_type": "deadline_reminder",
      "subject": "Reminder: Project Review is due tomorrow",
      "status": "delivered",
      "recipient_email": "user@example.com",
      "content_preview": "Hello John, This is a reminder that your task...",
      "related_object": {
        "type": "task",
        "id": "task-uuid",
        "title": "Project Review"
      },
      "sent_at": "2025-08-21T09:00:00Z",
      "delivered_at": "2025-08-21T09:00:15Z",
      "opened_at": "2025-08-21T10:30:00Z",
      "clicked_at": null,
      "provider": "sendgrid"
    }
  ]
}
```

#### GET /api/notifications/history/{id}/
Get detailed information about a specific notification.

**Response:**
```json
{
  "id": "notification-uuid",
  "notification_type": "deadline_reminder",
  "template_used": {
    "id": "template-uuid",
    "name": "Task Deadline Reminder",
    "version": "1.0.0"
  },
  "subject": "Reminder: Project Review is due tomorrow",
  "status": "delivered",
  "recipient_email": "user@example.com",
  "sender_email": "notifications@trackapp.com",
  "content_preview": "Hello John, This is a reminder...",
  "related_object": {
    "type": "task",
    "id": "task-uuid",
    "title": "Project Review",
    "url": "/tasks/task-uuid"
  },
  "delivery_details": {
    "provider": "sendgrid",
    "provider_message_id": "14c5d75ce93.dfd.64b469@ismtpd-555",
    "attempts": 1,
    "sent_at": "2025-08-21T09:00:00Z",
    "delivered_at": "2025-08-21T09:00:15Z",
    "opened_at": "2025-08-21T10:30:00Z",
    "clicked_at": null
  }
}
```

### Notification Templates (Admin)

#### GET /api/notifications/templates/
List available notification templates.

**Query Parameters:**
- `type`: Filter by notification type
- `category`: Filter by category
- `active`: Filter by active status (true/false)
- `system`: Show only system templates (true/false)

**Response:**
```json
{
  "results": [
    {
      "id": "template-uuid",
      "name": "Task Deadline Reminder",
      "slug": "task-deadline-reminder",
      "notification_type": "deadline_reminder",
      "category": "scheduled",
      "is_system_template": true,
      "is_active": true,
      "version": "1.0.0",
      "usage_count": 1250,
      "last_used": "2025-08-21T10:00:00Z",
      "created_at": "2025-08-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/notifications/templates/
Create a new notification template (admin only).

**Request Body:**
```json
{
  "name": "Custom Milestone Alert",
  "slug": "custom-milestone-alert",
  "notification_type": "milestone_alert",
  "category": "immediate",
  "subject_template": "🎉 Milestone achieved: {{ milestone.title }}",
  "html_template": "<h2>Congratulations!</h2><p>You've achieved the milestone: <strong>{{ milestone.title }}</strong></p>",
  "text_template": "Congratulations! You've achieved the milestone: {{ milestone.title }}",
  "variables": ["milestone", "user", "project"],
  "default_context": {
    "celebration_emoji": "🎉"
  }
}
```

#### PUT /api/notifications/templates/{id}/
Update an existing notification template.

#### DELETE /api/notifications/templates/{id}/
Delete a notification template (admin only).

### Notification Queue Management

#### GET /api/notifications/queue/
View current notification queue status (admin only).

**Query Parameters:**
- `status`: Filter by queue status
- `user`: Filter by user ID
- `priority`: Filter by priority level

**Response:**
```json
{
  "queue_stats": {
    "total_queued": 1250,
    "processing": 15,
    "failed": 3,
    "avg_wait_time": "00:02:30",
    "oldest_queued": "2025-08-21T09:45:00Z"
  },
  "notifications": [
    {
      "id": "queue-item-uuid",
      "user": "user@example.com",
      "notification_type": "deadline_reminder",
      "subject": "Task due tomorrow",
      "priority": 5,
      "status": "queued",
      "scheduled_for": "2025-08-21T10:00:00Z",
      "attempts": 0,
      "created_at": "2025-08-21T09:00:00Z"
    }
  ]
}
```

#### POST /api/notifications/send/
Send an immediate notification (admin/system use).

**Request Body:**
```json
{
  "user_id": "user-uuid",
  "notification_type": "system_notification",
  "template_slug": "system-maintenance-alert",
  "context": {
    "maintenance_date": "2025-08-22T02:00:00Z",
    "duration": "2 hours",
    "impact": "Brief service interruption expected"
  },
  "priority": 1,
  "send_immediately": true
}
```

### Unsubscribe Management

#### POST /api/notifications/unsubscribe/
Unsubscribe from specific notification types.

**Request Body:**
```json
{
  "notification_types": ["digest_email", "milestone_alert"],
  "reason": "user_request",
  "feedback": "Too many emails, prefer to check the app directly"
}
```

**Response:**
```json
{
  "message": "Successfully unsubscribed from specified notification types",
  "unsubscribed_types": ["digest_email", "milestone_alert"],
  "unsubscribe_token": "secure-unsubscribe-token"
}
```

#### GET /api/notifications/unsubscribe/{token}/
Process unsubscribe via email link (public endpoint).

**Response:**
```json
{
  "user": "user@example.com",
  "notification_type": "digest_email",
  "unsubscribed": true,
  "message": "You have been successfully unsubscribed from digest emails"
}
```

#### POST /api/notifications/resubscribe/
Re-enable previously disabled notification types.

**Request Body:**
```json
{
  "notification_types": ["digest_email"]
}
```

### Analytics & Reporting

#### GET /api/notifications/analytics/
Get notification analytics for the current user.

**Query Parameters:**
- `period`: Time period (day, week, month, quarter)
- `date_from`: Start date
- `date_to`: End date

**Response:**
```json
{
  "period": "month",
  "date_range": {
    "from": "2025-08-01",
    "to": "2025-08-31"
  },
  "summary": {
    "total_sent": 45,
    "total_delivered": 43,
    "total_opened": 28,
    "total_clicked": 12,
    "delivery_rate": 95.56,
    "open_rate": 65.12,
    "click_rate": 27.91
  },
  "by_type": {
    "deadline_reminder": {
      "sent": 20,
      "opened": 15,
      "clicked": 8
    },
    "status_update": {
      "sent": 15,
      "opened": 10,
      "clicked": 3
    }
  },
  "trends": [
    {
      "date": "2025-08-21",
      "sent": 3,
      "opened": 2,
      "clicked": 1
    }
  ]
}
```

#### GET /api/notifications/analytics/system/ (Admin)
System-wide notification analytics.

**Response:**
```json
{
  "global_stats": {
    "total_users": 1500,
    "active_users": 1200,
    "opt_out_rate": 12.5,
    "avg_notifications_per_user": 15.3
  },
  "delivery_performance": {
    "total_sent": 22500,
    "delivery_rate": 97.2,
    "bounce_rate": 1.8,
    "complaint_rate": 0.1
  },
  "provider_performance": {
    "sendgrid": {
      "sent": 15000,
      "delivery_rate": 97.8,
      "avg_delivery_time": "00:00:45"
    },
    "mailgun": {
      "sent": 7500,
      "delivery_rate": 96.2,
      "avg_delivery_time": "00:01:12"
    }
  }
}
```

## Controllers

### NotificationPreferencesController
Manages user notification preferences and settings.

```python
class NotificationPreferencesController:
    def get_user_preferences(self, user):
        """Get user's notification preferences with defaults"""
        preferences, created = NotificationPreferences.objects.get_or_create(
            user=user,
            defaults=self.get_default_preferences()
        )
        return self.serialize_preferences(preferences)
    
    def update_preferences(self, user, preference_data):
        """Update user preferences with validation"""
        preferences = self.get_user_preferences_object(user)
        
        # Validate preference data
        validated_data = self.validate_preferences(preference_data)
        
        # Update preferences
        updated_fields = []
        for field, value in validated_data.items():
            if hasattr(preferences, field):
                setattr(preferences, field, value)
                updated_fields.append(field)
        
        preferences.save(update_fields=updated_fields + ['updated_at'])
        
        # Clear preference cache
        self.clear_preference_cache(user)
        
        return {
            'message': 'Preferences updated successfully',
            'updated_fields': updated_fields
        }
```

### NotificationQueueController
Manages notification queuing and processing.

```python
class NotificationQueueController:
    def queue_notification(self, user, notification_type, context, **options):
        """Queue a notification for processing"""
        # Check if user has opted out
        if self.is_user_opted_out(user, notification_type):
            return {'status': 'skipped', 'reason': 'user_opted_out'}
        
        # Get user preferences
        preferences = self.get_user_preferences(user)
        
        # Apply smart batching logic
        if self.should_batch_notification(user, notification_type, preferences):
            return self.add_to_batch(user, notification_type, context)
        
        # Create immediate notification
        template = self.get_template(notification_type)
        rendered_content = self.render_notification(template, context, user)
        
        notification = NotificationQueue.objects.create(
            user=user,
            notification_type=notification_type,
            template=template,
            subject=rendered_content['subject'],
            html_content=rendered_content['html'],
            text_content=rendered_content['text'],
            context_data=context,
            priority=options.get('priority', 5),
            scheduled_for=self.calculate_send_time(user, preferences)
        )
        
        # Queue for processing
        process_notification.delay(notification.id)
        
        return {'status': 'queued', 'notification_id': notification.id}
    
    def should_batch_notification(self, user, notification_type, preferences):
        """Determine if notification should be batched"""
        type_settings = preferences.notification_types.get(notification_type, {})
        
        # Don't batch immediate notifications
        if type_settings.get('immediate', False):
            return False
        
        # Check if batching is enabled
        if not preferences.enable_smart_batching:
            return False
        
        # Check rate limits
        recent_count = self.get_recent_notification_count(user, hours=1)
        if recent_count >= preferences.max_notifications_per_hour:
            return True
        
        return type_settings.get('batch_allowed', False)
```

### NotificationDeliveryController
Handles email delivery with provider management.

```python
class NotificationDeliveryController:
    def __init__(self):
        self.providers = {
            'sendgrid': SendGridProvider(),
            'mailgun': MailgunProvider(),
            'ses': SESProvider(),
        }
        self.primary_provider = 'sendgrid'
    
    def send_notification(self, notification):
        """Send notification with provider failover"""
        try:
            provider = self.get_active_provider()
            result = provider.send_email(
                to=notification.user.email,
                subject=notification.subject,
                html_content=notification.html_content,
                text_content=notification.text_content
            )
            
            # Update notification status
            notification.status = 'sent'
            notification.processed_at = timezone.now()
            notification.save()
            
            # Record delivery history
            self.record_delivery_history(notification, result)
            
            return result
            
        except EmailDeliveryException as e:
            self.handle_delivery_failure(notification, e)
            raise
    
    def handle_delivery_failure(self, notification, error):
        """Handle failed email delivery with retry logic"""
        notification.attempts += 1
        notification.error_message = str(error)
        
        if notification.attempts >= notification.max_attempts:
            notification.status = 'failed'
        else:
            # Schedule retry with exponential backoff
            retry_delay = 2 ** notification.attempts * 60  # minutes
            retry_time = timezone.now() + timedelta(minutes=retry_delay)
            notification.scheduled_for = retry_time
        
        notification.save()
```

### Security & Access Control

#### Authentication & Authorization
- JWT token validation for all authenticated endpoints
- Role-based access control for administrative functions
- User ownership verification for personal preferences and history
- Rate limiting to prevent API abuse (1000 requests per hour per user)

#### Data Protection
- Encryption of sensitive notification content
- Secure unsubscribe token generation and validation
- Audit logging of all preference changes and administrative actions
- GDPR compliance with data export and deletion capabilities

#### Email Security
- DKIM and SPF configuration for email authentication
- Bounce and complaint handling to maintain sender reputation
- Unsubscribe link validation and secure token generation
- Content sanitization to prevent email-based attacks