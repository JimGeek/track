# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-status-workflow-system/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Workflow Status Transitions

#### Trigger Status Transition
```http
POST /api/feature-requests/{id}/workflow/transition/
```

**Request Body:**
```json
{
    "transition": "start_development",
    "reason": "Technical specification approved and developer assigned",
    "approval_notes": "All requirements validated, ready to proceed"
}
```

**Response:** 200 OK
```json
{
    "id": 1,
    "previous_status": "specification",
    "current_status": "development",
    "transition": "start_development",
    "transitioned_at": "2025-08-21T16:30:00Z",
    "transitioned_by": {
        "id": 1,
        "username": "tech_lead",
        "first_name": "John",
        "last_name": "Lead"
    },
    "reason": "Technical specification approved and developer assigned",
    "validation_passed": true,
    "stage_duration": "2 days, 3:30:00",
    "workflow_progress": 60
}
```

**Error Response:** 400 Bad Request
```json
{
    "error": "Transition validation failed",
    "details": {
        "transition": "start_development",
        "validation_errors": [
            "Acceptance criteria required for development",
            "Developer assignment required for development"
        ]
    },
    "code": "WORKFLOW_VALIDATION_ERROR"
}
```

#### Get Available Transitions
```http
GET /api/feature-requests/{id}/workflow/transitions/
```

**Response:** 200 OK
```json
{
    "feature_request_id": 1,
    "current_status": "specification",
    "available_transitions": [
        {
            "transition": "start_development",
            "target_status": "development",
            "display_name": "Start Development",
            "description": "Move feature to development phase",
            "can_execute": true,
            "validation_requirements": [
                "Acceptance criteria must be completed",
                "Developer must be assigned",
                "Effort estimation required"
            ]
        },
        {
            "transition": "rollback_to_idea",
            "target_status": "idea",
            "display_name": "Rollback to Idea",
            "description": "Return to idea phase for revision",
            "can_execute": true,
            "validation_requirements": []
        }
    ]
}
```

#### Bulk Workflow Transitions
```http
POST /api/feature-requests/workflow/bulk-transition/
```

**Request Body:**
```json
{
    "feature_request_ids": [1, 2, 3],
    "transition": "start_testing",
    "reason": "Development completed for all features",
    "force_validation": false
}
```

**Response:** 200 OK
```json
{
    "successful_transitions": [
        {
            "feature_request_id": 1,
            "previous_status": "development",
            "new_status": "testing"
        },
        {
            "feature_request_id": 2,
            "previous_status": "development",
            "new_status": "testing"
        }
    ],
    "failed_transitions": [
        {
            "feature_request_id": 3,
            "error": "Development approval required for testing",
            "current_status": "development"
        }
    ],
    "success_count": 2,
    "failure_count": 1
}
```

### Workflow Analytics

#### Project Workflow Metrics
```http
GET /api/projects/{id}/workflow/metrics/
```

**Query Parameters:**
- `period_start` (date): Start date for metrics calculation
- `period_end` (date): End date for metrics calculation
- `granularity` (string): Time granularity (daily, weekly, monthly)

**Response:** 200 OK
```json
{
    "project_id": 1,
    "period": {
        "start": "2025-08-01",
        "end": "2025-08-21"
    },
    "stage_metrics": {
        "idea": {
            "avg_duration_days": 2.5,
            "min_duration_days": 0.5,
            "max_duration_days": 7.0,
            "current_count": 5,
            "completed_count": 15
        },
        "specification": {
            "avg_duration_days": 3.2,
            "min_duration_days": 1.0,
            "max_duration_days": 8.0,
            "current_count": 3,
            "completed_count": 12
        },
        "development": {
            "avg_duration_days": 8.7,
            "min_duration_days": 2.0,
            "max_duration_days": 21.0,
            "current_count": 7,
            "completed_count": 10
        },
        "testing": {
            "avg_duration_days": 4.1,
            "min_duration_days": 1.0,
            "max_duration_days": 10.0,
            "current_count": 2,
            "completed_count": 8
        },
        "live": {
            "avg_duration_days": 0,
            "completed_count": 8
        }
    },
    "throughput_metrics": {
        "features_completed": 8,
        "features_in_progress": 17,
        "completion_rate_per_week": 2.4,
        "avg_cycle_time_days": 18.5
    },
    "bottleneck_analysis": {
        "bottleneck_stage": "development",
        "bottleneck_duration_days": 8.7,
        "bottleneck_reason": "Longest average duration",
        "recommendations": [
            "Consider breaking down complex features",
            "Review developer workload distribution",
            "Implement pair programming for knowledge sharing"
        ]
    },
    "quality_metrics": {
        "rollback_count": 3,
        "rollback_percentage": 12.5,
        "rollback_by_stage": {
            "specification_to_idea": 1,
            "development_to_specification": 1,
            "testing_to_development": 1
        }
    }
}
```

