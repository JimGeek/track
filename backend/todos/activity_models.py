"""
Activity tracking models for the todos app.

This module contains models for tracking user activities such as creating,
updating, and completing tasks and todo lists.
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class ActivityType(models.TextChoices):
    """Activity type choices."""
    TODO_LIST_CREATED = 'todo_list_created', 'Todo List Created'
    TODO_LIST_UPDATED = 'todo_list_updated', 'Todo List Updated'
    TODO_LIST_DELETED = 'todo_list_deleted', 'Todo List Deleted'
    TASK_CREATED = 'task_created', 'Task Created'
    TASK_UPDATED = 'task_updated', 'Task Updated'
    TASK_COMPLETED = 'task_completed', 'Task Completed'
    TASK_DELETED = 'task_deleted', 'Task Deleted'


class Activity(models.Model):
    """
    Model to track user activities for recent activity feed.
    
    Tracks all user actions related to todo lists and tasks for
    displaying in the dashboard recent activity section.
    """
    
    id = models.AutoField(primary_key=True)
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='activities',
        help_text="User who performed the activity"
    )
    
    activity_type = models.CharField(
        max_length=50,
        choices=ActivityType.choices,
        help_text="Type of activity performed"
    )
    
    title = models.CharField(
        max_length=200,
        help_text="Human-readable title of the activity"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Detailed description of the activity"
    )
    
    # Related objects (optional, for linking back to the object)
    todo_list_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="ID of related todo list (if applicable)"
    )
    
    todo_list_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="Name of related todo list (cached for deleted objects)"
    )
    
    task_id = models.UUIDField(
        null=True,
        blank=True,
        help_text="ID of related task (if applicable)"
    )
    
    task_title = models.CharField(
        max_length=200,
        blank=True,
        help_text="Title of related task (cached for deleted objects)"
    )
    
    # Metadata
    timestamp = models.DateTimeField(
        default=timezone.now,
        help_text="When the activity occurred"
    )
    
    # Additional context data (JSON field for flexibility)
    context = models.JSONField(
        default=dict,
        blank=True,
        help_text="Additional context data about the activity"
    )
    
    class Meta:
        db_table = 'todo_activities'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['activity_type', '-timestamp']),
            models.Index(fields=['todo_list_id']),
            models.Index(fields=['task_id']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.title} ({self.timestamp})"
    
    @classmethod
    def log_todo_list_created(cls, user, todo_list):
        """Log when a todo list is created."""
        return cls.objects.create(
            user=user,
            activity_type=ActivityType.TODO_LIST_CREATED,
            title=f"Created todo list '{todo_list.name}'",
            description=f"Created a new todo list: {todo_list.name}",
            todo_list_id=todo_list.id,
            todo_list_name=todo_list.name,
            context={
                'color': todo_list.color,
                'has_deadline': bool(todo_list.deadline),
                'is_favorite': todo_list.is_favorite,
            }
        )
    
    @classmethod
    def log_todo_list_updated(cls, user, todo_list, changes=None):
        """Log when a todo list is updated."""
        description = f"Updated todo list: {todo_list.name}"
        if changes:
            description += f" (Changed: {', '.join(changes)})"
        
        return cls.objects.create(
            user=user,
            activity_type=ActivityType.TODO_LIST_UPDATED,
            title=f"Updated todo list '{todo_list.name}'",
            description=description,
            todo_list_id=todo_list.id,
            todo_list_name=todo_list.name,
            context={
                'changes': changes or [],
                'color': todo_list.color,
            }
        )
    
    @classmethod
    def log_todo_list_deleted(cls, user, todo_list_name, todo_list_id):
        """Log when a todo list is deleted."""
        return cls.objects.create(
            user=user,
            activity_type=ActivityType.TODO_LIST_DELETED,
            title=f"Deleted todo list '{todo_list_name}'",
            description=f"Deleted todo list: {todo_list_name}",
            todo_list_id=todo_list_id,
            todo_list_name=todo_list_name,
        )
    
    @classmethod
    def log_task_created(cls, user, task):
        """Log when a task is created."""
        return cls.objects.create(
            user=user,
            activity_type=ActivityType.TASK_CREATED,
            title=f"Created task '{task.title}'",
            description=f"Created task '{task.title}' in '{task.todo_list.name}'",
            todo_list_id=task.todo_list.id,
            todo_list_name=task.todo_list.name,
            task_id=task.id,
            task_title=task.title,
            context={
                'priority': task.priority,
                'status': task.status,
                'has_due_date': bool(task.end_date),
            }
        )
    
    @classmethod
    def log_task_updated(cls, user, task, changes=None):
        """Log when a task is updated."""
        description = f"Updated task '{task.title}' in '{task.todo_list.name}'"
        if changes:
            description += f" (Changed: {', '.join(changes)})"
        
        return cls.objects.create(
            user=user,
            activity_type=ActivityType.TASK_UPDATED,
            title=f"Updated task '{task.title}'",
            description=description,
            todo_list_id=task.todo_list.id,
            todo_list_name=task.todo_list.name,
            task_id=task.id,
            task_title=task.title,
            context={
                'changes': changes or [],
                'priority': task.priority,
                'status': task.status,
            }
        )
    
    @classmethod
    def log_task_completed(cls, user, task):
        """Log when a task is completed."""
        return cls.objects.create(
            user=user,
            activity_type=ActivityType.TASK_COMPLETED,
            title=f"Completed task '{task.title}'",
            description=f"Marked task '{task.title}' as completed in '{task.todo_list.name}'",
            todo_list_id=task.todo_list.id,
            todo_list_name=task.todo_list.name,
            task_id=task.id,
            task_title=task.title,
            context={
                'priority': task.priority,
                'completion_time': task.completed_at.isoformat() if task.completed_at else None,
            }
        )
    
    @classmethod
    def log_task_deleted(cls, user, task_title, task_id, todo_list_name, todo_list_id):
        """Log when a task is deleted."""
        return cls.objects.create(
            user=user,
            activity_type=ActivityType.TASK_DELETED,
            title=f"Deleted task '{task_title}'",
            description=f"Deleted task '{task_title}' from '{todo_list_name}'",
            todo_list_id=todo_list_id,
            todo_list_name=todo_list_name,
            task_id=task_id,
            task_title=task_title,
        )
    
    @classmethod
    def get_recent_for_user(cls, user, limit=10):
        """Get recent activities for a user."""
        return cls.objects.filter(user=user)[:limit]
    
    @classmethod
    def cleanup_old_activities(cls, days=90):
        """Clean up activities older than specified days."""
        cutoff_date = timezone.now() - timezone.timedelta(days=days)
        deleted_count, _ = cls.objects.filter(timestamp__lt=cutoff_date).delete()
        return deleted_count