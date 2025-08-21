# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-data-export-functionality/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### New Models

#### ExportRequest Model
```python
class ExportRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='export_requests')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Export Configuration
    format = models.CharField(max_length=20, choices=[
        ('csv', 'CSV'),
        ('json', 'JSON'),
        ('pdf', 'PDF'),
        ('excel', 'Excel')
    ])
    template = models.ForeignKey('ExportTemplate', null=True, blank=True, on_delete=models.SET_NULL)
    
    # Filtering & Parameters
    filters = models.JSONField(default=dict)  # Store filter criteria
    date_range_start = models.DateTimeField(null=True, blank=True)
    date_range_end = models.DateTimeField(null=True, blank=True)
    selected_fields = models.JSONField(default=list)  # Fields to include
    
    # Processing Status
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('expired', 'Expired')
    ], default='pending')
    
    progress_percentage = models.IntegerField(default=0)
    error_message = models.TextField(blank=True)
    
    # File Information
    file_path = models.CharField(max_length=500, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)  # Size in bytes
    download_url = models.URLField(blank=True)
    download_count = models.IntegerField(default=0)
    
    # Scheduling
    is_scheduled = models.BooleanField(default=False)
    schedule_pattern = models.CharField(max_length=100, blank=True)  # Cron pattern
    next_run = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'export_requests'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['next_run']),
        ]
```

#### ExportTemplate Model
```python
class ExportTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='export_templates')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Template Configuration
    format = models.CharField(max_length=20, choices=[
        ('csv', 'CSV'),
        ('json', 'JSON'),
        ('pdf', 'PDF'),
        ('excel', 'Excel')
    ])
    
    # Field Configuration
    field_configuration = models.JSONField(default=dict)  # Field mappings and formatting
    default_filters = models.JSONField(default=dict)      # Default filter settings
    layout_settings = models.JSONField(default=dict)      # PDF layout, Excel sheets, etc.
    
    # Sharing & Access
    is_public = models.BooleanField(default=False)
    shared_with = models.ManyToManyField(User, blank=True, related_name='shared_export_templates')
    
    # Usage Tracking
    usage_count = models.IntegerField(default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'export_templates'
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['is_public', '-usage_count']),
        ]
```

#### ExportAuditLog Model
```python
class ExportAuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    export_request = models.ForeignKey(ExportRequest, on_delete=models.CASCADE, related_name='audit_logs')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Action Details
    action = models.CharField(max_length=50, choices=[
        ('created', 'Export Created'),
        ('started', 'Processing Started'),
        ('completed', 'Export Completed'),
        ('downloaded', 'File Downloaded'),
        ('failed', 'Export Failed'),
        ('expired', 'Export Expired'),
        ('deleted', 'Export Deleted'),
        ('shared', 'Export Shared'),
    ])
    
    # Context Information
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True)
    additional_data = models.JSONField(default=dict)  # Action-specific data
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'export_audit_logs'
        indexes = [
            models.Index(fields=['export_request', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['action', '-timestamp']),
        ]
```

#### ExportSchedule Model
```python
class ExportSchedule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='export_schedules')
    name = models.CharField(max_length=255)
    
    # Schedule Configuration
    template = models.ForeignKey(ExportTemplate, on_delete=models.CASCADE)
    cron_pattern = models.CharField(max_length=100)  # Cron expression
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Delivery Settings
    email_recipients = models.JSONField(default=list)  # List of email addresses
    include_download_link = models.BooleanField(default=True)
    attach_file = models.BooleanField(default=False)  # For small files only
    
    # Status & Control
    is_active = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField()
    run_count = models.IntegerField(default=0)
    failure_count = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'export_schedules'
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['next_run', 'is_active']),
        ]
```

#### ExportUsageStats Model
```python
class ExportUsageStats(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='export_stats')
    
    # Time Period
    date = models.DateField()
    
    # Usage Metrics
    total_exports = models.IntegerField(default=0)
    csv_exports = models.IntegerField(default=0)
    json_exports = models.IntegerField(default=0)
    pdf_exports = models.IntegerField(default=0)
    excel_exports = models.IntegerField(default=0)
    
    total_records_exported = models.BigIntegerField(default=0)
    total_file_size = models.BigIntegerField(default=0)  # Total bytes
    
    # Performance Metrics
    avg_processing_time = models.DurationField(null=True, blank=True)
    failed_exports = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'export_usage_stats'
        unique_together = ['user', 'date']
        indexes = [
            models.Index(fields=['user', '-date']),
            models.Index(fields=['-date']),
        ]
```

## Migrations

### Migration 001: Initial Export Models
```python
# Generated migration file
from django.db import migrations, models
import django.db.models.deletion
import uuid

class Migration(migrations.Migration):
    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('tracking', '0015_add_time_tracking_analytics'),  # Previous migration
    ]

    operations = [
        migrations.CreateModel(
            name='ExportTemplate',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('format', models.CharField(choices=[('csv', 'CSV'), ('json', 'JSON'), ('pdf', 'PDF'), ('excel', 'Excel')], max_length=20)),
                ('field_configuration', models.JSONField(default=dict)),
                ('default_filters', models.JSONField(default=dict)),
                ('layout_settings', models.JSONField(default=dict)),
                ('is_public', models.BooleanField(default=False)),
                ('usage_count', models.IntegerField(default=0)),
                ('last_used', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='export_templates', to='auth.user')),
                ('shared_with', models.ManyToManyField(blank=True, related_name='shared_export_templates', to='auth.user')),
            ],
            options={
                'db_table': 'export_templates',
            },
        ),
        # ... Additional model creations
    ]
```

### Migration 002: Add Indexes and Constraints
```python
class Migration(migrations.Migration):
    dependencies = [
        ('exports', '0001_initial'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='exportrequest',
            index=models.Index(fields=['user', '-created_at'], name='export_user_created_idx'),
        ),
        migrations.AddIndex(
            model_name='exportrequest',
            index=models.Index(fields=['status', 'created_at'], name='export_status_created_idx'),
        ),
        migrations.AddIndex(
            model_name='exportrequest',
            index=models.Index(fields=['expires_at'], name='export_expires_idx'),
        ),
        # ... Additional indexes
    ]
```

### Data Migration: Default Templates
```python
def create_default_templates(apps, schema_editor):
    ExportTemplate = apps.get_model('exports', 'ExportTemplate')
    User = apps.get_model('auth', 'User')
    
    # Create system-wide default templates
    templates = [
        {
            'name': 'Basic Time Tracking Export',
            'format': 'csv',
            'field_configuration': {
                'fields': ['date', 'project', 'task', 'duration', 'description'],
                'headers': ['Date', 'Project', 'Task', 'Duration', 'Description']
            },
            'is_public': True,
        },
        # ... Additional default templates
    ]
    
    admin_user = User.objects.filter(is_superuser=True).first()
    if admin_user:
        for template_data in templates:
            ExportTemplate.objects.create(user=admin_user, **template_data)
```