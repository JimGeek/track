# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-21-visual-timeline-chart-system/spec.md

> Created: 2025-08-21
> Version: 1.0.0

## Endpoints

### Timeline Data

#### GET /api/timeline/projects/{project_id}/
**Description**: Get timeline data for a specific project
**Parameters**:
- `start_date`: Start date for timeline view (YYYY-MM-DD)
- `end_date`: End date for timeline view (YYYY-MM-DD)
- `include_dependencies`: Include dependency relationships (default: true)
- `include_conflicts`: Include conflict information (default: true)
- `zoom_level`: Timeline zoom level (day, week, month, quarter)

**Response**:
```json
{
  "project": {
    "id": 1,
    "title": "Mobile App Development",
    "start_date": "2025-08-01T00:00:00Z",
    "end_date": "2025-12-31T23:59:59Z"
  },
  "timeline_items": [
    {
      "id": 101,
      "title": "User Authentication",
      "item_type": "feature",
      "start_date": "2025-08-15T09:00:00Z",
      "end_date": "2025-09-01T17:00:00Z",
      "duration_days": 12,
      "progress_percentage": 45.5,
      "color_code": "#3498db",
      "row_position": 0,
      "is_milestone": false,
      "is_critical_path": true,
      "assigned_users": [
        {
          "id": 5,
          "username": "john_doe",
          "allocation_percentage": 75.0
        }
      ]
    }
  ],
  "dependencies": [
    {
      "id": 201,
      "predecessor_id": 101,
      "successor_id": 102,
      "dependency_type": "finish_to_start",
      "lag_days": 2,
      "is_critical": true
    }
  ],
  "conflicts": [
    {
      "id": 301,
      "conflict_type": "overlap",
      "severity": "high",
      "primary_item_id": 101,
      "secondary_item_id": 103,
      "description": "Resource conflict: john_doe assigned to overlapping tasks",
      "suggested_resolution": "Adjust task scheduling or reassign resources"
    }
  ]
}
```

#### GET /api/timeline/multi-project/
**Description**: Get timeline data across multiple projects
**Parameters**:
- `project_ids[]`: Array of project IDs to include
- `start_date`: Start date for timeline view
- `end_date`: End date for timeline view
- `group_by`: Grouping method (project, user, milestone)

**Response**:
```json
{
  "projects": [
    {
      "id": 1,
      "title": "Mobile App",
      "color_code": "#3498db",
      "timeline_items": [...]
    },
    {
      "id": 2,
      "title": "Web Portal",
      "color_code": "#e74c3c",
      "timeline_items": [...]
    }
  ],
  "cross_project_conflicts": [
    {
      "conflict_type": "resource",
      "affected_projects": [1, 2],
      "shared_resources": ["john_doe", "jane_smith"],
      "description": "Resource overallocation across projects"
    }
  ]
}
```

### Timeline Item Management

#### POST /api/timeline/items/
**Description**: Create new timeline item
**Body**:
```json
{
  "title": "API Development",
  "description": "Develop REST API endpoints",
  "item_type": "feature",
  "start_date": "2025-09-01T09:00:00Z",
  "end_date": "2025-09-15T17:00:00Z",
  "project_id": 1,
  "feature_request_id": 45,
  "color_code": "#2ecc71",
  "assigned_users": [
    {
      "user_id": 5,
      "allocation_percentage": 100.0,
      "role": "developer"
    }
  ]
}
```

#### PUT /api/timeline/items/{item_id}/
**Description**: Update timeline item
**Body**:
```json
{
  "start_date": "2025-09-02T09:00:00Z",
  "end_date": "2025-09-16T17:00:00Z",
  "progress_percentage": 75.0
}
```

#### POST /api/timeline/items/{item_id}/move/
**Description**: Move timeline item with conflict checking
**Body**:
```json
{
  "new_start_date": "2025-09-05T09:00:00Z",
  "new_end_date": "2025-09-20T17:00:00Z",
  "check_conflicts": true,
  "auto_resolve_conflicts": false
}
```

**Response**:
```json
{
  "success": true,
  "item": {...},
  "conflicts_detected": [
    {
      "conflict_type": "resource",
      "severity": "medium",
      "description": "Potential resource conflict with item #105",
      "suggested_actions": ["adjust_schedule", "reassign_resource"]
    }
  ],
  "auto_resolved": []
}
```

