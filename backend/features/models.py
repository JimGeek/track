from django.db import models
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.validators import MinLengthValidator
from django.core.exceptions import ValidationError
import uuid

from projects.models import Project

User = get_user_model()


class Feature(models.Model):
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

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='features')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='sub_features')
    
    title = models.CharField(max_length=200, validators=[MinLengthValidator(3)])
    description = models.TextField()
    
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='idea')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_features')
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reported_features')
    
    estimated_hours = models.PositiveIntegerField(null=True, blank=True, help_text="Estimated hours for completion")
    actual_hours = models.PositiveIntegerField(null=True, blank=True, help_text="Actual hours spent")
    
    due_date = models.DateField(null=True, blank=True, help_text="Feature due date")
    start_date = models.DateField(null=True, blank=True, help_text="Feature start date")
    end_date = models.DateField(null=True, blank=True, help_text="Feature end date")
    completed_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Ordering and hierarchy
    order = models.PositiveIntegerField(default=0, help_text="Order within parent or project")
    
    # Dependencies
    dependencies = models.ManyToManyField(
        'self', 
        symmetrical=False, 
        blank=True, 
        related_name='dependent_features',
        help_text="Features that this feature depends on"
    )
    
    class Meta:
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['assignee']),
            models.Index(fields=['parent']),
            models.Index(fields=['due_date']),
            models.Index(fields=['start_date']),
            models.Index(fields=['end_date']),
            models.Index(fields=['priority']),
        ]
        unique_together = ['project', 'title']

    def __str__(self):
        return f"{self.project.name} - {self.title}"

    def get_absolute_url(self):
        return reverse('feature-detail', kwargs={'pk': self.pk})

    def clean(self):
        """Validate feature dates and dependencies"""
        super().clean()
        
        # Validate start_date and end_date relationship
        if self.start_date and self.end_date:
            if self.start_date > self.end_date:
                raise ValidationError({
                    'end_date': 'End date cannot be earlier than start date.'
                })
        
        # Validate against project boundaries if project is set
        if self.project:
            # Get project date boundaries
            project_start = self.project.start_date
            project_end = self.project.end_date or self.project.deadline  # Use end_date, fallback to deadline
            
            # If no project start date set, use creation date
            if not project_start:
                project_start = self.project.created_at.date()
            
            # Validate feature dates against project start date
            if project_start:
                if self.start_date and self.start_date < project_start:
                    raise ValidationError({
                        'start_date': f'Start date cannot be before project start date ({project_start}).'
                    })
                
                if self.end_date and self.end_date < project_start:
                    raise ValidationError({
                        'end_date': f'End date cannot be before project start date ({project_start}).'
                    })
                
                if self.due_date and self.due_date < project_start:
                    raise ValidationError({
                        'due_date': f'Due date cannot be before project start date ({project_start}).'
                    })
            
            # Validate feature dates against project end date
            if project_end:
                if self.start_date and self.start_date > project_end:
                    raise ValidationError({
                        'start_date': f'Start date cannot be after project end date ({project_end}).'
                    })
                
                if self.end_date and self.end_date > project_end:
                    raise ValidationError({
                        'end_date': f'End date cannot be after project end date ({project_end}).'
                    })
                
                if self.due_date and self.due_date > project_end:
                    raise ValidationError({
                        'due_date': f'Due date cannot be after project end date ({project_end}).'
                    })
        
        # Validate against parent feature boundaries if this is a sub-feature
        if self.parent:
            try:
                parent_feature = Feature.objects.get(id=self.parent)
                
                # Validate against parent start date
                if parent_feature.start_date:
                    if self.start_date and self.start_date < parent_feature.start_date:
                        raise ValidationError({
                            'start_date': f'Start date cannot be before parent feature start date ({parent_feature.start_date}).'
                        })
                    
                    if self.end_date and self.end_date < parent_feature.start_date:
                        raise ValidationError({
                            'end_date': f'End date cannot be before parent feature start date ({parent_feature.start_date}).'
                        })
                
                # Validate against parent end date (use end_date, then due_date as fallback)
                parent_end = parent_feature.end_date or parent_feature.due_date
                if parent_end:
                    if self.start_date and self.start_date > parent_end:
                        raise ValidationError({
                            'start_date': f'Start date cannot be after parent feature end date ({parent_end}).'
                        })
                    
                    if self.end_date and self.end_date > parent_end:
                        raise ValidationError({
                            'end_date': f'End date cannot be after parent feature end date ({parent_end}).'
                        })
                    
                    if self.due_date and self.due_date > parent_end:
                        raise ValidationError({
                            'due_date': f'Due date cannot be after parent feature end date ({parent_end}).'
                        })
                        
            except Feature.DoesNotExist:
                pass  # Parent feature doesn't exist, skip validation
        
        # Validate dependencies
        self._validate_dependencies()

    def _validate_dependencies(self):
        """Validate feature dependencies to prevent circular dependencies and ensure proper scope"""
        if not self.pk:
            # For new features, we can't validate dependencies until saved
            return
        
        # Get current dependencies (need to check via direct database query)
        try:
            current_feature = Feature.objects.get(pk=self.pk)
            dependencies = current_feature.dependencies.all()
            
            # Validate dependency scope
            for dependency in dependencies:
                # Features can only depend on features within the same project
                if dependency.project != self.project:
                    raise ValidationError({
                        'dependencies': f'Feature "{dependency.title}" is not in the same project.'
                    })
                
                # Sub-features can only depend on sub-features from the same parent feature
                if self.parent:
                    if not dependency.parent or dependency.parent != self.parent:
                        raise ValidationError({
                            'dependencies': f'Sub-feature "{dependency.title}" must have the same parent feature.'
                        })
                
                # Features cannot depend on their own sub-features
                if dependency.parent == self:
                    raise ValidationError({
                        'dependencies': f'Feature cannot depend on its own sub-feature "{dependency.title}".'
                    })
                
                # Sub-features cannot depend on their parent feature
                if self.parent and dependency == self.parent:
                    raise ValidationError({
                        'dependencies': f'Sub-feature cannot depend on its parent feature "{dependency.title}".'
                    })
            
            # Check for circular dependencies
            self._check_circular_dependencies(dependencies)
            
        except Feature.DoesNotExist:
            # Feature doesn't exist yet, skip validation
            pass
    
    def _check_circular_dependencies(self, dependencies):
        """Check for circular dependencies using depth-first search"""
        visited = set()
        rec_stack = set()
        
        def has_cycle(feature_id):
            if feature_id in rec_stack:
                return True
            if feature_id in visited:
                return False
                
            visited.add(feature_id)
            rec_stack.add(feature_id)
            
            try:
                feature = Feature.objects.get(pk=feature_id)
                for dependency in feature.dependencies.all():
                    if has_cycle(dependency.pk):
                        return True
            except Feature.DoesNotExist:
                pass
            
            rec_stack.remove(feature_id)
            return False
        
        # Check if adding current dependencies would create a cycle
        for dependency in dependencies:
            if has_cycle(dependency.pk):
                raise ValidationError({
                    'dependencies': f'Adding dependency "{dependency.title}" would create a circular dependency.'
                })

    @property
    def is_overdue(self):
        # Check due_date first, then end_date if due_date is not set
        check_date = self.due_date or self.end_date
        if not check_date:
            return False
        from django.utils import timezone
        return timezone.now().date() > check_date and self.status != 'live'

    @property
    def is_completed(self):
        return self.status == 'live'

    @property
    def hierarchy_level(self):
        level = 0
        parent = self.parent
        while parent:
            level += 1
            parent = parent.parent
        return level

    @property
    def full_path(self):
        path = [self.title]
        parent = self.parent
        while parent:
            path.insert(0, parent.title)
            parent = parent.parent
        return ' > '.join(path)

    @property
    def progress_percentage(self):
        if not self.sub_features.exists():
            # Leaf feature - calculate based on status
            status_progress = {
                'idea': 0,
                'specification': 20,
                'development': 60,
                'testing': 80,
                'live': 100,
            }
            return status_progress.get(self.status, 0)
        
        # Parent feature - calculate based on sub-features
        sub_features = self.sub_features.all()
        if not sub_features:
            return 0
        
        total_progress = sum(sub.progress_percentage for sub in sub_features)
        return round(total_progress / len(sub_features), 2)

    def can_user_edit(self, user):
        # Project owner, assignee, or reporter can edit
        return (self.project.can_user_edit(user) or 
                self.assignee == user or 
                self.reporter == user)

    def get_next_status(self):
        status_flow = ['idea', 'specification', 'development', 'testing', 'live']
        current_index = status_flow.index(self.status)
        if current_index < len(status_flow) - 1:
            return status_flow[current_index + 1]
        return None

    def get_previous_status(self):
        status_flow = ['idea', 'specification', 'development', 'testing', 'live']
        current_index = status_flow.index(self.status)
        if current_index > 0:
            return status_flow[current_index - 1]
        return None

    def advance_status(self, user=None, comment=''):
        next_status = self.get_next_status()
        if next_status:
            old_status = self.status
            self.status = next_status
            if next_status == 'live':
                from django.utils import timezone
                self.completed_date = timezone.now()
            self.save()
            
            # Record workflow history if workflow system is available
            self._record_status_change(old_status, next_status, user, comment)
            return True
        return False

    def revert_status(self, user=None, comment=''):
        previous_status = self.get_previous_status()
        if previous_status:
            old_status = self.status
            self.status = previous_status
            if previous_status != 'live':
                self.completed_date = None
            self.save()
            
            # Record workflow history if workflow system is available
            self._record_status_change(old_status, previous_status, user, comment)
            return True
        return False

    def set_status(self, new_status, user=None, comment=''):
        if new_status in dict(self.STATUS_CHOICES):
            old_status = self.status
            self.status = new_status
            if new_status == 'live':
                from django.utils import timezone
                self.completed_date = timezone.now()
            elif old_status == 'live' and new_status != 'live':
                self.completed_date = None
            self.save()
            
            # Record workflow history if workflow system is available
            self._record_status_change(old_status, new_status, user, comment)
            return True
        return False

    def _record_status_change(self, from_status, to_status, user, comment):
        """Record status change in workflow history"""
        try:
            from workflow.models import WorkflowHistory, WorkflowTemplate, WorkflowState
            
            # Try to find a workflow template for features
            template = WorkflowTemplate.objects.filter(
                entity_type='feature',
                is_active=True
            ).first()
            
            if template:
                try:
                    from_state = WorkflowState.objects.get(template=template, slug=from_status) if from_status else None
                    to_state = WorkflowState.objects.get(template=template, slug=to_status)
                    
                    WorkflowHistory.objects.create(
                        template=template,
                        entity_type='feature',
                        entity_id=self.id,
                        from_state=from_state,
                        to_state=to_state,
                        changed_by=user or self.reporter,
                        comment=comment,
                        metadata={
                            'feature_title': self.title,
                            'project': str(self.project.id),
                            'assignee': str(self.assignee.id) if self.assignee else None,
                        }
                    )
                except WorkflowState.DoesNotExist:
                    # States don't exist in workflow template, skip recording
                    pass
        except ImportError:
            # Workflow app not available, skip recording
            pass

    def get_total_estimated_hours(self):
        if not self.sub_features.exists():
            return self.estimated_hours or 0
        
        total = self.estimated_hours or 0
        for sub_feature in self.sub_features.all():
            total += sub_feature.get_total_estimated_hours()
        return total

    def get_total_actual_hours(self):
        if not self.sub_features.exists():
            return self.actual_hours or 0
        
        total = self.actual_hours or 0
        for sub_feature in self.sub_features.all():
            total += sub_feature.get_total_actual_hours()
        return total

    def update_parent_timeline(self):
        """Update parent feature timeline based on sub-features"""
        if self.parent:
            self.parent._recalculate_timeline()
            self.parent.save()

    def _recalculate_timeline(self):
        """Recalculate timeline for this feature based on its sub-features"""
        sub_features_with_dates = self.sub_features.filter(
            start_date__isnull=False, 
            end_date__isnull=False
        )
        
        if sub_features_with_dates.exists():
            # Get the earliest start_date and latest end_date from sub-features
            earliest_start = sub_features_with_dates.earliest('start_date').start_date
            latest_end = sub_features_with_dates.latest('end_date').end_date
            
            # Update this feature's timeline to span all sub-features
            self.start_date = earliest_start
            self.end_date = latest_end
            
            # Calculate estimated hours based on timespan (8 hours per day)
            if latest_end and earliest_start:
                timespan_days = (latest_end - earliest_start).days + 1
                self.estimated_hours = max(timespan_days * 8, self.estimated_hours or 0)

    def save(self, *args, **kwargs):
        # Run validation
        self.full_clean()
        super().save(*args, **kwargs)
        # Update parent timeline if this is a sub-feature
        if self.parent:
            self.update_parent_timeline()

    def delete(self, *args, **kwargs):
        parent = self.parent
        super().delete(*args, **kwargs)
        # Update parent timeline after deletion if this was a sub-feature
        if parent:
            parent._recalculate_timeline()
            parent.save()


class FeatureComment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feature = models.ForeignKey(Feature, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment on {self.feature.title} by {self.author.get_full_name()}"


class FeatureAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feature = models.ForeignKey(Feature, on_delete=models.CASCADE, related_name='attachments')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    file = models.FileField(upload_to='feature_attachments/%Y/%m/%d/')
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    content_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.filename} for {self.feature.title}"

    @property
    def file_size_display(self):
        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"