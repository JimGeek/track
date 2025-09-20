"""
Django signals for the todos app.

This module contains signal handlers that automatically log user activities
when todo lists and tasks are created, updated, or deleted.
"""

from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from .models import TodoList, Task, TaskStatus
from .activity_models import Activity


@receiver(post_save, sender=TodoList)
def log_todo_list_activity(sender, instance, created, **kwargs):
    """Log activity when a todo list is created or updated."""
    if created:
        # Log todo list creation
        Activity.log_todo_list_created(
            user=instance.user,
            todo_list=instance
        )
    else:
        # Log todo list update
        # Note: We can't easily detect what changed without tracking 
        # previous values, so we'll log a generic update
        Activity.log_todo_list_updated(
            user=instance.user,
            todo_list=instance
        )


@receiver(pre_delete, sender=TodoList)
def log_todo_list_deletion(sender, instance, **kwargs):
    """Log activity when a todo list is deleted."""
    Activity.log_todo_list_deleted(
        user=instance.user,
        todo_list_name=instance.name,
        todo_list_id=instance.id
    )


@receiver(post_save, sender=Task)
def log_task_activity(sender, instance, created, **kwargs):
    """Log activity when a task is created or updated."""
    if created:
        # Log task creation
        Activity.log_task_created(
            user=instance.user,
            task=instance
        )
    else:
        # Check if task was completed
        if instance.status == TaskStatus.DONE and instance.completed_at:
            # Check if this is a new completion (not just an update)
            # We'll assume if completed_at is recent, it's a new completion
            from django.utils import timezone
            from datetime import timedelta
            
            recent_threshold = timezone.now() - timedelta(minutes=1)
            if instance.completed_at >= recent_threshold:
                Activity.log_task_completed(
                    user=instance.user,
                    task=instance
                )
            else:
                # Regular update
                Activity.log_task_updated(
                    user=instance.user,
                    task=instance
                )
        else:
            # Regular task update
            Activity.log_task_updated(
                user=instance.user,
                task=instance
            )


@receiver(pre_delete, sender=Task)
def log_task_deletion(sender, instance, **kwargs):
    """Log activity when a task is deleted."""
    Activity.log_task_deleted(
        user=instance.user,
        task_title=instance.title,
        task_id=instance.id,
        todo_list_name=instance.todo_list.name,
        todo_list_id=instance.todo_list.id
    )