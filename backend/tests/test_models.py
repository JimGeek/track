import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError

User = get_user_model()


class CustomUserModelTests(TestCase):
    """Test cases for the custom User model with email authentication."""

    def setUp(self):
        """Set up test data."""
        self.valid_email = "testuser@example.com"
        self.valid_password = "SecurePassword123!"

    def test_create_user_with_email_successful(self):
        """Test creating a user with email is successful."""
        user = User.objects.create_user(
            email=self.valid_email, password=self.valid_password
        )
        self.assertEqual(user.email, self.valid_email)
        self.assertTrue(user.check_password(self.valid_password))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.is_active)

    def test_create_user_email_normalized(self):
        """Test that email is normalized for new users."""
        email = "test@EXAMPLE.COM"
        user = User.objects.create_user(email=email, password=self.valid_password)
        self.assertEqual(user.email, email.lower())

    def test_create_user_without_email_raises_error(self):
        """Test creating user without email raises ValueError."""
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password=self.valid_password)

    def test_create_user_without_password_raises_error(self):
        """Test creating user without password raises ValueError."""
        with self.assertRaises(ValueError):
            User.objects.create_user(email=self.valid_email, password="")

    def test_create_superuser_successful(self):
        """Test creating a superuser is successful."""
        user = User.objects.create_superuser(
            email=self.valid_email, password=self.valid_password
        )
        self.assertEqual(user.email, self.valid_email)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertTrue(user.is_active)

    def test_create_superuser_without_is_staff_raises_error(self):
        """Test creating superuser with is_staff=False raises ValueError."""
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email=self.valid_email, password=self.valid_password, is_staff=False
            )

    def test_create_superuser_without_is_superuser_raises_error(self):
        """Test creating superuser with is_superuser=False raises ValueError."""
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email=self.valid_email, password=self.valid_password, is_superuser=False
            )

    def test_email_unique_constraint(self):
        """Test that email must be unique."""
        User.objects.create_user(email=self.valid_email, password=self.valid_password)
        with self.assertRaises(IntegrityError):
            User.objects.create_user(
                email=self.valid_email, password="AnotherPassword123!"
            )

    def test_username_field_is_email(self):
        """Test that USERNAME_FIELD is set to email."""
        self.assertEqual(User.USERNAME_FIELD, "email")

    def test_required_fields_contains_no_email(self):
        """Test that REQUIRED_FIELDS does not contain email."""
        self.assertNotIn("email", User.REQUIRED_FIELDS)

    def test_user_string_representation(self):
        """Test string representation of user."""
        user = User.objects.create_user(
            email=self.valid_email, password=self.valid_password
        )
        self.assertEqual(str(user), self.valid_email)

    def test_email_case_insensitive_login(self):
        """Test that email login is case insensitive."""
        # Create user with lowercase email
        user = User.objects.create_user(
            email=self.valid_email.lower(), password=self.valid_password
        )

        # Try to authenticate with uppercase email
        from django.contrib.auth import authenticate

        authenticated_user = authenticate(
            username=self.valid_email.upper(), password=self.valid_password
        )
        self.assertEqual(authenticated_user, user)

    def test_invalid_email_format(self):
        """Test that invalid email formats are handled properly."""
        invalid_emails = [
            "invalid-email",
            "@example.com",
            "test@",
            "test..test@example.com",
        ]

        for invalid_email in invalid_emails:
            with self.assertRaises((ValidationError, ValueError)):
                user = User.objects.create_user(
                    email=invalid_email, password=self.valid_password
                )
                user.full_clean()  # Trigger validation
