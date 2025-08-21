import pytest
import json
from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch

User = get_user_model()


class AuthenticationAPITestCase(APITestCase):
    """Test cases for authentication API endpoints."""

    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        self.user_data = {
            'email': 'testuser@example.com',
            'password': 'SecurePassword123!',
            'first_name': 'Test',
            'last_name': 'User'
        }
        self.user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password'],
            first_name=self.user_data['first_name'],
            last_name=self.user_data['last_name']
        )

    def test_user_registration_success(self):
        """Test successful user registration."""
        url = reverse('user-register')
        data = {
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], data['email'])

    def test_user_registration_invalid_email(self):
        """Test registration with invalid email."""
        url = reverse('user-register')
        data = {
            'email': 'invalid-email',
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_registration_weak_password(self):
        """Test registration with weak password."""
        url = reverse('user-register')
        data = {
            'email': 'newuser@example.com',
            'password': '12345',
            'password_confirm': '12345',
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_user_registration_password_mismatch(self):
        """Test registration with mismatched passwords."""
        url = reverse('user-register')
        data = {
            'email': 'newuser@example.com',
            'password': 'SecurePassword123!',
            'password_confirm': 'DifferentPassword123!',
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password_confirm', response.data)

    def test_user_registration_duplicate_email(self):
        """Test registration with existing email."""
        url = reverse('user-register')
        data = {
            'email': self.user_data['email'],  # Existing user email
            'password': 'SecurePassword123!',
            'password_confirm': 'SecurePassword123!',
            'first_name': 'Test',
            'last_name': 'User'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_login_success(self):
        """Test successful user login."""
        url = reverse('user-login')
        data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)

    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        url = reverse('user-login')
        data = {
            'email': self.user_data['email'],
            'password': 'wrongpassword'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_login_nonexistent_user(self):
        """Test login with non-existent user."""
        url = reverse('user-login')
        data = {
            'email': 'nonexistent@example.com',
            'password': 'somepassword'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_logout_success(self):
        """Test successful user logout."""
        # First login to get tokens
        login_url = reverse('user-login')
        login_data = {
            'email': self.user_data['email'],
            'password': self.user_data['password']
        }
        login_response = self.client.post(login_url, login_data, format='json')
        refresh_token = login_response.data['refresh']
        
        # Then logout
        logout_url = reverse('user-logout')
        logout_data = {'refresh': refresh_token}
        response = self.client.post(logout_url, logout_data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_logout_invalid_token(self):
        """Test logout with invalid refresh token."""
        url = reverse('user-logout')
        data = {'refresh': 'invalid-token'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_refresh_success(self):
        """Test successful token refresh."""
        # Get initial tokens
        refresh = RefreshToken.for_user(self.user)
        
        url = reverse('token-refresh')
        data = {'refresh': str(refresh)}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_token_refresh_invalid_token(self):
        """Test token refresh with invalid token."""
        url = reverse('token-refresh')
        data = {'refresh': 'invalid-token'}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('accounts.utils.send_email')
    def test_password_reset_request_success(self, mock_send_email):
        """Test successful password reset request."""
        url = reverse('password-reset-request')
        data = {'email': self.user_data['email']}
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_send_email.assert_called_once()

    def test_password_reset_request_nonexistent_user(self):
        """Test password reset request for non-existent user."""
        url = reverse('password-reset-request')
        data = {'email': 'nonexistent@example.com'}
        response = self.client.post(url, data, format='json')
        
        # Should return success for security reasons
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_password_reset_confirm_success(self):
        """Test successful password reset confirmation."""
        # Create reset token
        from accounts.models import PasswordResetToken
        reset_token = PasswordResetToken.objects.create_token_for_user(self.user)
        
        url = reverse('password-reset-confirm')
        data = {
            'token': reset_token.token,
            'new_password': 'NewSecurePassword123!',
            'new_password_confirm': 'NewSecurePassword123!'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewSecurePassword123!'))

    def test_password_reset_confirm_invalid_token(self):
        """Test password reset confirmation with invalid token."""
        url = reverse('password-reset-confirm')
        data = {
            'token': 'invalid-token',
            'new_password': 'NewSecurePassword123!',
            'new_password_confirm': 'NewSecurePassword123!'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_reset_confirm_password_mismatch(self):
        """Test password reset confirmation with mismatched passwords."""
        from accounts.models import PasswordResetToken
        reset_token = PasswordResetToken.objects.create_token_for_user(self.user)
        
        url = reverse('password-reset-confirm')
        data = {
            'token': reset_token.token,
            'new_password': 'NewSecurePassword123!',
            'new_password_confirm': 'DifferentPassword123!'
        }
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_profile_authenticated_access(self):
        """Test authenticated access to user profile."""
        # Authenticate user
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        url = reverse('user-profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.user.email)

    def test_user_profile_unauthenticated_access(self):
        """Test unauthenticated access to user profile."""
        url = reverse('user-profile')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_profile_update_success(self):
        """Test successful user profile update."""
        # Authenticate user
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        url = reverse('user-profile')
        data = {
            'first_name': 'Updated',
            'last_name': 'Name'
        }
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Updated')
        self.assertEqual(self.user.last_name, 'Name')

    def test_user_profile_email_update_not_allowed(self):
        """Test that email cannot be updated through profile endpoint."""
        # Authenticate user
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        url = reverse('user-profile')
        data = {
            'email': 'newemail@example.com'
        }
        response = self.client.patch(url, data, format='json')
        
        # Email should not be updated
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, self.user_data['email'])

    def test_rate_limiting_login_attempts(self):
        """Test rate limiting on login attempts."""
        url = reverse('user-login')
        data = {
            'email': self.user_data['email'],
            'password': 'wrongpassword'
        }
        
        # Make multiple failed login attempts
        for i in range(6):  # Assuming rate limit is 5 attempts
            response = self.client.post(url, data, format='json')
            if i < 5:
                self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
            else:
                # Should be rate limited after 5 attempts
                self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)