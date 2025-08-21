import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from datetime import date, timedelta
import uuid
import tempfile
from django.core.files.uploadedfile import SimpleUploadedFile

from projects.models import Project
from features.models import Feature, FeatureComment, FeatureAttachment

User = get_user_model()


class FeatureModelTestCase(TestCase):
    """Test cases for Feature model."""

    def setUp(self):
        """Set up test data."""
        self.user1 = User.objects.create_user(
            email='owner@example.com',
            password='testpass123',
            first_name='Owner',
            last_name='User'
        )
        self.user2 = User.objects.create_user(
            email='assignee@example.com',
            password='testpass123',
            first_name='Assignee',
            last_name='User'
        )
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.user1
        )
        self.feature = Feature.objects.create(
            project=self.project,
            title='Test Feature',
            description='A test feature description',
            reporter=self.user1,
            assignee=self.user2,
            priority='high',
            status='idea',
            estimated_hours=10,
            due_date=date.today() + timedelta(days=7)
        )

    def test_feature_creation(self):
        """Test feature creation with required fields."""
        self.assertEqual(self.feature.title, 'Test Feature')
        self.assertEqual(self.feature.project, self.project)
        self.assertEqual(self.feature.reporter, self.user1)
        self.assertEqual(self.feature.assignee, self.user2)
        self.assertEqual(self.feature.status, 'idea')
        self.assertEqual(self.feature.priority, 'high')
        self.assertTrue(isinstance(self.feature.id, uuid.UUID))

    def test_feature_str_representation(self):
        """Test string representation of feature."""
        expected = f"{self.project.name} - {self.feature.title}"
        self.assertEqual(str(self.feature), expected)

    def test_feature_is_overdue_property(self):
        """Test feature overdue property."""
        # Not overdue
        self.assertFalse(self.feature.is_overdue)
        
        # Make it overdue
        self.feature.due_date = date.today() - timedelta(days=1)
        self.feature.save()
        self.assertTrue(self.feature.is_overdue)
        
        # Completed features are not overdue
        self.feature.status = 'live'
        self.feature.save()
        self.assertFalse(self.feature.is_overdue)

    def test_feature_is_completed_property(self):
        """Test feature completed property."""
        self.assertFalse(self.feature.is_completed)
        
        self.feature.status = 'live'
        self.feature.save()
        self.assertTrue(self.feature.is_completed)

    def test_feature_hierarchy_level(self):
        """Test feature hierarchy level."""
        # Root feature
        self.assertEqual(self.feature.hierarchy_level, 0)
        
        # Child feature
        child_feature = Feature.objects.create(
            project=self.project,
            parent=self.feature,
            title='Child Feature',
            description='A child feature',
            reporter=self.user1
        )
        self.assertEqual(child_feature.hierarchy_level, 1)
        
        # Grandchild feature
        grandchild_feature = Feature.objects.create(
            project=self.project,
            parent=child_feature,
            title='Grandchild Feature',
            description='A grandchild feature',
            reporter=self.user1
        )
        self.assertEqual(grandchild_feature.hierarchy_level, 2)

    def test_feature_full_path(self):
        """Test feature full path property."""
        # Root feature
        self.assertEqual(self.feature.full_path, 'Test Feature')
        
        # Child feature
        child_feature = Feature.objects.create(
            project=self.project,
            parent=self.feature,
            title='Child Feature',
            description='A child feature',
            reporter=self.user1
        )
        self.assertEqual(child_feature.full_path, 'Test Feature > Child Feature')

    def test_feature_progress_percentage(self):
        """Test feature progress percentage calculation."""
        # Leaf feature progress based on status
        self.assertEqual(self.feature.progress_percentage, 0)  # idea = 0%
        
        self.feature.status = 'development'
        self.feature.save()
        self.assertEqual(self.feature.progress_percentage, 60)  # development = 60%
        
        self.feature.status = 'live'
        self.feature.save()
        self.assertEqual(self.feature.progress_percentage, 100)  # live = 100%

    def test_feature_status_advancement(self):
        """Test feature status advancement."""
        self.assertEqual(self.feature.status, 'idea')
        
        # Advance status
        self.assertTrue(self.feature.advance_status())
        self.assertEqual(self.feature.status, 'specification')
        
        # Continue advancing
        self.assertTrue(self.feature.advance_status())
        self.assertEqual(self.feature.status, 'development')
        
        self.assertTrue(self.feature.advance_status())
        self.assertEqual(self.feature.status, 'testing')
        
        self.assertTrue(self.feature.advance_status())
        self.assertEqual(self.feature.status, 'live')
        self.assertIsNotNone(self.feature.completed_date)
        
        # Cannot advance further
        self.assertFalse(self.feature.advance_status())
        self.assertEqual(self.feature.status, 'live')

    def test_feature_status_reversion(self):
        """Test feature status reversion."""
        self.feature.status = 'testing'
        self.feature.save()
        
        # Revert status
        self.assertTrue(self.feature.revert_status())
        self.assertEqual(self.feature.status, 'development')
        
        # Continue reverting
        self.assertTrue(self.feature.revert_status())
        self.assertEqual(self.feature.status, 'specification')
        
        self.assertTrue(self.feature.revert_status())
        self.assertEqual(self.feature.status, 'idea')
        
        # Cannot revert further
        self.assertFalse(self.feature.revert_status())
        self.assertEqual(self.feature.status, 'idea')

    def test_can_user_edit_permissions(self):
        """Test user edit permissions."""
        # Reporter can edit
        self.assertTrue(self.feature.can_user_edit(self.user1))
        
        # Assignee can edit
        self.assertTrue(self.feature.can_user_edit(self.user2))
        
        # Project owner can edit
        self.assertTrue(self.feature.can_user_edit(self.user1))
        
        # Random user cannot edit
        user3 = User.objects.create_user(
            email='random@example.com',
            password='testpass123'
        )
        self.assertFalse(self.feature.can_user_edit(user3))


