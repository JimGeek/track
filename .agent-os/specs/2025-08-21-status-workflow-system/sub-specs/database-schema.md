# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-status-workflow-system/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### Enhanced FeatureRequest Model with Workflow

```python
# models.py - Enhanced FeatureRequest with FSM
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django_fsm import FSMField, transition
from django_fsm_log.decorators import fsm_log_by
import logging

logger = logging.getLogger(__name__)

class WorkflowStatus(models.TextChoices):
    IDEA = 'idea', 'Idea'
    SPECIFICATION = 'specification', 'Specification'
    DEVELOPMENT = 'development', 'Development'
    TESTING = 'testing', 'Testing'
    LIVE = 'live', 'Live'

class FeatureRequest(models.Model):
    # ... existing fields from previous spec ...
    
    # Enhanced status field with FSM
    status = FSMField(
        choices=WorkflowStatus.choices,
        default=WorkflowStatus.IDEA,
        help_text="Current workflow status"
    )
    
    # Workflow tracking fields
    idea_started_at = models.DateTimeField(null=True, blank=True)
    specification_started_at = models.DateTimeField(null=True, blank=True)
    development_started_at = models.DateTimeField(null=True, blank=True)
    testing_started_at = models.DateTimeField(null=True, blank=True)
    live_started_at = models.DateTimeField(null=True, blank=True)
    
    # Duration tracking (calculated fields)
    idea_duration = models.DurationField(null=True, blank=True)
    specification_duration = models.DurationField(null=True, blank=True)
    development_duration = models.DurationField(null=True, blank=True)
    testing_duration = models.DurationField(null=True, blank=True)
    total_cycle_time = models.DurationField(null=True, blank=True)
    
    # Workflow validation fields
    specification_approved_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_specifications'
    )
    specification_approved_at = models.DateTimeField(null=True, blank=True)
    
    development_approved_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_developments'
    )
    development_approved_at = models.DateTimeField(null=True, blank=True)
    
    testing_approved_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_testing'
    )
    testing_approved_at = models.DateTimeField(null=True, blank=True)
    
    # Workflow state management
    @fsm_log_by
    @transition(field=status, source=WorkflowStatus.IDEA, target=WorkflowStatus.SPECIFICATION)
    def start_specification(self, by=None):
        """Transition from Idea to Specification"""
        self._validate_specification_requirements()
        self._calculate_stage_duration('idea')
        self.specification_started_at = timezone.now()
        logger.info(f"Feature {self.id} moved to specification by {by}")
    
    @fsm_log_by
    @transition(field=status, source=WorkflowStatus.SPECIFICATION, target=WorkflowStatus.DEVELOPMENT)
    def start_development(self, by=None):
        """Transition from Specification to Development"""
        self._validate_development_requirements()
        self._calculate_stage_duration('specification')
        self.development_started_at = timezone.now()
        logger.info(f"Feature {self.id} moved to development by {by}")
    
    @fsm_log_by
    @transition(field=status, source=WorkflowStatus.DEVELOPMENT, target=WorkflowStatus.TESTING)
    def start_testing(self, by=None):
        """Transition from Development to Testing"""
        self._validate_testing_requirements()
        self._calculate_stage_duration('development')
        self.testing_started_at = timezone.now()
        logger.info(f"Feature {self.id} moved to testing by {by}")
    
    @fsm_log_by
    @transition(field=status, source=WorkflowStatus.TESTING, target=WorkflowStatus.LIVE)
    def go_live(self, by=None):
        """Transition from Testing to Live"""
        self._validate_live_requirements()
        self._calculate_stage_duration('testing')
        self.live_started_at = timezone.now()
        self.completed_date = timezone.now()
        self._calculate_total_cycle_time()
        logger.info(f"Feature {self.id} went live by {by}")
    
    # Rollback transitions
    @fsm_log_by
    @transition(field=status, source=WorkflowStatus.SPECIFICATION, target=WorkflowStatus.IDEA)
    def rollback_to_idea(self, by=None):
        """Rollback from Specification to Idea"""
        self.specification_started_at = None
        self.specification_duration = None
    
    @fsm_log_by
    @transition(field=status, source=WorkflowStatus.DEVELOPMENT, target=WorkflowStatus.SPECIFICATION)
    def rollback_to_specification(self, by=None):
        """Rollback from Development to Specification"""
        self.development_started_at = None
        self.development_duration = None
    
    @fsm_log_by
    @transition(field=status, source=WorkflowStatus.TESTING, target=WorkflowStatus.DEVELOPMENT)
    def rollback_to_development(self, by=None):
        """Rollback from Testing to Development"""
        self.testing_started_at = None
        self.testing_duration = None
    
    def _validate_specification_requirements(self):
        """Validate requirements for moving to specification"""
        from django.core.exceptions import ValidationError
        
        errors = []
        if not self.description or len(self.description.strip()) < 50:
            errors.append("Description must be at least 50 characters for specification")
        
        if not self.business_value:
            errors.append("Business value is required for specification")
        
        if errors:
            raise ValidationError(errors)
    
    def _validate_development_requirements(self):
        """Validate requirements for moving to development"""
        from django.core.exceptions import ValidationError
        
        errors = []
        if not self.acceptance_criteria:
            errors.append("Acceptance criteria required for development")
        
        if not self.assignee:
            errors.append("Developer assignment required for development")
        
        if not self.estimated_hours:
            errors.append("Effort estimation required for development")
        
        if errors:
            raise ValidationError(errors)
    
    def _validate_testing_requirements(self):
        """Validate requirements for moving to testing"""
        from django.core.exceptions import ValidationError
        
        errors = []
        if not self.technical_notes:
            errors.append("Technical implementation notes required for testing")
        
        if not self.development_approved_by:
            errors.append("Development approval required for testing")
        
        if errors:
            raise ValidationError(errors)
    
    def _validate_live_requirements(self):
        """Validate requirements for going live"""
        from django.core.exceptions import ValidationError
        
        errors = []
        if not self.testing_approved_by:
            errors.append("Testing approval required for going live")
        
        if self.is_blocked:
            errors.append("Cannot go live while feature is blocked")
        
        if errors:
            raise ValidationError(errors)
    
    def _calculate_stage_duration(self, completed_stage):
        """Calculate duration for completed stage"""
        now = timezone.now()
        
        if completed_stage == 'idea' and self.idea_started_at:
            self.idea_duration = now - (self.idea_started_at or self.created_at)
        elif completed_stage == 'specification' and self.specification_started_at:
            self.specification_duration = now - self.specification_started_at
        elif completed_stage == 'development' and self.development_started_at:
            self.development_duration = now - self.development_started_at
        elif completed_stage == 'testing' and self.testing_started_at:
            self.testing_duration = now - self.testing_started_at
    
    def _calculate_total_cycle_time(self):
        """Calculate total cycle time from idea to live"""
        if self.live_started_at:
            start_time = self.idea_started_at or self.created_at
            self.total_cycle_time = self.live_started_at - start_time
    
    def save(self, *args, **kwargs):
        # Set initial idea start time
        if not self.idea_started_at and self.status == WorkflowStatus.IDEA:
            self.idea_started_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    @property
    def current_stage_duration(self):
        """Calculate duration in current stage"""
        now = timezone.now()
        
        if self.status == WorkflowStatus.IDEA:
            return now - (self.idea_started_at or self.created_at)
        elif self.status == WorkflowStatus.SPECIFICATION and self.specification_started_at:
            return now - self.specification_started_at
        elif self.status == WorkflowStatus.DEVELOPMENT and self.development_started_at:
            return now - self.development_started_at
        elif self.status == WorkflowStatus.TESTING and self.testing_started_at:
            return now - self.testing_started_at
        elif self.status == WorkflowStatus.LIVE and self.live_started_at:
            return now - self.live_started_at
        
        return timezone.timedelta(0)
    
    @property
    def workflow_progress_percentage(self):
        """Calculate workflow completion percentage"""
        stage_weights = {
            WorkflowStatus.IDEA: 10,
            WorkflowStatus.SPECIFICATION: 25,
            WorkflowStatus.DEVELOPMENT: 60,
            WorkflowStatus.TESTING: 85,
            WorkflowStatus.LIVE: 100,
        }
        return stage_weights.get(self.status, 0)
    
    def get_available_transitions(self, user=None):
        """Get list of available status transitions for user"""
        transitions = []
        
        # Forward transitions
        if self.status == WorkflowStatus.IDEA:
            if self._can_transition_to_specification():
                transitions.append(('start_specification', 'Move to Specification'))
        elif self.status == WorkflowStatus.SPECIFICATION:
            if self._can_transition_to_development():
                transitions.append(('start_development', 'Start Development'))
            transitions.append(('rollback_to_idea', 'Rollback to Idea'))
        elif self.status == WorkflowStatus.DEVELOPMENT:
            if self._can_transition_to_testing():
                transitions.append(('start_testing', 'Move to Testing'))
            transitions.append(('rollback_to_specification', 'Rollback to Specification'))
        elif self.status == WorkflowStatus.TESTING:
            if self._can_go_live():
                transitions.append(('go_live', 'Go Live'))
            transitions.append(('rollback_to_development', 'Rollback to Development'))
        
        return transitions
    
    def _can_transition_to_specification(self):
        try:
            self._validate_specification_requirements()
            return True
        except:
            return False
    
    def _can_transition_to_development(self):
        try:
            self._validate_development_requirements()
            return True
        except:
            return False
    
    def _can_transition_to_testing(self):
        try:
            self._validate_testing_requirements()
            return True
        except:
            return False
    
    def _can_go_live(self):
        try:
            self._validate_live_requirements()
            return True
        except:
            return False


class WorkflowMetrics(models.Model):
    """Aggregated workflow metrics for performance analysis"""
    
    project = models.ForeignKey(
        'Project',
        on_delete=models.CASCADE,
        related_name='workflow_metrics'
    )
    
    # Time period for metrics
    period_start = models.DateField()
    period_end = models.DateField()
    
    # Stage metrics
    avg_idea_duration = models.DurationField(null=True)
    avg_specification_duration = models.DurationField(null=True)
    avg_development_duration = models.DurationField(null=True)
    avg_testing_duration = models.DurationField(null=True)
    avg_total_cycle_time = models.DurationField(null=True)
    
    # Throughput metrics
    features_completed = models.PositiveIntegerField(default=0)
    features_in_progress = models.PositiveIntegerField(default=0)
    throughput_per_week = models.FloatField(null=True)
    
    # Bottleneck analysis
    bottleneck_stage = models.CharField(
        max_length=20,
        choices=WorkflowStatus.choices,
        null=True,
        blank=True
    )
    bottleneck_duration = models.DurationField(null=True)
    
    # Quality metrics
    rollback_count = models.PositiveIntegerField(default=0)
    rollback_percentage = models.FloatField(null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['project', 'period_start', 'period_end']
        ordering = ['-period_end']
        indexes = [
            models.Index(fields=['project', 'period_end']),
        ]
```

