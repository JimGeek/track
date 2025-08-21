# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-project-management-crud/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Project CRUD Operations

#### List Projects
```http
GET /api/projects/
```

**Query Parameters:**
- `search` (string): Search in name and description
- `status` (string): Filter by status (planning, active, on_hold, completed, archived)
- `domain` (string): Filter by domain
- `priority` (string): Filter by priority
- `owner` (integer): Filter by owner ID
- `is_active` (boolean): Filter by active status
- `ordering` (string): Order by field (name, created_at, updated_at, end_date)
- `page` (integer): Page number for pagination
- `page_size` (integer): Number of items per page (max 100)

**Response:**
```json
{
    "count": 25,
    "next": "/api/projects/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "name": "Track Feature Management",
            "slug": "track-feature-management",
            "description": "A comprehensive feature tracking system",
            "short_description": "Feature tracking and management platform",
            "start_date": "2025-08-01",
            "end_date": "2025-12-31",
            "target_launch_date": "2025-11-30",
            "domain": "web",
            "status": "active",
            "priority": "high",
            "owner": {
                "id": 1,
                "username": "admin",
                "email": "admin@example.com",
                "first_name": "Admin",
                "last_name": "User"
            },
            "team_members_count": 3,
            "feature_request_count": 15,
            "is_active": true,
            "is_public": false,
            "is_overdue": false,
            "days_remaining": 132,
            "created_at": "2025-08-21T10:00:00Z",
            "updated_at": "2025-08-21T14:30:00Z"
        }
    ]
}
```

#### Create Project
```http
POST /api/projects/
```

**Request Body:**
```json
{
    "name": "New Project Name",
    "description": "Detailed project description",
    "short_description": "Brief summary",
    "start_date": "2025-09-01",
    "end_date": "2025-12-31",
    "target_launch_date": "2025-12-15",
    "domain": "web",
    "status": "planning",
    "priority": "medium",
    "is_public": false
}
```

**Response:** 201 Created
```json
{
    "id": 2,
    "name": "New Project Name",
    "slug": "new-project-name",
    "description": "Detailed project description",
    "short_description": "Brief summary",
    "start_date": "2025-09-01",
    "end_date": "2025-12-31",
    "target_launch_date": "2025-12-15",
    "domain": "web",
    "status": "planning",
    "priority": "medium",
    "owner": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User"
    },
    "team_members_count": 0,
    "feature_request_count": 0,
    "is_active": true,
    "is_public": false,
    "is_overdue": false,
    "days_remaining": 132,
    "created_at": "2025-08-21T15:00:00Z",
    "updated_at": "2025-08-21T15:00:00Z"
}
```

#### Retrieve Project
```http
GET /api/projects/{id}/
```

**Response:** 200 OK
```json
{
    "id": 1,
    "name": "Track Feature Management",
    "slug": "track-feature-management",
    "description": "A comprehensive feature tracking system for managing project features and requests",
    "short_description": "Feature tracking and management platform",
    "start_date": "2025-08-01",
    "end_date": "2025-12-31",
    "target_launch_date": "2025-11-30",
    "domain": "web",
    "status": "active",
    "priority": "high",
    "owner": {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "first_name": "Admin",
        "last_name": "User"
    },
    "team_members": [
        {
            "id": 2,
            "username": "developer1",
            "email": "dev1@example.com",
            "first_name": "John",
            "last_name": "Developer",
            "role": "contributor",
            "joined_at": "2025-08-15T09:00:00Z"
        }
    ],
    "feature_request_count": 15,
    "is_active": true,
    "is_public": false,
    "is_overdue": false,
    "days_remaining": 132,
    "created_at": "2025-08-21T10:00:00Z",
    "updated_at": "2025-08-21T14:30:00Z"
}
```

#### Update Project
```http
PUT /api/projects/{id}/
PATCH /api/projects/{id}/
```

**Request Body (PUT - full update):**
```json
{
    "name": "Updated Project Name",
    "description": "Updated project description",
    "short_description": "Updated brief summary",
    "start_date": "2025-09-01",
    "end_date": "2025-12-31",
    "target_launch_date": "2025-12-15",
    "domain": "web",
    "status": "active",
    "priority": "high",
    "is_public": true
}
```

**Request Body (PATCH - partial update):**
```json
{
    "status": "active",
    "priority": "high"
}
```

**Response:** 200 OK (same format as retrieve)

#### Delete Project
```http
DELETE /api/projects/{id}/
```

**Response:** 204 No Content

### Project Team Management

#### Add Team Member
```http
POST /api/projects/{id}/members/
```

**Request Body:**
```json
{
    "user_id": 2,
    "role": "contributor"
}
```

**Response:** 201 Created
```json
{
    "id": 1,
    "user": {
        "id": 2,
        "username": "developer1",
        "email": "dev1@example.com",
        "first_name": "John",
        "last_name": "Developer"
    },
    "role": "contributor",
    "joined_at": "2025-08-21T15:30:00Z"
}
```

#### Remove Team Member
```http
DELETE /api/projects/{id}/members/{user_id}/
```

**Response:** 204 No Content