class FeatureAPITestCase(APITestCase):
    """Test cases for Feature API endpoints."""

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
            email='assignee@example.com',
            password='testpass123',
            first_name='Assignee',
            last_name='User'
        )
        self.user3 = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            first_name='Other',
            last_name='User'
        )
        self.project = Project.objects.create(
            name='Test Project',
            owner=self.user1
        )

    def authenticate_user(self, user):
        """Authenticate a user and set credentials."""
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_create_feature_success(self):
        """Test successful feature creation."""
        self.authenticate_user(self.user1)
        url = '/api/features/'
        data = {
            'project': self.project.id,
            'title': 'New Feature',
            'description': 'A new test feature with detailed description',
            'priority': 'medium',
            'assignee_email': 'assignee@example.com',
            'estimated_hours': 5,
            'due_date': str(date.today() + timedelta(days=14))
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Feature')
        self.assertEqual(response.data['reporter']['id'], self.user1.id)
        self.assertEqual(response.data['assignee']['id'], self.user2.id)

    def test_create_feature_invalid_title(self):
        """Test feature creation with invalid title."""
        self.authenticate_user(self.user1)
        url = '/api/features/'
        data = {
            'project': self.project.id,
            'title': 'AB',  # Too short
            'description': 'A test feature with long description'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.data)

    def test_create_feature_invalid_description(self):
        """Test feature creation with invalid description."""
        self.authenticate_user(self.user1)
        url = '/api/features/'
        data = {
            'project': self.project.id,
            'title': 'Valid Title',
            'description': 'Short'  # Too short
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('description', response.data)

    def test_create_feature_invalid_assignee_email(self):
        """Test feature creation with invalid assignee email."""
        self.authenticate_user(self.user1)
        url = '/api/features/'
        data = {
            'project': self.project.id,
            'title': 'Valid Title',
            'description': 'A valid description for testing',
            'assignee_email': 'nonexistent@example.com'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('assignee_email', response.data)

    def test_list_features(self):
        """Test listing user's accessible features."""
        self.authenticate_user(self.user1)
        
        # Create features
        feature1 = Feature.objects.create(
            project=self.project,
            title='Feature 1',
            description='Description for feature 1',
            reporter=self.user1
        )
        
        # Create another project and feature (not accessible)
        other_project = Project.objects.create(name='Other Project', owner=self.user3)
        Feature.objects.create(
            project=other_project,
            title='Other Feature',
            description='Description for other feature',
            reporter=self.user3
        )
        
        url = '/api/features/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Feature 1')

    def test_retrieve_feature(self):
        """Test retrieving a specific feature."""
        self.authenticate_user(self.user1)
        feature = Feature.objects.create(
            project=self.project,
            title='Test Feature',
            description='A test feature description',
            reporter=self.user1
        )
        
        url = f'/api/features/{feature.id}/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Feature')
        self.assertIn('sub_features', response.data)
        self.assertIn('comments', response.data)

    def test_update_feature_as_reporter(self):
        """Test updating feature as reporter."""
        self.authenticate_user(self.user1)
        feature = Feature.objects.create(
            project=self.project,
            title='Original Title',
            description='Original description for testing',
            reporter=self.user1
        )
        
        url = f'/api/features/{feature.id}/'
        data = {
            'title': 'Updated Title',
            'priority': 'high'
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')
        self.assertEqual(response.data['priority'], 'high')

    def test_update_feature_unauthorized(self):
        """Test updating feature without permission."""
        self.authenticate_user(self.user3)
        feature = Feature.objects.create(
            project=self.project,
            title='Test Feature',
            description='A test feature description',
            reporter=self.user1
        )
        
        url = f'/api/features/{feature.id}/'
        data = {'title': 'Unauthorized Update'}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_advance_feature_status(self):
        """Test advancing feature status."""
        self.authenticate_user(self.user1)
        feature = Feature.objects.create(
            project=self.project,
            title='Test Feature',
            description='A test feature description',
            reporter=self.user1,
            status='idea'
        )
        
        url = f'/api/features/{feature.id}/advance_status/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        feature.refresh_from_db()
        self.assertEqual(feature.status, 'specification')

    def test_revert_feature_status(self):
        """Test reverting feature status."""
        self.authenticate_user(self.user1)
        feature = Feature.objects.create(
            project=self.project,
            title='Test Feature',
            description='A test feature description',
            reporter=self.user1,
            status='development'
        )
        
        url = f'/api/features/{feature.id}/revert_status/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        feature.refresh_from_db()
        self.assertEqual(feature.status, 'specification')

    def test_set_feature_status(self):
        """Test setting feature status directly."""
        self.authenticate_user(self.user1)
        feature = Feature.objects.create(
            project=self.project,
            title='Test Feature',
            description='A test feature description',
            reporter=self.user1,
            status='idea'
        )
        
        url = f'/api/features/{feature.id}/set_status/'
        data = {'status': 'testing'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        feature.refresh_from_db()
        self.assertEqual(feature.status, 'testing')

    def test_feature_hierarchy(self):
        """Test feature hierarchy endpoint."""
        self.authenticate_user(self.user1)
        
        parent_feature = Feature.objects.create(
            project=self.project,
            title='Parent Feature',
            description='A parent feature description',
            reporter=self.user1
        )
        
        child_feature = Feature.objects.create(
            project=self.project,
            parent=parent_feature,
            title='Child Feature',
            description='A child feature description',
            reporter=self.user1
        )
        
        url = f'/api/features/{child_feature.id}/hierarchy/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['ancestors']), 1)
        self.assertEqual(response.data['ancestors'][0]['title'], 'Parent Feature')
        self.assertEqual(response.data['current']['title'], 'Child Feature')

    def test_features_by_project(self):
        """Test features by project endpoint."""
        self.authenticate_user(self.user1)
        
        feature1 = Feature.objects.create(
            project=self.project,
            title='Feature 1',
            description='Description for feature 1',
            reporter=self.user1
        )
        
        feature2 = Feature.objects.create(
            project=self.project,
            parent=feature1,
            title='Feature 2',
            description='Description for feature 2',
            reporter=self.user1
        )
        
        url = f'/api/features/by_project/?project_id={self.project.id}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return root features (no parent)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Feature 1')

    def test_my_assignments(self):
        """Test my assignments endpoint."""
        self.authenticate_user(self.user2)
        
        # Create feature assigned to user2
        Feature.objects.create(
            project=self.project,
            title='Assigned Feature',
            description='A feature assigned to user2',
            reporter=self.user1,
            assignee=self.user2
        )
        
        # Create feature not assigned to user2
        Feature.objects.create(
            project=self.project,
            title='Other Feature',
            description='A feature not assigned to user2',
            reporter=self.user1
        )
        
        url = '/api/features/my_assignments/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Assigned Feature')

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint."""
        self.authenticate_user(self.user1)
        
        # Create various features
        Feature.objects.create(
            project=self.project,
            title='Assigned Feature',
            description='A feature assigned to user1',
            reporter=self.user2,
            assignee=self.user1,
            status='development'
        )
        
        Feature.objects.create(
            project=self.project,
            title='Reported Feature',
            description='A feature reported by user1',
            reporter=self.user1,
            status='testing'
        )
        
        url = '/api/features/dashboard_stats/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('my_assignments_count', response.data)
        self.assertIn('my_reports_count', response.data)
        self.assertIn('status_distribution', response.data)
        self.assertIn('priority_distribution', response.data)

    def test_feature_filtering(self):
        """Test feature filtering."""
        self.authenticate_user(self.user1)
        
        # Create features with different attributes
        Feature.objects.create(
            project=self.project,
            title='High Priority Feature',
            description='A high priority feature description',
            reporter=self.user1,
            priority='high',
            status='development'
        )
        
        Feature.objects.create(
            project=self.project,
            title='Low Priority Feature',
            description='A low priority feature description',
            reporter=self.user1,
            priority='low',
            status='idea'
        )
        
        # Filter by priority
        url = '/api/features/?priority=high'
        response = self.client.get(url)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['priority'], 'high')
        
        # Filter by status
        url = '/api/features/?status=development'
        response = self.client.get(url)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['status'], 'development')

    def test_feature_search(self):
        """Test feature search functionality."""
        self.authenticate_user(self.user1)
        
        Feature.objects.create(
            project=self.project,
            title='Authentication System',
            description='User login and registration functionality',
            reporter=self.user1
        )
        
        Feature.objects.create(
            project=self.project,
            title='Dashboard UI',
            description='User interface for dashboard',
            reporter=self.user1
        )
        
        # Search by title
        url = '/api/features/?search=Authentication'
        response = self.client.get(url)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Authentication System')
        
        # Search by description
        url = '/api/features/?search=interface'
        response = self.client.get(url)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['title'], 'Dashboard UI')

    def test_unauthenticated_access(self):
        """Test unauthenticated access to features."""
        url = '/api/features/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class FeatureCommentTestCase(APITestCase):
    """Test cases for Feature Comments."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.project = Project.objects.create(name='Test Project', owner=self.user)
        self.feature = Feature.objects.create(
            project=self.project,
            title='Test Feature',
            description='A test feature description',
            reporter=self.user
        )

    def authenticate_user(self):
        """Authenticate the test user."""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_create_comment(self):
        """Test creating a comment on a feature."""
        self.authenticate_user()
        
        url = f'/api/features/{self.feature.id}/comments/'
        data = {'content': 'This is a test comment on the feature.'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'This is a test comment on the feature.')
        self.assertEqual(response.data['author']['id'], self.user.id)

    def test_list_comments(self):
        """Test listing comments for a feature."""
        self.authenticate_user()
        
        # Create comments
        FeatureComment.objects.create(
            feature=self.feature,
            author=self.user,
            content='First comment'
        )
        FeatureComment.objects.create(
            feature=self.feature,
            author=self.user,
            content='Second comment'
        )
        
        url = f'/api/features/{self.feature.id}/comments/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)


class FeatureAttachmentTestCase(APITestCase):
    """Test cases for Feature Attachments."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123'
        )
        self.project = Project.objects.create(name='Test Project', owner=self.user)
        self.feature = Feature.objects.create(
            project=self.project,
            title='Test Feature',
            description='A test feature description',
            reporter=self.user
        )

    def authenticate_user(self):
        """Authenticate the test user."""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_upload_attachment(self):
        """Test uploading an attachment to a feature."""
        self.authenticate_user()
        
        # Create a simple test file
        test_file = SimpleUploadedFile(
            "test.txt",
            b"This is a test file content",
            content_type="text/plain"
        )
        
        url = f'/api/features/{self.feature.id}/attachments/'
        data = {'file': test_file}
        response = self.client.post(url, data, format='multipart')
        
        # Debug the response if it fails
        if response.status_code != status.HTTP_201_CREATED:
            print(f"Response status: {response.status_code}")
            print(f"Response data: {response.data}")
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['filename'], 'test.txt')
        self.assertEqual(response.data['uploaded_by']['id'], self.user.id)

    def test_list_attachments(self):
        """Test listing attachments for a feature."""
        self.authenticate_user()
        
        # Create attachment
        test_file = SimpleUploadedFile(
            "document.pdf",
            b"PDF content here",
            content_type="application/pdf"
        )
        FeatureAttachment.objects.create(
            feature=self.feature,
            uploaded_by=self.user,
            file=test_file,
            filename='document.pdf',
            file_size=1024,
            content_type='application/pdf'
        )
        
        url = f'/api/features/{self.feature.id}/attachments/'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['filename'], 'document.pdf')