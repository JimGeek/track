from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkflowTemplateViewSet, WorkflowStateViewSet, WorkflowTransitionViewSet,
    WorkflowHistoryViewSet, WorkflowRuleViewSet, WorkflowMetricsViewSet
)

router = DefaultRouter()
router.register(r'templates', WorkflowTemplateViewSet, basename='workflowtemplate')
router.register(r'states', WorkflowStateViewSet, basename='workflowstate')
router.register(r'transitions', WorkflowTransitionViewSet, basename='workflowtransition')
router.register(r'history', WorkflowHistoryViewSet, basename='workflowhistory')
router.register(r'rules', WorkflowRuleViewSet, basename='workflowrule')
router.register(r'metrics', WorkflowMetricsViewSet, basename='workflowmetrics')

urlpatterns = [
    path('', include(router.urls)),
]