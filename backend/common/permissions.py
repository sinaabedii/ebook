"""
Common permissions for the application.
"""
from rest_framework.permissions import BasePermission


class IsOrganizationAdmin(BasePermission):
    """Permission for organization admins."""
    
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.is_org_admin
        )


class IsOwnerOrReadOnly(BasePermission):
    """Permission for object owners."""
    
    def has_object_permission(self, request, view, obj):
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return True
        return obj.user == request.user