### Dependency Management

#### POST /api/timeline/dependencies/
**Description**: Create dependency between timeline items
**Body**:
```json
{
  "predecessor_id": 101,
  "successor_id": 102,
  "dependency_type": "finish_to_start",
  "lag_days": 1
}
```

#### GET /api/timeline/items/{item_id}/dependencies/
**Description**: Get all dependencies for a timeline item
**Response**:
```json
{
  "predecessors": [
    {
      "id": 201,
      "predecessor": {
        "id": 100,
        "title": "Database Setup",
        "end_date": "2025-08-30T17:00:00Z"
      },
      "dependency_type": "finish_to_start",
      "lag_days": 2
    }
  ],
  "successors": [
    {
      "id": 202,
      "successor": {
        "id": 102,
        "title": "Frontend Integration",
        "start_date": "2025-09-15T09:00:00Z"
      },
      "dependency_type": "finish_to_start",
      "lag_days": 0
    }
  ]
}
```

#### DELETE /api/timeline/dependencies/{dependency_id}/
**Description**: Remove dependency relationship

### Conflict Detection & Resolution

#### GET /api/timeline/conflicts/
**Description**: Get all timeline conflicts
**Parameters**:
- `severity`: Filter by severity level
- `conflict_type`: Filter by conflict type
- `resolved`: Filter by resolution status
- `project_ids[]`: Filter by project IDs

**Response**:
```json
{
  "conflicts": [
    {
      "id": 301,
      "conflict_type": "overlap",
      "severity": "high",
      "primary_item": {
        "id": 101,
        "title": "User Authentication",
        "project_title": "Mobile App"
      },
      "secondary_item": {
        "id": 103,
        "title": "Payment Processing",
        "project_title": "Mobile App"
      },
      "description": "Timeline overlap with shared resource allocation",
      "suggested_resolution": "Delay Payment Processing by 3 days or reassign developer",
      "impact_assessment": "Critical path delay of 2 days if not resolved",
      "detected_at": "2025-08-21T10:30:00Z",
      "is_resolved": false
    }
  ],
  "summary": {
    "total_conflicts": 5,
    "by_severity": {
      "critical": 1,
      "high": 2,
      "medium": 2,
      "low": 0
    },
    "by_type": {
      "overlap": 3,
      "resource": 1,
      "dependency": 1
    }
  }
}
```

#### POST /api/timeline/conflicts/{conflict_id}/resolve/
**Description**: Resolve a timeline conflict
**Body**:
```json
{
  "resolution_type": "reschedule",
  "resolution_notes": "Delayed Payment Processing by 3 days to resolve resource conflict",
  "applied_changes": [
    {
      "item_id": 103,
      "field": "start_date",
      "old_value": "2025-09-01T09:00:00Z",
      "new_value": "2025-09-04T09:00:00Z"
    }
  ]
}
```

#### POST /api/timeline/conflicts/auto-resolve/
**Description**: Auto-resolve conflicts where possible
**Body**:
```json
{
  "conflict_ids": [301, 302, 303],
  "resolution_preferences": {
    "prefer_delay_over_reassign": true,
    "max_delay_days": 5,
    "respect_dependencies": true
  }
}
```

### Timeline Views & Export

#### GET /api/timeline/views/
**Description**: Get user's saved timeline views
**Response**:
```json
{
  "views": [
    {
      "id": 401,
      "name": "Project Overview",
      "description": "High-level view of all projects",
      "is_default": true,
      "view_config": {
        "zoom_level": "month",
        "show_dependencies": false,
        "show_progress": true,
        "group_by": "project"
      },
      "filter_config": {
        "project_ids": [1, 2, 3],
        "date_range_type": "current_quarter"
      }
    }
  ]
}
```

#### POST /api/timeline/views/
**Description**: Save new timeline view
**Body**:
```json
{
  "name": "Development Focus",
  "description": "Detailed view for development team",
  "view_config": {
    "zoom_level": "week",
    "show_dependencies": true,
    "show_conflicts": true,
    "row_height": 50
  },
  "filter_config": {
    "project_ids": [1],
    "item_types": ["feature", "task"],
    "assigned_to_me": true
  }
}
```

