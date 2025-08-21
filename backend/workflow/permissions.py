from rest_framework import permissions


class WorkflowPermission(permissions.BasePermission):
    """
    Custom permission for workflow management.
    - Allow read access to all authenticated users
    - Allow create/update/delete only to staff users or template creators
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Read permissions for all authenticated users
        if view.action in ['list', 'retrieve']:
            return True
        
        # Write permissions for staff users
        if request.user.is_staff:
            return True
        
        return False

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        # Read permissions for all authenticated users
        if view.action in ['retrieve']:
            return True
        
        # Write permissions for staff users
        if request.user.is_staff:
            return True
        
        # Template creators can modify their own templates
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True
        
        # For workflow states and transitions, check template ownership
        if hasattr(obj, 'template') and hasattr(obj.template, 'created_by'):
            return obj.template.created_by == request.user
        
        return False