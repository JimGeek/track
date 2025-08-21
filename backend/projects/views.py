from rest_framework import generics, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit

from .models import Project
from .serializers import ProjectSerializer, ProjectListSerializer
from .permissions import IsProjectOwnerOrTeamMember


class ProjectViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['priority', 'is_archived']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'priority', 'deadline', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Project.objects.filter(
            Q(owner=user) | Q(team_members=user)
        ).distinct().select_related('owner').prefetch_related('team_members')
        
        # Filter by archived status
        archived = self.request.query_params.get('archived', None)
        if archived is not None:
            is_archived = archived.lower() in ('true', '1')
            queryset = queryset.filter(is_archived=is_archived)
        
        return queryset

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'archive', 'unarchive']:
            permission_classes = [IsAuthenticated, IsProjectOwnerOrTeamMember]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @method_decorator(ratelimit(key='user', rate='10/m', method='POST'))
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        project = serializer.save()
        return Response(
            ProjectSerializer(project, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsProjectOwnerOrTeamMember])
    def archive(self, request, pk=None):
        project = self.get_object()
        project.is_archived = True
        project.save()
        return Response({
            'detail': 'Project archived successfully.',
            'project': ProjectSerializer(project, context={'request': request}).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsProjectOwnerOrTeamMember])
    def unarchive(self, request, pk=None):
        project = self.get_object()
        project.is_archived = False
        project.save()
        return Response({
            'detail': 'Project unarchived successfully.',
            'project': ProjectSerializer(project, context={'request': request}).data
        })

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        project = self.get_object()
        
        # Get statistics
        stats = {
            'total_features': project.total_features,
            'completed_features': project.completed_features,
            'progress_percentage': project.progress_percentage,
            'is_overdue': project.is_overdue,
            'team_members_count': project.team_members.count(),
            'created_at': project.created_at,
            'last_updated': project.updated_at,
        }
        
        return Response(stats)

    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        user = request.user
        owned_projects = Project.objects.filter(owner=user, is_archived=False)
        team_projects = Project.objects.filter(team_members=user, is_archived=False).exclude(owner=user)
        
        return Response({
            'owned_projects': ProjectListSerializer(
                owned_projects,
                many=True,
                context={'request': request}
            ).data,
            'team_projects': ProjectListSerializer(
                team_projects,
                many=True,
                context={'request': request}
            ).data
        })

    @action(detail=False, methods=['get'])
    def dashboard_summary(self, request):
        user = request.user
        user_projects = Project.objects.filter(
            Q(owner=user) | Q(team_members=user)
        ).distinct()
        
        total_projects = user_projects.count()
        active_projects = user_projects.filter(is_archived=False).count()
        overdue_projects = sum(1 for p in user_projects if p.is_overdue)
        
        return Response({
            'total_projects': total_projects,
            'active_projects': active_projects,
            'archived_projects': total_projects - active_projects,
            'overdue_projects': overdue_projects,
        })