#### GET /api/timeline/export/
**Description**: Export timeline chart
**Parameters**:
- `format`: Export format (pdf, png, svg, excel)
- `view_id`: Saved view to export (optional)
- `start_date`: Date range start
- `end_date`: Date range end
- `project_ids[]`: Projects to include

**Response**: Binary file download

### Real-time Updates

#### WebSocket: /ws/timeline/{project_id}/
**Description**: Real-time timeline updates
**Messages**:

**Client -> Server**:
```json
{
  "type": "join_project",
  "project_id": 1
}
```

**Server -> Client**:
```json
{
  "type": "item_moved",
  "item_id": 101,
  "new_start_date": "2025-09-02T09:00:00Z",
  "new_end_date": "2025-09-16T17:00:00Z",
  "moved_by": "john_doe",
  "timestamp": "2025-08-21T14:30:00Z"
}
```

```json
{
  "type": "conflict_detected",
  "conflict": {
    "id": 305,
    "conflict_type": "resource",
    "severity": "medium",
    "affected_items": [101, 104]
  }
}
```

## Controllers

### TimelineViewSet
```python
class TimelineViewSet(viewsets.ModelViewSet):
    queryset = TimelineItem.objects.all()
    serializer_class = TimelineItemSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def project_timeline(self, request, project_id=None):
        """Get timeline data for specific project"""
        project = get_object_or_404(Project, id=project_id)
        
        # Check permissions
        if not project.has_view_permission(request.user):
            raise PermissionDenied()
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        include_dependencies = request.query_params.get('include_dependencies', 'true').lower() == 'true'
        include_conflicts = request.query_params.get('include_conflicts', 'true').lower() == 'true'
        
        timeline_data = TimelineService.get_project_timeline(
            project=project,
            start_date=start_date,
            end_date=end_date,
            include_dependencies=include_dependencies,
            include_conflicts=include_conflicts
        )
        
        return Response(timeline_data)
    
    @action(detail=False, methods=['get'])
    def multi_project(self, request):
        """Get timeline data across multiple projects"""
        project_ids = request.query_params.getlist('project_ids[]')
        
        # Filter to projects user has access to
        projects = Project.objects.filter_for_user(request.user)
        if project_ids:
            projects = projects.filter(id__in=project_ids)
        
        timeline_data = TimelineService.get_multi_project_timeline(
            projects=projects,
            user=request.user,
            **request.query_params.dict()
        )
        
        return Response(timeline_data)
    
    @action(detail=True, methods=['post'])
    def move_item(self, request, pk=None):
        """Move timeline item with conflict checking"""
        item = self.get_object()
        
        new_start = request.data.get('new_start_date')
        new_end = request.data.get('new_end_date')
        check_conflicts = request.data.get('check_conflicts', True)
        auto_resolve = request.data.get('auto_resolve_conflicts', False)
        
        result = TimelineService.move_item(
            item=item,
            new_start=new_start,
            new_end=new_end,
            check_conflicts=check_conflicts,
            auto_resolve=auto_resolve,
            user=request.user
        )
        
        return Response(result)
```

### ConflictManagementViewSet
```python
class ConflictManagementViewSet(viewsets.ModelViewSet):
    queryset = TimelineConflict.objects.all()
    serializer_class = TimelineConflictSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter conflicts by user's project access"""
        accessible_projects = Project.objects.filter_for_user(self.request.user)
        return super().get_queryset().filter(
            primary_item__project__in=accessible_projects
        )
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Resolve a timeline conflict"""
        conflict = self.get_object()
        
        resolution_type = request.data.get('resolution_type')
        resolution_notes = request.data.get('resolution_notes', '')
        applied_changes = request.data.get('applied_changes', [])
        
        result = ConflictResolutionService.resolve_conflict(
            conflict=conflict,
            resolution_type=resolution_type,
            resolution_notes=resolution_notes,
            applied_changes=applied_changes,
            resolved_by=request.user
        )
        
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def auto_resolve(self, request):
        """Auto-resolve multiple conflicts"""
        conflict_ids = request.data.get('conflict_ids', [])
        preferences = request.data.get('resolution_preferences', {})
        
        conflicts = self.get_queryset().filter(id__in=conflict_ids, is_resolved=False)
        
        results = []
        for conflict in conflicts:
            result = ConflictResolutionService.auto_resolve_conflict(
                conflict=conflict,
                preferences=preferences,
                user=request.user
            )
            results.append(result)
        
        return Response({
            'resolved_count': len([r for r in results if r['success']]),
            'failed_count': len([r for r in results if not r['success']]),
            'results': results
        })
```

