# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-dark-mode-theme/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### New Models

#### UserThemePreferences Model
```python
class UserThemePreferences(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='theme_preferences')
    
    # Theme Settings
    theme_mode = models.CharField(max_length=20, choices=[
        ('auto', 'Auto (System)'),
        ('light', 'Light'),
        ('dark', 'Dark'),
    ], default='auto')
    
    # Accessibility Settings
    high_contrast = models.BooleanField(default=False)
    reduced_motion = models.BooleanField(default=False)  # Override system preference
    
    # Device-Specific Preferences (JSON field for flexibility)
    device_preferences = models.JSONField(default=dict, help_text="Store preferences per device/browser")
    
    # Usage Tracking
    theme_switches_count = models.IntegerField(default=0)
    last_theme_change = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_theme_preferences'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['theme_mode']),
        ]
    
    def increment_switch_count(self):
        """Increment theme switch counter and update timestamp"""
        self.theme_switches_count += 1
        self.last_theme_change = timezone.now()
        self.save(update_fields=['theme_switches_count', 'last_theme_change'])
```

#### ThemeAnalytics Model
```python
class ThemeAnalytics(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    
    # Time Period
    date = models.DateField()
    hour = models.IntegerField(null=True, blank=True)  # For hourly analytics
    
    # User Segmentation
    user_count = models.IntegerField(default=0)
    new_user_count = models.IntegerField(default=0)
    returning_user_count = models.IntegerField(default=0)
    
    # Theme Usage Statistics
    auto_theme_users = models.IntegerField(default=0)
    light_theme_users = models.IntegerField(default=0)
    dark_theme_users = models.IntegerField(default=0)
    
    # System Theme Distribution (for auto users)
    system_light_users = models.IntegerField(default=0)
    system_dark_users = models.IntegerField(default=0)
    
    # Accessibility Usage
    high_contrast_users = models.IntegerField(default=0)
    reduced_motion_users = models.IntegerField(default=0)
    
    # Engagement Metrics
    total_theme_switches = models.IntegerField(default=0)
    avg_switches_per_user = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Performance Metrics
    avg_switch_time = models.DurationField(null=True, blank=True)
    switch_success_rate = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    
    # Device/Browser Breakdown
    device_breakdown = models.JSONField(default=dict)  # Mobile, Desktop, Tablet counts
    browser_breakdown = models.JSONField(default=dict)  # Chrome, Firefox, Safari counts
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'theme_analytics'
        unique_together = ['date', 'hour']
        indexes = [
            models.Index(fields=['-date']),
            models.Index(fields=['-date', 'hour']),
        ]
```

#### ThemeUsageSession Model
```python
class ThemeUsageSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='theme_sessions', null=True, blank=True)
    
    # Session Identification
    session_id = models.CharField(max_length=255)  # Browser session ID
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    
    # Device Information
    device_type = models.CharField(max_length=50, choices=[
        ('desktop', 'Desktop'),
        ('mobile', 'Mobile'),
        ('tablet', 'Tablet'),
    ], null=True, blank=True)
    
    browser = models.CharField(max_length=100, blank=True)
    operating_system = models.CharField(max_length=100, blank=True)
    
    # Theme Usage During Session
    initial_theme = models.CharField(max_length=20, choices=[
        ('auto', 'Auto'),
        ('light', 'Light'),
        ('dark', 'Dark'),
    ])
    
    final_theme = models.CharField(max_length=20, choices=[
        ('auto', 'Auto'),
        ('light', 'Light'),
        ('dark', 'Dark'),
    ])
    
    # Session Metrics
    theme_switches_in_session = models.IntegerField(default=0)
    session_duration = models.DurationField(null=True, blank=True)
    pages_viewed = models.IntegerField(default=0)
    
    # System Preferences Detected
    system_theme_preference = models.CharField(max_length=10, choices=[
        ('light', 'Light'),
        ('dark', 'Dark'),
    ], null=True, blank=True)
    
    system_reduced_motion = models.BooleanField(default=False)
    
    # Timestamps
    session_start = models.DateTimeField(auto_now_add=True)
    session_end = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'theme_usage_sessions'
        indexes = [
            models.Index(fields=['user', '-session_start']),
            models.Index(fields=['session_id']),
            models.Index(fields=['-session_start']),
            models.Index(fields=['device_type', '-session_start']),
        ]
```

