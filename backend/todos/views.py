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
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get dashboard data with tasks categorized by due dates.
        
        Returns:
        - today_tasks: Tasks due today
        - recent_activity: Recently created/updated tasks
        - upcoming_tasks: Tasks due soon
        - summary_stats: Overall statistics
        """
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=401)
            
        today = date.today()
        tomorrow = today + timedelta(days=1)
        week_end = today + timedelta(days=7)
        
        # Get tasks for the authenticated user
        tasks = Task.objects.filter(user=request.user).select_related('todo_list')
        
        # Categorize tasks
        today_tasks = tasks.filter(end_date=today).exclude(status=TaskStatus.DONE)
        recent_activity = tasks.order_by('-updated_at')[:5]
        upcoming_tasks = tasks.filter(
            end_date__gte=tomorrow,
            end_date__lte=week_end
        ).exclude(status=TaskStatus.DONE)
        overdue_tasks = tasks.filter(
            end_date__lt=today
        ).exclude(status=TaskStatus.DONE)
        
        # Serialize the data
        context = {'request': request}
        dashboard_data = {
            'today_tasks': TaskSummarySerializer(today_tasks, many=True, context=context).data,
            'recent_activity': TaskSummarySerializer(recent_activity, many=True, context=context).data,
            'upcoming_tasks': TaskSummarySerializer(upcoming_tasks, many=True, context=context).data,
            'summary_stats': {
                'total_tasks': tasks.count(),
                'completed_tasks': tasks.filter(status=TaskStatus.DONE).count(),
                'ongoing_tasks': tasks.filter(status=TaskStatus.ONGOING).count(),
                'todo_tasks': tasks.filter(status=TaskStatus.TODO).count(),
                'overdue_tasks': overdue_tasks.count(),
                'today_tasks_count': today_tasks.count(),
                'upcoming_tasks_count': upcoming_tasks.count(),
            }
        }
        
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