#### Workflow Timeline
```http
GET /api/feature-requests/{id}/workflow/timeline/
```

**Response:** 200 OK
```json
{
    "feature_request_id": 1,
    "workflow_timeline": [
        {
            "stage": "idea",
            "started_at": "2025-08-15T09:00:00Z",
            "ended_at": "2025-08-17T14:30:00Z",
            "duration": "2 days, 5:30:00",
            "transitioned_by": null,
            "notes": "Initial feature concept"
        },
        {
            "stage": "specification",
            "started_at": "2025-08-17T14:30:00Z",
            "ended_at": "2025-08-20T10:00:00Z",
            "duration": "2 days, 19:30:00",
            "transitioned_by": {
                "username": "product_manager",
                "first_name": "John",
                "last_name": "Manager"
            },
            "transition_reason": "Requirements gathering complete",
            "notes": "Detailed specification with acceptance criteria"
        },
        {
            "stage": "development",
            "started_at": "2025-08-20T10:00:00Z",
            "ended_at": null,
            "duration": "1 day, 14:30:00",
            "is_current": true,
            "transitioned_by": {
                "username": "tech_lead",
                "first_name": "Jane",
                "last_name": "Lead"
            },
            "transition_reason": "Technical specification approved",
            "notes": "Implementation in progress"
        }
    ],
    "total_elapsed_time": "6 days, 15:30:00",
    "estimated_completion": "2025-08-25T12:00:00Z",
    "workflow_progress_percentage": 60
}
```

#### Workflow Health Dashboard
```http
GET /api/workflow/dashboard/
```

**Query Parameters:**
- `project_ids` (list): Filter by specific projects
- `time_range` (string): Time range (7d, 30d, 90d, 1y)

**Response:** 200 OK
```json
{
    "summary": {
        "total_active_features": 45,
        "avg_cycle_time_days": 16.8,
        "completion_rate_trend": "increasing",
        "bottleneck_alert": true,
        "bottleneck_stage": "development"
    },
    "stage_distribution": {
        "idea": {
            "count": 12,
            "percentage": 26.7,
            "trend": "stable"
        },
        "specification": {
            "count": 8,
            "percentage": 17.8,
            "trend": "decreasing"
        },
        "development": {
            "count": 15,
            "percentage": 33.3,
            "trend": "increasing",
            "alert": "bottleneck_detected"
        },
        "testing": {
            "count": 7,
            "percentage": 15.6,
            "trend": "stable"
        },
        "live": {
            "count": 3,
            "percentage": 6.7,
            "trend": "increasing"
        }
    },
    "performance_indicators": {
        "velocity": {
            "current_week": 3.2,
            "previous_week": 2.8,
            "trend": "improving"
        },
        "cycle_time": {
            "current_avg": 16.8,
            "target_avg": 14.0,
            "trend": "above_target"
        },
        "throughput": {
            "features_per_week": 2.4,
            "target_per_week": 3.0,
            "trend": "below_target"
        }
    },
    "recent_completions": [
        {
            "feature_request_id": 8,
            "title": "User Profile Settings",
            "completed_at": "2025-08-21T15:00:00Z",
            "cycle_time_days": 12.5
        }
    ]
}
```

### Workflow Approvals

#### Request Approval
```http
POST /api/feature-requests/{id}/workflow/request-approval/
```

**Request Body:**
```json
{
    "approval_type": "development",
    "notes": "Implementation completed, ready for testing approval",
    "approver_id": 3
}
```

**Response:** 201 Created
```json
{
    "approval_id": 1,
    "feature_request_id": 1,
    "approval_type": "development",
    "requested_by": "developer1",
    "requested_at": "2025-08-21T17:00:00Z",
    "approver": {
        "id": 3,
        "username": "tech_lead",
        "first_name": "Jane",
        "last_name": "Lead"
    },
    "status": "pending",
    "notes": "Implementation completed, ready for testing approval"
}
```

#### Grant Approval
```http
POST /api/feature-requests/{id}/workflow/approve/
```

