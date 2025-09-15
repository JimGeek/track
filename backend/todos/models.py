"""
Models for the todos app - simplified task management system.

This module contains the TodoList and Task models that replace the complex
project management system with a streamlined todo list approach.
"""

import uuid
from datetime import date
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError

User = get_user_model()


class TaskPriority(models.TextChoices):
    """Priority levels for tasks."""
    LOW = 'low', 'Low'
    MEDIUM = 'medium', 'Medium'
    HIGH = 'high', 'High'
    URGENT = 'urgent', 'Urgent'


class TaskStatus(models.TextChoices):
    """Status options for tasks (simplified workflow)."""
    TODO = 'todo', 'Todo'
    ONGOING = 'ongoing', 'Ongoing'
    DONE = 'done', 'Done'


class TodoList(models.Model):
    """
    A todo list that contains multiple tasks.
    
    Replaces the Project model with a simplified structure focused on
    personal/team todo management rather than complex project management.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, help_text="Name of the todo list")
    description = models.TextField(
        blank=True, 
        null=True, 
        help_text="Optional description of the todo list"
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='todo_lists',
        help_text="Owner of the todo list"
    )
    color = models.CharField(
        max_length=7, 
        default='#3B82F6',
        help_text="Hex color code for UI display (e.g., #3B82F6)"
    )
    deadline = models.DateField(
        null=True, 
        blank=True, 
        help_text="Deadline for completing the entire todo list"
    )
    is_favorite = models.BooleanField(
        default=False,
        help_text="Whether this todo list is marked as favorite"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'todo_lists'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'name']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'name'], 
                name='unique_user_todolist_name'
            )
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def task_count(self):
        """Total number of tasks in this todo list."""
        return self.tasks.count()
    
    @property
    def completed_tasks(self):
        """Number of completed tasks in this todo list."""
        return self.tasks.filter(status=TaskStatus.DONE).count()
    
    @property
    def progress_percentage(self):
        """Progress percentage (0-100) based on completed tasks."""
        if self.task_count == 0:
            return 0
        return round((self.completed_tasks / self.task_count) * 100, 2)
    
    @property
    def overdue_count(self):
        """Number of overdue tasks in this todo list."""
        today = date.today()
        return self.tasks.filter(
            end_date__lt=today,
            status__in=[TaskStatus.TODO, TaskStatus.ONGOING]
        ).count()

    def clean(self):
        """Validate the todo list data."""
        super().clean()
        if self.color and not self.color.startswith('#'):
            raise ValidationError({'color': 'Color must be a valid hex code starting with #'})
        if self.color and len(self.color) != 7:
            raise ValidationError({'color': 'Color must be a 7-character hex code (e.g., #3B82F6)'})


class Task(models.Model):
    """
    A single task within a todo list.
    
    Replaces the Feature model with a simplified structure focused on
    individual task management rather than hierarchical project features.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(
        max_length=300, 
        help_text="Title/summary of the task"
    )
    description = models.TextField(
        blank=True, 
        null=True, 
        help_text="Detailed description of the task"
    )
    priority = models.CharField(
        max_length=10, 
        choices=TaskPriority.choices, 
        default=TaskPriority.MEDIUM,
        help_text="Priority level of the task"
    )
    status = models.CharField(
        max_length=10, 
        choices=TaskStatus.choices, 
        default=TaskStatus.TODO,
        help_text="Current status of the task"
    )
    start_date = models.DateField(
        null=True, 
        blank=True, 
        help_text="Date when work on the task should begin"
    )
    end_date = models.DateField(
        null=True, 
        blank=True, 
        help_text="Due date for the task"
    )
    todo_list = models.ForeignKey(
        TodoList, 
        on_delete=models.CASCADE, 
        related_name='tasks',
        help_text="Todo list this task belongs to"
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='tasks',
        help_text="User who owns this task"
    )
    completed_at = models.DateTimeField(
        null=True, 
        blank=True, 
        help_text="Timestamp when task was completed"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tasks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['todo_list', 'status']),
            models.Index(fields=['user', 'end_date']),
            models.Index(fields=['priority', 'status']),
            models.Index(fields=['end_date', 'status']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'priority']),
        ]
    
    def __str__(self):
        return self.title
    
    @property
    def is_overdue(self):
        """Check if task is overdue (past due date and not completed)."""
        if not self.end_date:
            return False
        if self.status == TaskStatus.DONE:
            return False
        return date.today() > self.end_date
    
    @property
    def is_completed(self):
        """Check if task is completed."""
        return self.status == TaskStatus.DONE
    
    def mark_completed(self):
        """Mark task as completed and set completion timestamp."""
        if self.status != TaskStatus.DONE:
            self.status = TaskStatus.DONE
        if not self.completed_at:
            self.completed_at = timezone.now()
        self.save()
    
    def mark_incomplete(self):
        """Mark task as incomplete and clear completion timestamp."""
        if self.status == TaskStatus.DONE:
            self.status = TaskStatus.TODO
        self.completed_at = None
        self.save()
    
    def clean(self):
        """Validate the task data."""
        super().clean()
        
        # Validate date range (start_date <= end_date)
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError({
                'end_date': 'End date must be after or equal to start date.'
            })
        
        # Validate that user owns the todo list
        if self.todo_list and self.user and self.todo_list.user != self.user:
            raise ValidationError({
                'todo_list': 'Task must be assigned to a todo list owned by the same user.'
            })
    
    def save(self, *args, **kwargs):
        """Override save to automatically set completed_at timestamp."""
        # Auto-set completed_at when status changes to DONE
        if self.status == TaskStatus.DONE and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != TaskStatus.DONE and self.completed_at:
            self.completed_at = None
            
        super().save(*args, **kwargs)
