from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()


class EmailAuthenticationBackend(BaseBackend):
    """
    Custom authentication backend that allows users to log in using their email address.
    
    This backend supports:
    - Case-insensitive email authentication
    - Active user checking
    - Email normalization
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authenticate a user by email and password.
        
        Args:
            request: The request object
            username: The email address (username field)
            password: The password
            **kwargs: Additional keyword arguments
            
        Returns:
            User instance if authentication is successful, None otherwise
        """
        if username is None or password is None:
            return None
        
        try:
            # Normalize email to lowercase for case-insensitive lookup
            email = username.lower().strip()
            
            # Find user by email (case-insensitive)
            user = User.objects.get(Q(email__iexact=email))
            
            # Check if the password is correct
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
                
        except User.DoesNotExist:
            # Run the default password hasher once to reduce the timing
            # difference between an existing and a non-existing user
            User().set_password(password)
            return None
        
        return None
    
    def user_can_authenticate(self, user):
        """
        Reject users with is_active=False. Custom user models that don't have
        an 'is_active' field are allowed.
        """
        is_active = getattr(user, 'is_active', None)
        return is_active or is_active is None
    
    def get_user(self, user_id):
        """
        Get a user instance by user ID.
        
        Args:
            user_id: The user's primary key
            
        Returns:
            User instance if found, None otherwise
        """
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
        
        return user if self.user_can_authenticate(user) else None