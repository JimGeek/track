from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested.routers import NestedDefaultRouter
from .views import FeatureViewSet, FeatureCommentViewSet, FeatureAttachmentViewSet

router = DefaultRouter()
router.register(r'features', FeatureViewSet, basename='feature')

# Nested routes for comments and attachments
feature_router = NestedDefaultRouter(router, r'features', lookup='feature')
feature_router.register(r'comments', FeatureCommentViewSet, basename='feature-comments')
feature_router.register(r'attachments', FeatureAttachmentViewSet, basename='feature-attachments')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(feature_router.urls)),
]