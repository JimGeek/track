# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-26-django-react-trackflow-transformation/spec.md

> Created: 2025-08-26
> Version: 1.0.0

## Authentication
All endpoints require JWT authentication via `Authorization: Bearer <token>` header, using the existing Django REST Framework authentication system.

## Base URL
- **Development**: `http://localhost:8000/api/v1/`
- **Production**: `https://track-api.marvelhomes.pro/api/v1/`

## Endpoints

### TodoList Management

#### GET /todo-lists/
**Purpose:** Retrieve all todo lists for authenticated user
**Parameters:** 
- `search` (optional): Search todo lists by name
- `ordering` (optional): Order by created_at, updated_at, name
**Response:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "Work Projects",
      "description": "Tasks related to work",
      "color": "#3B82F6",
      "task_count": 15,
      "completed_count": 8,
      "created_at": "2025-08-26T10:00:00Z",
      "updated_at": "2025-08-26T10:00:00Z"
    }
  ]
}
```
**Errors:** 401 Unauthorized

#### POST /todo-lists/
**Purpose:** Create new todo list
**Parameters:**
```json
{
  "name": "Personal Tasks",
  "description": "My personal todo items",
  "color": "#10B981"
}
```
**Response:** 201 Created with todo list object
**Errors:** 400 Bad Request (validation), 401 Unauthorized

#### GET /todo-lists/{id}/
**Purpose:** Retrieve specific todo list with task summary
**Response:** Todo list object with task statistics
**Errors:** 401 Unauthorized, 404 Not Found

#### PUT /todo-lists/{id}/
**Purpose:** Update todo list details
**Parameters:** Same as POST, all fields optional
**Response:** 200 OK with updated object
**Errors:** 400 Bad Request, 401 Unauthorized, 404 Not Found

#### DELETE /todo-lists/{id}/
**Purpose:** Delete todo list and all associated tasks
**Response:** 204 No Content
**Errors:** 401 Unauthorized, 404 Not Found

### Task Management

#### GET /todo-lists/{list_id}/tasks/
**Purpose:** Retrieve tasks for specific todo list
**Parameters:**
- `status` (optional): Filter by todo, ongoing, done
- `priority` (optional): Filter by low, medium, high, urgent
- `due_date_gte` (optional): Tasks due after date (YYYY-MM-DD)
- `due_date_lte` (optional): Tasks due before date (YYYY-MM-DD)
- `search` (optional): Search in title and description
- `ordering` (optional): Order by created_at, end_date, priority, status
**Response:**
```json
{
  "count": 25,
  "results": [
    {
      "id": "uuid",
      "title": "Complete API documentation",
      "description": "Write comprehensive API docs",
      "priority": "high",
      "status": "ongoing",
      "start_date": "2025-08-26",
      "end_date": "2025-08-30",
      "todo_list": "uuid",
      "completed_at": null,
      "created_at": "2025-08-26T10:00:00Z",
      "updated_at": "2025-08-26T10:00:00Z"
    }
  ]
}
```

#### POST /todo-lists/{list_id}/tasks/
**Purpose:** Create new task in todo list
**Parameters:**
```json
{
  "title": "Review pull request",
  "description": "Review and merge PR #123",
  "priority": "medium",
  "status": "todo",
  "start_date": "2025-08-27",
  "end_date": "2025-08-28"
}
```
**Response:** 201 Created with task object
**Errors:** 400 Bad Request, 401 Unauthorized, 404 Not Found (todo list)

#### GET /tasks/{id}/
**Purpose:** Retrieve specific task details
**Response:** Task object with full details
**Errors:** 401 Unauthorized, 404 Not Found

#### PUT /tasks/{id}/
**Purpose:** Update task (full update)
**Parameters:** Same as POST, all fields optional
**Response:** 200 OK with updated task
**Errors:** 400 Bad Request, 401 Unauthorized, 404 Not Found

#### PATCH /tasks/{id}/
**Purpose:** Partial task update (e.g., status change)
**Parameters:** Any subset of task fields
**Response:** 200 OK with updated task
**Errors:** 400 Bad Request, 401 Unauthorized, 404 Not Found

#### DELETE /tasks/{id}/
**Purpose:** Delete specific task
**Response:** 204 No Content
**Errors:** 401 Unauthorized, 404 Not Found

### Dashboard Analytics

#### GET /dashboard/overview/
**Purpose:** Get dashboard overview with task statistics
**Response:**
```json
{
  "total_tasks": 150,
  "completed_tasks": 85,
  "overdue_tasks": 12,
  "due_today": 8,
  "due_tomorrow": 15,
  "due_this_week": 32,
  "due_this_month": 67,
  "recent_activity": [
    {
      "id": "uuid",
      "type": "task_completed",
      "task_title": "Fix login bug",
      "todo_list_name": "Bug Fixes",
      "timestamp": "2025-08-26T09:30:00Z"
    }
  ]
}
```
**Errors:** 401 Unauthorized

#### GET /dashboard/tasks-due/
**Purpose:** Get tasks due in specific timeframes
**Parameters:**
- `timeframe`: today, tomorrow, week, month
- `status` (optional): Filter by status
**Response:** Paginated list of tasks with todo list information
**Errors:** 401 Unauthorized

#### GET /dashboard/productivity-stats/
**Purpose:** Get productivity statistics for charts
**Parameters:**
- `period` (optional): 7d, 30d, 90d (default: 30d)
**Response:**
```json
{
  "completed_by_day": [
    {"date": "2025-08-26", "count": 5},
    {"date": "2025-08-25", "count": 3}
  ],
  "completion_rate": 0.75,
  "average_completion_time": 2.5,
  "priority_distribution": {
    "urgent": 10,
    "high": 25,
    "medium": 40,
    "low": 15
  }
}
```

## Controllers

### TodoListViewSet (DRF ViewSet)
```python
class TodoListViewSet(viewsets.ModelViewSet):
    serializer_class = TodoListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    
    def get_queryset(self):
        return TodoList.objects.filter(user=self.request.user).annotate(
            task_count=Count('tasks'),
            completed_count=Count('tasks', filter=Q(tasks__status='done'))
        )
```

### TaskViewSet (DRF ViewSet)
```python
class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority']
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'end_date', 'priority', 'status']
    
    def get_queryset(self):
        todo_list_id = self.kwargs.get('todo_list_pk')
        return Task.objects.filter(
            user=self.request.user,
            todo_list_id=todo_list_id
        ).select_related('todo_list')
```

### DashboardViewSet (DRF APIView)
```python
class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        today = timezone.now().date()
        
        # Calculate statistics with optimized queries
        stats = {
            'total_tasks': user.tasks.count(),
            'completed_tasks': user.tasks.filter(status='done').count(),
            'overdue_tasks': user.tasks.filter(
                end_date__lt=today,
                status__in=['todo', 'ongoing']
            ).count(),
            # ... additional stats
        }
        
        return Response(stats)
```

## Error Handling
- **400 Bad Request**: Invalid input data, validation errors
- **401 Unauthorized**: Missing or invalid authentication token  
- **403 Forbidden**: User doesn't have permission (shouldn't occur with proper filtering)
- **404 Not Found**: Resource doesn't exist or user doesn't have access
- **500 Internal Server Error**: Unexpected server errors

## Rate Limiting
- Implement Django REST Framework throttling for API endpoints
- User-based throttling: 1000 requests per hour for authenticated users
- Anonymous throttling: 100 requests per hour (for auth endpoints only)