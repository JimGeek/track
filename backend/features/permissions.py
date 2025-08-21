from rest_framework import permissions


class IsFeatureStakeholder(permissions.BasePermission):
    """
    Custom permission to only allow stakeholders of a feature to edit it.
    Stakeholders are: project owner, team members, assignee, and reporter.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any authenticated user who has access to the feature
        if request.method in permissions.SAFE_METHODS:
            return obj.can_user_edit(request.user)
        
        # Write permissions are only allowed to stakeholders
        return obj.can_user_edit(request.user)


class IsFeatureReporter(permissions.BasePermission):
    """
    Custom permission to only allow the reporter of a feature to perform certain actions.
    """

    def has_object_permission(self, request, view, obj):
        return obj.reporter == request.user


class CanManageFeatureComments(permissions.BasePermission):
    """
    Custom permission for feature comments.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Anyone with feature access can read comments
        if request.method in permissions.SAFE_METHODS:
            return obj.feature.can_user_edit(request.user)
        
        # Only comment author can edit/delete their comments
        return obj.author == request.user


class CanManageFeatureAttachments(permissions.BasePermission):
    """
    Custom permission for feature attachments.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Anyone with feature access can read attachments
        if request.method in permissions.SAFE_METHODS:
            return obj.feature.can_user_edit(request.user)
        
        # Only uploader or feature stakeholders can delete attachments
        return (obj.uploaded_by == request.user or 
                obj.feature.can_user_edit(request.user))