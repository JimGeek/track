# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-email-notifications/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### New Models

#### NotificationPreferences Model
```python
class NotificationPreferences(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Global Settings
    email_enabled = models.BooleanField(default=True)
    time_zone = models.CharField(max_length=50, default='UTC')
    preferred_language = models.CharField(max_length=10, default='en')
    
    # Working Hours (for delayed notifications)
    work_hours_start = models.TimeField(default='09:00')
    work_hours_end = models.TimeField(default='17:00')
    work_days = models.JSONField(default=list)  # [1,2,3,4,5] for Mon-Fri
    respect_work_hours = models.BooleanField(default=True)
    
    # Digest Settings
    daily_digest_enabled = models.BooleanField(default=True)
    daily_digest_time = models.TimeField(default='09:00')
    weekly_digest_enabled = models.BooleanField(default=True)
    weekly_digest_day = models.IntegerField(default=1)  # Monday
    weekly_digest_time = models.TimeField(default='09:00')
    
    # Batching Settings
    enable_smart_batching = models.BooleanField(default=True)
    max_notifications_per_hour = models.IntegerField(default=10)
    
    # Individual Notification Types
    notification_types = models.JSONField(default=dict)  # Type-specific settings
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_preferences'
        indexes = [
            models.Index(fields=['user']),
        ]
```

#### NotificationTemplate Model
```python
class NotificationTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)  # Used for programmatic access
    description = models.TextField(blank=True)
    
    # Template Type and Category
    notification_type = models.CharField(max_length=100, choices=[
        ('deadline_reminder', 'Deadline Reminder'),
        ('status_update', 'Status Update'),
        ('assignment_notification', 'Assignment Notification'),
        ('milestone_alert', 'Milestone Alert'),
        ('digest_email', 'Digest Email'),
        ('system_notification', 'System Notification'),
        ('collaboration_alert', 'Collaboration Alert'),
    ])
    
    category = models.CharField(max_length=50, choices=[
        ('immediate', 'Immediate'),
        ('scheduled', 'Scheduled'),
        ('digest', 'Digest'),
        ('system', 'System'),
    ])
    
    # Template Content
    subject_template = models.TextField()
    html_template = models.TextField()
    text_template = models.TextField()
    
    # Template Metadata
    variables = models.JSONField(default=list)  # List of available template variables
    default_context = models.JSONField(default=dict)  # Default values for variables
    
    # Organization and Sharing
    organization = models.ForeignKey('Organization', null=True, blank=True, on_delete=models.CASCADE)
    is_system_template = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Version Control
    version = models.CharField(max_length=20, default='1.0.0')
    parent_template = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE)
    
    # Usage Tracking
    usage_count = models.IntegerField(default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        db_table = 'notification_templates'
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['notification_type', 'is_active']),
            models.Index(fields=['organization', '-created_at']),
            models.Index(fields=['is_system_template', 'is_active']),
        ]
        unique_together = ['slug', 'organization']
```

#### NotificationQueue Model
```python
class NotificationQueue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='queued_notifications')
    
    # Notification Content
    notification_type = models.CharField(max_length=100)
    template = models.ForeignKey(NotificationTemplate, on_delete=models.CASCADE)
    subject = models.CharField(max_length=255)
    html_content = models.TextField()
    text_content = models.TextField()
    
    # Context and Metadata
    context_data = models.JSONField(default=dict)  # Data used to render template
    related_object_type = models.CharField(max_length=100, blank=True)
    related_object_id = models.CharField(max_length=100, blank=True)
    
    # Scheduling and Priority
    priority = models.IntegerField(default=5, choices=[
        (1, 'Critical'),
        (3, 'High'),
        (5, 'Normal'),
        (7, 'Low'),
        (9, 'Batch'),
    ])
    
    scheduled_for = models.DateTimeField(default=timezone.now)
    delay_until = models.DateTimeField(null=True, blank=True)  # For work hours respect
    
    # Processing Status
    status = models.CharField(max_length=20, choices=[
        ('queued', 'Queued'),
        ('processing', 'Processing'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('batched', 'Batched'),
    ], default='queued')
    
    # Batch Information
    batch_id = models.UUIDField(null=True, blank=True)
    is_batch_notification = models.BooleanField(default=False)
    
    # Processing Details
    attempts = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notification_queue'
        indexes = [
            models.Index(fields=['status', 'scheduled_for']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['priority', 'scheduled_for']),
            models.Index(fields=['batch_id']),
            models.Index(fields=['related_object_type', 'related_object_id']),
        ]
```

