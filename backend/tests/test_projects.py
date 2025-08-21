import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import date, timedelta
import uuid

from projects.models import Project

User = get_user_model()


class ProjectModelTestCase(TestCase):
    """Test cases for Project model."""

    def setUp(self):
        """Set up test data."""
        self.user1 = User.objects.create_user(
            email='owner@example.com',
            password='testpass123',
            first_name='Owner',
            last_name='User'
        )
        self.user2 = User.objects.create_user(
            email='member@example.com',
            password='testpass123',
            first_name='Team',
            last_name='Member'
        )
        self.project = Project.objects.create(
            name='Test Project',
            description='A test project',
            owner=self.user1,
            priority='high',
            deadline=date.today() + timedelta(days=30)
        )

    def test_project_creation(self):
        """Test project creation with required fields."""
        self.assertEqual(self.project.name, 'Test Project')
        self.assertEqual(self.project.owner, self.user1)
        self.assertEqual(self.project.priority, 'high')
        self.assertFalse(self.project.is_archived)
        self.assertTrue(isinstance(self.project.id, uuid.UUID))

    def test_project_str_representation(self):
        """Test string representation of project."""
        self.assertEqual(str(self.project), 'Test Project')

    def test_project_properties(self):
        """Test project computed properties."""
        self.assertEqual(self.project.total_features, 0)
        self.assertEqual(self.project.completed_features, 0)
        self.assertEqual(self.project.progress_percentage, 0)
        self.assertFalse(self.project.is_overdue)

    def test_project_overdue_property(self):
        """Test project overdue property."""
        # Create overdue project
        overdue_project = Project.objects.create(
            name='Overdue Project',
            owner=self.user1,
            deadline=date.today() - timedelta(days=1)
        )
        self.assertTrue(overdue_project.is_overdue)

    def test_can_user_edit_owner(self):
        """Test owner can edit project."""
        self.assertTrue(self.project.can_user_edit(self.user1))

    def test_can_user_edit_team_member(self):
        """Test team member can edit project."""
        self.project.team_members.add(self.user2)
        self.assertTrue(self.project.can_user_edit(self.user2))

    def test_can_user_edit_non_member(self):
        """Test non-member cannot edit project."""
        user3 = User.objects.create_user(
            email='other@example.com',
            password='testpass123'
        )
        self.assertFalse(self.project.can_user_edit(user3))


