import secrets
from datetime import timedelta
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


class CustomUserManager(BaseUserManager):
    """Custom user manager that uses email instead of username."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user with email and password."""
        if not email:
            raise ValueError(_("The Email field must be set"))
        if not password:
            raise ValueError(_("The Password field must be set"))

        # Normalize and validate email
        email = self.normalize_email(email)
        validate_email(email)

        # Set default values for extra fields
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser with email and password."""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError(_("Superuser must have is_staff=True."))
        if extra_fields.get("is_superuser") is not True:
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    """Custom user model that uses email instead of username for authentication."""

    # Remove username field and use email as unique identifier
    username = None
    email = models.EmailField(
        _("email address"),
        unique=True,
        help_text=_("Required. Enter a valid email address."),
        error_messages={
            "unique": _("A user with that email address already exists."),
        },
    )

    # Additional fields for user profile
    first_name = models.CharField(_("first name"), max_length=150, blank=True)
    last_name = models.CharField(_("last name"), max_length=150, blank=True)
    date_joined = models.DateTimeField(_("date joined"), auto_now_add=True)
    is_email_verified = models.BooleanField(
        _("email verified"),
        default=False,
        help_text=_("Designates whether this user has verified their email address."),
    )
    email_verification_token = models.CharField(
        _("email verification token"),
        max_length=255,
        blank=True,
        null=True,
        help_text=_("Token used for email verification."),
    )
    email_verification_token_created = models.DateTimeField(
        _("email verification token created"),
        blank=True,
        null=True,
        help_text=_("When the email verification token was created."),
    )

    # Set email as the unique identifier for authentication
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = (
        []
    )  # Remove email from required fields since it's the username field

    objects = CustomUserManager()

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        db_table = "auth_user"  # Keep the same table name for compatibility

    def __str__(self):
        """Return string representation of user."""
        return self.email

    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f"{self.first_name} {self.last_name}"
        return full_name.strip()

    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name

    def clean(self):
        """Clean and validate the model."""
        super().clean()
        # Normalize email to lowercase
        self.email = self.__class__.objects.normalize_email(self.email)


class PasswordResetTokenManager(models.Manager):
    """Manager for password reset tokens."""
    
    def create_token_for_user(self, user):
        """Create a new password reset token for user."""
        # Deactivate any existing tokens for this user
        self.filter(user=user, is_used=False).update(is_used=True)
        
        # Generate secure token
        token = secrets.token_urlsafe(32)
        
        # Create new token with 1 hour expiry
        return self.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timedelta(hours=1)
        )
    
    def get_valid_token(self, token):
        """Get valid, unexpired token."""
        try:
            return self.get(
                token=token,
                is_used=False,
                expires_at__gt=timezone.now()
            )
        except self.model.DoesNotExist:
            return None


class PasswordResetToken(models.Model):
    """Model for password reset tokens."""
    
    user = models.ForeignKey(
        'CustomUser',
        on_delete=models.CASCADE,
        related_name='password_reset_tokens',
        help_text=_('User requesting password reset.')
    )
    token = models.CharField(
        _('reset token'),
        max_length=64,
        unique=True,
        help_text=_('Unique token for password reset.')
    )
    created_at = models.DateTimeField(
        _('created at'),
        auto_now_add=True,
        help_text=_('When the token was created.')
    )
    expires_at = models.DateTimeField(
        _('expires at'),
        help_text=_('When the token expires.')
    )
    is_used = models.BooleanField(
        _('is used'),
        default=False,
        help_text=_('Whether the token has been used.')
    )
    used_at = models.DateTimeField(
        _('used at'),
        blank=True,
        null=True,
        help_text=_('When the token was used.')
    )
    ip_address = models.GenericIPAddressField(
        _('IP address'),
        blank=True,
        null=True,
        help_text=_('IP address from which reset was requested.')
    )
    user_agent = models.TextField(
        _('user agent'),
        blank=True,
        help_text=_('User agent string from reset request.')
    )
    
    objects = PasswordResetTokenManager()
    
    class Meta:
        verbose_name = _('Password Reset Token')
        verbose_name_plural = _('Password Reset Tokens')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'is_used']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        """Return string representation."""
        return f"Password reset token for {self.user.email}"
    
    def is_valid(self):
        """Check if token is valid and not expired."""
        return not self.is_used and self.expires_at > timezone.now()
    
    def mark_as_used(self, ip_address=None, user_agent=None):
        """Mark token as used."""
        self.is_used = True
        self.used_at = timezone.now()
        if ip_address:
            self.ip_address = ip_address
        if user_agent:
            self.user_agent = user_agent
        self.save()
    
    def clean(self):
        """Validate token."""
        super().clean()
        if self.expires_at and self.created_at and self.expires_at <= self.created_at:
            raise ValidationError(_('Token expiry must be after creation time.'))
