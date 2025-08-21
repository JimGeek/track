# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-feature-request-management/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Feature Request CRUD Operations

#### List Feature Requests
```http
GET /api/feature-requests/
GET /api/projects/{project_id}/features/
```

**Query Parameters:**
- `search` (string): Search in title, description, and acceptance criteria
- `project` (integer): Filter by project ID
- `status` (string): Filter by status (idea, specification, development, testing, live)
- `priority` (string): Filter by priority (low, medium, high, critical)
- `feature_type` (string): Filter by feature type
- `assignee` (integer): Filter by assignee ID
- `requester` (integer): Filter by requester ID
- `tags` (string): Filter by tags (comma-separated)
- `is_blocked` (boolean): Filter by blocked status
- `is_overdue` (boolean): Filter by overdue status
- `complexity` (string): Filter by complexity level
- `target_date_after` (date): Filter by target date after
- `target_date_before` (date): Filter by target date before
- `ordering` (string): Order by field (title, created_at, updated_at, priority, target_date)
- `page` (integer): Page number for pagination
- `page_size` (integer): Number of items per page (max 100)

**Response:**
```json
{
    "count": 45,
    "next": "/api/feature-requests/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "title": "User Authentication System",
            "slug": "user-authentication-system",
            "project": {
                "id": 1,
                "name": "Track Feature Management",
                "slug": "track-feature-management"
            },
            "description": "Implement comprehensive user authentication with email verification",
            "acceptance_criteria": "- User registration with email\n- Email verification\n- Login/logout functionality",
            "business_value": "Essential for user management and security",
            "feature_type": "feature",
            "priority": "high",
            "complexity": "complex",
            "status": "development",
            "requester": {
                "id": 1,
                "username": "product_manager",
                "email": "pm@example.com",
                "first_name": "John",
                "last_name": "Manager"
            },
            "assignee": {
                "id": 2,
                "username": "developer1",
                "email": "dev1@example.com",
                "first_name": "Jane",
                "last_name": "Developer"
            },
            "requested_date": "2025-08-15T09:00:00Z",
            "target_date": "2025-09-15",
            "completed_date": null,
            "estimated_hours": 40,
            "actual_hours": null,
            "business_value_score": 9,
            "technical_risk_score": 6,
            "is_active": true,
            "is_blocked": false,
            "blocked_reason": "",
            "is_overdue": false,
            "days_until_target": 25,
            "duration_in_development": 6,
            "tags": ["authentication", "security", "user-management"],
            "comment_count": 3,
            "created_at": "2025-08-15T09:00:00Z",
            "updated_at": "2025-08-21T14:30:00Z"
        }
    ]
}
```

#### Create Feature Request
```http
POST /api/feature-requests/
POST /api/projects/{project_id}/features/
```

**Request Body:**
```json
{
    "title": "Advanced Search Functionality",
    "project": 1,
    "description": "Implement advanced search with filters and faceted search capabilities",
    "acceptance_criteria": "- Full-text search across all content\n- Advanced filters by category\n- Search result highlighting",
    "business_value": "Improve user experience and content discoverability",
    "technical_notes": "Consider using Elasticsearch for search backend",
    "feature_type": "feature",
    "priority": "medium",
    "complexity": "complex",
    "target_date": "2025-10-15",
    "estimated_hours": 60,
    "business_value_score": 7,
    "technical_risk_score": 8,
    "tags": ["search", "performance", "user-experience"]
}
```

