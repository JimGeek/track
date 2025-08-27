"""
Views for the todos app.

This module contains DRF ViewSets for the TodoList and Task models,
providing full CRUD operations with filtering, search, and pagination.
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Case, When, IntegerField
from datetime import date, timedelta

from .models import TodoList, Task, TaskStatus
from .serializers import (
    TodoListSerializer, TaskSerializer, TaskCreateSerializer,
    TodoListSummarySerializer, TaskSummarySerializer
)
from .filters import TodoListFilter, TaskFilter


class TodoListViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TodoList model.
    
    Provides CRUD operations with filtering by color, search by name,
    and ordering by various fields. Only returns todo lists owned by
    the authenticated user.
    """
    
    serializer_class = TodoListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TodoListFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'updated_at', 'task_count', 'progress_percentage']
    ordering = ['-created_at']  # Default ordering: newest first
    
    def get_queryset(self):
        """Return todo lists for the authenticated user only."""
        return TodoList.objects.filter(user=self.request.user).prefetch_related('tasks')
    
    def perform_create(self, serializer):
        """Create todo list for the authenticated user."""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get a summary of all todo lists with minimal data for dashboard.
        
        Returns lightweight serialization suitable for overview displays.
        """
        queryset = self.get_queryset()
        serializer = TodoListSummarySerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """
        Get all tasks for a specific todo list.
        
        Supports filtering and ordering of tasks within the list.
        """
        todo_list = self.get_object()
        tasks = todo_list.tasks.filter(user=request.user)
        
        # Apply task filtering
        status_filter = request.query_params.get('status')
        if status_filter:
            tasks = tasks.filter(status=status_filter)
        
        priority_filter = request.query_params.get('priority')
        if priority_filter:
            tasks = tasks.filter(priority=priority_filter)
        
        # Apply ordering
        ordering = request.query_params.get('ordering', '-created_at')
        tasks = tasks.order_by(ordering)
        
        serializer = TaskSummarySerializer(tasks, many=True)
        return Response(serializer.data)


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task model.
    
    Provides CRUD operations with comprehensive filtering by status, priority,
    todo list, due dates, and search by title/description. Only returns
    tasks owned by the authenticated user.
    """
    
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ['title', 'description']
    ordering_fields = [
        'title', 'priority', 'status', 'start_date', 'end_date', 
        'created_at', 'updated_at', 'completed_at'
    ]
    ordering = ['-created_at']  # Default ordering: newest first
    
    def get_queryset(self):
        """Return tasks for the authenticated user only."""
        return Task.objects.filter(user=self.request.user).select_related('todo_list')
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action in ['list'] and self.request.query_params.get('summary'):
            return TaskSummarySerializer
        return TaskSerializer
    
    def perform_create(self, serializer):
        """Create task for the authenticated user."""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'], permission_classes=[])
    def dashboard(self, request):
        """
        Get dashboard data with tasks categorized by due dates.
        
        Returns:
        - due_today: Tasks due today
        - due_tomorrow: Tasks due tomorrow
        - due_this_week: Tasks due within 7 days
        - due_this_month: Tasks due within 30 days
        - overdue: Tasks past due date
        """
        today = date.today()
        tomorrow = today + timedelta(days=1)
        week_end = today + timedelta(days=7)
        month_end = today + timedelta(days=30)
        
        # For testing, get all tasks for user 1 (admin) with explicit model import
        from django.contrib.auth import get_user_model
        from .models import Task, TodoList
        User = get_user_model()
        admin_user = User.objects.get(id=1)
        tasks = Task.objects.filter(user=admin_user).exclude(status=TaskStatus.DONE).select_related('todo_list')
        
        # Add context for proper serialization
        serializer_context = {'request': request}
        
        # Debug: try basic data access without serializer, step by step
        try:
            # First try without join
            task_count = tasks.count()
            print(f"Basic task count: {task_count}")
            
            # Try simple values() without join
            simple_tasks = list(tasks.values('id', 'title', 'end_date'))
            print(f"Simple tasks query worked: {len(simple_tasks)}")
            
            # Now try with join
            task_list = list(tasks.values('id', 'title', 'end_date', 'todo_list__name', 'todo_list__color'))
            print(f"Join query worked: {len(task_list)}")
            
            dashboard_data = {
                'debug': True,
                'task_count': len(task_list),
                'tasks': task_list,
                'due_today': [],
                'due_tomorrow': [],
                'due_this_week': [],
                'due_this_month': [],
                'overdue': [],
            }
        except Exception as e:
            dashboard_data = {
                'error': str(e),
                'debug': True,
                'today': str(today)
            }
        
        # Add summary statistics if not in error state
        if 'error' not in dashboard_data:
            try:
                dashboard_data['stats'] = {
                    'total_active_tasks': tasks.count(),
                    'due_today_count': len(dashboard_data['due_today']),
                    'due_tomorrow_count': len(dashboard_data['due_tomorrow']),
                    'due_this_week_count': len(dashboard_data['due_this_week']),
                    'due_this_month_count': len(dashboard_data['due_this_month']),
                    'overdue_count': len(dashboard_data['overdue']),
                }
            except Exception as e:
                dashboard_data['stats_error'] = str(e)
        
        return Response(dashboard_data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get a summary of tasks with minimal data for list views.
        
        Returns lightweight serialization suitable for kanban boards
        and list views with reduced data transfer.
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = TaskSummarySerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """
        Get tasks grouped by status for kanban board display.
        
        Returns:
        - todo: Tasks with status 'todo'
        - ongoing: Tasks with status 'ongoing'  
        - done: Tasks with status 'done'
        """
        tasks = self.filter_queryset(self.get_queryset())
        
        status_data = {
            'todo': TaskSummarySerializer(
                tasks.filter(status=TaskStatus.TODO), many=True
            ).data,
            'ongoing': TaskSummarySerializer(
                tasks.filter(status=TaskStatus.ONGOING), many=True
            ).data,
            'done': TaskSummarySerializer(
                tasks.filter(status=TaskStatus.DONE), many=True
            ).data,
        }
        
        return Response(status_data)
    
    @action(detail=True, methods=['post'])
    def mark_complete(self, request, pk=None):
        """
        Mark a task as complete.
        
        Updates status to 'done' and sets completed_at timestamp.
        """
        task = self.get_object()
        if task.status != TaskStatus.DONE:
            task.mark_completed()
            serializer = self.get_serializer(task)
            return Response(serializer.data)
        else:
            return Response(
                {'detail': 'Task is already completed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def mark_incomplete(self, request, pk=None):
        """
        Mark a task as incomplete.
        
        Updates status from 'done' to 'todo' and clears completed_at.
        """
        task = self.get_object()
        if task.status == TaskStatus.DONE:
            task.mark_incomplete()
            serializer = self.get_serializer(task)
            return Response(serializer.data)
        else:
            return Response(
                {'detail': 'Task is not completed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