#### Update Member Role
```http
PATCH /api/projects/{id}/members/{user_id}/
```

**Request Body:**
```json
{
    "role": "manager"
}
```

### Bulk Operations

#### Bulk Status Update
```http
PATCH /api/projects/bulk-update/
```

**Request Body:**
```json
{
    "project_ids": [1, 2, 3],
    "updates": {
        "status": "active",
        "priority": "high"
    }
}
```

**Response:** 200 OK
```json
{
    "updated_count": 3,
    "updated_projects": [1, 2, 3]
}
```

## Controllers

### ProjectViewSet

```python
# views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from .models import Project, ProjectMembership
from .serializers import ProjectSerializer, ProjectDetailSerializer, ProjectMembershipSerializer
from .filters import ProjectFilter
from .permissions import ProjectPermission

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, ProjectPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProjectFilter
    search_fields = ['name', 'description', 'short_description']
    ordering_fields = ['name', 'created_at', 'updated_at', 'end_date', 'priority']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        user = self.request.user
        queryset = Project.objects.select_related('owner').prefetch_related('team_members')
        
        # Filter based on user permissions
        if user.is_superuser:
            return queryset
        else:
            return queryset.filter(
                Q(owner=user) | 
                Q(team_members=user) | 
                Q(is_public=True)
            ).distinct()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        project = self.get_object()
        memberships = ProjectMembership.objects.filter(project=project).select_related('user')
        serializer = ProjectMembershipSerializer(memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        project = self.get_object()
        serializer = ProjectMembershipSerializer(data=request.data)
        
        if serializer.is_valid():
            user_id = serializer.validated_data['user_id']
            role = serializer.validated_data.get('role', 'member')
            
            membership, created = ProjectMembership.objects.get_or_create(
                project=project,
                user_id=user_id,
                defaults={'role': role}
            )
            
            if created:
                return Response(
                    ProjectMembershipSerializer(membership).data,
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'error': 'User is already a member of this project'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None, user_id=None):
        project = self.get_object()
        try:
            membership = ProjectMembership.objects.get(project=project, user_id=user_id)
            membership.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ProjectMembership.DoesNotExist:
            return Response(
                {'error': 'User is not a member of this project'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['patch'])
    def bulk_update(self, request):
        project_ids = request.data.get('project_ids', [])
        updates = request.data.get('updates', {})
        
        if not project_ids or not updates:
            return Response(
                {'error': 'project_ids and updates are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Filter projects user can modify
        queryset = self.get_queryset().filter(id__in=project_ids)
        
        if request.user.is_superuser:
            projects = queryset
        else:
            projects = queryset.filter(owner=request.user)
        
        updated_count = projects.update(**updates)
        updated_ids = list(projects.values_list('id', flat=True))
        
        return Response({
            'updated_count': updated_count,
            'updated_projects': updated_ids
        })
    
    @action(detail=False, methods=['get'])
    def my_projects(self, request):
        """Get projects owned by the current user"""
        projects = self.get_queryset().filter(owner=request.user)
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get project statistics for the current user"""
        queryset = self.get_queryset()
        
        stats = {
            'total_projects': queryset.count(),
            'by_status': dict(queryset.values_list('status').annotate(count=Count('id'))),
            'by_domain': dict(queryset.values_list('domain').annotate(count=Count('id'))),
            'by_priority': dict(queryset.values_list('priority').annotate(count=Count('id'))),
            'overdue_projects': queryset.filter(
                end_date__lt=timezone.now().date(),
                status__in=['planning', 'active', 'on_hold']
            ).count()
        }
        
        return Response(stats)


# filters.py
import django_filters
from .models import Project

class ProjectFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr='icontains')
    status = django_filters.ChoiceFilter(choices=Project.STATUS_CHOICES)
    domain = django_filters.ChoiceFilter(choices=Project.DOMAIN_CHOICES)
    priority = django_filters.ChoiceFilter(choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ])
    start_date_after = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    start_date_before = django_filters.DateFilter(field_name='start_date', lookup_expr='lte')
    end_date_after = django_filters.DateFilter(field_name='end_date', lookup_expr='gte')
    end_date_before = django_filters.DateFilter(field_name='end_date', lookup_expr='lte')
    is_overdue = django_filters.BooleanFilter(method='filter_overdue')
    
    class Meta:
        model = Project
        fields = ['status', 'domain', 'priority', 'owner', 'is_active', 'is_public']
    
    def filter_overdue(self, queryset, name, value):
        from django.utils import timezone
        if value:
            return queryset.filter(
                end_date__lt=timezone.now().date(),
                status__in=['planning', 'active', 'on_hold']
            )
        else:
            return queryset.exclude(
                end_date__lt=timezone.now().date(),
                status__in=['planning', 'active', 'on_hold']
            )
```

### Error Handling

**Standard Error Response Format:**
```json
{
    "error": "Error message description",
    "details": {
        "field_name": ["Specific field error messages"]
    },
    "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `VALIDATION_ERROR` (400): Request validation failed
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict (e.g., duplicate name)
- `SERVER_ERROR` (500): Internal server error