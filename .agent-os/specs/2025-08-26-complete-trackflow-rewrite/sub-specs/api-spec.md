# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-26-complete-trackflow-rewrite/spec.md

> Created: 2025-08-26
> Version: 1.0.0

## Endpoints

### Authentication Endpoints

#### POST /api/auth/signin
**Purpose**: User authentication via NextAuth.js
**Method**: Server Action
**Parameters**:
- `email`: string (required)
- `password`: string (required)
- `callbackUrl`: string (optional)

#### POST /api/auth/signout
**Purpose**: User logout
**Method**: Server Action
**Authentication**: Required

#### GET /api/auth/session
**Purpose**: Get current user session
**Response**:
```typescript
{
  user: {
    id: string;
    email: string;
    name?: string;
    avatar?: string;
  } | null;
  expires: string;
}
```

### Task Management Endpoints

#### GET /api/tasks
**Purpose**: Fetch user's tasks with filtering and pagination
**Authentication**: Required
**Query Parameters**:
- `todoListId`: string (optional) - Filter by specific list
- `status`: TaskStatus (optional) - Filter by status
- `priority`: Priority (optional) - Filter by priority
- `search`: string (optional) - Search in title/description
- `page`: number (default: 1)
- `limit`: number (default: 50, max: 100)
- `sortBy`: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' (default: 'createdAt')
- `sortOrder`: 'asc' | 'desc' (default: 'desc')