## Migrations

### Workflow Enhancement Migration

```python
# Generated migration file: 0004_workflow_system.py
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django_fsm

class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('track', '0003_feature_request_management'),
    ]

    operations = [
        # Update existing status field to FSMField
        migrations.AlterField(
            model_name='featurerequest',
            name='status',
            field=django_fsm.FSMField(
                choices=[
                    ('idea', 'Idea'),
                    ('specification', 'Specification'),
                    ('development', 'Development'),
                    ('testing', 'Testing'),
                    ('live', 'Live')
                ],
                default='idea',
                help_text='Current workflow status',
                max_length=50
            ),
        ),
        
        # Add workflow tracking fields
        migrations.AddField(
            model_name='featurerequest',
            name='idea_started_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='featurerequest',
            name='specification_started_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='featurerequest',
            name='development_started_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='featurerequest',
            name='testing_started_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='featurerequest',
            name='live_started_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        
        # Add duration tracking fields
        migrations.AddField(
            model_name='featurerequest',
            name='idea_duration',
            field=models.DurationField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='featurerequest',
            name='specification_duration',
            field=models.DurationField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='featurerequest',
            name='development_duration',
            field=models.DurationField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='featurerequest',
            name='testing_duration',
            field=models.DurationField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='featurerequest',
            name='total_cycle_time',
            field=models.DurationField(blank=True, null=True),
        ),
        
        # Add approval tracking fields
        migrations.AddField(
            model_name='featurerequest',
            name='specification_approved_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='approved_specifications',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddField(
            model_name='featurerequest',
            name='specification_approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='featurerequest',
            name='development_approved_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='approved_developments',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddField(
            model_name='featurerequest',
            name='development_approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='featurerequest',
            name='testing_approved_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='approved_testing',
                to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddField(
            model_name='featurerequest',
            name='testing_approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        
        # Create WorkflowMetrics model
        migrations.CreateModel(
            name='WorkflowMetrics',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('period_start', models.DateField()),
                ('period_end', models.DateField()),
                ('avg_idea_duration', models.DurationField(null=True)),
                ('avg_specification_duration', models.DurationField(null=True)),
                ('avg_development_duration', models.DurationField(null=True)),
                ('avg_testing_duration', models.DurationField(null=True)),
                ('avg_total_cycle_time', models.DurationField(null=True)),
                ('features_completed', models.PositiveIntegerField(default=0)),
                ('features_in_progress', models.PositiveIntegerField(default=0)),
                ('throughput_per_week', models.FloatField(null=True)),
                ('bottleneck_stage', models.CharField(blank=True, choices=[('idea', 'Idea'), ('specification', 'Specification'), ('development', 'Development'), ('testing', 'Testing'), ('live', 'Live')], max_length=20, null=True)),
                ('bottleneck_duration', models.DurationField(null=True)),
                ('rollback_count', models.PositiveIntegerField(default=0)),
                ('rollback_percentage', models.FloatField(null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workflow_metrics', to='track.project')),
            ],
            options={
                'ordering': ['-period_end'],
            },
        ),
        
        # Add indexes for workflow queries
        migrations.AddIndex(
            model_name='featurerequest',
            index=models.Index(fields=['status', 'development_started_at'], name='track_featurerequest_status_dev_idx'),
        ),
        migrations.AddIndex(
            model_name='featurerequest',
            index=models.Index(fields=['project', 'status', 'created_at'], name='track_featurerequest_proj_status_created_idx'),
        ),
        migrations.AddIndex(
            model_name='workflowmetrics',
            index=models.Index(fields=['project', 'period_end'], name='track_workflowmetrics_proj_period_idx'),
        ),
        
        migrations.AlterUniqueTogether(
            name='workflowmetrics',
            unique_together={('project', 'period_start', 'period_end')},
        ),
    ]
```

