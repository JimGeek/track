"""
Test cases for Todo API endpoints.
"""

from datetime import date, timedelta
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

from todos.models import TodoList, Task, TaskPriority, TaskStatus

User = get_user_model()


class TodoListAPITest(TestCase):
    """Test cases for TodoList CRUD API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test users
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            password='testpass123'
        )
        
        # Create JWT tokens
        self.user1_token = RefreshToken.for_user(self.user1).access_token
        self.user2_token = RefreshToken.for_user(self.user2).access_token
        
        # Create test todo lists
        self.todo_list1 = TodoList.objects.create(
            name='Work Tasks',
            description='Tasks related to work',
            user=self.user1,
            color='#3B82F6'
        )
        
        self.todo_list2 = TodoList.objects.create(
            name='Personal Tasks',
            description='Personal todo items',
            user=self.user1,
            color='#10B981'
        )
        
        # Todo list owned by different user
        self.other_user_list = TodoList.objects.create(
            name='Other User List',
            user=self.user2,
            color='#EF4444'
        )
        
        # Add some tasks for testing computed fields
        Task.objects.create(
            title='Completed Task',
            todo_list=self.todo_list1,
            user=self.user1,
            status=TaskStatus.DONE
        )
        Task.objects.create(
            title='Pending Task',
            todo_list=self.todo_list1,
            user=self.user1,
            status=TaskStatus.TODO
        )

    def authenticate_user1(self):
        """Authenticate as user1."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user1_token}')

    def authenticate_user2(self):
        """Authenticate as user2."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user2_token}')

    def test_list_todo_lists_authenticated(self):
        """Test listing todo lists for authenticated user."""
        self.authenticate_user1()
        url = reverse('todolist-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should only return user1's todo lists
        self.assertEqual(data['count'], 2)
        names = [item['name'] for item in data['results']]
        self.assertIn('Work Tasks', names)
        self.assertIn('Personal Tasks', names)
        self.assertNotIn('Other User List', names)
        
        # Check computed fields
        work_list = next(item for item in data['results'] if item['name'] == 'Work Tasks')
        self.assertEqual(work_list['task_count'], 2)
        self.assertEqual(work_list['completed_count'], 1)
        self.assertEqual(work_list['progress_percentage'], 50.0)

    def test_list_todo_lists_unauthenticated(self):
        """Test listing todo lists without authentication."""
        url = reverse('todolist-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_todo_list(self):
        """Test creating a new todo list."""
        self.authenticate_user1()
        url = reverse('todolist-list')
        
        data = {
            'name': 'New Project',
            'description': 'A new project description',
            'color': '#8B5CF6'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the todo list was created
        todo_list = TodoList.objects.get(name='New Project')
        self.assertEqual(todo_list.user, self.user1)
        self.assertEqual(todo_list.description, 'A new project description')
        self.assertEqual(todo_list.color, '#8B5CF6')

    def test_create_todo_list_invalid_color(self):
        """Test creating todo list with invalid color."""
        self.authenticate_user1()
        url = reverse('todolist-list')
        
        data = {
            'name': 'Test List',
            'color': 'invalid-color'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('color', response.json())

    def test_create_todo_list_duplicate_name(self):
        """Test creating todo list with duplicate name for same user."""
        self.authenticate_user1()
        url = reverse('todolist-list')
        
        data = {
            'name': 'Work Tasks',  # Already exists for user1
            'description': 'Duplicate name test'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_retrieve_todo_list(self):
        """Test retrieving a specific todo list."""
        self.authenticate_user1()
        url = reverse('todolist-detail', args=[self.todo_list1.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['name'], 'Work Tasks')
        self.assertEqual(data['description'], 'Tasks related to work')
        self.assertEqual(data['color'], '#3B82F6')
        self.assertEqual(data['task_count'], 2)
        self.assertEqual(data['completed_count'], 1)

    def test_retrieve_other_user_todo_list(self):
        """Test retrieving todo list owned by different user."""
        self.authenticate_user1()
        url = reverse('todolist-detail', args=[self.other_user_list.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_update_todo_list(self):
        """Test updating a todo list."""
        self.authenticate_user1()
        url = reverse('todolist-detail', args=[self.todo_list1.id])
        
        data = {
            'name': 'Updated Work Tasks',
            'description': 'Updated description',
            'color': '#F59E0B'
        }
        
        response = self.client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify the changes
        self.todo_list1.refresh_from_db()
        self.assertEqual(self.todo_list1.name, 'Updated Work Tasks')
        self.assertEqual(self.todo_list1.description, 'Updated description')
        self.assertEqual(self.todo_list1.color, '#F59E0B')

    def test_partial_update_todo_list(self):
        """Test partially updating a todo list."""
        self.authenticate_user1()
        url = reverse('todolist-detail', args=[self.todo_list1.id])
        
        data = {
            'name': 'Partially Updated'
        }
        
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify only the name changed
        self.todo_list1.refresh_from_db()
        self.assertEqual(self.todo_list1.name, 'Partially Updated')
        self.assertEqual(self.todo_list1.description, 'Tasks related to work')  # Unchanged

    def test_update_other_user_todo_list(self):
        """Test updating todo list owned by different user."""
        self.authenticate_user1()
        url = reverse('todolist-detail', args=[self.other_user_list.id])
        
        data = {'name': 'Hacked Name'}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_todo_list(self):
        """Test deleting a todo list."""
        self.authenticate_user1()
        url = reverse('todolist-detail', args=[self.todo_list2.id])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify the todo list was deleted
        self.assertFalse(TodoList.objects.filter(id=self.todo_list2.id).exists())

    def test_delete_other_user_todo_list(self):
        """Test deleting todo list owned by different user."""
        self.authenticate_user1()
        url = reverse('todolist-detail', args=[self.other_user_list.id])
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verify the todo list still exists
        self.assertTrue(TodoList.objects.filter(id=self.other_user_list.id).exists())

    def test_search_todo_lists(self):
        """Test searching todo lists by name."""
        self.authenticate_user1()
        url = reverse('todolist-list')
        response = self.client.get(url, {'search': 'work'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['count'], 1)
        self.assertEqual(data['results'][0]['name'], 'Work Tasks')

    def test_filter_todo_lists_by_color(self):
        """Test filtering todo lists by color."""
        self.authenticate_user1()
        url = reverse('todolist-list')
        response = self.client.get(url, {'color': '#3B82F6'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['count'], 1)
        self.assertEqual(data['results'][0]['name'], 'Work Tasks')

    def test_ordering_todo_lists(self):
        """Test ordering todo lists by creation date."""
        self.authenticate_user1()
        url = reverse('todolist-list')
        
        # Test ascending order
        response = self.client.get(url, {'ordering': 'created_at'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should be ordered by creation date (oldest first)
        names = [item['name'] for item in data['results']]
        self.assertEqual(names, ['Work Tasks', 'Personal Tasks'])
        
        # Test descending order (default)
        response = self.client.get(url, {'ordering': '-created_at'})
        data = response.json()
        names = [item['name'] for item in data['results']]
        self.assertEqual(names, ['Personal Tasks', 'Work Tasks'])


class TaskAPITest(TestCase):
    """Test cases for Task CRUD API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        self.user1 = User.objects.create_user(
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            email='user2@example.com',
            password='testpass123'
        )
        
        self.user1_token = RefreshToken.for_user(self.user1).access_token
        self.user2_token = RefreshToken.for_user(self.user2).access_token
        
        self.todo_list1 = TodoList.objects.create(
            name='Work List',
            user=self.user1
        )
        
        self.other_user_list = TodoList.objects.create(
            name='Other User List',
            user=self.user2
        )
        
        self.task1 = Task.objects.create(
            title='Important Task',
            description='This is important',
            priority=TaskPriority.HIGH,
            status=TaskStatus.TODO,
            end_date=date.today() + timedelta(days=7),
            todo_list=self.todo_list1,
            user=self.user1
        )
        
        self.task2 = Task.objects.create(
            title='Completed Task',
            priority=TaskPriority.MEDIUM,
            status=TaskStatus.DONE,
            todo_list=self.todo_list1,
            user=self.user1
        )

    def authenticate_user1(self):
        """Authenticate as user1."""
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.user1_token}')

    def test_list_tasks_authenticated(self):
        """Test listing tasks for authenticated user."""
        self.authenticate_user1()
        url = reverse('task-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['count'], 2)
        titles = [item['title'] for item in data['results']]
        self.assertIn('Important Task', titles)
        self.assertIn('Completed Task', titles)

    def test_create_task(self):
        """Test creating a new task."""
        self.authenticate_user1()
        url = reverse('task-list')
        
        data = {
            'title': 'New Task',
            'description': 'Task description',
            'priority': 'high',
            'status': 'todo',
            'todo_list': str(self.todo_list1.id),
            'start_date': '2025-08-26',
            'end_date': '2025-08-30'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verify the task was created
        task = Task.objects.get(title='New Task')
        self.assertEqual(task.user, self.user1)
        self.assertEqual(task.todo_list, self.todo_list1)

    def test_create_task_in_other_user_list(self):
        """Test creating task in todo list owned by different user."""
        self.authenticate_user1()
        url = reverse('task-list')
        
        data = {
            'title': 'Unauthorized Task',
            'todo_list': str(self.other_user_list.id)
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('todo_list', response.json())

    def test_update_task_status_to_done(self):
        """Test updating task status to done sets completed_at."""
        self.authenticate_user1()
        url = reverse('task-detail', args=[self.task1.id])
        
        data = {'status': 'done'}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify completed_at was set
        self.task1.refresh_from_db()
        self.assertEqual(self.task1.status, TaskStatus.DONE)
        self.assertIsNotNone(self.task1.completed_at)

    def test_filter_tasks_by_status(self):
        """Test filtering tasks by status."""
        self.authenticate_user1()
        url = reverse('task-list')
        response = self.client.get(url, {'status': 'done'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['count'], 1)
        self.assertEqual(data['results'][0]['title'], 'Completed Task')

    def test_filter_tasks_by_priority(self):
        """Test filtering tasks by priority."""
        self.authenticate_user1()
        url = reverse('task-list')
        response = self.client.get(url, {'priority': 'high'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['count'], 1)
        self.assertEqual(data['results'][0]['title'], 'Important Task')

    def test_filter_tasks_by_todo_list(self):
        """Test filtering tasks by todo list."""
        self.authenticate_user1()
        url = reverse('task-list')
        response = self.client.get(url, {'todo_list': str(self.todo_list1.id)})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['count'], 2)

    def test_search_tasks_by_title(self):
        """Test searching tasks by title."""
        self.authenticate_user1()
        url = reverse('task-list')
        response = self.client.get(url, {'search': 'important'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertEqual(data['count'], 1)
        self.assertEqual(data['results'][0]['title'], 'Important Task')