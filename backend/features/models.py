from django.db import models
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.core.validators import MinLengthValidator
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
    
    due_date = models.DateField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Ordering and hierarchy
    order = models.PositiveIntegerField(default=0, help_text="Order within parent or project")
    
    class Meta:
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['project', 'status']),
            models.Index(fields=['assignee']),
            models.Index(fields=['parent']),
            models.Index(fields=['due_date']),
            models.Index(fields=['priority']),
        ]
        unique_together = ['project', 'title']

    def __str__(self):
        return f"{self.project.name} - {self.title}"

    def get_absolute_url(self):
        return reverse('feature-detail', kwargs={'pk': self.pk})

    @property
    def is_overdue(self):
        if not self.due_date:
            return False
        from django.utils import timezone
        return timezone.now().date() > self.due_date and self.status != 'live'

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

    def advance_status(self):
        next_status = self.get_next_status()
        if next_status:
            self.status = next_status
            if next_status == 'live':
                from django.utils import timezone
                self.completed_date = timezone.now()
            self.save()
            return True
        return False

    def revert_status(self):
        previous_status = self.get_previous_status()
        if previous_status:
            self.status = previous_status
            if previous_status != 'live':
                self.completed_date = None
            self.save()
            return True
        return False

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