# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-feature-request-management/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### FeatureRequest Model

```python
# models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinLengthValidator, MaxValueValidator, MinValueValidator
from django.utils import timezone
from taggit.managers import TaggableManager

class FeatureRequest(models.Model):
    STATUS_CHOICES = [
        ('idea', 'Idea'),
        ('specification', 'Specification'),
        ('development', 'Development'),
        ('testing', 'Testing'),
        ('live', 'Live'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    COMPLEXITY_CHOICES = [
        ('simple', 'Simple (1-2 days)'),
        ('medium', 'Medium (3-5 days)'),
        ('complex', 'Complex (1-2 weeks)'),
        ('epic', 'Epic (2+ weeks)'),
    ]
    
    TYPE_CHOICES = [
        ('feature', 'New Feature'),
        ('enhancement', 'Enhancement'),
        ('bug_fix', 'Bug Fix'),
        ('technical', 'Technical Task'),
        ('research', 'Research'),
    ]
    
    # Core identification
    title = models.CharField(
        max_length=200,
        validators=[MinLengthValidator(5)],
        help_text="Feature request title"
    )
    
    slug = models.SlugField(
        max_length=220,
        help_text="URL-friendly version of title"
    )
    
    # Project relationship
    project = models.ForeignKey(
        'Project',
        on_delete=models.CASCADE,
        related_name='feature_requests',
        help_text="Associated project"
    )
    
    # Content fields
    description = models.TextField(
        help_text="Detailed feature description"
    )
    
    acceptance_criteria = models.TextField(
        blank=True,
        help_text="Acceptance criteria and requirements"
    )
    
    business_value = models.TextField(
        blank=True,
        help_text="Business justification and value proposition"
    )
    
    technical_notes = models.TextField(
        blank=True,
        help_text="Technical implementation notes"
    )
    
    # Classification fields
    feature_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='feature',
        help_text="Type of feature request"
    )
    
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Feature priority level"
    )
    
    complexity = models.CharField(
        max_length=10,
        choices=COMPLEXITY_CHOICES,
        default='medium',
        help_text="Implementation complexity estimate"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='idea',
        help_text="Current status in workflow"
    )
    
    # Assignment and ownership
    requester = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='requested_features',
        help_text="User who requested the feature"
    )
    
    assignee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_features',
        help_text="Assigned developer/implementer"
    )
    
    # Timeline fields
    requested_date = models.DateTimeField(
        auto_now_add=True,
        help_text="When feature was requested"
    )
    
    target_date = models.DateField(
        null=True,
        blank=True,
        help_text="Target completion date"
    )
    
    completed_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When feature was completed"
    )
    
    # Effort tracking
    estimated_hours = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MaxValueValidator(500)],
        help_text="Estimated development hours"
    )
    
    actual_hours = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MaxValueValidator(500)],
        help_text="Actual development hours"
    )
    
    # Business metrics
    business_value_score = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Business value score (1-10)"
    )
    
    technical_risk_score = models.PositiveIntegerField(
        default=5,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Technical risk score (1-10)"
    )
    
    # Status tracking
    is_active = models.BooleanField(
        default=True,
        help_text="Is feature request active"
    )
    
    is_blocked = models.BooleanField(
        default=False,
        help_text="Is feature currently blocked"
    )
    
    blocked_reason = models.CharField(
        max_length=200,
        blank=True,
        help_text="Reason for being blocked"
    )
    
    # Tags for organization
    tags = TaggableManager(
        blank=True,
        help_text="Tags for categorization"
    )
    
    # Audit fields
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Creation timestamp"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Last update timestamp"
    )
    
    class Meta:
        ordering = ['-updated_at', '-created_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['assignee', 'status']),
            models.Index(fields=['requester', 'created_at']),
            models.Index(fields=['priority', 'status']),
            models.Index(fields=['target_date']),
            models.Index(fields=['status', 'priority']),
        ]
        unique_together = ['project', 'slug']
        verbose_name = 'Feature Request'
        verbose_name_plural = 'Feature Requests'
    
    def __str__(self):
        return f"{self.project.name}: {self.title}"
    
    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Validate target date
        if self.target_date and self.target_date < timezone.now().date():
            if self.status in ['idea', 'specification']:
                raise ValidationError('Target date cannot be in the past for new features')
        
        # Validate completed date
        if self.completed_date and self.status != 'live':
            raise ValidationError('Completed date can only be set when status is Live')
        
        if self.status == 'live' and not self.completed_date:
            self.completed_date = timezone.now()
    
    def save(self, *args, **kwargs):
        # Auto-generate slug from title and project
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.title)
            slug = base_slug
            counter = 1
            
            while FeatureRequest.objects.filter(
                project=self.project, 
                slug=slug
            ).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            
            self.slug = slug
        
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self):
        if self.target_date and self.status not in ['live']:
            return timezone.now().date() > self.target_date
        return False
    
    @property
    def days_until_target(self):
        if self.target_date:
            delta = self.target_date - timezone.now().date()
            return delta.days if delta.days > 0 else 0
        return None
    
    @property
    def duration_in_development(self):
        if self.status == 'live' and self.completed_date:
            return (self.completed_date - self.created_at).days
        elif self.status not in ['idea']:
            return (timezone.now() - self.created_at).days
        return 0
    
    @property
    def effort_variance(self):
        if self.estimated_hours and self.actual_hours:
            return ((self.actual_hours - self.estimated_hours) / self.estimated_hours) * 100
        return None
    
    def get_status_display_with_icon(self):
        status_icons = {
            'idea': '💡',
            'specification': '📋',
            'development': '⚡',
            'testing': '🧪',
            'live': '✅',
        }
        return f"{status_icons.get(self.status, '')} {self.get_status_display()}"


class FeatureRequestComment(models.Model):
    feature_request = models.ForeignKey(
        FeatureRequest,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    
    is_internal = models.BooleanField(
        default=False,
        help_text="Internal team comment (not visible to requesters)"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name = 'Feature Request Comment'
        verbose_name_plural = 'Feature Request Comments'
    
    def __str__(self):
        return f"Comment on {self.feature_request.title} by {self.author.username}"


class FeatureRequestStatusHistory(models.Model):
    feature_request = models.ForeignKey(
        FeatureRequest,
        on_delete=models.CASCADE,
        related_name='status_history'
    )
    
    from_status = models.CharField(
        max_length=20,
        choices=FeatureRequest.STATUS_CHOICES,
        null=True,
        blank=True
    )
    
    to_status = models.CharField(
        max_length=20,
        choices=FeatureRequest.STATUS_CHOICES
    )
    
    changed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    reason = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-changed_at']
        verbose_name = 'Feature Request Status History'
        verbose_name_plural = 'Feature Request Status History'
    
    def __str__(self):
        return f"{self.feature_request.title}: {self.from_status} → {self.to_status}"
```

