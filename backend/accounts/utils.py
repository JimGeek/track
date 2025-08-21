import logging
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)


def send_email(subject, message, recipient_list, html_message=None, fail_silently=False):
    """
    Send email with error handling and logging.
    
    Args:
        subject: Email subject
        message: Plain text message
        recipient_list: List of recipient email addresses
        html_message: HTML message (optional)
        fail_silently: Whether to suppress exceptions
        
    Returns:
        Boolean indicating success
    """
    try:
        sent = send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            html_message=html_message,
            fail_silently=fail_silently
        )
        
        if sent:
            logger.info(f"Email sent successfully to {recipient_list}")
            return True
        else:
            logger.warning(f"Failed to send email to {recipient_list}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending email to {recipient_list}: {str(e)}")
        if not fail_silently:
            raise
        return False


def send_welcome_email(user):
    """
    Send welcome email to newly registered user.
    
    Args:
        user: User instance
        
    Returns:
        Boolean indicating success
    """
    subject = _("Welcome to Track!")
    
    context = {
        'user': user,
        'site_name': 'Track',
        'site_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
    }
    
    # Render email templates
    html_message = render_to_string('emails/welcome.html', context)
    plain_message = render_to_string('emails/welcome.txt', context)
    
    return send_email(
        subject=subject,
        message=plain_message,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=True
    )


def send_password_reset_email(user, reset_token):
    """
    Send password reset email with reset link.
    
    Args:
        user: User instance
        reset_token: PasswordResetToken instance
        
    Returns:
        Boolean indicating success
    """
    subject = _("Reset your Track password")
    
    # Build reset URL
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    reset_url = f"{frontend_url}/auth/reset-password?token={reset_token.token}"
    
    context = {
        'user': user,
        'reset_url': reset_url,
        'reset_token': reset_token.token,
        'site_name': 'Track',
        'expiry_hours': 1,  # Token expires in 1 hour
    }
    
    # Render email templates
    html_message = render_to_string('emails/password_reset.html', context)
    plain_message = render_to_string('emails/password_reset.txt', context)
    
    return send_email(
        subject=subject,
        message=plain_message,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=True
    )


def send_password_changed_email(user):
    """
    Send confirmation email when password is changed.
    
    Args:
        user: User instance
        
    Returns:
        Boolean indicating success
    """
    subject = _("Your Track password was changed")
    
    context = {
        'user': user,
        'site_name': 'Track',
        'support_email': getattr(settings, 'SUPPORT_EMAIL', 'support@track.com'),
    }
    
    # Render email templates
    html_message = render_to_string('emails/password_changed.html', context)
    plain_message = render_to_string('emails/password_changed.txt', context)
    
    return send_email(
        subject=subject,
        message=plain_message,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=True
    )


def send_email_verification(user, verification_token):
    """
    Send email verification email to user.
    
    Args:
        user: User instance
        verification_token: Email verification token
        
    Returns:
        Boolean indicating success
    """
    subject = _("Verify your Track email address")
    
    # Build verification URL
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    verification_url = f"{frontend_url}/auth/verify-email?token={verification_token}"
    
    context = {
        'user': user,
        'verification_url': verification_url,
        'verification_token': verification_token,
        'site_name': 'Track',
    }
    
    # Render email templates
    html_message = render_to_string('emails/email_verification.html', context)
    plain_message = render_to_string('emails/email_verification.txt', context)
    
    return send_email(
        subject=subject,
        message=plain_message,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=True
    )


def get_client_ip(request):
    """
    Get client IP address from request.
    
    Args:
        request: Django request object
        
    Returns:
        String IP address
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent(request):
    """
    Get user agent string from request.
    
    Args:
        request: Django request object
        
    Returns:
        String user agent
    """
    return request.META.get('HTTP_USER_AGENT', '')


def validate_password_strength(password):
    """
    Additional password strength validation.
    
    Args:
        password: Password string to validate
        
    Returns:
        Dict with is_valid boolean and errors list
    """
    errors = []
    
    # Check length
    if len(password) < 8:
        errors.append(_('Password must be at least 8 characters long.'))
    
    # Check for at least one uppercase letter
    if not any(c.isupper() for c in password):
        errors.append(_('Password must contain at least one uppercase letter.'))
    
    # Check for at least one lowercase letter
    if not any(c.islower() for c in password):
        errors.append(_('Password must contain at least one lowercase letter.'))
    
    # Check for at least one digit
    if not any(c.isdigit() for c in password):
        errors.append(_('Password must contain at least one digit.'))
    
    # Check for at least one special character
    special_chars = "!@#$%^&*()_+-=[]{}|;':\",./<>?"
    if not any(c in special_chars for c in password):
        errors.append(_('Password must contain at least one special character.'))
    
    # Check for common weak passwords
    weak_passwords = [
        'password', '12345678', 'qwertyui', 'abc12345', 
        'password123', '123456789', 'qwerty123'
    ]
    if password.lower() in weak_passwords:
        errors.append(_('This password is too common.'))
    
    return {
        'is_valid': len(errors) == 0,
        'errors': errors
    }


def generate_username_from_email(email):
    """
    Generate a username from email address.
    Used for fallback compatibility.
    
    Args:
        email: Email address
        
    Returns:
        String username
    """
    return email.split('@')[0].lower()