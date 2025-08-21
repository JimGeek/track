# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-project-management-crud/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### Project Model

```python
# models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinLengthValidator
from django.utils import timezone

class Project(models.Model):
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]
    
    DOMAIN_CHOICES = [
        ('web', 'Web Application'),
        ('mobile', 'Mobile Application'),
        ('desktop', 'Desktop Application'),
        ('api', 'API/Backend Service'),
        ('data', 'Data/Analytics'),
        ('infrastructure', 'Infrastructure'),
        ('other', 'Other'),
    ]
    
    # Core identification
    name = models.CharField(
        max_length=200,
        unique=True,
        validators=[MinLengthValidator(3)],
        help_text="Unique project name"
    )
    
    slug = models.SlugField(
        max_length=220,
        unique=True,
        help_text="URL-friendly version of name"
    )
    
    # Descriptive information
    description = models.TextField(
        blank=True,
        help_text="Detailed project description"
    )
    
    short_description = models.CharField(
        max_length=500,
        blank=True,
        help_text="Brief project summary"
    )
    
    # Timeline management
    start_date = models.DateField(
        null=True,
        blank=True,
        help_text="Project start date"
    )
    
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text="Project end date"
    )
    
    target_launch_date = models.DateField(
        null=True,
        blank=True,
        help_text="Target launch date"
    )
    
    # Classification and status
    domain = models.CharField(
        max_length=50,
        choices=DOMAIN_CHOICES,
        default='web',
        help_text="Project domain/category"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='planning',
        help_text="Current project status"
    )
    
    priority = models.CharField(
        max_length=10,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('critical', 'Critical'),
        ],
        default='medium',
        help_text="Project priority level"
    )
    
    # Ownership and access
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='owned_projects',
        help_text="Project owner"
    )
    
    team_members = models.ManyToManyField(
        User,
        through='ProjectMembership',
        related_name='projects',
        blank=True,
        help_text="Project team members"
    )
    
    # Metadata
    is_active = models.BooleanField(
        default=True,
        help_text="Is project currently active"
    )
    
    is_public = models.BooleanField(
        default=False,
        help_text="Is project visible to all users"
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
            models.Index(fields=['status', 'domain']),
            models.Index(fields=['owner', 'is_active']),
            models.Index(fields=['created_at']),
            models.Index(fields=['end_date']),
        ]
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
    
    def __str__(self):
        return self.name
    
    def clean(self):
        from django.core.exceptions import ValidationError
        
        # Validate date ranges
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                raise ValidationError('End date must be after start date')
        
        if self.start_date and self.target_launch_date:
            if self.target_launch_date < self.start_date:
                raise ValidationError('Target launch date cannot be before start date')
    
    def save(self, *args, **kwargs):
        # Auto-generate slug from name
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self):
        if self.end_date:
            return timezone.now().date() > self.end_date and self.status not in ['completed', 'archived']
        return False
    
    @property
    def days_remaining(self):
        if self.end_date:
            delta = self.end_date - timezone.now().date()
            return delta.days if delta.days > 0 else 0
        return None
    
    @property
    def feature_request_count(self):
        return self.feature_requests.count()


class ProjectMembership(models.Model):
    ROLE_CHOICES = [
        ('member', 'Member'),
        ('contributor', 'Contributor'),
        ('manager', 'Manager'),
        ('admin', 'Admin'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member')
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'project']
        verbose_name = 'Project Membership'
        verbose_name_plural = 'Project Memberships'
    
    def __str__(self):
        return f"{self.user.username} - {self.project.name} ({self.role})"
```

## Migrations

### Initial Migration

```python
# Generated migration file: 0002_project_management.py
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
import django.utils.timezone

class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('track', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Unique project name', max_length=200, unique=True, validators=[django.core.validators.MinLengthValidator(3)])),
                ('slug', models.SlugField(help_text='URL-friendly version of name', max_length=220, unique=True)),
                ('description', models.TextField(blank=True, help_text='Detailed project description')),
                ('short_description', models.CharField(blank=True, help_text='Brief project summary', max_length=500)),
                ('start_date', models.DateField(blank=True, help_text='Project start date', null=True)),
                ('end_date', models.DateField(blank=True, help_text='Project end date', null=True)),
                ('target_launch_date', models.DateField(blank=True, help_text='Target launch date', null=True)),
                ('domain', models.CharField(choices=[('web', 'Web Application'), ('mobile', 'Mobile Application'), ('desktop', 'Desktop Application'), ('api', 'API/Backend Service'), ('data', 'Data/Analytics'), ('infrastructure', 'Infrastructure'), ('other', 'Other')], default='web', help_text='Project domain/category', max_length=50)),
                ('status', models.CharField(choices=[('planning', 'Planning'), ('active', 'Active'), ('on_hold', 'On Hold'), ('completed', 'Completed'), ('archived', 'Archived')], default='planning', help_text='Current project status', max_length=20)),
                ('priority', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], default='medium', help_text='Project priority level', max_length=10)),
                ('is_active', models.BooleanField(default=True, help_text='Is project currently active')),
                ('is_public', models.BooleanField(default=False, help_text='Is project visible to all users')),
                ('created_at', models.DateTimeField(auto_now_add=True, help_text='Creation timestamp')),
                ('updated_at', models.DateTimeField(auto_now=True, help_text='Last update timestamp')),
                ('owner', models.ForeignKey(help_text='Project owner', on_delete=django.db.models.deletion.CASCADE, related_name='owned_projects', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Project',
                'verbose_name_plural': 'Projects',
                'ordering': ['-updated_at', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ProjectMembership',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('member', 'Member'), ('contributor', 'Contributor'), ('manager', 'Manager'), ('admin', 'Admin')], default='member', max_length=20)),
                ('joined_at', models.DateTimeField(auto_now_add=True)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='track.project')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Project Membership',
                'verbose_name_plural': 'Project Memberships',
            },
        ),
        migrations.AddField(
            model_name='project',
            name='team_members',
            field=models.ManyToManyField(blank=True, help_text='Project team members', related_name='projects', through='track.ProjectMembership', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddIndex(
            model_name='project',
            index=models.Index(fields=['status', 'domain'], name='track_project_status_domain_idx'),
        ),
        migrations.AddIndex(
            model_name='project',
            index=models.Index(fields=['owner', 'is_active'], name='track_project_owner_active_idx'),
        ),
        migrations.AddIndex(
            model_name='project',
            index=models.Index(fields=['created_at'], name='track_project_created_idx'),
        ),
        migrations.AddIndex(
            model_name='project',
            index=models.Index(fields=['end_date'], name='track_project_end_date_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='projectmembership',
            unique_together={('user', 'project')},
        ),
    ]
```

### Database Indexes Strategy

```sql
-- Performance optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS track_project_status_priority_idx 
ON track_project (status, priority);

CREATE INDEX CONCURRENTLY IF NOT EXISTS track_project_domain_active_idx 
ON track_project (domain, is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS track_project_name_search_idx 
ON track_project USING gin (to_tsvector('english', name || ' ' || description));
```