#### ThemeFeedback Model
```python
class ThemeFeedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='theme_feedback', null=True, blank=True)
    
    # Feedback Type
    feedback_type = models.CharField(max_length=50, choices=[
        ('bug_report', 'Bug Report'),
        ('feature_request', 'Feature Request'),
        ('usability_issue', 'Usability Issue'),
        ('accessibility_issue', 'Accessibility Issue'),
        ('general_feedback', 'General Feedback'),
    ])
    
    # Theme Context
    theme_when_submitted = models.CharField(max_length=20, choices=[
        ('light', 'Light'),
        ('dark', 'Dark'),
    ])
    
    high_contrast_enabled = models.BooleanField(default=False)
    reduced_motion_enabled = models.BooleanField(default=False)
    
    # Feedback Content
    subject = models.CharField(max_length=255)
    description = models.TextField()
    severity = models.CharField(max_length=20, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ], default='medium')
    
    # Technical Context
    browser_info = models.JSONField(default=dict)
    device_info = models.JSONField(default=dict)
    page_url = models.URLField(blank=True)
    screenshot_url = models.URLField(blank=True)
    
    # Status and Resolution
    status = models.CharField(max_length=20, choices=[
        ('new', 'New'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ], default='new')
    
    resolution = models.TextField(blank=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_theme_feedback')
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'theme_feedback'
        indexes = [
            models.Index(fields=['user', '-submitted_at']),
            models.Index(fields=['status', '-submitted_at']),
            models.Index(fields=['feedback_type', '-submitted_at']),
            models.Index(fields=['severity', '-submitted_at']),
        ]
```

## Migrations

### Migration 001: Initial Theme Models
```python
from django.db import migrations, models
import django.db.models.deletion
import uuid
from django.utils import timezone

class Migration(migrations.Migration):
    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('tracking', '0017_add_email_notifications'),  # Previous migration
    ]

    operations = [
        migrations.CreateModel(
            name='UserThemePreferences',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('theme_mode', models.CharField(choices=[('auto', 'Auto (System)'), ('light', 'Light'), ('dark', 'Dark')], default='auto', max_length=20)),
                ('high_contrast', models.BooleanField(default=False)),
                ('reduced_motion', models.BooleanField(default=False)),
                ('device_preferences', models.JSONField(default=dict)),
                ('theme_switches_count', models.IntegerField(default=0)),
                ('last_theme_change', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='theme_preferences', to='auth.user')),
            ],
            options={
                'db_table': 'user_theme_preferences',
            },
        ),
        
        migrations.CreateModel(
            name='ThemeAnalytics',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('date', models.DateField()),
                ('hour', models.IntegerField(blank=True, null=True)),
                ('user_count', models.IntegerField(default=0)),
                ('new_user_count', models.IntegerField(default=0)),
                ('returning_user_count', models.IntegerField(default=0)),
                ('auto_theme_users', models.IntegerField(default=0)),
                ('light_theme_users', models.IntegerField(default=0)),
                ('dark_theme_users', models.IntegerField(default=0)),
                ('system_light_users', models.IntegerField(default=0)),
                ('system_dark_users', models.IntegerField(default=0)),
                ('high_contrast_users', models.IntegerField(default=0)),
                ('reduced_motion_users', models.IntegerField(default=0)),
                ('total_theme_switches', models.IntegerField(default=0)),
                ('avg_switches_per_user', models.DecimalField(decimal_places=2, default=0, max_digits=5)),
                ('avg_switch_time', models.DurationField(blank=True, null=True)),
                ('switch_success_rate', models.DecimalField(decimal_places=2, default=100, max_digits=5)),
                ('device_breakdown', models.JSONField(default=dict)),
                ('browser_breakdown', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'theme_analytics',
            },
        ),
        # ... Additional model creations
    ]
```

### Migration 002: Add Indexes
```python
class Migration(migrations.Migration):
    dependencies = [
        ('themes', '0001_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='userthemepreferences',
            index=models.Index(fields=['user'], name='theme_user_idx'),
        ),
        migrations.AddIndex(
            model_name='userthemepreferences',
            index=models.Index(fields=['theme_mode'], name='theme_mode_idx'),
        ),
        migrations.AddIndex(
            model_name='themeanalytics',
            index=models.Index(fields=['-date'], name='theme_analytics_date_idx'),
        ),
        migrations.AddIndex(
            model_name='themeanalytics',
            index=models.Index(fields=['-date', 'hour'], name='theme_analytics_date_hour_idx'),
        ),
        # ... Additional indexes
    ]
```

### Data Migration: Default Preferences
```python
def create_default_theme_preferences(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    UserThemePreferences = apps.get_model('themes', 'UserThemePreferences')
    
    # Create default preferences for existing users
    users_without_preferences = User.objects.filter(theme_preferences__isnull=True)
    
    preferences_to_create = []
    for user in users_without_preferences:
        preferences_to_create.append(
            UserThemePreferences(
                user=user,
                theme_mode='auto',
                high_contrast=False,
                reduced_motion=False,
                device_preferences={},
                theme_switches_count=0
            )
        )
    
    # Bulk create for performance
    UserThemePreferences.objects.bulk_create(preferences_to_create, ignore_conflicts=True)

class Migration(migrations.Migration):
    dependencies = [
        ('themes', '0002_add_indexes'),
    ]

    operations = [
        migrations.RunPython(create_default_theme_preferences),
    ]
```

