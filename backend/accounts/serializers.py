from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with email and password validation."""
    
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text=_('Password must be at least 8 characters with uppercase, lowercase, digits, and special characters.')
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text=_('Confirm your password by entering it again.')
    )
    
    class Meta:
        model = User
        fields = ('email', 'password', 'password_confirm', 'first_name', 'last_name')
        extra_kwargs = {
            'email': {
                'required': True,
                'help_text': _('Valid email address for account verification and login.')
            },
            'first_name': {
                'required': True,
                'help_text': _('Your first name.')
            },
            'last_name': {
                'required': True,
                'help_text': _('Your last name.')
            }
        }

    def validate_email(self, value):
        """Validate email is unique and properly formatted."""
        value = value.lower().strip()
        
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                _('A user with this email address already exists.')
            )
        
        return value

    def validate_password(self, value):
        """Validate password meets security requirements."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        
        return value

    def validate(self, attrs):
        """Validate password confirmation matches."""
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        
        if password != password_confirm:
            raise serializers.ValidationError({
                'password_confirm': _('Password confirmation does not match.')
            })
        
        return attrs

    def create(self, validated_data):
        """Create user with validated data."""
        # Remove password_confirm as it's not needed for user creation
        validated_data.pop('password_confirm', None)
        
        # Create user with encrypted password
        user = User.objects.create_user(**validated_data)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login with email and password."""
    
    email = serializers.EmailField(
        required=True,
        help_text=_('Your registered email address.')
    )
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text=_('Your account password.')
    )

    def validate(self, attrs):
        """Validate credentials and authenticate user."""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            # Normalize email
            email = email.lower().strip()
            
            # Authenticate user
            user = authenticate(
                request=self.context.get('request'),
                username=email,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError({
                    'non_field_errors': [_('Invalid email or password.')]
                })
            
            if not user.is_active:
                raise serializers.ValidationError({
                    'non_field_errors': [_('User account is disabled.')]
                })
            
            attrs['user'] = user
            return attrs
        
        raise serializers.ValidationError({
            'non_field_errors': [_('Email and password are required.')]
        })


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile information."""
    
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name', 
            'date_joined', 'is_email_verified'
        )
        read_only_fields = ('id', 'email', 'date_joined', 'is_email_verified')

    def get_full_name(self, obj):
        """Return user's full name."""
        return obj.get_full_name()

    def validate_first_name(self, value):
        """Validate first name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError(_('First name cannot be empty.'))
        return value.strip()

    def validate_last_name(self, value):
        """Validate last name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError(_('Last name cannot be empty.'))
        return value.strip()


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request."""
    
    email = serializers.EmailField(
        required=True,
        help_text=_('Email address associated with your account.')
    )

    def validate_email(self, value):
        """Normalize email address."""
        return value.lower().strip()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""
    
    token = serializers.CharField(
        required=True,
        help_text=_('Password reset token from email.')
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text=_('Your new password.')
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text=_('Confirm your new password.')
    )

    def validate_new_password(self, value):
        """Validate new password meets requirements."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        
        return value

    def validate(self, attrs):
        """Validate password confirmation matches."""
        new_password = attrs.get('new_password')
        new_password_confirm = attrs.get('new_password_confirm')
        
        if new_password != new_password_confirm:
            raise serializers.ValidationError({
                'new_password_confirm': _('Password confirmation does not match.')
            })
        
        return attrs


class TokenRefreshSerializer(serializers.Serializer):
    """Serializer for JWT token refresh."""
    
    refresh = serializers.CharField(
        required=True,
        help_text=_('Valid refresh token.')
    )


class LogoutSerializer(serializers.Serializer):
    """Serializer for user logout."""
    
    refresh = serializers.CharField(
        required=True,
        help_text=_('Refresh token to blacklist.')
    )


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing user password."""
    
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text=_('Your current password.')
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        help_text=_('Your new password.')
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text=_('Confirm your new password.')
    )

    def validate_old_password(self, value):
        """Validate old password is correct."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(_('Current password is incorrect.'))
        return value

    def validate_new_password(self, value):
        """Validate new password meets requirements."""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        
        return value

    def validate(self, attrs):
        """Validate password confirmation matches and is different from old password."""
        old_password = attrs.get('old_password')
        new_password = attrs.get('new_password')
        new_password_confirm = attrs.get('new_password_confirm')
        
        if new_password != new_password_confirm:
            raise serializers.ValidationError({
                'new_password_confirm': _('Password confirmation does not match.')
            })
        
        if old_password == new_password:
            raise serializers.ValidationError({
                'new_password': _('New password must be different from current password.')
            })
        
        return attrs