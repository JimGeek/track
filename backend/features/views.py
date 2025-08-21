from rest_framework import generics, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from django.utils import timezone

from .models import Feature, FeatureComment, FeatureAttachment
from .serializers import (
    FeatureSerializer, FeatureListSerializer, CreateFeatureSerializer,
    FeatureCommentSerializer, FeatureAttachmentSerializer
)
from .permissions import IsFeatureStakeholder
from .filters import FeatureFilter


class FeatureViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = FeatureFilter
    search_fields = ['title', 'description']
    ordering_fields = [
        'title', 'status', 'priority', 'due_date', 'created_at', 
        'updated_at', 'order', 'estimated_hours'
    ]
    ordering = ['order', '-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return FeatureListSerializer
        elif self.action == 'create':
            return CreateFeatureSerializer
        return FeatureSerializer

    def get_queryset(self):
        user = self.request.user
        
        # User can see features from projects they have access to
        queryset = Feature.objects.filter(
            Q(project__owner=user) | Q(project__team_members=user) |
            Q(assignee=user) | Q(reporter=user)
        ).distinct().select_related(
            'project', 'parent', 'assignee', 'reporter'
        ).prefetch_related('comments', 'attachments', 'sub_features')
        
        # Filter by project if specified
        project_id = self.request.query_params.get('project', None)
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Filter by parent feature if specified
        parent_id = self.request.query_params.get('parent', None)
        if parent_id:
            if parent_id == 'null':
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent_id)
        
        return queryset

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsFeatureStakeholder]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @method_decorator(ratelimit(key='user', rate='20/m', method='POST'))
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsFeatureStakeholder])
    def advance_status(self, request, pk=None):
        feature = self.get_object()
        if feature.advance_status():
            serializer = self.get_serializer(feature)
            return Response({
                'detail': f'Feature status advanced to {feature.status}.',
                'feature': serializer.data
            })
        else:
            return Response(
                {'detail': 'Cannot advance status further.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsFeatureStakeholder])
    def revert_status(self, request, pk=None):
        feature = self.get_object()
        if feature.revert_status():
            serializer = self.get_serializer(feature)
            return Response({
                'detail': f'Feature status reverted to {feature.status}.',
                'feature': serializer.data
            })
        else:
            return Response(
                {'detail': 'Cannot revert status further.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsFeatureStakeholder])
    def set_status(self, request, pk=None):
        feature = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in [choice[0] for choice in Feature.STATUS_CHOICES]:
            return Response(
                {'detail': 'Invalid status.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = feature.status
        feature.status = new_status
        
        if new_status == 'live':
            from django.utils import timezone
            feature.completed_date = timezone.now()
        elif old_status == 'live':
            feature.completed_date = None
        
        feature.save()
        
        serializer = self.get_serializer(feature)
        return Response({
            'detail': f'Feature status changed from {old_status} to {new_status}.',
            'feature': serializer.data
        })

    @action(detail=True, methods=['get'])
    def hierarchy(self, request, pk=None):
        feature = self.get_object()
        
        # Get all ancestors
        ancestors = []
        parent = feature.parent
        while parent:
            ancestors.insert(0, {
                'id': str(parent.id),
                'title': parent.title,
                'status': parent.status,
                'hierarchy_level': parent.hierarchy_level
            })
            parent = parent.parent
        
        # Get all descendants
        def get_descendants(feature):
            descendants = []
            for sub_feature in feature.sub_features.all():
                descendants.append({
                    'id': str(sub_feature.id),
                    'title': sub_feature.title,
                    'status': sub_feature.status,
                    'hierarchy_level': sub_feature.hierarchy_level,
                    'children': get_descendants(sub_feature)
                })
            return descendants
        
        descendants = get_descendants(feature)
        
        return Response({
            'ancestors': ancestors,
            'current': {
                'id': str(feature.id),
                'title': feature.title,
                'status': feature.status,
                'hierarchy_level': feature.hierarchy_level
            },
            'descendants': descendants
        })

    @action(detail=False, methods=['get'])
    def by_project(self, request):
        project_id = request.query_params.get('project_id')
        if not project_id:
            return Response(
                {'detail': 'project_id parameter is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        features = self.get_queryset().filter(project_id=project_id, parent__isnull=True)
        serializer = self.get_serializer(features, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_assignments(self, request):
        features = self.get_queryset().filter(assignee=request.user)
        serializer = self.get_serializer(features, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        user = request.user
        queryset = self.get_queryset()
        
        # My assignments
        my_assignments = queryset.filter(assignee=user)
        
        # Features I reported
        my_reports = queryset.filter(reporter=user)
        
        # Overdue features
        overdue_features = queryset.filter(
            Q(assignee=user) | Q(reporter=user)
        ).filter(due_date__lt=timezone.now().date()).exclude(status='live').distinct()
        
        # Status distribution
        status_distribution = list(
            my_assignments.values('status').annotate(count=Count('id'))
        )
        
        # Priority distribution
        priority_distribution = list(
            my_assignments.values('priority').annotate(count=Count('id'))
        )
        
        return Response({
            'my_assignments_count': my_assignments.count(),
            'my_reports_count': my_reports.count(),
            'overdue_count': overdue_features.count(),
            'status_distribution': status_distribution,
            'priority_distribution': priority_distribution,
        })


class FeatureCommentViewSet(ModelViewSet):
    serializer_class = FeatureCommentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        feature_id = self.kwargs.get('feature_pk')
        return FeatureComment.objects.filter(feature_id=feature_id)

    def perform_create(self, serializer):
        feature_id = self.kwargs.get('feature_pk')
        serializer.save(
            feature_id=feature_id,
            author=self.request.user
        )


class FeatureAttachmentViewSet(ModelViewSet):
    serializer_class = FeatureAttachmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        feature_id = self.kwargs.get('feature_pk')
        return FeatureAttachment.objects.filter(feature_id=feature_id)

    def perform_create(self, serializer):
        feature_id = self.kwargs.get('feature_pk')
        serializer.save(
            feature_id=feature_id,
            uploaded_by=self.request.user
        )