**Response:** 201 Created
```json
{
    "id": 2,
    "title": "Advanced Search Functionality",
    "slug": "advanced-search-functionality",
    "project": {
        "id": 1,
        "name": "Track Feature Management",
        "slug": "track-feature-management"
    },
    "description": "Implement advanced search with filters and faceted search capabilities",
    "acceptance_criteria": "- Full-text search across all content\n- Advanced filters by category\n- Search result highlighting",
    "business_value": "Improve user experience and content discoverability",
    "technical_notes": "Consider using Elasticsearch for search backend",
    "feature_type": "feature",
    "priority": "medium",
    "complexity": "complex",
    "status": "idea",
    "requester": {
        "id": 1,
        "username": "product_manager",
        "email": "pm@example.com",
        "first_name": "John",
        "last_name": "Manager"
    },
    "assignee": null,
    "requested_date": "2025-08-21T15:30:00Z",
    "target_date": "2025-10-15",
    "completed_date": null,
    "estimated_hours": 60,
    "actual_hours": null,
    "business_value_score": 7,
    "technical_risk_score": 8,
    "is_active": true,
    "is_blocked": false,
    "blocked_reason": "",
    "is_overdue": false,
    "days_until_target": 55,
    "duration_in_development": 0,
    "tags": ["search", "performance", "user-experience"],
    "comment_count": 0,
    "created_at": "2025-08-21T15:30:00Z",
    "updated_at": "2025-08-21T15:30:00Z"
}
```

#### Retrieve Feature Request
```http
GET /api/feature-requests/{id}/
GET /api/projects/{project_id}/features/{id}/
```

**Response:** 200 OK
```json
{
    "id": 1,
    "title": "User Authentication System",
    "slug": "user-authentication-system",
    "project": {
        "id": 1,
        "name": "Track Feature Management",
        "slug": "track-feature-management",
        "domain": "web",
        "status": "active"
    },
    "description": "Implement comprehensive user authentication with email verification and password reset functionality",
    "acceptance_criteria": "- User registration with email verification\n- Login/logout functionality\n- Password reset via email\n- Remember me functionality\n- Account activation flow",
    "business_value": "Essential for user management, security, and personalized experience",
    "technical_notes": "Use Django's built-in authentication system with custom user model. Implement email verification using celery for async processing.",
    "feature_type": "feature",
    "priority": "high",
    "complexity": "complex",
    "status": "development",
    "requester": {
        "id": 1,
        "username": "product_manager",
        "email": "pm@example.com",
        "first_name": "John",
        "last_name": "Manager"
    },
    "assignee": {
        "id": 2,
        "username": "developer1",
        "email": "dev1@example.com",
        "first_name": "Jane",
        "last_name": "Developer"
    },
    "requested_date": "2025-08-15T09:00:00Z",
    "target_date": "2025-09-15",
    "completed_date": null,
    "estimated_hours": 40,
    "actual_hours": 28,
    "business_value_score": 9,
    "technical_risk_score": 6,
    "is_active": true,
    "is_blocked": false,
    "blocked_reason": "",
    "is_overdue": false,
    "days_until_target": 25,
    "duration_in_development": 6,
    "effort_variance": -30.0,
    "tags": ["authentication", "security", "user-management"],
    "status_history": [
        {
            "from_status": "specification",
            "to_status": "development",
            "changed_by": "tech_lead",
            "reason": "Technical requirements approved",
            "changed_at": "2025-08-20T10:00:00Z"
        }
    ],
    "comments": [
        {
            "id": 1,
            "author": "developer1",
            "content": "Working on email verification implementation",
            "is_internal": false,
            "created_at": "2025-08-20T14:00:00Z"
        }
    ],
    "created_at": "2025-08-15T09:00:00Z",
    "updated_at": "2025-08-21T14:30:00Z"
}
```

#### Update Feature Request
```http
PUT /api/feature-requests/{id}/
PATCH /api/feature-requests/{id}/
```

**Request Body (PATCH - partial update):**
```json
{
    "status": "testing",
    "assignee": 3,
    "actual_hours": 45,
    "technical_notes": "Implementation completed, moving to testing phase"
}
```

**Response:** 200 OK (same format as retrieve)

#### Delete Feature Request
```http
DELETE /api/feature-requests/{id}/
```

**Response:** 204 No Content

### Status Management

#### Update Feature Request Status
```http
PATCH /api/feature-requests/{id}/status/
```

**Request Body:**
```json
{
    "status": "testing",
    "reason": "Development completed, ready for QA testing"
}
```

**Response:** 200 OK
```json
{
    "id": 1,
    "status": "testing",
    "previous_status": "development",
    "changed_at": "2025-08-21T16:00:00Z",
    "changed_by": "developer1",
    "reason": "Development completed, ready for QA testing"
}
```

### Bulk Operations

