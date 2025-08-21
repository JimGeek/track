from django.db import models
from django.contrib.auth import get_user_model
from django.urls import reverse
import uuid

User = get_user_model()


class Project(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_projects')
    team_members = models.ManyToManyField(User, blank=True, related_name='team_projects')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    deadline = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_archived = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['priority']),
            models.Index(fields=['deadline']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.name

    def get_absolute_url(self):
        return reverse('project-detail', kwargs={'pk': self.pk})

    @property
    def total_features(self):
        if hasattr(self, 'features'):
            return self.features.count()
        return 0

    @property
    def completed_features(self):
        if hasattr(self, 'features'):
            return self.features.filter(status='live').count()
        return 0

    @property
    def progress_percentage(self):
        if self.total_features == 0:
            return 0
        return round((self.completed_features / self.total_features) * 100, 2)

    @property
    def is_overdue(self):
        if not self.deadline:
            return False
        from django.utils import timezone
        return timezone.now().date() > self.deadline

    def can_user_edit(self, user):
        return self.owner == user or self.team_members.filter(id=user.id).exists()