## Migrations

### Initial Migration

```python
# Generated migration file: 0003_feature_request_management.py
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
import taggit.managers

class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('taggit', '0005_auto_20220424_2025'),
        ('track', '0002_project_management'),
    ]

    operations = [
        migrations.CreateModel(
            name='FeatureRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(help_text='Feature request title', max_length=200, validators=[django.core.validators.MinLengthValidator(5)])),
                ('slug', models.SlugField(help_text='URL-friendly version of title', max_length=220)),
                ('description', models.TextField(help_text='Detailed feature description')),
                ('acceptance_criteria', models.TextField(blank=True, help_text='Acceptance criteria and requirements')),
                ('business_value', models.TextField(blank=True, help_text='Business justification and value proposition')),
                ('technical_notes', models.TextField(blank=True, help_text='Technical implementation notes')),
                ('feature_type', models.CharField(choices=[('feature', 'New Feature'), ('enhancement', 'Enhancement'), ('bug_fix', 'Bug Fix'), ('technical', 'Technical Task'), ('research', 'Research')], default='feature', help_text='Type of feature request', max_length=20)),
                ('priority', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], default='medium', help_text='Feature priority level', max_length=10)),
                ('complexity', models.CharField(choices=[('simple', 'Simple (1-2 days)'), ('medium', 'Medium (3-5 days)'), ('complex', 'Complex (1-2 weeks)'), ('epic', 'Epic (2+ weeks)')], default='medium', help_text='Implementation complexity estimate', max_length=10)),
                ('status', models.CharField(choices=[('idea', 'Idea'), ('specification', 'Specification'), ('development', 'Development'), ('testing', 'Testing'), ('live', 'Live')], default='idea', help_text='Current status in workflow', max_length=20)),
                ('requested_date', models.DateTimeField(auto_now_add=True, help_text='When feature was requested')),
                ('target_date', models.DateField(blank=True, help_text='Target completion date', null=True)),
                ('completed_date', models.DateTimeField(blank=True, help_text='When feature was completed', null=True)),
                ('estimated_hours', models.PositiveIntegerField(blank=True, help_text='Estimated development hours', null=True, validators=[django.core.validators.MaxValueValidator(500)])),
                ('actual_hours', models.PositiveIntegerField(blank=True, help_text='Actual development hours', null=True, validators=[django.core.validators.MaxValueValidator(500)])),
                ('business_value_score', models.PositiveIntegerField(default=5, help_text='Business value score (1-10)', validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(10)])),
                ('technical_risk_score', models.PositiveIntegerField(default=5, help_text='Technical risk score (1-10)', validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(10)])),
                ('is_active', models.BooleanField(default=True, help_text='Is feature request active')),
                ('is_blocked', models.BooleanField(default=False, help_text='Is feature currently blocked')),
                ('blocked_reason', models.CharField(blank=True, help_text='Reason for being blocked', max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Last update timestamp')),
                ('assignee', models.ForeignKey(blank=True, help_text='Assigned developer/implementer', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_features', to=settings.AUTH_USER_MODEL)),
                ('project', models.ForeignKey(help_text='Associated project', on_delete=django.db.models.deletion.CASCADE, related_name='feature_requests', to='track.project')),
                ('requester', models.ForeignKey(help_text='User who requested the feature', on_delete=django.db.models.deletion.CASCADE, related_name='requested_features', to=settings.AUTH_USER_MODEL)),
                ('tags', taggit.managers.TaggableManager(blank=True, help_text='Tags for categorization', through='taggit.TaggedItem', to='taggit.Tag', verbose_name='Tags')),
            ],
            options={
                'verbose_name': 'Feature Request',
                'verbose_name_plural': 'Feature Requests',
                'ordering': ['-updated_at', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='FeatureRequestStatusHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('from_status', models.CharField(blank=True, choices=[('idea', 'Idea'), ('specification', 'Specification'), ('development', 'Development'), ('testing', 'Testing'), ('live', 'Live')], max_length=20, null=True)),
                ('to_status', models.CharField(choices=[('idea', 'Idea'), ('specification', 'Specification'), ('development', 'Development'), ('testing', 'Testing'), ('live', 'Live')], max_length=20)),
                ('reason', models.TextField(blank=True)),
                ('changed_at', models.DateTimeField(auto_now_add=True)),
                ('changed_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('feature_request', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='status_history', to='track.featurerequest')),
            ],
            options={
                'verbose_name': 'Feature Request Status History',
                'verbose_name_plural': 'Feature Request Status History',
                'ordering': ['-changed_at'],
            },
        ),
        migrations.CreateModel(
            name='FeatureRequestComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('is_internal', models.BooleanField(default=False, help_text='Internal team comment (not visible to requesters)')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
                ('feature_request', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='track.featurerequest')),
            ],
            options={
                'verbose_name': 'Feature Request Comment',
                'verbose_name_plural': 'Feature Request Comments',
                'ordering': ['created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='featurerequest',
            index=models.Index(fields=['project', 'status'], name='track_featurerequest_proj_status_idx'),
        ),
        migrations.AddIndex(
            model_name='featurerequest',
            index=models.Index(fields=['assignee', 'status'], name='track_featurerequest_assign_status_idx'),
        ),
        migrations.AddIndex(
            model_name='featurerequest',
            index=models.Index(fields=['requester', 'created_at'], name='track_featurerequest_req_created_idx'),
        ),
        migrations.AddIndex(
            model_name='featurerequest',
            index=models.Index(fields=['priority', 'status'], name='track_featurerequest_pri_status_idx'),
        ),
        migrations.AddIndex(
            model_name='featurerequest',
            index=models.Index(fields=['target_date'], name='track_featurerequest_target_idx'),
        ),
        migrations.AddIndex(
            model_name='featurerequest',
            index=models.Index(fields=['status', 'priority'], name='track_featurerequest_status_pri_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='featurerequest',
            unique_together={('project', 'slug')},
        ),
    ]
```

### Database Indexes Strategy

```sql
-- Additional performance optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS track_featurerequest_search_idx 
ON track_featurerequest USING gin (to_tsvector('english', title || ' ' || description));

CREATE INDEX CONCURRENTLY IF NOT EXISTS track_featurerequest_project_priority_idx 
ON track_featurerequest (project_id, priority, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS track_featurerequest_assignee_target_idx 
ON track_featurerequest (assignee_id, target_date) WHERE target_date IS NOT NULL;
```