class ProjectAPITestCase(APITestCase):
    """Test cases for Project API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            email='owner@example.com',
            password='testpass123',
            first_name='Owner',
            last_name='User'
        )
        self.user2 = User.objects.create_user(
            email='member@example.com',
            password='testpass123',
            first_name='Team',
            last_name='Member'
        )
        self.user3 = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            first_name='Other',
            last_name='User'
        )

    def authenticate_user(self, user):
        """Authenticate a user and set credentials."""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_create_project_success(self):
        """Test successful project creation."""
        self.authenticate_user(self.user1)
        url = '/api/projects/'
        data = {
            'name': 'New Project',
            'description': 'A new test project',
            'priority': 'medium',
            'deadline': str(date.today() + timedelta(days=30)),
            'team_member_emails': ['member@example.com']
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Project')
        self.assertEqual(response.data['owner']['id'], self.user1.id)
        self.assertEqual(len(response.data['team_members']), 1)

    def test_create_project_invalid_name(self):
        """Test project creation with invalid name."""
        self.authenticate_user(self.user1)
        url = '/api/projects/'
        data = {
            'name': 'AB',  # Too short
            'description': 'A test project'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_project_past_deadline(self):
        """Test project creation with past deadline."""
        self.authenticate_user(self.user1)
        url = '/api/projects/'
        data = {
            'name': 'Test Project',
            'deadline': str(date.today() - timedelta(days=1))
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('deadline', response.data)

    def test_list_projects(self):
        """Test listing user's projects."""
        self.authenticate_user(self.user1)
        
        # Create projects
        project1 = Project.objects.create(name='Project 1', owner=self.user1)
        project2 = Project.objects.create(name='Project 2', owner=self.user2)
        project2.team_members.add(self.user1)
        Project.objects.create(name='Project 3', owner=self.user3)  # Not accessible
        
        url = '/api/projects/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_retrieve_project(self):
        """Test retrieving a specific project."""
        self.authenticate_user(self.user1)
        project = Project.objects.create(name='Test Project', owner=self.user1)
        
        url = f'/api/projects/{project.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Project')

    def test_update_project_as_owner(self):
        """Test updating project as owner."""
        self.authenticate_user(self.user1)
        project = Project.objects.create(name='Test Project', owner=self.user1)
        
        url = f'/api/projects/{project.id}/'
        data = {
            'name': 'Updated Project',
            'priority': 'high'
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Updated Project')
        self.assertEqual(response.data['priority'], 'high')

    def test_update_project_as_team_member(self):
        """Test updating project as team member."""
        self.authenticate_user(self.user2)
        project = Project.objects.create(name='Test Project', owner=self.user1)
        project.team_members.add(self.user2)
        
        url = f'/api/projects/{project.id}/'
        data = {'description': 'Updated by team member'}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['description'], 'Updated by team member')

    def test_update_project_unauthorized(self):
        """Test updating project without permission."""
        self.authenticate_user(self.user3)
        project = Project.objects.create(name='Test Project', owner=self.user1)
        
        url = f'/api/projects/{project.id}/'
        data = {'name': 'Unauthorized Update'}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_project_as_owner(self):
        """Test deleting project as owner."""
        self.authenticate_user(self.user1)
        project = Project.objects.create(name='Test Project', owner=self.user1)
        
        url = f'/api/projects/{project.id}/'
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Project.objects.filter(id=project.id).exists())

    def test_archive_project(self):
        """Test archiving a project."""
        self.authenticate_user(self.user1)
        project = Project.objects.create(name='Test Project', owner=self.user1)
        
        url = f'/api/projects/{project.id}/archive/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        project.refresh_from_db()
        self.assertTrue(project.is_archived)

    def test_unarchive_project(self):
        """Test unarchiving a project."""
        self.authenticate_user(self.user1)
        project = Project.objects.create(
            name='Test Project',
            owner=self.user1,
            is_archived=True
        )
        
        url = f'/api/projects/{project.id}/unarchive/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        project.refresh_from_db()
        self.assertFalse(project.is_archived)

    def test_project_statistics(self):
        """Test project statistics endpoint."""
        self.authenticate_user(self.user1)
        project = Project.objects.create(name='Test Project', owner=self.user1)
        
        url = f'/api/projects/{project.id}/statistics/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_features', response.data)
        self.assertIn('progress_percentage', response.data)

    def test_my_projects_endpoint(self):
        """Test my projects endpoint."""
        self.authenticate_user(self.user1)
        
        # Create owned and team projects
        owned_project = Project.objects.create(name='Owned Project', owner=self.user1)
        team_project = Project.objects.create(name='Team Project', owner=self.user2)
        team_project.team_members.add(self.user1)
        
        url = '/api/projects/my_projects/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['owned_projects']), 1)
        self.assertEqual(len(response.data['team_projects']), 1)

    def test_dashboard_summary_endpoint(self):
        """Test dashboard summary endpoint."""
        self.authenticate_user(self.user1)
        
        # Create projects
        Project.objects.create(name='Active Project', owner=self.user1)
        Project.objects.create(
            name='Archived Project',
            owner=self.user1,
            is_archived=True
        )
        
        url = '/api/projects/dashboard_summary/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_projects'], 2)
        self.assertEqual(response.data['active_projects'], 1)
        self.assertEqual(response.data['archived_projects'], 1)

    def test_project_filtering(self):
        """Test project filtering by priority and archived status."""
        self.authenticate_user(self.user1)
        
        # Create projects with different priorities
        Project.objects.create(name='High Priority', owner=self.user1, priority='high')
        Project.objects.create(name='Low Priority', owner=self.user1, priority='low')
        
        # Filter by priority
        url = '/api/projects/?priority=high'
        response = self.client.get(url)
        self.assertEqual(len(response.data['results']), 1)
        
        # Filter by archived status
        url = '/api/projects/?is_archived=false'
        response = self.client.get(url)
        self.assertEqual(len(response.data['results']), 2)

    def test_project_search(self):
        """Test project search functionality."""
        self.authenticate_user(self.user1)
        
        Project.objects.create(
            name='Django Project',
            description='A web application',
            owner=self.user1
        )
        Project.objects.create(
            name='React App',
            description='Frontend application',
            owner=self.user1
        )
        
        # Search by name
        url = '/api/projects/?search=Django'
        response = self.client.get(url)
        self.assertEqual(len(response.data['results']), 1)
        
        # Search by description
        url = '/api/projects/?search=Frontend'
        response = self.client.get(url)
        self.assertEqual(len(response.data['results']), 1)

    def test_unauthenticated_access(self):
        """Test unauthenticated access to projects."""
        url = '/api/projects/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)