### Timeline Service Layer
```python
class TimelineService:
    @staticmethod
    def get_project_timeline(project, start_date=None, end_date=None, **options):
        """Get comprehensive timeline data for a project"""
        # Get timeline items
        items_query = project.timeline_items.all()
        
        if start_date and end_date:
            items_query = items_query.filter(
                models.Q(start_date__lte=end_date, end_date__gte=start_date)
            )
        
        items = list(items_query.select_related('feature_request', 'created_by')
                              .prefetch_related('assignments__user', 'predecessor_dependencies', 'successor_dependencies'))
        
        # Get dependencies if requested
        dependencies = []
        if options.get('include_dependencies', True):
            dependencies = TimelineItemDependency.objects.filter(
                models.Q(predecessor__in=items) | models.Q(successor__in=items)
            ).select_related('predecessor', 'successor')
        
        # Get conflicts if requested
        conflicts = []
        if options.get('include_conflicts', True):
            conflicts = TimelineConflict.objects.filter(
                primary_item__in=items,
                is_resolved=False
            ).select_related('primary_item', 'secondary_item')
        
        return {
            'project': {
                'id': project.id,
                'title': project.title,
                'start_date': project.start_date,
                'end_date': project.end_date,
            },
            'timeline_items': TimelineItemSerializer(items, many=True).data,
            'dependencies': TimelineItemDependencySerializer(dependencies, many=True).data,
            'conflicts': TimelineConflictSerializer(conflicts, many=True).data,
        }
    
    @staticmethod
    def move_item(item, new_start, new_end, check_conflicts=True, auto_resolve=False, user=None):
        """Move timeline item with conflict detection"""
        old_start = item.start_date
        old_end = item.end_date
        
        # Validate new dates
        if new_start >= new_end:
            raise ValidationError("Start date must be before end date")
        
        # Update item temporarily to check conflicts
        item.start_date = new_start
        item.end_date = new_end
        
        conflicts_detected = []
        if check_conflicts:
            conflicts_detected = ConflictDetectionService.detect_item_conflicts(item)
        
        if conflicts_detected and not auto_resolve:
            # Revert changes and return conflicts
            item.start_date = old_start
            item.end_date = old_end
            return {
                'success': False,
                'conflicts_detected': conflicts_detected,
                'message': 'Conflicts detected. Review and resolve before moving.'
            }
        
        # Apply changes
        item.save()
        
        # Auto-resolve conflicts if requested
        auto_resolved = []
        if auto_resolve and conflicts_detected:
            for conflict_data in conflicts_detected:
                resolution_result = ConflictResolutionService.auto_resolve_simple_conflict(
                    conflict_data, user
                )
                if resolution_result['success']:
                    auto_resolved.append(resolution_result)
        
        return {
            'success': True,
            'item': TimelineItemSerializer(item).data,
            'conflicts_detected': conflicts_detected,
            'auto_resolved': auto_resolved
        }
```

### Real-time WebSocket Consumer
```python
class TimelineConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.project_group_name = f'timeline_project_{self.project_id}'
        
        # Check permissions
        project = await database_sync_to_async(Project.objects.get)(id=self.project_id)
        user = self.scope["user"]
        
        if not await database_sync_to_async(project.has_view_permission)(user):
            await self.close()
            return
        
        await self.channel_layer.group_add(
            self.project_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.project_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        
        if message_type == 'join_project':
            # Handle project join
            pass
        elif message_type == 'item_update':
            # Broadcast item update to other clients
            await self.channel_layer.group_send(
                self.project_group_name,
                {
                    'type': 'timeline_update',
                    'data': data
                }
            )
    
    async def timeline_update(self, event):
        """Send timeline update to client"""
        await self.send(text_data=json.dumps(event['data']))
```