#### NotificationHistory Model
```python
class NotificationHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notification_history')
    
    # Notification Details
    notification_type = models.CharField(max_length=100)
    template_used = models.ForeignKey(NotificationTemplate, null=True, on_delete=models.SET_NULL)
    subject = models.CharField(max_length=255)
    
    # Delivery Information
    recipient_email = models.EmailField()
    sender_email = models.EmailField()
    
    # Content (truncated for storage efficiency)
    content_preview = models.TextField(max_length=500)
    
    # Related Objects
    related_object_type = models.CharField(max_length=100, blank=True)
    related_object_id = models.CharField(max_length=100, blank=True)
    
    # Delivery Status
    status = models.CharField(max_length=20, choices=[
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('opened', 'Opened'),
        ('clicked', 'Clicked'),
        ('bounced', 'Bounced'),
        ('complained', 'Complained'),
        ('unsubscribed', 'Unsubscribed'),
    ])
    
    # Provider Information
    email_provider = models.CharField(max_length=50)
    provider_message_id = models.CharField(max_length=255, blank=True)
    
    # Engagement Tracking
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    bounce_reason = models.TextField(blank=True)
    
    # Timestamps
    sent_at = models.DateTimeField()
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notification_history'
        indexes = [
            models.Index(fields=['user', '-sent_at']),
            models.Index(fields=['status', '-sent_at']),
            models.Index(fields=['notification_type', '-sent_at']),
            models.Index(fields=['provider_message_id']),
            models.Index(fields=['related_object_type', 'related_object_id']),
        ]
```

#### NotificationUnsubscribe Model
```python
class NotificationUnsubscribe(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='unsubscriptions')
    
    # Unsubscribe Details
    notification_type = models.CharField(max_length=100)
    unsubscribe_token = models.CharField(max_length=255, unique=True)
    
    # Reason and Context
    reason = models.CharField(max_length=50, choices=[
        ('user_request', 'User Request'),
        ('bounce_limit', 'Bounce Limit Exceeded'),
        ('complaint', 'Spam Complaint'),
        ('admin_action', 'Admin Action'),
    ])
    
    feedback = models.TextField(blank=True)  # User-provided feedback
    
    # Timestamps
    unsubscribed_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)  # For temporary unsubscribes
    
    class Meta:
        db_table = 'notification_unsubscribes'
        unique_together = ['user', 'notification_type']
        indexes = [
            models.Index(fields=['user', 'notification_type']),
            models.Index(fields=['unsubscribe_token']),
        ]
```

#### EmailDeliveryStats Model
```python
class EmailDeliveryStats(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    # Time Period
    date = models.DateField()
    hour = models.IntegerField(null=True, blank=True)  # For hourly stats
    
    # Email Provider
    provider = models.CharField(max_length=50)
    
    # Delivery Metrics
    emails_sent = models.IntegerField(default=0)
    emails_delivered = models.IntegerField(default=0)
    emails_bounced = models.IntegerField(default=0)
    emails_opened = models.IntegerField(default=0)
    emails_clicked = models.IntegerField(default=0)
    complaints = models.IntegerField(default=0)
    unsubscribes = models.IntegerField(default=0)
    
    # Performance Metrics
    avg_delivery_time = models.DurationField(null=True, blank=True)
    delivery_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    bounce_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    open_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    click_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'email_delivery_stats'
        unique_together = ['date', 'hour', 'provider']
        indexes = [
            models.Index(fields=['-date', 'provider']),
            models.Index(fields=['-date', 'hour']),
        ]
```

## Migrations

