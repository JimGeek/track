"""
Test cases for Todo serializers.
"""

from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
from django.contrib.auth.models import AnonymousUser

from todos.models import TodoList, Task, TaskPriority, TaskStatus
from todos.serializers import (
    TodoListSerializer, TaskSerializer, TaskCreateSerializer, 
    TaskSummarySerializer, TodoListSummarySerializer
)

User = get_user_model()


class TodoListSerializerTest(TestCase):
    """Test cases for TodoListSerializer."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123'
        )
        self.factory = APIRequestFactory()

    def test_todo_list_serialization(self):
        """Test serializing a todo list."""
        todo_list = TodoList.objects.create(
            name='Work Tasks',
            description='Tasks for work',
            user=self.user,
            color='#3B82F6'
        )
        
        # Add some tasks for computed fields
        Task.objects.create(title='Task 1', todo_list=todo_list, user=self.user, status=TaskStatus.DONE)
        Task.objects.create(title='Task 2', todo_list=todo_list, user=self.user, status=TaskStatus.TODO)
        
        serializer = TodoListSerializer(todo_list)
        data = serializer.data
        
        self.assertEqual(data['name'], 'Work Tasks')
        self.assertEqual(data['description'], 'Tasks for work')
        self.assertEqual(data['color'], '#3B82F6')
        self.assertEqual(data['task_count'], 2)
        self.assertEqual(data['completed_count'], 1)
        self.assertEqual(data['progress_percentage'], 50.0)

    def test_todo_list_creation(self):
        """Test creating a todo list through serializer."""
        # Create a mock request with the user
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        data = {
            'name': 'Personal Tasks',
            'description': 'My personal todo items',
            'color': '#10B981'
        }
        
        serializer = TodoListSerializer(data=data, context={'request': MockRequest(self.user)})
        self.assertTrue(serializer.is_valid())
        
        todo_list = serializer.save()
        self.assertEqual(todo_list.name, 'Personal Tasks')
        self.assertEqual(todo_list.user, self.user)

    def test_color_validation(self):
        """Test color validation."""
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        # Invalid color (no #)
        data = {'name': 'Test', 'color': '3B82F6'}
        serializer = TodoListSerializer(data=data, context={'request': MockRequest(self.user)})
        self.assertFalse(serializer.is_valid())
        self.assertIn('color', serializer.errors)
        
        # Invalid color (wrong length)
        data = {'name': 'Test', 'color': '#3B82F'}
        serializer = TodoListSerializer(data=data, context={'request': MockRequest(self.user)})
        self.assertFalse(serializer.is_valid())
        self.assertIn('color', serializer.errors)


class TaskSerializerTest(TestCase):
    """Test cases for TaskSerializer."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123'
        )
        self.todo_list = TodoList.objects.create(
            name='Test List',
            user=self.user
        )
        self.factory = APIRequestFactory()

    def test_task_serialization(self):
        """Test serializing a task."""
        task = Task.objects.create(
            title='Complete documentation',
            description='Write API docs',
            priority=TaskPriority.HIGH,
            status=TaskStatus.TODO,
            start_date=date(2025, 8, 26),
            end_date=date(2025, 8, 30),
            todo_list=self.todo_list,
            user=self.user
        )
        
        serializer = TaskSerializer(task)
        data = serializer.data
        
        self.assertEqual(data['title'], 'Complete documentation')
        self.assertEqual(data['description'], 'Write API docs')
        self.assertEqual(data['priority'], 'high')
        self.assertEqual(data['status'], 'todo')
        self.assertEqual(data['todo_list_name'], 'Test List')
        self.assertFalse(data['is_overdue'])
        self.assertFalse(data['is_completed'])

    def test_task_creation(self):
        """Test creating a task through serializer."""
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        data = {
            'title': 'New Task',
            'description': 'Task description',
            'priority': 'medium',
            'status': 'todo',
            'todo_list': self.todo_list.id,
            'end_date': '2025-08-30'
        }
        
        serializer = TaskSerializer(data=data, context={'request': MockRequest(self.user)})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        
        task = serializer.save()
        self.assertEqual(task.title, 'New Task')
        self.assertEqual(task.user, self.user)

    def test_date_validation(self):
        """Test date range validation."""
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        # Invalid date range (start > end)
        data = {
            'title': 'Test Task',
            'todo_list': self.todo_list.id,
            'start_date': '2025-08-30',
            'end_date': '2025-08-26'
        }
        
        serializer = TaskSerializer(data=data, context={'request': MockRequest(self.user)})
        self.assertFalse(serializer.is_valid())
        self.assertIn('end_date', serializer.errors)

    def test_todo_list_ownership_validation(self):
        """Test todo list ownership validation."""
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123'
        )
        other_list = TodoList.objects.create(name='Other List', user=other_user)
        
        class MockRequest:
            def __init__(self, user):
                self.user = user
        
        data = {
            'title': 'Test Task',
            'todo_list': other_list.id
        }
        
        serializer = TaskSerializer(data=data, context={'request': MockRequest(self.user)})
        self.assertFalse(serializer.is_valid())
        self.assertIn('todo_list', serializer.errors)