#### Bulk Status Update
```http
PATCH /api/feature-requests/bulk-status/
```

**Request Body:**
```json
{
    "feature_request_ids": [1, 2, 3],
    "status": "specification",
    "reason": "Moving to specification phase for detailed requirements"
}
```

**Response:** 200 OK
```json
{
    "updated_count": 3,
    "updated_features": [1, 2, 3],
    "status": "specification"
}
```

#### Bulk Assignment
```http
PATCH /api/feature-requests/bulk-assign/
```

**Request Body:**
```json
{
    "feature_request_ids": [4, 5, 6],
    "assignee": 2
}
```

### Analytics and Reporting

#### Feature Request Statistics
```http
GET /api/feature-requests/stats/
GET /api/projects/{project_id}/features/stats/
```

**Response:** 200 OK
```json
{
    "total_features": 45,
    "by_status": {
        "idea": 12,
        "specification": 8,
        "development": 15,
        "testing": 7,
        "live": 3
    },
    "by_priority": {
        "low": 8,
        "medium": 20,
        "high": 12,
        "critical": 5
    },
    "by_complexity": {
        "simple": 15,
        "medium": 18,
        "complex": 10,
        "epic": 2
    },
    "by_type": {
        "feature": 30,
        "enhancement": 8,
        "bug_fix": 5,
        "technical": 2
    },
    "overdue_count": 3,
    "blocked_count": 1,
    "avg_completion_time_days": 12.5,
    "effort_accuracy": {
        "avg_variance_percent": -8.5,
        "features_with_estimates": 38
    }
}
```

#### Feature Request Timeline
```http
GET /api/feature-requests/timeline/
```

**Query Parameters:**
- `start_date` (date): Timeline start date
- `end_date` (date): Timeline end date
- `project` (integer): Filter by project

**Response:** 200 OK
```json
{
    "timeline": [
        {
            "date": "2025-08-21",
            "events": [
                {
                    "type": "status_change",
                    "feature_request": {
                        "id": 1,
                        "title": "User Authentication System"
                    },
                    "from_status": "development",
                    "to_status": "testing",
                    "changed_by": "developer1"
                }
            ]
        }
    ]
}
```

## Controllers

### FeatureRequestViewSet