**Request Body:**
```json
{
    "approval_type": "development",
    "decision": "approved",
    "notes": "Code review passed, implementation meets requirements"
}
```

**Response:** 200 OK
```json
{
    "feature_request_id": 1,
    "approval_type": "development",
    "approved_by": {
        "id": 3,
        "username": "tech_lead",
        "first_name": "Jane",
        "last_name": "Lead"
    },
    "approved_at": "2025-08-21T17:30:00Z",
    "decision": "approved",
    "notes": "Code review passed, implementation meets requirements",
    "can_transition_to_next_stage": true,
    "next_available_transitions": ["start_testing"]
}
```

### Workflow Configuration

#### Get Workflow Rules
```http
GET /api/projects/{id}/workflow/rules/
```

**Response:** 200 OK
```json
{
    "project_id": 1,
    "workflow_rules": {
        "transitions": {
            "idea_to_specification": {
                "required_fields": ["description", "business_value"],
                "min_description_length": 50,
                "approval_required": false,
                "auto_assign": false
            },
            "specification_to_development": {
                "required_fields": ["acceptance_criteria", "assignee", "estimated_hours"],
                "approval_required": true,
                "approver_roles": ["tech_lead", "project_manager"],
                "auto_assign": false
            },
            "development_to_testing": {
                "required_fields": ["technical_notes"],
                "approval_required": true,
                "approver_roles": ["tech_lead"],
                "auto_assign": false
            },
            "testing_to_live": {
                "required_fields": [],
                "approval_required": true,
                "approver_roles": ["tech_lead", "project_manager"],
                "auto_assign": false,
                "additional_checks": ["not_blocked"]
            }
        },
        "stage_requirements": {
            "idea": {
                "required_fields": ["title", "description"],
                "optional_fields": ["business_value"]
            },
            "specification": {
                "required_fields": ["acceptance_criteria", "business_value"],
                "optional_fields": ["technical_notes"]
            },
            "development": {
                "required_fields": ["assignee", "estimated_hours"],
                "optional_fields": ["actual_hours"]
            },
            "testing": {
                "required_fields": ["technical_notes"],
                "optional_fields": []
            },
            "live": {
                "required_fields": [],
                "optional_fields": []
            }
        }
    }
}
```

## Controllers

### WorkflowViewSet

