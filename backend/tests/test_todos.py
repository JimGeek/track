"""
Test cases for Todo models, views, and serializers.
"""

import uuid
from datetime import date, datetime, timezone
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError

from todos.models import TodoList, Task, TaskPriority, TaskStatus

User = get_user_model()


class TodoListModelTest(TestCase):
    """Test cases for TodoList model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )

    def test_create_todo_list(self):
        """Test creating a new todo list."""
        todo_list = TodoList.objects.create(
            name='Work Tasks',
            description='Tasks related to work projects',
            user=self.user,
            color='#3B82F6'
        )
        
        self.assertEqual(todo_list.name, 'Work Tasks')
        self.assertEqual(todo_list.description, 'Tasks related to work projects')
        self.assertEqual(todo_list.user, self.user)
        self.assertEqual(todo_list.color, '#3B82F6')
        self.assertIsInstance(todo_list.id, uuid.UUID)
        self.assertIsNotNone(todo_list.created_at)
        self.assertIsNotNone(todo_list.updated_at)

    def test_todo_list_str_representation(self):
        """Test string representation of todo list."""
        todo_list = TodoList.objects.create(
            name='Personal Tasks',
            user=self.user
        )
        self.assertEqual(str(todo_list), 'Personal Tasks')

    def test_todo_list_default_color(self):
        """Test default color is applied."""
        todo_list = TodoList.objects.create(
            name='Test List',
            user=self.user
        )
        self.assertEqual(todo_list.color, '#3B82F6')

    def test_todo_list_ordering(self):
        """Test todo lists are ordered by creation date (newest first)."""
        list1 = TodoList.objects.create(name='First', user=self.user)
        list2 = TodoList.objects.create(name='Second', user=self.user)
        list3 = TodoList.objects.create(name='Third', user=self.user)
        
        todo_lists = list(TodoList.objects.all())
        self.assertEqual(todo_lists[0], list3)  # Newest first
        self.assertEqual(todo_lists[1], list2)
        self.assertEqual(todo_lists[2], list1)

    def test_todo_list_user_relationship(self):
        """Test user can have multiple todo lists."""
        user2 = User.objects.create_user(
            email='user2@example.com',
            password='testpass123'
        )
        
        list1 = TodoList.objects.create(name='List 1', user=self.user)
        list2 = TodoList.objects.create(name='List 2', user=self.user)
        list3 = TodoList.objects.create(name='List 3', user=user2)
        
        self.assertEqual(self.user.todo_lists.count(), 2)
        self.assertEqual(user2.todo_lists.count(), 1)
        self.assertIn(list1, self.user.todo_lists.all())
        self.assertIn(list2, self.user.todo_lists.all())
        self.assertIn(list3, user2.todo_lists.all())

    def test_todo_list_task_count(self):
        """Test task count property."""
        todo_list = TodoList.objects.create(name='Test List', user=self.user)
        
        # Initially no tasks
        self.assertEqual(todo_list.task_count, 0)
        
        # Add tasks and check count
        Task.objects.create(title='Task 1', todo_list=todo_list, user=self.user)
        Task.objects.create(title='Task 2', todo_list=todo_list, user=self.user)
        
        # Refresh from database
        todo_list.refresh_from_db()
        self.assertEqual(todo_list.task_count, 2)

    def test_todo_list_completed_count(self):
        """Test completed task count property."""
        todo_list = TodoList.objects.create(name='Test List', user=self.user)
        
        # Create tasks with different statuses
        Task.objects.create(title='Task 1', todo_list=todo_list, user=self.user, status=TaskStatus.TODO)
        Task.objects.create(title='Task 2', todo_list=todo_list, user=self.user, status=TaskStatus.ONGOING)
        Task.objects.create(title='Task 3', todo_list=todo_list, user=self.user, status=TaskStatus.DONE)
        Task.objects.create(title='Task 4', todo_list=todo_list, user=self.user, status=TaskStatus.DONE)
        
        # Refresh from database
        todo_list.refresh_from_db()
        self.assertEqual(todo_list.completed_tasks, 2)


class TaskModelTest(TestCase):
    """Test cases for Task model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            email='testuser@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.todo_list = TodoList.objects.create(
            name='Test List',
            user=self.user
        )

    def test_create_task(self):
        """Test creating a new task."""
        task = Task.objects.create(
            title='Complete API documentation',
            description='Write comprehensive API documentation for the new endpoints',
            priority=TaskPriority.HIGH,
            status=TaskStatus.TODO,
            start_date=date(2025, 8, 26),
            end_date=date(2025, 8, 30),
            todo_list=self.todo_list,
            user=self.user
        )
        
        self.assertEqual(task.title, 'Complete API documentation')
        self.assertEqual(task.description, 'Write comprehensive API documentation for the new endpoints')
        self.assertEqual(task.priority, TaskPriority.HIGH)
        self.assertEqual(task.status, TaskStatus.TODO)
        self.assertEqual(task.start_date, date(2025, 8, 26))
        self.assertEqual(task.end_date, date(2025, 8, 30))
        self.assertEqual(task.todo_list, self.todo_list)
        self.assertEqual(task.user, self.user)
        self.assertIsInstance(task.id, uuid.UUID)
        self.assertIsNotNone(task.created_at)
        self.assertIsNotNone(task.updated_at)

    def test_task_str_representation(self):
        """Test string representation of task."""
        task = Task.objects.create(
            title='Test Task',
            todo_list=self.todo_list,
            user=self.user
        )
        self.assertEqual(str(task), 'Test Task')

    def test_task_default_values(self):
        """Test default values for task fields."""
        task = Task.objects.create(
            title='Test Task',
            todo_list=self.todo_list,
            user=self.user
        )
        
        self.assertEqual(task.priority, TaskPriority.MEDIUM)
        self.assertEqual(task.status, TaskStatus.TODO)
        self.assertIsNone(task.description)
        self.assertIsNone(task.start_date)
        self.assertIsNone(task.end_date)
        self.assertIsNone(task.completed_at)

    def test_task_priority_choices(self):
        """Test task priority enum values."""
        self.assertEqual(TaskPriority.LOW, 'low')
        self.assertEqual(TaskPriority.MEDIUM, 'medium')
        self.assertEqual(TaskPriority.HIGH, 'high')
        self.assertEqual(TaskPriority.URGENT, 'urgent')

    def test_task_status_choices(self):
        """Test task status enum values."""
        self.assertEqual(TaskStatus.TODO, 'todo')
        self.assertEqual(TaskStatus.ONGOING, 'ongoing')
        self.assertEqual(TaskStatus.DONE, 'done')

    def test_task_ordering(self):
        """Test tasks are ordered by creation date (newest first)."""
        task1 = Task.objects.create(title='First', todo_list=self.todo_list, user=self.user)
        task2 = Task.objects.create(title='Second', todo_list=self.todo_list, user=self.user)
        task3 = Task.objects.create(title='Third', todo_list=self.todo_list, user=self.user)
        
        tasks = list(Task.objects.all())
        self.assertEqual(tasks[0], task3)  # Newest first
        self.assertEqual(tasks[1], task2)
        self.assertEqual(tasks[2], task1)

    def test_task_relationships(self):
        """Test task relationships with todo list and user."""
        user2 = User.objects.create_user(
            email='user2@example.com',
            password='testpass123'
        )
        list2 = TodoList.objects.create(name='List 2', user=user2)
        
        task1 = Task.objects.create(title='Task 1', todo_list=self.todo_list, user=self.user)
        task2 = Task.objects.create(title='Task 2', todo_list=self.todo_list, user=self.user)
        task3 = Task.objects.create(title='Task 3', todo_list=list2, user=user2)
        
        # Test todo list relationship
        self.assertEqual(self.todo_list.tasks.count(), 2)
        self.assertEqual(list2.tasks.count(), 1)
        self.assertIn(task1, self.todo_list.tasks.all())
        self.assertIn(task2, self.todo_list.tasks.all())
        self.assertIn(task3, list2.tasks.all())
        
        # Test user relationship
        self.assertEqual(self.user.tasks.count(), 2)
        self.assertEqual(user2.tasks.count(), 1)

    def test_task_is_overdue_property(self):
        """Test is_overdue property."""
        from datetime import timedelta
        today = date.today()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)
        
        # Task without end date is not overdue
        task_no_date = Task.objects.create(
            title='No Date Task',
            todo_list=self.todo_list,
            user=self.user
        )
        self.assertFalse(task_no_date.is_overdue)
        
        # Completed task is not overdue even if past due date
        task_completed = Task.objects.create(
            title='Completed Task',
            todo_list=self.todo_list,
            user=self.user,
            end_date=yesterday,
            status=TaskStatus.DONE
        )
        self.assertFalse(task_completed.is_overdue)
        
        # Incomplete task past due date is overdue
        task_overdue = Task.objects.create(
            title='Overdue Task',
            todo_list=self.todo_list,
            user=self.user,
            end_date=yesterday,
            status=TaskStatus.TODO
        )
        self.assertTrue(task_overdue.is_overdue)
        
        # Task with future due date is not overdue
        task_future = Task.objects.create(
            title='Future Task',
            todo_list=self.todo_list,
            user=self.user,
            end_date=tomorrow,
            status=TaskStatus.TODO
        )
        self.assertFalse(task_future.is_overdue)

    def test_task_mark_completed(self):
        """Test marking task as completed."""
        task = Task.objects.create(
            title='Test Task',
            todo_list=self.todo_list,
            user=self.user,
            status=TaskStatus.TODO
        )
        
        # Initially not completed
        self.assertIsNone(task.completed_at)
        self.assertEqual(task.status, TaskStatus.TODO)
        
        # Mark as completed
        task.status = TaskStatus.DONE
        task.mark_completed()
        
        self.assertEqual(task.status, TaskStatus.DONE)
        self.assertIsNotNone(task.completed_at)

    def test_task_date_validation(self):
        """Test task date validation (start date <= end date)."""
        # Valid dates (start before end)
        task_valid = Task.objects.create(
            title='Valid Task',
            todo_list=self.todo_list,
            user=self.user,
            start_date=date(2025, 8, 26),
            end_date=date(2025, 8, 30)
        )
        self.assertIsNotNone(task_valid)
        
        # Same dates should be valid
        task_same = Task.objects.create(
            title='Same Date Task',
            todo_list=self.todo_list,
            user=self.user,
            start_date=date(2025, 8, 26),
            end_date=date(2025, 8, 26)
        )
        self.assertIsNotNone(task_same)

    def test_task_cascade_delete(self):
        """Test tasks are deleted when todo list is deleted."""
        task1 = Task.objects.create(title='Task 1', todo_list=self.todo_list, user=self.user)
        task2 = Task.objects.create(title='Task 2', todo_list=self.todo_list, user=self.user)
        
        # Verify tasks exist
        self.assertEqual(Task.objects.count(), 2)
        
        # Delete todo list
        self.todo_list.delete()
        
        # Verify tasks are deleted
        self.assertEqual(Task.objects.count(), 0)

    def test_task_user_cascade_delete(self):
        """Test tasks are deleted when user is deleted."""
        task1 = Task.objects.create(title='Task 1', todo_list=self.todo_list, user=self.user)
        task2 = Task.objects.create(title='Task 2', todo_list=self.todo_list, user=self.user)
        
        # Verify tasks exist
        self.assertEqual(Task.objects.count(), 2)
        
        # Delete user (this will also delete todo list due to cascade)
        self.user.delete()
        
        # Verify tasks are deleted
        self.assertEqual(Task.objects.count(), 0)
        self.assertEqual(TodoList.objects.count(), 0)