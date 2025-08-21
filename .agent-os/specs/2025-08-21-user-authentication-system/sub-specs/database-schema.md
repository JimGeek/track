# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-21-user-authentication-system/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Schema Changes

### New Tables/Models

#### Custom User Model
Extending Django's AbstractUser with email as primary identifier:

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, blank=True, null=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    is_email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        db_table = 'auth_user'
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['is_email_verified']),
            models.Index(fields=['created_at']),
        ]
```

#### UserProfile Model
Additional user information separated from authentication data:

```python
class UserProfile(models.Model):
    user = models.OneToOneField(
        'User',
        on_delete=models.CASCADE,
        related_name='profile'
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    bio = models.TextField(blank=True, max_length=500)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    timezone = models.CharField(max_length=50, default='UTC')
    language_preference = models.CharField(max_length=10, default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profile'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['created_at']),
        ]
```

#### PasswordResetToken Model
Secure token-based password reset workflow:

```python
import secrets
from datetime import timedelta
from django.utils import timezone

class PasswordResetToken(models.Model):
    user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    token = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(blank=True, null=True)
    
    def save(self, *args, **kwargs):
        if not self.token:
            self.token = secrets.token_urlsafe(48)
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at
    
    def mark_as_used(self):
        self.is_used = True
        self.used_at = timezone.now()
        self.save()
    
    class Meta:
        db_table = 'password_reset_token'
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['is_used']),
            models.Index(fields=['created_at']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(expires_at__gt=models.F('created_at')),
                name='expires_after_creation'
            ),
        ]
```

### Database Constraints and Indexes

#### Performance Indexes
- **User.email**: Primary lookup field for authentication
- **User.is_email_verified**: Filter verified users
- **User.created_at**: User registration analytics
- **UserProfile.user**: Foreign key optimization
- **PasswordResetToken.token**: Token lookup for password reset
- **PasswordResetToken.expires_at**: Cleanup expired tokens
- **PasswordResetToken.is_used**: Filter valid tokens

#### Data Integrity Constraints
- **User.email**: Unique constraint for primary identifier
- **PasswordResetToken.token**: Unique constraint for security
- **PasswordResetToken expires_after_creation**: Check constraint ensuring expiry is after creation
- **UserProfile.user**: One-to-one relationship constraint

### Field Specifications

#### User Model Fields
- **email**: EmailField, unique=True (primary identifier)
- **username**: CharField, nullable (legacy compatibility)
- **first_name/last_name**: Required CharField fields
- **is_email_verified**: Boolean flag for email verification status
- **created_at/updated_at**: Automatic timestamp fields

#### UserProfile Fields
- **phone_number**: Optional CharField with max length 20
- **date_of_birth**: Optional DateField
- **bio**: TextField with 500 character limit
- **avatar**: ImageField with upload path
- **timezone**: CharField defaulting to UTC
- **language_preference**: CharField defaulting to 'en'

#### PasswordResetToken Fields
- **token**: 64-character unique string (URL-safe base64)
- **expires_at**: DateTime field (24-hour expiry default)
- **is_used**: Boolean flag to prevent token reuse
- **used_at**: Timestamp when token was consumed

## Migrations

### Initial Migration Steps

1. **Create Custom User Migration**
```python
# 0001_initial.py
from django.db import migrations, models
import django.contrib.auth.models

class Migration(migrations.Migration):
    initial = True
    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]
    
    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                # User model fields as defined above
            ],
            options={
                'db_table': 'auth_user',
            },
            managers=[
                ('objects', django.contrib.auth.models.UserManager()),
            ],
        ),
    ]
```

2. **Create UserProfile Migration**
```python
# 0002_userprofile.py
operations = [
    migrations.CreateModel(
        name='UserProfile',
        fields=[
            # UserProfile fields as defined above
        ],
        options={
            'db_table': 'user_profile',
        },
    ),
]
```

3. **Create PasswordResetToken Migration**
```python
# 0003_passwordresettoken.py
operations = [
    migrations.CreateModel(
        name='PasswordResetToken',
        fields=[
            # PasswordResetToken fields as defined above
        ],
        options={
            'db_table': 'password_reset_token',
        },
    ),
]
```

### Migration Considerations

#### Data Migration Strategy
- **Existing Users**: If migrating from default User model, create data migration to preserve existing user data
- **Email Population**: Ensure all existing users have valid email addresses before applying unique constraint
- **Profile Creation**: Automatic UserProfile creation via signals for existing users

#### Index Creation Strategy
- Create indexes after table creation to avoid performance issues during migration
- Use concurrent index creation for production deployments
- Monitor index usage and adjust based on query patterns

#### Rollback Strategy
- Maintain reversible migrations for all schema changes
- Backup critical user data before major migrations
- Test rollback procedures in staging environment

### Performance Considerations

#### Query Optimization
- Email-based authentication queries optimized with unique index
- Password reset token lookups optimized with token index
- User profile queries optimized with foreign key index

#### Storage Optimization
- Avatar images stored with efficient upload paths
- Token strings use URL-safe encoding for efficient storage
- Timestamp fields use database-level defaults where appropriate

#### Maintenance Queries
```sql
-- Cleanup expired password reset tokens
DELETE FROM password_reset_token 
WHERE expires_at < NOW() - INTERVAL '7 days';

-- Find unverified users older than 30 days
SELECT * FROM auth_user 
WHERE is_email_verified = false 
AND created_at < NOW() - INTERVAL '30 days';
```