**Response**:
```typescript
{
  tasks: Task[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### POST /api/tasks
**Purpose**: Create new task
**Authentication**: Required
**Body**:
```typescript
{
  title: string;
  description?: string;
  todoListId: string;
  priority?: Priority;
  dueDate?: string;
  startDate?: string;
  tags?: string[];
  estimatedHours?: number;
  parentId?: string;
}
```

#### PUT /api/tasks/[id]
**Purpose**: Update existing task
**Authentication**: Required
**Parameters**: `id` - Task ID
**Body**: Partial Task object

#### DELETE /api/tasks/[id]
**Purpose**: Delete task
**Authentication**: Required
**Parameters**: `id` - Task ID

#### POST /api/tasks/[id]/complete
**Purpose**: Mark task as complete
**Authentication**: Required
**Parameters**: `id` - Task ID
**Body**:
```typescript
{
  completedAt?: string; // ISO date string, defaults to now
  actualHours?: number;
}
```

#### POST /api/tasks/bulk
**Purpose**: Bulk operations on tasks
**Authentication**: Required
**Body**:
```typescript
{
  action: 'update' | 'delete' | 'move';
  taskIds: string[];
  data?: {
    status?: TaskStatus;
    priority?: Priority;
    todoListId?: string;
    tags?: string[];
  };
}
```

### TodoList Endpoints

#### GET /api/todolists
**Purpose**: Fetch user's todo lists
**Authentication**: Required
**Query Parameters**:
- `includeArchived`: boolean (default: false)
- `includeTaskCounts`: boolean (default: true)

**Response**:
```typescript
{
  todoLists: (TodoList & {
    _count?: {
      tasks: number;
    };
  })[];
}
```

#### POST /api/todolists
**Purpose**: Create new todo list
**Authentication**: Required
**Body**:
```typescript
{
  title: string;
  description?: string;
  color?: string;
}
```

#### PUT /api/todolists/[id]
**Purpose**: Update todo list
**Authentication**: Required
**Parameters**: `id` - TodoList ID
**Body**: Partial TodoList object

#### DELETE /api/todolists/[id]
**Purpose**: Delete todo list
**Authentication**: Required
**Parameters**: `id` - TodoList ID
**Query Parameters**:
- `moveTasksTo`: string (optional) - Move tasks to another list instead of deleting

#### POST /api/todolists/reorder
**Purpose**: Reorder todo lists
**Authentication**: Required
**Body**:
```typescript
{
  todoListIds: string[]; // Array of IDs in new order
}
```

### Dashboard Endpoints

#### GET /api/dashboard/overview
**Purpose**: Get dashboard overview data
**Authentication**: Required
**Response**:
```typescript
{
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    todayTasks: number;
    completionRate: number;
  };
  recentTasks: Task[];
  upcomingDeadlines: Task[];
  productivityData: {
    date: string;
    completed: number;
    created: number;
  }[];
}
```

#### GET /api/dashboard/analytics
**Purpose**: Get detailed analytics data
**Authentication**: Required
**Query Parameters**:
- `period`: '7d' | '30d' | '90d' | '1y' (default: '30d')
- `groupBy`: 'day' | 'week' | 'month' (default: 'day')

**Response**:
```typescript
{
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<Priority, number>;
  completionTrend: {
    date: string;
    completed: number;
    total: number;
  }[];
  timeSpent: {
    estimated: number;
    actual: number;
  };
  topLists: {
    id: string;
    title: string;
    taskCount: number;
    completionRate: number;
  }[];
}
```

### Search Endpoints

#### GET /api/search
**Purpose**: Global search across tasks and lists
**Authentication**: Required
**Query Parameters**:
- `q`: string (required) - Search query
- `type`: 'tasks' | 'todolists' | 'all' (default: 'all')
- `limit`: number (default: 20, max: 50)

**Response**:
```typescript
{
  tasks: Task[];
  todoLists: TodoList[];
  total: number;
}
```

## Controllers

### Task Controller (`lib/controllers/tasks.ts`)
```typescript
export class TaskController {
  static async getAll(userId: string, filters: TaskFilters): Promise<TaskResponse>;
  static async getById(taskId: string, userId: string): Promise<Task | null>;
  static async create(data: CreateTaskData, userId: string): Promise<Task>;
  static async update(taskId: string, data: UpdateTaskData, userId: string): Promise<Task>;
  static async delete(taskId: string, userId: string): Promise<void>;
  static async complete(taskId: string, userId: string, data: CompleteTaskData): Promise<Task>;
  static async bulkUpdate(taskIds: string[], data: BulkUpdateData, userId: string): Promise<void>;
  static async reorder(todoListId: string, taskIds: string[], userId: string): Promise<void>;
}
```

### TodoList Controller (`lib/controllers/todolists.ts`)
```typescript
export class TodoListController {
  static async getAll(userId: string, includeArchived: boolean): Promise<TodoList[]>;
  static async getById(listId: string, userId: string): Promise<TodoList | null>;
  static async create(data: CreateTodoListData, userId: string): Promise<TodoList>;
  static async update(listId: string, data: UpdateTodoListData, userId: string): Promise<TodoList>;
  static async delete(listId: string, userId: string, moveTasksTo?: string): Promise<void>;
  static async reorder(todoListIds: string[], userId: string): Promise<void>;
}
```

### Dashboard Controller (`lib/controllers/dashboard.ts`)
```typescript
export class DashboardController {
  static async getOverview(userId: string): Promise<DashboardOverview>;
  static async getAnalytics(userId: string, period: Period): Promise<DashboardAnalytics>;
  static async getProductivityData(userId: string, days: number): Promise<ProductivityData[]>;
}
```

### Search Controller (`lib/controllers/search.ts`)
```typescript
export class SearchController {
  static async globalSearch(query: string, userId: string, options: SearchOptions): Promise<SearchResults>;
  static async searchTasks(query: string, userId: string, filters: TaskFilters): Promise<Task[]>;
  static async searchTodoLists(query: string, userId: string): Promise<TodoList[]>;
}
```

## Real-time Synchronization Requirements

### WebSocket Implementation
- **Connection management**: Maintain user-specific WebSocket connections
- **Room-based updates**: Group users by workspace/list for targeted updates
- **Event types**:
  - `task:created` - New task added
  - `task:updated` - Task modified
  - `task:deleted` - Task removed
  - `task:moved` - Task position changed
  - `list:created` - New list added
  - `list:updated` - List modified
  - `list:deleted` - List removed

### Server-Sent Events (Alternative)
```typescript
// GET /api/events
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  // Set up real-time updates
  const subscription = subscribeToUserUpdates(userId, (event) => {
    writer.write(`data: ${JSON.stringify(event)}\n\n`);
  });
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### Optimistic Updates
- **Client-side predictions**: Update UI immediately before server confirmation
- **Rollback mechanism**: Revert changes if server update fails
- **Conflict resolution**: Handle concurrent updates with last-write-wins or user confirmation

### Data Synchronization
- **Version control**: Track data versions to detect conflicts
- **Offline support**: Queue updates when offline, sync when reconnected
- **Background sync**: Periodic synchronization for data consistency
- **Rate limiting**: Prevent excessive API calls during real-time updates

### Error Handling
- **Network failures**: Retry mechanisms with exponential backoff
- **Authentication errors**: Automatic token refresh and re-authentication
- **Validation errors**: Clear error messages and recovery suggestions
- **Server errors**: Graceful degradation and fallback mechanisms