```python
# workflow_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import FeatureRequest, WorkflowMetrics
from .serializers import WorkflowTransitionSerializer, WorkflowTimelineSerializer
from .services import WorkflowAnalyticsService, WorkflowValidationService

class WorkflowViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=True, methods=['post'], url_path='transition')
    def trigger_transition(self, request, pk=None):
        """Execute a workflow transition"""
        try:
            feature_request = FeatureRequest.objects.get(pk=pk)
            self.check_object_permissions(request, feature_request)
            
            transition_name = request.data.get('transition')
            reason = request.data.get('reason', '')
            
            # Get transition method
            transition_method = getattr(feature_request, transition_name, None)
            if not transition_method:
                return Response(
                    {'error': f'Invalid transition: {transition_name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            previous_status = feature_request.status
            
            # Execute transition with validation
            try:
                transition_method(by=request.user)
                feature_request.save()
                
                return Response({
                    'id': feature_request.id,
                    'previous_status': previous_status,
                    'current_status': feature_request.status,
                    'transition': transition_name,
                    'transitioned_at': timezone.now(),
                    'transitioned_by': {
                        'id': request.user.id,
                        'username': request.user.username,
                        'first_name': request.user.first_name,
                        'last_name': request.user.last_name
                    },
                    'reason': reason,
                    'validation_passed': True,
                    'stage_duration': str(feature_request.current_stage_duration),
                    'workflow_progress': feature_request.workflow_progress_percentage
                })
                
            except Exception as e:
                return Response(
                    {
                        'error': 'Transition validation failed',
                        'details': {
                            'transition': transition_name,
                            'validation_errors': [str(e)]
                        },
                        'code': 'WORKFLOW_VALIDATION_ERROR'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except FeatureRequest.DoesNotExist:
            return Response(
                {'error': 'Feature request not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'], url_path='transitions')
    def available_transitions(self, request, pk=None):
        """Get available workflow transitions"""
        try:
            feature_request = FeatureRequest.objects.get(pk=pk)
            transitions = feature_request.get_available_transitions(user=request.user)
            
            transition_data = []
            for transition_method, display_name in transitions:
                # Get validation requirements for each transition
                requirements = WorkflowValidationService.get_transition_requirements(
                    feature_request, transition_method
                )
                
                transition_data.append({
                    'transition': transition_method,
                    'target_status': WorkflowValidationService.get_target_status(transition_method),
                    'display_name': display_name,
                    'description': WorkflowValidationService.get_transition_description(transition_method),
                    'can_execute': WorkflowValidationService.can_execute_transition(
                        feature_request, transition_method, request.user
                    ),
                    'validation_requirements': requirements
                })
            
            return Response({
                'feature_request_id': feature_request.id,
                'current_status': feature_request.status,
                'available_transitions': transition_data
            })
            
        except FeatureRequest.DoesNotExist:
            return Response(
                {'error': 'Feature request not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'], url_path='timeline')
    def workflow_timeline(self, request, pk=None):
        """Get workflow timeline for a feature request"""
        try:
            feature_request = FeatureRequest.objects.get(pk=pk)
            timeline_data = WorkflowAnalyticsService.generate_timeline(feature_request)
            
            return Response({
                'feature_request_id': feature_request.id,
                'workflow_timeline': timeline_data,
                'total_elapsed_time': str(
                    timezone.now() - (feature_request.idea_started_at or feature_request.created_at)
                ),
                'workflow_progress_percentage': feature_request.workflow_progress_percentage
            })
            
        except FeatureRequest.DoesNotExist:
            return Response(
                {'error': 'Feature request not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'], url_path='dashboard')
    def workflow_dashboard(self, request):
        """Get workflow health dashboard data"""
        project_ids = request.query_params.getlist('project_ids[]')
        time_range = request.query_params.get('time_range', '30d')
        
        dashboard_data = WorkflowAnalyticsService.generate_dashboard(
            user=request.user,
            project_ids=project_ids,
            time_range=time_range
        )
        
        return Response(dashboard_data)
    
    @action(detail=False, methods=['post'], url_path='bulk-transition')
    def bulk_transition(self, request):
        """Execute bulk workflow transitions"""
        feature_request_ids = request.data.get('feature_request_ids', [])
        transition = request.data.get('transition')
        reason = request.data.get('reason', '')
        force_validation = request.data.get('force_validation', False)
        
        if not feature_request_ids or not transition:
            return Response(
                {'error': 'feature_request_ids and transition are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        successful_transitions = []
        failed_transitions = []
        
        for feature_id in feature_request_ids:
            try:
                feature_request = FeatureRequest.objects.get(pk=feature_id)
                transition_method = getattr(feature_request, transition, None)
                
                if transition_method:
                    previous_status = feature_request.status
                    transition_method(by=request.user)
                    feature_request.save()
                    
                    successful_transitions.append({
                        'feature_request_id': feature_id,
                        'previous_status': previous_status,
                        'new_status': feature_request.status
                    })
                else:
                    failed_transitions.append({
                        'feature_request_id': feature_id,
                        'error': f'Invalid transition: {transition}',
                        'current_status': feature_request.status
                    })
                    
            except Exception as e:
                failed_transitions.append({
                    'feature_request_id': feature_id,
                    'error': str(e),
                    'current_status': getattr(feature_request, 'status', 'unknown')
                })
        
        return Response({
            'successful_transitions': successful_transitions,
            'failed_transitions': failed_transitions,
            'success_count': len(successful_transitions),
            'failure_count': len(failed_transitions)
        })


# services.py
class WorkflowAnalyticsService:
    @staticmethod
    def generate_dashboard(user, project_ids=None, time_range='30d'):
        """Generate workflow dashboard data"""
        # Implementation for dashboard analytics
        pass
    
    @staticmethod
    def generate_timeline(feature_request):
        """Generate workflow timeline for feature request"""
        # Implementation for timeline generation
        pass

class WorkflowValidationService:
    @staticmethod
    def get_transition_requirements(feature_request, transition_method):
        """Get validation requirements for transition"""
        # Implementation for validation requirements
        pass
    
    @staticmethod
    def can_execute_transition(feature_request, transition_method, user):
        """Check if user can execute transition"""
        # Implementation for permission checking
        pass
```

### Error Handling

**Workflow-Specific Error Codes:**
- `WORKFLOW_VALIDATION_ERROR` (400): Transition validation failed
- `INVALID_TRANSITION` (400): Requested transition not available
- `APPROVAL_REQUIRED` (403): Approval needed before transition
- `INSUFFICIENT_PERMISSIONS` (403): User cannot execute transition
- `WORKFLOW_STATE_CONFLICT` (409): Concurrent modification detected