### Migration 003: Add Analytics Triggers
```python
class Migration(migrations.Migration):
    dependencies = [
        ('themes', '0003_default_preferences'),
    ]

    operations = [
        # Add database triggers for analytics (PostgreSQL specific)
        migrations.RunSQL(
            """
            CREATE OR REPLACE FUNCTION update_theme_analytics()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Update daily analytics when theme preferences change
                INSERT INTO theme_analytics (date, user_count, updated_at, created_at)
                VALUES (CURRENT_DATE, 1, NOW(), NOW())
                ON CONFLICT (date) 
                DO UPDATE SET 
                    updated_at = NOW(),
                    user_count = theme_analytics.user_count + 1;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            
            CREATE TRIGGER theme_preferences_analytics_trigger
                AFTER INSERT OR UPDATE ON user_theme_preferences
                FOR EACH ROW
                EXECUTE FUNCTION update_theme_analytics();
            """,
            reverse_sql="""
            DROP TRIGGER IF EXISTS theme_preferences_analytics_trigger ON user_theme_preferences;
            DROP FUNCTION IF EXISTS update_theme_analytics();
            """
        ),
    ]
```

## Performance Considerations

### Database Optimization Strategies

#### Efficient Querying
```python
# Optimized theme preference retrieval
class UserThemePreferencesManager(models.Manager):
    def get_for_user(self, user):
        """Get theme preferences with caching"""
        cache_key = f"theme_preferences_{user.id}"
        preferences = cache.get(cache_key)
        
        if preferences is None:
            try:
                preferences = self.select_related('user').get(user=user)
                cache.set(cache_key, preferences, 3600)  # Cache for 1 hour
            except self.model.DoesNotExist:
                # Create default preferences
                preferences = self.create(user=user)
                cache.set(cache_key, preferences, 3600)
        
        return preferences
    
    def bulk_update_analytics(self, date, metrics):
        """Bulk update analytics to avoid N+1 queries"""
        analytics, created = ThemeAnalytics.objects.get_or_create(
            date=date,
            defaults=metrics
        )
        
        if not created:
            for field, value in metrics.items():
                setattr(analytics, field, value)
            analytics.save(update_fields=list(metrics.keys()) + ['updated_at'])
```

#### Index Strategy
```python
# Additional indexes for performance
class Meta:
    indexes = [
        # Composite indexes for common query patterns
        models.Index(fields=['user', 'theme_mode']),
        models.Index(fields=['theme_mode', 'high_contrast']),
        
        # Analytics optimization
        models.Index(fields=['date', 'user_count']),
        models.Index(fields=['date', 'hour', 'total_theme_switches']),
        
        # Session tracking optimization
        models.Index(fields=['session_id', 'last_activity']),
        models.Index(fields=['user', 'session_start', 'session_end']),
    ]
```

#### Data Retention and Cleanup
```python
# Automated cleanup for old analytics data
class ThemeAnalyticsManager(models.Manager):
    def cleanup_old_data(self, days_to_keep=365):
        """Remove analytics data older than specified days"""
        cutoff_date = timezone.now().date() - timedelta(days=days_to_keep)
        
        deleted_count = self.filter(date__lt=cutoff_date).delete()[0]
        logger.info(f"Cleaned up {deleted_count} old theme analytics records")
        
        return deleted_count
    
    def aggregate_hourly_to_daily(self, date):
        """Aggregate hourly data to daily for storage efficiency"""
        hourly_data = self.filter(date=date, hour__isnull=False)
        
        if not hourly_data.exists():
            return
        
        # Aggregate hourly metrics
        daily_metrics = hourly_data.aggregate(
            total_users=Sum('user_count'),
            total_switches=Sum('total_theme_switches'),
            avg_switch_time=Avg('avg_switch_time'),
            # ... other aggregations
        )
        
        # Create or update daily record
        daily_record, created = self.get_or_create(
            date=date,
            hour__isnull=True,
            defaults=daily_metrics
        )
        
        if not created:
            for field, value in daily_metrics.items():
                setattr(daily_record, field, value)
            daily_record.save()
        
        # Remove hourly records after aggregation
        hourly_data.delete()
```

### Caching Strategy
```python
# Theme preference caching
class ThemePreferenceCache:
    @staticmethod
    def get_cache_key(user_id):
        return f"theme_preferences_{user_id}"
    
    @staticmethod
    def set_preferences(user_id, preferences, timeout=3600):
        cache_key = ThemePreferenceCache.get_cache_key(user_id)
        cache.set(cache_key, preferences, timeout)
    
    @staticmethod
    def get_preferences(user_id):
        cache_key = ThemePreferenceCache.get_cache_key(user_id)
        return cache.get(cache_key)
    
    @staticmethod
    def invalidate_preferences(user_id):
        cache_key = ThemePreferenceCache.get_cache_key(user_id)
        cache.delete(cache_key)
```

This database schema provides a comprehensive foundation for theme management with analytics tracking, user feedback collection, and performance optimization. The schema is designed to scale efficiently while providing detailed insights into theme usage patterns and user preferences.