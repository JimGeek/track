import axios, { AxiosInstance, AxiosResponse } from 'axios';

// TodoList and Task Types
export interface TodoList {
  id: string;
  name: string;
  description: string;
  color: string;
  deadline?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  task_count: number;
  completed_tasks: number;
  progress_percentage: number;
  overdue_count: number;
  can_edit: boolean;
}

export interface TodoListListItem {
  id: string;
  name: string;
  description: string;
  color: string;
  deadline?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  task_count: number;
  completed_tasks: number;
  progress_percentage: number;
  overdue_count: number;
}

export interface Task {
  id: string;
  todo_list: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'ongoing' | 'done';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  is_overdue: boolean;
  can_edit: boolean;
}

// Request Types
export interface CreateTodoListRequest {
  name: string;
  description?: string;
  color?: string;
  deadline?: string;
  is_favorite?: boolean;
}

export interface UpdateTodoListRequest {
  name?: string;
  description?: string;
  color?: string;
  deadline?: string;
  is_favorite?: boolean;
}

export interface CreateTaskRequest {
  todo_list: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'ongoing' | 'done';
  start_date?: string;
  end_date?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'ongoing' | 'done';
  start_date?: string;
  end_date?: string;
}

// Dashboard Types
export interface DashboardStats {
  total_todo_lists: number;
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  tasks_due_today: number;
  tasks_due_tomorrow: number;
  tasks_due_this_week: number;
  tasks_due_this_month: number;
}

export interface TasksByStatus {
  todo_tasks: Task[];
  ongoing_tasks: Task[];
  completed_tasks: Task[];
}

export interface TasksByPriority {
  urgent_tasks: Task[];
  high_tasks: Task[];
  medium_tasks: Task[];
  low_tasks: Task[];
}

export interface RecentActivity {
  id: string;
  type: 'todo_list_created' | 'todo_list_updated' | 'task_created' | 'task_updated' | 'task_completed';
  title: string;
  description: string;
  todo_list_name?: string;
  task_title?: string;
  timestamp: string;
}

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

class TodoApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              localStorage.setItem('access_token', response.data.access);
              originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async refreshToken(refresh: string): Promise<AxiosResponse<{ access: string }>> {
    return this.client.post<{ access: string }>('/api/auth/token/refresh/', { refresh });
  }

  // Dashboard API calls
  async getDashboardStats(): Promise<AxiosResponse<DashboardStats>> {
    const response = await this.client.get('/api/tasks/dashboard/');
    const dashboardData = response.data;
    
    // Transform the Django response to match expected DashboardStats interface
    const stats: DashboardStats = {
      total_todo_lists: dashboardData.summary_stats?.total_todo_lists || 0,
      total_tasks: dashboardData.summary_stats?.total_tasks || 0,
      completed_tasks: dashboardData.summary_stats?.completed_tasks || 0,
      overdue_tasks: dashboardData.summary_stats?.overdue_tasks || 0,
      tasks_due_today: dashboardData.summary_stats?.today_tasks_count || 0,
      tasks_due_tomorrow: dashboardData.summary_stats?.due_tomorrow_count || 0,
      tasks_due_this_week: dashboardData.summary_stats?.upcoming_tasks_count || 0,
      tasks_due_this_month: dashboardData.summary_stats?.due_this_month_count || 0
    };
    
    return { ...response, data: stats };
  }

  async getTasksByStatus(): Promise<AxiosResponse<TasksByStatus>> {
    // This isn't directly provided by the Django endpoint, so return empty for now
    const emptyTasks: TasksByStatus = {
      todo_tasks: [],
      ongoing_tasks: [],
      completed_tasks: []
    };
    return {
      data: emptyTasks,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    } as AxiosResponse<TasksByStatus>;
  }

  async getTasksByPriority(): Promise<AxiosResponse<TasksByPriority>> {
    // This isn't directly provided by the Django endpoint, so return empty for now
    const emptyTasks: TasksByPriority = {
      urgent_tasks: [],
      high_tasks: [],
      medium_tasks: [],
      low_tasks: []
    };
    return {
      data: emptyTasks,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    } as AxiosResponse<TasksByPriority>;
  }

  async getRecentActivity(limit: number = 10): Promise<AxiosResponse<{ results: RecentActivity[] }>> {
    try {
      const response = await this.client.get('/api/tasks/dashboard/');
      
      // Transform task data from dashboard to RecentActivity interface
      const transformedResults: RecentActivity[] = (response.data.recent_activity || []).map((task: any) => ({
        id: task.id,
        type: 'task_update',
        title: `Updated: ${task.title}`,
        description: task.description || '',
        todo_list_name: task.todo_list_name || '',
        task_title: task.title,
        timestamp: task.updated_at,
      }));
      
      return {
        ...response,
        data: { results: transformedResults }
      };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Return empty results as fallback
      return {
        data: { results: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      } as AxiosResponse<{ results: RecentActivity[] }>;
    }
  }

  async getTasksDueToday(): Promise<AxiosResponse<{ results: Task[] }>> {
    const response = await this.client.get('/api/tasks/dashboard/');
    return { ...response, data: { results: response.data.today_tasks || [] } };
  }

  async getTasksDueTomorrow(): Promise<AxiosResponse<{ results: Task[] }>> {
    const response = await this.client.get('/api/tasks/dashboard/');
    return { ...response, data: { results: response.data.tomorrow_tasks || [] } };
  }

  async getTasksDueThisWeek(): Promise<AxiosResponse<{ results: Task[] }>> {
    const response = await this.client.get('/api/tasks/dashboard/');
    return { ...response, data: { results: response.data.upcoming_tasks || [] } };
  }

  async getTasksDueThisMonth(): Promise<AxiosResponse<{ results: Task[] }>> {
    const response = await this.client.get('/api/tasks/dashboard/');
    return { ...response, data: { results: response.data.upcoming_tasks || [] } };
  }

  // TodoList API calls
  async getTodoLists(params?: {
    search?: string;
    ordering?: string;
  }): Promise<AxiosResponse<{ results: TodoListListItem[]; count: number; next: string | null; previous: string | null }>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/api/todolists/?${queryString}` : '/api/todolists/';
    return this.client.get(url);
  }

  async getTodoList(id: string): Promise<AxiosResponse<TodoList>> {
    return this.client.get(`/api/todolists/${id}/`);
  }

  async createTodoList(data: CreateTodoListRequest): Promise<AxiosResponse<TodoList>> {
    return this.client.post('/api/todolists/', data);
  }

  async updateTodoList(id: string, data: UpdateTodoListRequest): Promise<AxiosResponse<TodoList>> {
    return this.client.patch(`/api/todolists/${id}/`, data);
  }

  async deleteTodoList(id: string): Promise<void> {
    await this.client.delete(`/api/todolists/${id}/`);
  }

  // Task API calls
  async getTasks(params?: {
    todo_list?: string;
    status?: string;
    priority?: string;
    search?: string;
    ordering?: string;
    start_date?: string;
    end_date?: string;
    is_overdue?: boolean;
  }): Promise<AxiosResponse<{ results: Task[]; count: number; next: string | null; previous: string | null }>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/api/tasks/?${queryString}` : '/api/tasks/';
    return this.client.get(url);
  }

  async getTask(id: string): Promise<AxiosResponse<Task>> {
    return this.client.get(`/api/tasks/${id}/`);
  }

  async createTask(data: CreateTaskRequest): Promise<AxiosResponse<Task>> {
    return this.client.post('/api/tasks/', data);
  }

  async updateTask(id: string, data: UpdateTaskRequest): Promise<AxiosResponse<Task>> {
    return this.client.patch(`/api/tasks/${id}/`, data);
  }

  async deleteTask(id: string): Promise<void> {
    await this.client.delete(`/api/tasks/${id}/`);
  }

  async updateTaskStatus(id: string, status: 'todo' | 'ongoing' | 'done'): Promise<AxiosResponse<Task>> {
    return this.client.patch(`/api/tasks/${id}/`, { status });
  }

  async getTasksByTodoList(todoListId: string, params?: {
    status?: string;
    priority?: string;
    search?: string;
    ordering?: string;
  }): Promise<AxiosResponse<{ results: Task[]; count: number }>> {
    const searchParams = new URLSearchParams();
    searchParams.append('todo_list', todoListId);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const queryString = searchParams.toString();
    return this.client.get(`/api/tasks/?${queryString}`);
  }

  // Bulk operations
  async bulkUpdateTaskStatus(taskIds: string[], status: 'Todo' | 'Ongoing' | 'Done'): Promise<AxiosResponse<{ updated_count: number; tasks: Task[] }>> {
    return this.client.post('/api/tasks/bulk-update-status/', {
      task_ids: taskIds,
      status
    });
  }

  async bulkDeleteTasks(taskIds: string[]): Promise<AxiosResponse<{ deleted_count: number }>> {
    return this.client.post('/api/tasks/bulk-delete/', {
      task_ids: taskIds
    });
  }

  // Statistics
  async getTodoListStats(id: string): Promise<AxiosResponse<{
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    overdue_tasks: number;
    completion_percentage: number;
    priority_distribution: Array<{ priority: string; count: number }>;
    status_distribution: Array<{ status: string; count: number }>;
  }>> {
    return this.client.get(`/api/todos/todo-lists/${id}/stats/`);
  }

  // Health check
  async healthCheck(): Promise<AxiosResponse<{ status: string; timestamp: string }>> {
    return this.client.get('/api/todos/health/');
  }

  // User data management
  async clearUserData(password: string): Promise<AxiosResponse<{
    message: string;
    deleted_counts: {
      todo_lists: number;
      tasks: number;
      activities: number;
      workflow_history: number;
      projects: number;
      features: number;
    };
    user_preserved: boolean;
  }>> {
    return this.client.post('/api/auth/clear-data/', { password });
  }
}

export const todoApiService = new TodoApiService();
export default todoApiService;