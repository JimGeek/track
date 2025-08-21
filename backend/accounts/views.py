from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django_ratelimit.decorators import ratelimit
from django.contrib.auth.signals import user_logged_in, user_logged_out

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer,
    LogoutSerializer,
    ChangePasswordSerializer
)
from .models import PasswordResetToken
from .utils import (
    send_welcome_email,
    send_password_reset_email,
    send_password_changed_email,
    get_client_ip,
    get_user_agent
)

User = get_user_model()


class UserRegistrationView(APIView):
    """
    API view for user registration.
    
    POST /api/auth/register/
    """
    permission_classes = [permissions.AllowAny]
    
    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
    def post(self, request):
        """Register a new user."""
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Send welcome email (async in production)
            try:
                send_welcome_email(user)
            except Exception:
                # Don't fail registration if email fails
                pass
            
            # Signal user login
            user_logged_in.send(sender=user.__class__, request=request, user=user)
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user': UserProfileSerializer(user).data,
                'message': _('Registration successful. Welcome to Track!')
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """
    API view for user login.
    
    POST /api/auth/login/
    """
    permission_classes = [permissions.AllowAny]
    
    @method_decorator(ratelimit(key='ip', rate='5/m', method='POST', block=True))
    def post(self, request):
        """Authenticate user and return tokens."""
        serializer = UserLoginSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            
            # Update last login
            user.save(update_fields=['last_login'])
            
            # Signal user login
            user_logged_in.send(sender=user.__class__, request=request, user=user)
            
            return Response({
                'access': str(access_token),
                'refresh': str(refresh),
                'user': UserProfileSerializer(user).data,
                'message': _('Login successful. Welcome back!')
            }, status=status.HTTP_200_OK)
        
        return Response({
            'error': _('Invalid email or password.')
        }, status=status.HTTP_401_UNAUTHORIZED)


class UserLogoutView(APIView):
    """
    API view for user logout.
    
    POST /api/auth/logout/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Logout user by blacklisting refresh token."""
        serializer = LogoutSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                refresh_token = RefreshToken(serializer.validated_data['refresh'])
                refresh_token.blacklist()
                
                # Signal user logout
                user_logged_out.send(
                    sender=request.user.__class__,
                    request=request,
                    user=request.user
                )
                
                return Response({
                    'message': _('Successfully logged out.')
                }, status=status.HTTP_200_OK)
                
            except TokenError:
                return Response({
                    'error': _('Invalid token.')
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view with additional validation.
    
    POST /api/auth/token/refresh/
    """
    
    @method_decorator(ratelimit(key='ip', rate='10/m', method='POST', block=True))
    def post(self, request, *args, **kwargs):
        """Refresh access token."""
        return super().post(request, *args, **kwargs)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    API view for user profile management.
    
    GET /api/auth/profile/
    PATCH /api/auth/profile/
    PUT /api/auth/profile/
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Return the current user."""
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        """Update user profile."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'user': serializer.data,
                'message': _('Profile updated successfully.')
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """
    API view for password reset request.
    
    POST /api/auth/password-reset/
    """
    permission_classes = [permissions.AllowAny]
    
    @method_decorator(ratelimit(key='ip', rate='3/h', method='POST', block=True))
    def post(self, request):
        """Request password reset email."""
        serializer = PasswordResetRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = User.objects.get(email=email)
                
                # Create reset token
                reset_token = PasswordResetToken.objects.create_token_for_user(user)
                
                # Send reset email
                send_password_reset_email(user, reset_token)
                
            except User.DoesNotExist:
                # Don't reveal whether user exists for security
                pass
            
            return Response({
                'message': _('If the email exists, a password reset link has been sent.')
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """
    API view for password reset confirmation.
    
    POST /api/auth/password-reset/confirm/
    """
    permission_classes = [permissions.AllowAny]
    
    @method_decorator(ratelimit(key='ip', rate='5/h', method='POST', block=True))
    def post(self, request):
        """Confirm password reset with token."""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if serializer.is_valid():
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            # Get valid token
            reset_token = PasswordResetToken.objects.get_valid_token(token)
            
            if reset_token:
                user = reset_token.user
                
                # Update password
                user.set_password(new_password)
                user.save()
                
                # Mark token as used
                reset_token.mark_as_used(
                    ip_address=get_client_ip(request),
                    user_agent=get_user_agent(request)
                )
                
                # Send confirmation email
                try:
                    send_password_changed_email(user)
                except Exception:
                    pass
                
                return Response({
                    'message': _('Password reset successful. You can now login with your new password.')
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': _('Invalid or expired reset token.')
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    API view for changing user password.
    
    POST /api/auth/change-password/
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @method_decorator(ratelimit(key='user', rate='3/h', method='POST', block=True))
    def post(self, request):
        """Change user password."""
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = request.user
            new_password = serializer.validated_data['new_password']
            
            # Update password
            user.set_password(new_password)
            user.save()
            
            # Send confirmation email
            try:
                send_password_changed_email(user)
            except Exception:
                pass
            
            return Response({
                'message': _('Password changed successfully.')
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_dashboard(request):
    """
    Get user dashboard data.
    
    GET /api/auth/dashboard/
    """
    user = request.user
    
    # Basic user stats (will be expanded in other features)
    dashboard_data = {
        'user': UserProfileSerializer(user).data,
        'stats': {
            'projects_count': 0,  # Will be updated when projects are implemented
            'active_features': 0,
            'completed_features': 0,
            'overdue_features': 0,
        },
        'recent_activity': [],  # Will be populated with actual activity
        'notifications': [],    # Will be populated with notifications
    }
    
    return Response(dashboard_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@never_cache
def health_check(request):
    """
    Health check endpoint for monitoring.
    
    GET /api/auth/health/
    """
    return Response({
        'status': 'healthy',
        'service': 'authentication',
        'version': '1.0.0'
    }, status=status.HTTP_200_OK)