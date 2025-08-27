"""
Filters for the todos app.

This module contains django-filter FilterSets for TodoList and Task models,
providing advanced filtering capabilities for the API endpoints.
"""

import django_filters
from datetime import date
from .models import TodoList, Task, TaskStatus, TaskPriority


class TodoListFilter(django_filters.FilterSet):
    """
    FilterSet for TodoList model.
    
    Provides filtering by:
    - color: Exact match on hex color code
    - name: Case-insensitive contains search
    - created_after: Todo lists created after specified date
    - created_before: Todo lists created before specified date
    - has_tasks: Todo lists with/without tasks
    """
    
    name = django_filters.CharFilter(lookup_expr='icontains')
    color = django_filters.CharFilter(lookup_expr='exact')
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    has_tasks = django_filters.BooleanFilter(method='filter_has_tasks')
    
    class Meta:
        model = TodoList
        fields = ['name', 'color', 'created_after', 'created_before', 'has_tasks']
    
    def filter_has_tasks(self, queryset, name, value):
        """Filter todo lists that have/don't have tasks."""
        if value is True:
            return queryset.filter(tasks__isnull=False).distinct()
        elif value is False:
            return queryset.filter(tasks__isnull=True)
        return queryset


class TaskFilter(django_filters.FilterSet):
    """
    FilterSet for Task model.
    
    Provides filtering by:
    - status: Task status (todo, ongoing, done)
    - priority: Task priority (low, medium, high, urgent)
    - todo_list: UUID of the todo list
    - due_soon: Tasks due within specified days
    - overdue: Tasks past their due date
    - completed_after: Tasks completed after specified date
    - completed_before: Tasks completed before specified date
    - created_after: Tasks created after specified date
    - created_before: Tasks created before specified date
    """
    
    status = django_filters.ChoiceFilter(choices=TaskStatus.choices)
    priority = django_filters.ChoiceFilter(choices=TaskPriority.choices)
    todo_list = django_filters.UUIDFilter(field_name='todo_list__id')
    
    # Date-based filters
    due_soon = django_filters.NumberFilter(method='filter_due_soon')
    overdue = django_filters.BooleanFilter(method='filter_overdue')
    
    # Completion date filters
    completed_after = django_filters.DateFilter(field_name='completed_at', lookup_expr='gte')
    completed_before = django_filters.DateFilter(field_name='completed_at', lookup_expr='lte')
    
    # Creation date filters
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    
    # Date range filters
    start_date_after = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    start_date_before = django_filters.DateFilter(field_name='start_date', lookup_expr='lte')
    end_date_after = django_filters.DateFilter(field_name='end_date', lookup_expr='gte')
    end_date_before = django_filters.DateFilter(field_name='end_date', lookup_expr='lte')
    
    class Meta:
        model = Task
        fields = [
            'status', 'priority', 'todo_list',
            'due_soon', 'overdue',
            'completed_after', 'completed_before',
            'created_after', 'created_before',
            'start_date_after', 'start_date_before',
            'end_date_after', 'end_date_before'
        ]
    
    def filter_due_soon(self, queryset, name, value):
        """Filter tasks due within the specified number of days."""
        if value is not None and value > 0:
            from datetime import timedelta
            cutoff_date = date.today() + timedelta(days=value)
            return queryset.filter(
                end_date__isnull=False,
                end_date__lte=cutoff_date,
                status__in=[TaskStatus.TODO, TaskStatus.ONGOING]
            )
        return queryset
    
    def filter_overdue(self, queryset, name, value):
        """Filter tasks that are overdue (past their due date and not completed)."""
        if value is True:
            return queryset.filter(
                end_date__isnull=False,
                end_date__lt=date.today(),
                status__in=[TaskStatus.TODO, TaskStatus.ONGOING]
            )
        elif value is False:
            return queryset.exclude(
                end_date__isnull=False,
                end_date__lt=date.today(),
                status__in=[TaskStatus.TODO, TaskStatus.ONGOING]
            )
        return queryset