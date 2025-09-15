"""
Serializers for the todos app.

This module contains DRF serializers for the TodoList and Task models,
providing API serialization/deserialization for the simplified todo system.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TodoList, Task, TaskPriority, TaskStatus

User = get_user_model()


class TodoListSerializer(serializers.ModelSerializer):
    """
    Serializer for TodoList model.
    
    Provides CRUD operations for todo lists with computed fields for
    task counts and progress statistics.
    """
    
    task_count = serializers.ReadOnlyField()
    completed_tasks = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    overdue_count = serializers.ReadOnlyField()
    
    class Meta:
        model = TodoList
        fields = [
            'id',
            'name', 
            'description',
            'color',
            'deadline',
            'is_favorite',
            'task_count',
            'completed_tasks', 
            'progress_percentage',
            'overdue_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_color(self, value):
        """Validate hex color format."""
        if value and not value.startswith('#'):
            raise serializers.ValidationError("Color must be a hex code starting with #")
        if value and len(value) != 7:
            raise serializers.ValidationError("Color must be a 7-character hex code (e.g., #3B82F6)")
        return value
    
    def validate_name(self, value):
        """Validate todo list name."""
        if len(value.strip()) < 1:
            raise serializers.ValidationError("Name cannot be empty")
        
        # Check for duplicate name for the same user
        user = self.context['request'].user
        name = value.strip()
        
        # Exclude current instance if updating
        queryset = TodoList.objects.filter(user=user, name=name)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("A todo list with this name already exists.")
        
        return name
    
    def create(self, validated_data):
        """Create todo list for the authenticated user."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for Task model.
    
    Provides CRUD operations for tasks with validation for dates,
    status transitions, and todo list ownership.
    """
    
    is_overdue = serializers.ReadOnlyField()
    is_completed = serializers.ReadOnlyField()
    todo_list_name = serializers.CharField(source='todo_list.name', read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description', 
            'priority',
            'status',
            'start_date',
            'end_date',
            'todo_list',
            'todo_list_name',
            'is_overdue',
            'is_completed',
            'completed_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'completed_at', 'created_at', 'updated_at']
    
    def validate_title(self, value):
        """Validate task title."""
        if len(value.strip()) < 1:
            raise serializers.ValidationError("Title cannot be empty")
        return value.strip()
    
    def validate_priority(self, value):
        """Validate task priority."""
        if value not in [choice[0] for choice in TaskPriority.choices]:
            raise serializers.ValidationError(f"Invalid priority. Must be one of: {', '.join([choice[0] for choice in TaskPriority.choices])}")
        return value
    
    def validate_status(self, value):
        """Validate task status."""
        if value not in [choice[0] for choice in TaskStatus.choices]:
            raise serializers.ValidationError(f"Invalid status. Must be one of: {', '.join([choice[0] for choice in TaskStatus.choices])}")
        return value
    
    def validate(self, data):
        """Validate task data with cross-field validation."""
        # Validate date range
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be after or equal to start date.'
            })
        
        # Validate todo list ownership during creation
        if 'todo_list' in data:
            todo_list = data['todo_list']
            user = self.context['request'].user
            
            if todo_list.user != user:
                raise serializers.ValidationError({
                    'todo_list': 'You can only create tasks in your own todo lists.'
                })
            
            # Check if task end date is within todo list deadline
            if end_date and todo_list.deadline and end_date > todo_list.deadline:
                raise serializers.ValidationError({
                    'end_date': f'Task end date cannot be later than the todo list deadline ({todo_list.deadline}).'
                })
        
        # For updates, also check against current todo list deadline
        elif self.instance and end_date:
            todo_list = self.instance.todo_list
            if todo_list.deadline and end_date > todo_list.deadline:
                raise serializers.ValidationError({
                    'end_date': f'Task end date cannot be later than the todo list deadline ({todo_list.deadline}).'
                })
        
        return data
    
    def create(self, validated_data):
        """Create task for the authenticated user."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update task with special handling for status changes."""
        # Handle status change to 'done' - mark_completed() will set completed_at
        if 'status' in validated_data and validated_data['status'] == TaskStatus.DONE:
            if instance.status != TaskStatus.DONE:
                # Task is being marked as complete
                instance = super().update(instance, validated_data)
                instance.mark_completed()
                return instance
        
        # Handle status change from 'done' to other - mark_incomplete() will clear completed_at
        elif 'status' in validated_data and validated_data['status'] != TaskStatus.DONE:
            if instance.status == TaskStatus.DONE:
                # Task is being marked as incomplete
                instance = super().update(instance, validated_data)
                instance.mark_incomplete()
                return instance
        
        return super().update(instance, validated_data)


class TaskCreateSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for creating tasks with minimal fields.
    
    Useful for quick task creation in UI where only title and todo_list are required.
    """
    
    class Meta:
        model = Task
        fields = [
            'title',
            'description',
            'priority',
            'status',
            'todo_list',
            'start_date',
            'end_date',
        ]
    
    def validate_title(self, value):
        """Validate task title."""
        if len(value.strip()) < 1:
            raise serializers.ValidationError("Title cannot be empty")
        return value.strip()
    
    def validate(self, data):
        """Validate task data with cross-field validation."""
        # Validate date range
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({
                'end_date': 'End date must be after or equal to start date.'
            })
        
        # Validate todo list ownership during creation
        if 'todo_list' in data:
            todo_list = data['todo_list']
            user = self.context['request'].user
            
            if todo_list.user != user:
                raise serializers.ValidationError({
                    'todo_list': 'You can only create tasks in your own todo lists.'
                })
        
        return data
    
    def create(self, validated_data):
        """Create task for the authenticated user."""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskSummarySerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for task summaries in lists.
    
    Provides minimal fields for efficient serialization when displaying
    many tasks in dashboard or list views.
    """
    
    todo_list_name = serializers.CharField(source='todo_list.name', read_only=True)
    todo_list_color = serializers.CharField(source='todo_list.color', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    
    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'priority',
            'status', 
            'end_date',
            'todo_list_name',
            'todo_list_color',
            'is_overdue',
            'completed_at',
        ]


class TodoListSummarySerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for todo list summaries.
    
    Provides minimal fields for efficient serialization when displaying
    todo lists in overview/dashboard contexts.
    """
    
    task_count = serializers.ReadOnlyField()
    completed_tasks = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    overdue_count = serializers.ReadOnlyField()
    
    class Meta:
        model = TodoList
        fields = [
            'id',
            'name',
            'color',
            'deadline',
            'is_favorite',
            'task_count',
            'completed_tasks',
            'progress_percentage', 
            'overdue_count',
        ]