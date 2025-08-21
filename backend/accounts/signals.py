from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

User = get_user_model()


@receiver(post_save, sender=User)
def user_post_save(sender, instance, created, **kwargs):
    """Handle post save signals for User model."""
    if created:
        # Perform any post-creation tasks here
        # For example, send welcome email, create user profile, etc.
        pass