### Migration 001: Initial Notification Models
```python
from django.db import migrations, models
import django.db.models.deletion
import uuid

class Migration(migrations.Migration):
    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('tracking', '0016_add_export_functionality'),  # Previous migration
    ]

    operations = [
        migrations.CreateModel(
            name='NotificationPreferences',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('email_enabled', models.BooleanField(default=True)),
                ('time_zone', models.CharField(default='UTC', max_length=50)),
                ('preferred_language', models.CharField(default='en', max_length=10)),
                ('work_hours_start', models.TimeField(default='09:00')),
                ('work_hours_end', models.TimeField(default='17:00')),
                ('work_days', models.JSONField(default=list)),
                ('respect_work_hours', models.BooleanField(default=True)),
                ('daily_digest_enabled', models.BooleanField(default=True)),
                ('daily_digest_time', models.TimeField(default='09:00')),
                ('weekly_digest_enabled', models.BooleanField(default=True)),
                ('weekly_digest_day', models.IntegerField(default=1)),
                ('weekly_digest_time', models.TimeField(default='09:00')),
                ('enable_smart_batching', models.BooleanField(default=True)),
                ('max_notifications_per_hour', models.IntegerField(default=10)),
                ('notification_types', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, 
                                            related_name='notification_preferences', to='auth.user')),
            ],
            options={
                'db_table': 'notification_preferences',
            },
        ),
        # ... Additional model creations
    ]
```

### Migration 002: Add Default Templates
```python
def create_default_templates(apps, schema_editor):
    NotificationTemplate = apps.get_model('notifications', 'NotificationTemplate')
    
    default_templates = [
        {
            'name': 'Task Deadline Reminder',
            'slug': 'task-deadline-reminder',
            'notification_type': 'deadline_reminder',
            'category': 'scheduled',
            'subject_template': 'Reminder: {{ task.title }} is due {{ due_date|naturaltime }}',
            'html_template': '''
                <h2>Task Deadline Reminder</h2>
                <p>Hello {{ user.first_name }},</p>
                <p>This is a reminder that your task "<strong>{{ task.title }}</strong>" 
                   is due {{ due_date|naturaltime }}.</p>
                <p><a href="{{ task_url }}">View Task</a></p>
            ''',
            'text_template': '''
                Task Deadline Reminder
                
                Hello {{ user.first_name }},
                
                This is a reminder that your task "{{ task.title }}" is due {{ due_date|naturaltime }}.
                
                View Task: {{ task_url }}
            ''',
            'variables': ['user', 'task', 'due_date', 'task_url'],
            'is_system_template': True,
        },
        # ... Additional default templates
    ]
    
    for template_data in default_templates:
        NotificationTemplate.objects.create(**template_data)
```

### Migration 003: Add Indexes for Performance
```python
class Migration(migrations.Migration):
    dependencies = [
        ('notifications', '0002_default_templates'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='notificationqueue',
            index=models.Index(fields=['status', 'scheduled_for'], name='notif_queue_status_sched_idx'),
        ),
        migrations.AddIndex(
            model_name='notificationhistory',
            index=models.Index(fields=['user', '-sent_at'], name='notif_history_user_sent_idx'),
        ),
        # ... Additional indexes
    ]
```

### Data Migration: User Preferences
```python
def create_default_preferences(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    NotificationPreferences = apps.get_model('notifications', 'NotificationPreferences')
    
    for user in User.objects.all():
        if not hasattr(user, 'notification_preferences'):
            NotificationPreferences.objects.create(
                user=user,
                notification_types={
                    'deadline_reminder': {'enabled': True, 'advance_days': [1, 3]},
                    'status_update': {'enabled': True, 'immediate': True},
                    'assignment_notification': {'enabled': True, 'immediate': True},
                    'milestone_alert': {'enabled': True, 'immediate': False},
                    'digest_email': {'enabled': True},
                    'system_notification': {'enabled': True, 'immediate': True},
                }
            )
```

## Performance Considerations

### Database Optimization
- **Partitioning**: Consider partitioning `notification_history` by date for large volumes
- **Indexing Strategy**: Composite indexes for common query patterns
- **Data Retention**: Automated cleanup of old notification history records
- **Connection Pooling**: Optimize database connections for high-volume processing

### Query Optimization
- **Bulk Operations**: Use bulk_create/bulk_update for batch processing
- **Select Related**: Optimize queries with proper select_related/prefetch_related
- **Database Functions**: Use database-level functions for aggregations
- **Materialized Views**: Consider for complex analytics queries