### Data Migration for Existing Records

```python
# Data migration: 0005_populate_workflow_fields.py
from django.db import migrations
from django.utils import timezone

def populate_workflow_fields(apps, schema_editor):
    FeatureRequest = apps.get_model('track', 'FeatureRequest')
    
    for feature in FeatureRequest.objects.all():
        # Set initial workflow timestamps based on status
        if not feature.idea_started_at:
            feature.idea_started_at = feature.created_at
        
        if feature.status in ['specification', 'development', 'testing', 'live'] and not feature.specification_started_at:
            feature.specification_started_at = feature.created_at
        
        if feature.status in ['development', 'testing', 'live'] and not feature.development_started_at:
            feature.development_started_at = feature.created_at
        
        if feature.status in ['testing', 'live'] and not feature.testing_started_at:
            feature.testing_started_at = feature.created_at
        
        if feature.status == 'live':
            if not feature.live_started_at:
                feature.live_started_at = feature.updated_at or feature.created_at
            if not feature.completed_date:
                feature.completed_date = feature.live_started_at
        
        feature.save()

def reverse_populate_workflow_fields(apps, schema_editor):
    # Reverse migration - clear workflow fields
    FeatureRequest = apps.get_model('track', 'FeatureRequest')
    FeatureRequest.objects.all().update(
        idea_started_at=None,
        specification_started_at=None,
        development_started_at=None,
        testing_started_at=None,
        live_started_at=None,
        idea_duration=None,
        specification_duration=None,
        development_duration=None,
        testing_duration=None,
        total_cycle_time=None
    )

class Migration(migrations.Migration):
    dependencies = [
        ('track', '0004_workflow_system'),
    ]

    operations = [
        migrations.RunPython(
            populate_workflow_fields,
            reverse_populate_workflow_fields
        ),
    ]
```