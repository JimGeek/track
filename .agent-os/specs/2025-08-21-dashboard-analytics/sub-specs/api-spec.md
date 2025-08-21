# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-dashboard-analytics/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Dashboard Overview

#### GET /api/analytics/dashboard/
**Description**: Get comprehensive dashboard overview data
**Parameters**:
- `date_range`: Date range filter (last7days, last30days, last90days, custom)
- `start_date`: Start date for custom range (YYYY-MM-DD)
- `end_date`: End date for custom range (YYYY-MM-DD)
- `project_ids[]`: Filter by specific projects

**Response**:
```json
{
  "overview": {
    "total_projects": 15,
    "active_features": 45,
    "completed_features": 23,
    "overall_completion_rate": 67.5,
    "avg_velocity": 3.2,
    "at_risk_features": 5
  },
  "project_metrics": [
    {
      "project_id": 1,
      "project_title": "Mobile App",
      "completion_percentage": 75.0,
      "velocity": 2.5,
      "active_contributors": 4,
      "last_activity": "2025-08-20T15:30:00Z"
    }
  ],
  "recent_activity": [
    {
      "id": 123,
      "user": "john_doe",
      "action": "completed_feature",
      "feature_title": "User Authentication",
      "timestamp": "2025-08-20T14:25:00Z"
    }
  ]
}
```

#### GET /api/analytics/charts/velocity/
**Description**: Get velocity chart data for projects
**Parameters**:
- `project_ids[]`: Specific projects to include
- `period`: Aggregation period (daily, weekly, monthly)
- `weeks_back`: Number of weeks of historical data

**Response**:
```json
{
  "labels": ["Week 1", "Week 2", "Week 3", "Week 4"],
  "datasets": [
    {
      "project_id": 1,
      "project_name": "Mobile App",
      "data": [2, 3, 4, 2],
      "color": "#3498db"
    }
  ],
  "avg_velocity": 2.75,
  "trend": "increasing"
}
```

### Project Analytics

#### GET /api/analytics/projects/{project_id}/
**Description**: Get detailed analytics for specific project
**Response**:
```json
{
  "project_id": 1,
  "project_title": "Mobile App",
  "metrics": {
    "completion_rate": 75.0,
    "velocity": 2.5,
    "cycle_time_avg": 5.2,
    "active_contributors": 4,
    "total_features": 20,
    "completed_features": 15,
    "overdue_features": 2
  },
  "status_distribution": {
    "pending": 3,
    "in_progress": 2,
    "completed": 15
  },
  "priority_distribution": {
    "high": 5,
    "medium": 10,
    "low": 5
  },
  "timeline": [
    {
      "date": "2025-08-01",
      "completed_features": 12,
      "total_features": 18
    }
  ]
}
```

#### GET /api/analytics/projects/{project_id}/features/at-risk/
**Description**: Get features at risk of missing deadlines
**Response**:
```json
{
  "at_risk_features": [
    {
      "id": 45,
      "title": "Payment Integration",
      "deadline": "2025-08-25",
      "days_remaining": 4,
      "status": "in_progress",
      "progress_percentage": 30,
      "risk_level": "high",
      "assigned_to": "jane_smith"
    }
  ],
  "risk_summary": {
    "high_risk": 2,
    "medium_risk": 3,
    "low_risk": 1
  }
}
```

### Feature Analytics

#### GET /api/analytics/features/{feature_id}/
**Description**: Get detailed analytics for specific feature
**Response**:
```json
{
  "feature_id": 45,
  "title": "Payment Integration",
  "analytics": {
    "time_in_current_status": 7200, // seconds
    "total_status_changes": 5,
    "priority_changes": 2,
    "assignee_changes": 1,
    "comment_count": 12,
    "estimated_completion": "2025-08-30"
  },
  "status_history": [
    {
      "status": "pending",
      "entered_at": "2025-08-01T09:00:00Z",
      "duration_seconds": 86400
    },
    {
      "status": "in_progress",
      "entered_at": "2025-08-02T09:00:00Z",
      "duration_seconds": null // current status
    }
  ]
}
```

### User Analytics

#### GET /api/analytics/users/{user_id}/
**Description**: Get user productivity and contribution metrics
**Response**:
```json
{
  "user_id": 123,
  "username": "john_doe",
  "metrics": {
    "features_completed": 8,
    "avg_completion_time": 4.5, // days
    "current_workload": 3,
    "contribution_score": 87,
    "on_time_delivery_rate": 92.5
  },
  "activity_heatmap": [
    {
      "date": "2025-08-01",
      "activity_count": 15
    }
  ],
  "project_contributions": [
    {
      "project_id": 1,
      "project_title": "Mobile App",
      "features_assigned": 5,
      "features_completed": 3
    }
  ]
}
```

### Alerts & Notifications

#### GET /api/analytics/alerts/
**Description**: Get active alerts and notifications
**Parameters**:
- `severity`: Filter by severity (low, medium, high, critical)
- `acknowledged`: Filter by acknowledgment status

