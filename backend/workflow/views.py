from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import (
    WorkflowTemplate, WorkflowState, WorkflowTransition, 
    WorkflowHistory, WorkflowRule, WorkflowMetrics
)
from .serializers import (
    WorkflowTemplateSerializer, WorkflowTemplateListSerializer,
    WorkflowStateSerializer, WorkflowTransitionSerializer,
    WorkflowHistorySerializer, WorkflowRuleSerializer,
    WorkflowMetricsSerializer, CreateWorkflowTemplateSerializer,
    WorkflowTransitionRequestSerializer
)
from .filters import WorkflowTemplateFilter, WorkflowHistoryFilter
from .permissions import WorkflowPermission


class WorkflowTemplateViewSet(viewsets.ModelViewSet):
    queryset = WorkflowTemplate.objects.all()
    permission_classes = [permissions.IsAuthenticated, WorkflowPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = WorkflowTemplateFilter
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'entity_type', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return WorkflowTemplateListSerializer
        elif self.action == 'create':
            return CreateWorkflowTemplateSerializer
        return WorkflowTemplateSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def states(self, request, pk=None):
        """Get all states for a workflow template"""
        template = self.get_object()
        states = template.states.all()
        serializer = WorkflowStateSerializer(states, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def transitions(self, request, pk=None):
        """Get all transitions for a workflow template"""
        template = self.get_object()
        transitions = template.transitions.all()
        serializer = WorkflowTransitionSerializer(transitions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Create a copy of an existing workflow template"""
        template = self.get_object()
        
        # Create new template
        new_template = WorkflowTemplate.objects.create(
            name=f"{template.name} (Copy)",
            description=template.description,
            entity_type=template.entity_type,
            created_by=request.user
        )
        
        # Copy states
        state_mapping = {}
        for state in template.states.all():
            new_state = WorkflowState.objects.create(
                template=new_template,
                name=state.name,
                slug=state.slug,
                description=state.description,
                color=state.color,
                icon=state.icon,
                is_initial=state.is_initial,
                is_final=state.is_final,
                order=state.order,
                auto_assign_to_creator=state.auto_assign_to_creator,
                require_assignee=state.require_assignee,
                require_comment=state.require_comment,
                notify_stakeholders=state.notify_stakeholders
            )
            state_mapping[state.id] = new_state
        
        # Copy transitions
        for transition in template.transitions.all():
            WorkflowTransition.objects.create(
                template=new_template,
                from_state=state_mapping[transition.from_state.id],
                to_state=state_mapping[transition.to_state.id],
                name=transition.name,
                description=transition.description,
                require_permission=transition.require_permission,
                require_role=transition.require_role,
                require_all_subtasks_complete=transition.require_all_subtasks_complete,
                require_comment=transition.require_comment,
                auto_assign_to_user=transition.auto_assign_to_user,
                auto_set_due_date_days=transition.auto_set_due_date_days
            )
        
        # Copy rules
        for rule in template.rules.all():
            WorkflowRule.objects.create(
                template=new_template,
                name=rule.name,
                description=rule.description,
                trigger_on_state=state_mapping[rule.trigger_on_state.id],
                trigger_condition=rule.trigger_condition,
                action_type=rule.action_type,
                action_config=rule.action_config,
                is_active=rule.is_active,
                priority=rule.priority,
                created_by=request.user
            )
        
        serializer = self.get_serializer(new_template)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def metrics(self, request, pk=None):
        """Get workflow metrics for a template"""
        template = self.get_object()
        days = int(request.query_params.get('days', 30))
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        metrics = WorkflowMetrics.objects.filter(
            template=template,
            period_start__gte=start_date,
            period_end__lte=end_date
        )
        
        serializer = WorkflowMetricsSerializer(metrics, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def usage_stats(self, request, pk=None):
        """Get usage statistics for a workflow template"""
        template = self.get_object()
        days = int(request.query_params.get('days', 30))
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Get history entries in the date range
        history = WorkflowHistory.objects.filter(
            template=template,
            created_at__gte=start_date,
            created_at__lte=end_date
        )
        
        # Calculate statistics
        total_transitions = history.count()
        unique_entities = history.values('entity_id').distinct().count()
        
        state_stats = history.values('to_state__name').annotate(
            count=Count('id')
        ).order_by('-count')
        
        daily_stats = history.extra(
            select={'day': "DATE(created_at)"}
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')
        
        return Response({
            'period': {
                'start': start_date,
                'end': end_date,
                'days': days
            },
            'totals': {
                'transitions': total_transitions,
                'unique_entities': unique_entities,
                'avg_transitions_per_day': total_transitions / days if days > 0 else 0
            },
            'state_distribution': list(state_stats),
            'daily_activity': list(daily_stats)
        })


class WorkflowStateViewSet(viewsets.ModelViewSet):
    queryset = WorkflowState.objects.all()
    serializer_class = WorkflowStateSerializer
    permission_classes = [permissions.IsAuthenticated, WorkflowPermission]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['template', 'is_initial', 'is_final']
    ordering_fields = ['order', 'name', 'created_at']
    ordering = ['order', 'name']

    @action(detail=True, methods=['get'])
    def transitions(self, request, pk=None):
        """Get all transitions from this state"""
        state = self.get_object()
        transitions = state.outgoing_transitions.all()
        serializer = WorkflowTransitionSerializer(transitions, many=True)
        return Response(serializer.data)


class WorkflowTransitionViewSet(viewsets.ModelViewSet):
    queryset = WorkflowTransition.objects.all()
    serializer_class = WorkflowTransitionSerializer
    permission_classes = [permissions.IsAuthenticated, WorkflowPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['template', 'from_state', 'to_state', 'require_role']

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute a workflow transition"""
        transition = self.get_object()
        serializer = WorkflowTransitionRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            # This would typically be called from the entity (Feature, Project, etc.)
            # Here we just return success for the API endpoint
            return Response({
                'detail': f'Transition "{transition.name}" executed successfully.',
                'transition': WorkflowTransitionSerializer(transition).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class WorkflowHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkflowHistory.objects.all()
    serializer_class = WorkflowHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = WorkflowHistoryFilter
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    @action(detail=False, methods=['get'])
    def entity_history(self, request):
        """Get workflow history for a specific entity"""
        entity_type = request.query_params.get('entity_type')
        entity_id = request.query_params.get('entity_id')
        
        if not entity_type or not entity_id:
            return Response(
                {'error': 'Both entity_type and entity_id parameters are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        history = self.get_queryset().filter(
            entity_type=entity_type,
            entity_id=entity_id
        )
        
        page = self.paginate_queryset(history)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(history, many=True)
        return Response(serializer.data)


class WorkflowRuleViewSet(viewsets.ModelViewSet):
    queryset = WorkflowRule.objects.all()
    serializer_class = WorkflowRuleSerializer
    permission_classes = [permissions.IsAuthenticated, WorkflowPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['template', 'trigger_on_state', 'action_type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['priority', 'name', 'created_at']
    ordering = ['priority', 'name']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle the active status of a workflow rule"""
        rule = self.get_object()
        rule.is_active = not rule.is_active
        rule.save()
        
        serializer = self.get_serializer(rule)
        return Response({
            'detail': f'Rule "{rule.name}" {"activated" if rule.is_active else "deactivated"}.',
            'rule': serializer.data
        })


class WorkflowMetricsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WorkflowMetrics.objects.all()
    serializer_class = WorkflowMetricsSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['template', 'state', 'period_start', 'period_end']
    ordering_fields = ['period_start', 'avg_time_in_state_hours', 'total_entries']
    ordering = ['-period_start']

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """Calculate metrics for a specific period and template"""
        template_id = request.data.get('template_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        if not all([template_id, start_date, end_date]):
            return Response(
                {'error': 'template_id, start_date, and end_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            template = WorkflowTemplate.objects.get(id=template_id)
        except WorkflowTemplate.DoesNotExist:
            return Response(
                {'error': 'Template not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Calculate metrics for each state
        metrics_created = []
        
        for state in template.states.all():
            history = WorkflowHistory.objects.filter(
                template=template,
                to_state=state,
                created_at__gte=start_date,
                created_at__lte=end_date
            )
            
            total_entries = history.count()
            
            # Calculate average time in state (simplified calculation)
            # In a real implementation, you'd track entry/exit times more precisely
            avg_time = 24.0  # Default 24 hours as placeholder
            
            metrics, created = WorkflowMetrics.objects.get_or_create(
                template=template,
                state=state,
                period_start=start_date,
                period_end=end_date,
                defaults={
                    'avg_time_in_state_hours': avg_time,
                    'total_entries': total_entries,
                    'total_exits': total_entries,  # Simplified
                    'completion_rate': 100.0 if total_entries > 0 else 0.0
                }
            )
            
            if created:
                metrics_created.append(metrics)
        
        return Response({
            'detail': f'Calculated metrics for {len(metrics_created)} states.',
            'metrics_count': len(metrics_created),
            'template': template.name
        })