```python
# views.py
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.utils import timezone
from .models import FeatureRequest, FeatureRequestStatusHistory
from .serializers import (
    FeatureRequestSerializer, 
    FeatureRequestDetailSerializer,
    FeatureRequestStatusUpdateSerializer
)
from .filters import FeatureRequestFilter
from .permissions import FeatureRequestPermission

class FeatureRequestViewSet(viewsets.ModelViewSet):
    serializer_class = FeatureRequestSerializer
    permission_classes = [IsAuthenticated, FeatureRequestPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = FeatureRequestFilter
    search_fields = ['title', 'description', 'acceptance_criteria', 'technical_notes']
    ordering_fields = ['title', 'created_at', 'updated_at', 'priority', 'target_date', 'status']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        user = self.request.user
        queryset = FeatureRequest.objects.select_related(
            'project', 'requester', 'assignee'
        ).prefetch_related('tags')
        
        # Filter based on project access
        if user.is_superuser:
            return queryset
        else:
            return queryset.filter(
                Q(project__owner=user) | 
                Q(project__team_members=user) | 
                Q(project__is_public=True) |
                Q(requester=user) |
                Q(assignee=user)
            ).distinct()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return FeatureRequestDetailSerializer
        return FeatureRequestSerializer
    
    def perform_create(self, serializer):
        serializer.save(requester=self.request.user)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        feature_request = self.get_object()
        serializer = FeatureRequestStatusUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            old_status = feature_request.status
            new_status = serializer.validated_data['status']
            reason = serializer.validated_data.get('reason', '')
            
            # Update status
            feature_request.status = new_status
            if new_status == 'live' and not feature_request.completed_date:
                feature_request.completed_date = timezone.now()
            
            feature_request.save()
            
            # Create status history
            FeatureRequestStatusHistory.objects.create(
                feature_request=feature_request,
                from_status=old_status,
                to_status=new_status,
                changed_by=request.user,
                reason=reason
            )
            
            return Response({
                'id': feature_request.id,
                'status': new_status,
                'previous_status': old_status,
                'changed_at': timezone.now(),
                'changed_by': request.user.username,
                'reason': reason
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['patch'])
    def bulk_status(self, request):
        feature_request_ids = request.data.get('feature_request_ids', [])
        new_status = request.data.get('status')
        reason = request.data.get('reason', '')
        
        if not feature_request_ids or not new_status:
            return Response(
                {'error': 'feature_request_ids and status are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get features user can modify
        queryset = self.get_queryset().filter(id__in=feature_request_ids)
        features = list(queryset)
        
        # Update status and create history entries
        for feature in features:
            old_status = feature.status
            feature.status = new_status
            if new_status == 'live' and not feature.completed_date:
                feature.completed_date = timezone.now()
            feature.save()
            
            FeatureRequestStatusHistory.objects.create(
                feature_request=feature,
                from_status=old_status,
                to_status=new_status,
                changed_by=request.user,
                reason=reason
            )
        
        return Response({
            'updated_count': len(features),
            'updated_features': [f.id for f in features],
            'status': new_status
        })
    
    @action(detail=False, methods=['patch'])
    def bulk_assign(self, request):
        feature_request_ids = request.data.get('feature_request_ids', [])
        assignee_id = request.data.get('assignee')
        
        if not feature_request_ids or assignee_id is None:
            return Response(
                {'error': 'feature_request_ids and assignee are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(id__in=feature_request_ids)
        updated_count = queryset.update(assignee_id=assignee_id)
        
        return Response({
            'updated_count': updated_count,
            'updated_features': list(queryset.values_list('id', flat=True)),
            'assignee': assignee_id
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        queryset = self.get_queryset()
        
        if 'project' in request.query_params:
            project_id = request.query_params['project']
            queryset = queryset.filter(project_id=project_id)
        
        # Calculate statistics
        total = queryset.count()
        
        stats = {
            'total_features': total,
            'by_status': dict(queryset.values_list('status').annotate(count=Count('id'))),
            'by_priority': dict(queryset.values_list('priority').annotate(count=Count('id'))),
            'by_complexity': dict(queryset.values_list('complexity').annotate(count=Count('id'))),
            'by_type': dict(queryset.values_list('feature_type').annotate(count=Count('id'))),
            'overdue_count': queryset.filter(
                target_date__lt=timezone.now().date(),
                status__in=['idea', 'specification', 'development', 'testing']
            ).count(),
            'blocked_count': queryset.filter(is_blocked=True).count(),
        }
        
        # Calculate completion metrics
        completed_features = queryset.filter(status='live', completed_date__isnull=False)
        if completed_features.exists():
            avg_completion_time = completed_features.aggregate(
                avg_time=Avg('completed_date') - Avg('requested_date')
            )
            stats['avg_completion_time_days'] = avg_completion_time['avg_time'].days if avg_completion_time['avg_time'] else 0
        
        # Calculate effort accuracy
        features_with_estimates = queryset.filter(
            estimated_hours__isnull=False,
            actual_hours__isnull=False
        )
        if features_with_estimates.exists():
            variances = []
            for feature in features_with_estimates:
                if feature.effort_variance is not None:
                    variances.append(feature.effort_variance)
            
            if variances:
                stats['effort_accuracy'] = {
                    'avg_variance_percent': sum(variances) / len(variances),
                    'features_with_estimates': len(variances)
                }
        
        return Response(stats)
    
    @action(detail=False, methods=['get'])
    def my_features(self, request):
        """Get features assigned to or requested by the current user"""
        features = self.get_queryset().filter(
            Q(assignee=request.user) | Q(requester=request.user)
        )
        serializer = self.get_serializer(features, many=True)
        return Response(serializer.data)
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

**Feature Request Specific Error Codes:**
- `INVALID_STATUS_TRANSITION` (400): Status change not allowed
- `PROJECT_ACCESS_DENIED` (403): No access to project
- `FEATURE_NOT_FOUND` (404): Feature request not found
- `DUPLICATE_SLUG` (409): Feature slug already exists in project
- `INVALID_TARGET_DATE` (400): Target date validation failed