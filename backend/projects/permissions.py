from rest_framework import permissions


class IsProjectOwnerOrTeamMember(permissions.BasePermission):
    """
    Custom permission to only allow owners or team members of a project to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user who has access to the project
        if request.method in permissions.SAFE_METHODS:
            return obj.can_user_edit(request.user)
        
        # Write permissions are only allowed to the owner or team members
        return obj.can_user_edit(request.user)


class IsProjectOwner(permissions.BasePermission):
    """
    Custom permission to only allow owners of a project to perform certain actions.
    """

    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user