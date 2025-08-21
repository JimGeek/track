import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class CustomPasswordValidator:
    """
    Custom password validator that enforces strong password requirements.
    
    Requirements:
    - At least 8 characters long
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    - Contains at least one special character
    """
    
    def __init__(self):
        self.min_length = 8
        
    def validate(self, password, user=None):
        """Validate password against custom requirements."""
        errors = []
        
        # Check length
        if len(password) < self.min_length:
            errors.append(_('Password must be at least 8 characters long.'))
        
        # Check for uppercase letter
        if not re.search(r'[A-Z]', password):
            errors.append(_('Password must contain at least one uppercase letter.'))
        
        # Check for lowercase letter
        if not re.search(r'[a-z]', password):
            errors.append(_('Password must contain at least one lowercase letter.'))
        
        # Check for digit
        if not re.search(r'\d', password):
            errors.append(_('Password must contain at least one digit.'))
        
        # Check for special character
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\?]', password):
            errors.append(_('Password must contain at least one special character.'))
        
        # Check for common patterns
        if password.lower() in ['password', '12345678', 'qwertyui']:
            errors.append(_('Password is too common.'))
        
        if errors:
            raise ValidationError(errors)
    
    def get_help_text(self):
        """Return help text for password requirements."""
        return _(
            'Your password must contain at least 8 characters with '
            'uppercase and lowercase letters, digits, and special characters.'
        )