**Response**:
```json
{
  "alerts": [
    {
      "id": 789,
      "alert_type": "deadline_approaching",
      "entity_type": "feature",
      "entity_id": 45,
      "severity": "high",
      "message": "Feature 'Payment Integration' deadline in 2 days",
      "current_value": 2,
      "threshold_value": 3,
      "is_acknowledged": false,
      "created_at": "2025-08-21T08:00:00Z"
    }
  ],
  "summary": {
    "total_alerts": 5,
    "high_priority": 2,
    "unacknowledged": 3
  }
}
```

#### POST /api/analytics/alerts/{alert_id}/acknowledge/
**Description**: Acknowledge an alert
**Body**:
```json
{
  "notes": "Acknowledged - taking action on deadline"
}
```

### Dashboard Configuration

#### GET /api/analytics/dashboard/config/
**Description**: Get user's dashboard configuration
**Response**:
```json
{
  "layout": [
    {
      "i": "overview",
      "x": 0,
      "y": 0,
      "w": 12,
      "h": 4
    }
  ],
  "widgets": {
    "overview": {
      "type": "project_overview",
      "settings": {
        "show_progress": true,
        "show_velocity": true
      }
    }
  }
}
```

#### PUT /api/analytics/dashboard/config/
**Description**: Update dashboard configuration
**Body**:
```json
{
  "layout": [...],
  "widgets": {...}
}
```

## Controllers

### AnalyticsDashboardViewSet
```python
class AnalyticsDashboardViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get dashboard overview data"""
        date_range = self._parse_date_range(request.query_params)
        project_ids = request.query_params.getlist('project_ids[]')
        
        # Get overview metrics
        overview_data = AnalyticsService.get_overview_metrics(
            user=request.user,
            date_range=date_range,
            project_ids=project_ids
        )
        
        return Response(overview_data)
    
    @action(detail=False, methods=['get'], url_path='charts/velocity')
    def velocity_chart(self, request):
        """Get velocity chart data"""
        project_ids = request.query_params.getlist('project_ids[]')
        period = request.query_params.get('period', 'weekly')
        weeks_back = int(request.query_params.get('weeks_back', 12))
        
        chart_data = AnalyticsService.get_velocity_chart_data(
            user=request.user,
            project_ids=project_ids,
            period=period,
            weeks_back=weeks_back
        )
        
        return Response(chart_data)
```

### ProjectAnalyticsViewSet
```python
class ProjectAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, pk=None):
        """Get project analytics"""
        project = get_object_or_404(Project, pk=pk)
        
        # Check permissions
        if not project.has_view_permission(request.user):
            raise PermissionDenied()
        
        analytics_data = AnalyticsService.get_project_analytics(
            project=project,
            user=request.user
        )
        
        return Response(analytics_data)
    
    @action(detail=True, methods=['get'], url_path='features/at-risk')
    def at_risk_features(self, request, pk=None):
        """Get features at risk for project"""
        project = get_object_or_404(Project, pk=pk)
        
        at_risk_data = AnalyticsService.get_at_risk_features(
            project=project,
            user=request.user
        )
        
        return Response(at_risk_data)
```

### Analytics Service Layer
```python
class AnalyticsService:
    @staticmethod
    def get_overview_metrics(user, date_range=None, project_ids=None):
        """Calculate overview dashboard metrics"""
        # Get user's accessible projects
        projects = Project.objects.filter_for_user(user)
        if project_ids:
            projects = projects.filter(id__in=project_ids)
        
        # Calculate metrics
        total_projects = projects.count()
        
        features = FeatureRequest.objects.filter(project__in=projects)
        if date_range:
            features = features.filter(created_at__range=date_range)
        
        total_features = features.count()
        completed_features = features.filter(status='completed').count()
        completion_rate = (completed_features / total_features * 100) if total_features > 0 else 0
        
        # Calculate average velocity
        avg_velocity = AnalyticsService._calculate_average_velocity(projects, date_range)
        
        # Get at-risk features
        at_risk_count = AnalyticsService._count_at_risk_features(projects)
        
        return {
            'overview': {
                'total_projects': total_projects,
                'active_features': features.exclude(status='completed').count(),
                'completed_features': completed_features,
                'overall_completion_rate': round(completion_rate, 1),
                'avg_velocity': round(avg_velocity, 1),
                'at_risk_features': at_risk_count
            }
        }
    
    @staticmethod
    def _calculate_average_velocity(projects, date_range):
        """Calculate average velocity across projects"""
        # Implementation for velocity calculation
        pass
    
    @staticmethod
    def _count_at_risk_features(projects):
        """Count features at risk of missing deadlines"""
        today = timezone.now().date()
        return FeatureRequest.objects.filter(
            project__in=projects,
            deadline__isnull=False,
            deadline__lt=today + timedelta(days=7),
            status__in=['pending', 'in_progress']
        ).count()
```

### Real-time Updates
```python
# WebSocket consumer for real-time analytics
class AnalyticsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        await self.channel_layer.group_add(
            f"analytics_user_{self.user.id}",
            self.channel_name
        )
        await self.accept()
    
    async def analytics_update(self, event):
        """Send analytics update to client"""
        await self.send(text_data=json.dumps({
            'type': 'analytics_update',
            'data': event['data']
        }))
```