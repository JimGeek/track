"""
URL routing for the todos app.

This module defines the API endpoints for TodoList and Task operations
using DRF router for consistent RESTful routing.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TodoListViewSet, TaskViewSet, ActivityViewSet

# Create a router and register our viewsets
router = DefaultRouter()
router.register(r'todolists', TodoListViewSet, basename='todolist')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'activities', ActivityViewSet, basename='activity')

urlpatterns = [
    # Include all router URLs
    path('', include(router.urls)),
]