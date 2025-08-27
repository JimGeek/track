import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_joined: string;
  is_email_verified: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  message: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: User;
  team_members: User[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date: string | null;
  end_date: string | null;
  deadline: string | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  total_features: number;
  completed_features: number;
  progress_percentage: number;
  is_overdue: boolean;
  can_edit: boolean;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  owner: User;
  team_members_count: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: string | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  total_features: number;
  completed_features: number;
  progress_percentage: number;
  is_overdue: boolean;
  can_edit: boolean;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  deadline?: string;
  team_member_emails?: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  deadline?: string;
  team_member_emails?: string[];
}

export interface Feature {
  id: string;
  project: string;
  parent: string | null;
  title: string;
  description: string;
  status: 'idea' | 'specification' | 'development' | 'testing' | 'live';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: User | null;
  reporter: User;
  estimated_hours: number | null;
  actual_hours: number | null;
  start_date: string | null;
  end_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
  order: number;
  is_overdue: boolean;
  is_completed: boolean;
  hierarchy_level: number;
  full_path: string;
  progress_percentage: number;
  can_edit: boolean;
  total_estimated_hours: number;
  total_actual_hours: number;
  next_status: string | null;
  previous_status: string | null;
  comments: FeatureComment[];
  attachments: FeatureAttachment[];
  sub_features: FeatureListItem[];
}

export interface FeatureListItem {
  id: string;
  title: string;
  description: string;
  status: 'idea' | 'specification' | 'development' | 'testing' | 'live';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee: User | null;
  reporter: User;
  project_name: string;
  parent: string | null;
  parent_title: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  start_date: string | null;
  end_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
  order: number;
  is_overdue: boolean;
  is_completed: boolean;
  hierarchy_level: number;
  full_path: string;
  progress_percentage: number;
  can_edit: boolean;
  sub_features_count: number;
  comments_count: number;
  attachments_count: number;
}

export interface CreateFeatureRequest {
  project: string;
  parent?: string;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee_email?: string;
  estimated_hours?: number;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  order?: number;
}

export interface UpdateFeatureRequest {
  title?: string;
  description?: string;
  status?: 'idea' | 'specification' | 'development' | 'testing' | 'live';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee_email?: string;
  estimated_hours?: number;
  actual_hours?: number;
  start_date?: string;
  end_date?: string;
  due_date?: string;
  order?: number;
}

export interface FeatureComment {
  id: string;
  content: string;
  author: User;
  created_at: string;
  updated_at: string;
}

export interface FeatureAttachment {
  id: string;
  file: string;
  filename: string;
  file_size: number;
  file_size_display: string;
  content_type: string;
  uploaded_by: User;
  uploaded_at: string;
}

// Dashboard Types
export interface RecentActivity {
  id: string;
  type: 'project_created' | 'project_updated' | 'feature_created' | 'feature_updated' | 'feature_status_changed' | 'comment_added';
  title: string;
  description: string;
  user: User;
  project_name: string;
  project_id: string;
  feature_id?: string;
  feature_title?: string;
  timestamp: string;
}

export interface UpcomingFeature {
  id: string;
  title: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'idea' | 'specification' | 'development' | 'testing' | 'live';
  project_name: string;
  project_id: string;
  assignee: User | null;
  days_until_due: number;
  is_overdue: boolean;
  parent_title?: string;
  hierarchy_level: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
  new_password_confirm: string;
}

// Workflow Types
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  entity_type: 'feature' | 'project';
  is_active: boolean;
  created_by_name: string;
  states: WorkflowState[];
  transitions: WorkflowTransition[];
  created_at: string;
  updated_at: string;
}

export interface WorkflowState {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  is_initial: boolean;
  is_final: boolean;
  order: number;
  auto_assign_to_creator: boolean;
  require_assignee: boolean;
  require_comment: boolean;
  notify_stakeholders: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowTransition {
  id: string;
  from_state: string;
  to_state: string;
  from_state_name: string;
  to_state_name: string;
  name: string;
  description: string;
  require_permission: string;
  require_role: 'owner' | 'assignee' | 'admin' | 'any';
  require_all_subtasks_complete: boolean;
  require_comment: boolean;
  auto_assign_to_user: string | null;
  auto_assign_to_user_email: string | null;
  auto_set_due_date_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowHistory {
  id: string;
  template: string;
  entity_type: string;
  entity_id: string;
  from_state: string | null;
  to_state: string;
  from_state_name: string | null;
  to_state_name: string;
  transition: string | null;
  transition_name: string | null;
  changed_by: string;
  changed_by_name: string;
  comment: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger_on_state: string;
  trigger_on_state_name: string;
  trigger_condition: Record<string, any>;
  action_type: 'auto_transition' | 'send_notification' | 'assign_user' | 'set_due_date' | 'add_comment' | 'webhook';
  action_config: Record<string, any>;
  is_active: boolean;
  priority: number;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowMetrics {
  id: string;
  template: string;
  template_name: string;
  state: string;
  state_name: string;
  avg_time_in_state_hours: number;
  total_entries: number;
  total_exits: number;
  completion_rate: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

// Workflow Creation Types
export interface CreateWorkflowTemplateRequest {
  name: string;
  description: string;
  entity_type: 'feature' | 'project';
  initial_states?: Array<{
    name: string;
    slug?: string;
    description?: string;
    color?: string;
    icon?: string;
    is_initial?: boolean;
    is_final?: boolean;
    order?: number;
    auto_assign_to_creator?: boolean;
    require_assignee?: boolean;
    require_comment?: boolean;
    notify_stakeholders?: boolean;
  }>;
}

export interface CreateWorkflowStateRequest {
  template: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  is_initial?: boolean;
  is_final?: boolean;
  order?: number;
  auto_assign_to_creator?: boolean;
  require_assignee?: boolean;
  require_comment?: boolean;
  notify_stakeholders?: boolean;
}

export interface CreateWorkflowTransitionRequest {
  template: string;
  from_state: string;
  to_state: string;
  name: string;
  description?: string;
  require_permission?: string;
  require_role?: 'owner' | 'assignee' | 'admin' | 'any';
  require_all_subtasks_complete?: boolean;
  require_comment?: boolean;
  auto_assign_to_user?: string;
  auto_set_due_date_days?: number;
}

export interface CreateWorkflowRuleRequest {
  template: string;
  name: string;
  description?: string;
  trigger_on_state: string;
  trigger_condition?: Record<string, any>;
  action_type: 'auto_transition' | 'send_notification' | 'assign_user' | 'set_due_date' | 'add_comment' | 'webhook';
  action_config?: Record<string, any>;
  is_active?: boolean;
  priority?: number;
}

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

class ApiService {
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
        const token = this.getAccessToken();
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
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              this.setTokens({ access: response.data.access, refresh: refreshToken });
              originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.clearTokens();
            window.location.href = '/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Token management
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  // User data management
  getUser(): User | null {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearUser(): void {
    localStorage.removeItem('user');
  }

  // User Management
  async getUsers(): Promise<AxiosResponse<{ results: User[] }>> {
    return this.client.get('/api/auth/users/');
  }

  async getUserById(userId: string): Promise<AxiosResponse<User>> {
    return this.client.get(`/api/auth/users/${userId}/`);
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<AxiosResponse<{
    projects_count: number;
    features_count: number;
    users_count: number;
    active_projects_count: number;
  }>> {
    return this.client.get('/api/dashboard/stats/');
  }

  // Authentication API calls
  async register(data: RegisterRequest): Promise<AxiosResponse<AuthResponse>> {
    const response = await this.client.post<AuthResponse>('/api/auth/register/', data);
    if (response.data) {
      this.setTokens({
        access: response.data.access,
        refresh: response.data.refresh,
      });
      this.setUser(response.data.user);
    }
    return response;
  }

  async login(data: LoginRequest): Promise<AxiosResponse<AuthResponse>> {
    const response = await this.client.post<AuthResponse>('/api/auth/login/', data);
    if (response.data) {
      this.setTokens({
        access: response.data.access,
        refresh: response.data.refresh,
      });
      this.setUser(response.data.user);
    }
    return response;
  }

  async logout(): Promise<AxiosResponse<{ message: string }>> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await this.client.post('/api/auth/logout/', { refresh: refreshToken });
      } catch (error) {
        // Continue with logout even if API call fails
      }
    }
    this.clearTokens();
    this.clearUser();
    return Promise.resolve({ data: { message: 'Logged out successfully' } } as AxiosResponse);
  }

  async refreshToken(refresh: string): Promise<AxiosResponse<{ access: string }>> {
    return this.client.post<{ access: string }>('/api/auth/token/refresh/', { refresh });
  }

  async getProfile(): Promise<AxiosResponse<User>> {
    return this.client.get<User>('/api/auth/profile/');
  }

  async updateProfile(data: Partial<User>): Promise<AxiosResponse<{ user: User; message: string }>> {
    return this.client.patch<{ user: User; message: string }>('/api/auth/profile/', data);
  }

  async requestPasswordReset(data: PasswordResetRequest): Promise<AxiosResponse<{ message: string }>> {
    return this.client.post<{ message: string }>('/api/auth/password-reset/', data);
  }

  async confirmPasswordReset(data: PasswordResetConfirm): Promise<AxiosResponse<{ message: string }>> {
    return this.client.post<{ message: string }>('/api/auth/password-reset/confirm/', data);
  }

  async changePassword(data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<AxiosResponse<{ message: string }>> {
    return this.client.post<{ message: string }>('/api/auth/change-password/', data);
  }

  // Utility methods
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getUser();
    return !!(token && user);
  }

  async healthCheck(): Promise<AxiosResponse<{ status: string }>> {
    return this.client.get<{ status: string }>('/api/auth/health/');
  }

  // Project Management Methods
  async getProjects(params?: {
    search?: string;
    priority?: string;
    is_archived?: boolean;
    ordering?: string;
  }): Promise<AxiosResponse<{ results: ProjectListItem[]; count: number; next: string | null; previous: string | null }>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/api/projects/?${queryString}` : '/api/projects/';
    return this.client.get(url);
  }

  async getProject(id: string): Promise<AxiosResponse<Project>> {
    return this.client.get(`/api/projects/${id}/`);
  }

  async createProject(data: CreateProjectRequest): Promise<AxiosResponse<Project>> {
    return this.client.post('/api/projects/', data);
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<AxiosResponse<Project>> {
    return this.client.patch(`/api/projects/${id}/`, data);
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/api/projects/${id}/`);
  }

  async archiveProject(id: string): Promise<AxiosResponse<{ detail: string; project: Project }>> {
    return this.client.post(`/api/projects/${id}/archive/`);
  }

  async unarchiveProject(id: string): Promise<AxiosResponse<{ detail: string; project: Project }>> {
    return this.client.post(`/api/projects/${id}/unarchive/`);
  }

  async getProjectStatistics(id: string): Promise<AxiosResponse<{
    total_features: number;
    completed_features: number;
    progress_percentage: number;
    is_overdue: boolean;
    team_members_count: number;
    created_at: string;
    last_updated: string;
  }>> {
    return this.client.get(`/api/projects/${id}/statistics/`);
  }

  async getMyProjects(): Promise<AxiosResponse<{
    owned_projects: ProjectListItem[];
    team_projects: ProjectListItem[];
  }>> {
    return this.client.get('/api/projects/my_projects/');
  }

  async getDashboardSummary(): Promise<AxiosResponse<{
    total_projects: number;
    active_projects: number;
    archived_projects: number;
    overdue_projects: number;
  }>> {
    return this.client.get('/api/projects/dashboard_summary/');
  }

  // Dashboard Activity and Upcoming Features
  async getRecentActivity(limit: number = 20): Promise<AxiosResponse<{ results: RecentActivity[] }>> {
    return this.client.get(`/api/dashboard/recent-activity/?limit=${limit}`);
  }

  async getUpcomingFeatures(days: number = 30): Promise<AxiosResponse<{ 
    next_7_days: UpcomingFeature[];
    next_15_days: UpcomingFeature[];
    next_30_days: UpcomingFeature[];
  }>> {
    return this.client.get(`/api/dashboard/upcoming-features/?days=${days}`);
  }

  // Feature Management Methods
  async getFeatures(params?: {
    project?: string;
    parent?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    search?: string;
    ordering?: string;
  }): Promise<AxiosResponse<{ results: FeatureListItem[]; count: number; next: string | null; previous: string | null }>> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const queryString = searchParams.toString();
    const url = queryString ? `/api/features/?${queryString}` : '/api/features/';
    return this.client.get(url);
  }

  async getFeature(id: string): Promise<AxiosResponse<Feature>> {
    return this.client.get(`/api/features/${id}/`);
  }

  async createFeature(data: CreateFeatureRequest): Promise<AxiosResponse<Feature>> {
    return this.client.post('/api/features/', data);
  }

  async updateFeature(id: string, data: UpdateFeatureRequest): Promise<AxiosResponse<Feature>> {
    return this.client.patch(`/api/features/${id}/`, data);
  }

  async deleteFeature(id: string): Promise<void> {
    await this.client.delete(`/api/features/${id}/`);
  }

  async advanceFeatureStatus(id: string): Promise<AxiosResponse<{ detail: string; feature: Feature }>> {
    return this.client.post(`/api/features/${id}/advance_status/`);
  }

  async revertFeatureStatus(id: string): Promise<AxiosResponse<{ detail: string; feature: Feature }>> {
    return this.client.post(`/api/features/${id}/revert_status/`);
  }

  async setFeatureStatus(id: string, status: string): Promise<AxiosResponse<{ detail: string; feature: Feature }>> {
    return this.client.post(`/api/features/${id}/set_status/`, { status });
  }

  async getFeatureHierarchy(id: string): Promise<AxiosResponse<{
    ancestors: Array<{ id: string; title: string; status: string; hierarchy_level: number }>;
    current: { id: string; title: string; status: string; hierarchy_level: number };
    descendants: Array<{ id: string; title: string; status: string; hierarchy_level: number; children: any[] }>;
  }>> {
    return this.client.get(`/api/features/${id}/hierarchy/`);
  }

  async getFeaturesByProject(projectId: string): Promise<AxiosResponse<FeatureListItem[]>> {
    return this.client.get(`/api/features/by_project/?project_id=${projectId}`);
  }

  async getMyFeatureAssignments(): Promise<AxiosResponse<FeatureListItem[]>> {
    return this.client.get('/api/features/my_assignments/');
  }

  async getFeatureDashboardStats(): Promise<AxiosResponse<{
    my_assignments_count: number;
    my_reports_count: number;
    overdue_count: number;
    status_distribution: Array<{ status: string; count: number }>;
    priority_distribution: Array<{ priority: string; count: number }>;
  }>> {
    return this.client.get('/api/features/dashboard_stats/');
  }

  // Feature Comments
  async getFeatureComments(featureId: string): Promise<AxiosResponse<{ results: FeatureComment[] }>> {
    return this.client.get(`/api/features/${featureId}/comments/`);
  }

  async createFeatureComment(featureId: string, content: string): Promise<AxiosResponse<FeatureComment>> {
    return this.client.post(`/api/features/${featureId}/comments/`, { content });
  }

  async updateFeatureComment(featureId: string, commentId: string, content: string): Promise<AxiosResponse<FeatureComment>> {
    return this.client.patch(`/api/features/${featureId}/comments/${commentId}/`, { content });
  }

  async deleteFeatureComment(featureId: string, commentId: string): Promise<void> {
    await this.client.delete(`/api/features/${featureId}/comments/${commentId}/`);
  }

  // Feature Attachments
  async getFeatureAttachments(featureId: string): Promise<AxiosResponse<{ results: FeatureAttachment[] }>> {
    return this.client.get(`/api/features/${featureId}/attachments/`);
  }

  async uploadFeatureAttachment(featureId: string, file: File): Promise<AxiosResponse<FeatureAttachment>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.client.post(`/api/features/${featureId}/attachments/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async deleteFeatureAttachment(featureId: string, attachmentId: string): Promise<void> {
    await this.client.delete(`/api/features/${featureId}/attachments/${attachmentId}/`);
  }

  // Workflow Management
  async getWorkflowTemplates(): Promise<AxiosResponse<{ results: WorkflowTemplate[] }>> {
    return this.client.get('/api/workflow/templates/');
  }

  async getWorkflowTemplate(templateId: string): Promise<AxiosResponse<WorkflowTemplate>> {
    return this.client.get(`/api/workflow/templates/${templateId}/`);
  }

  async createWorkflowTemplate(data: CreateWorkflowTemplateRequest): Promise<AxiosResponse<WorkflowTemplate>> {
    return this.client.post('/api/workflow/templates/', data);
  }

  async updateWorkflowTemplate(templateId: string, data: Partial<WorkflowTemplate>): Promise<AxiosResponse<WorkflowTemplate>> {
    return this.client.patch(`/api/workflow/templates/${templateId}/`, data);
  }

  async deleteWorkflowTemplate(templateId: string): Promise<void> {
    await this.client.delete(`/api/workflow/templates/${templateId}/`);
  }

  async duplicateWorkflowTemplate(templateId: string): Promise<AxiosResponse<WorkflowTemplate>> {
    return this.client.post(`/api/workflow/templates/${templateId}/duplicate/`);
  }

  async getWorkflowTemplateStates(templateId: string): Promise<AxiosResponse<WorkflowState[]>> {
    return this.client.get(`/api/workflow/templates/${templateId}/states/`);
  }

  async getWorkflowTemplateTransitions(templateId: string): Promise<AxiosResponse<WorkflowTransition[]>> {
    return this.client.get(`/api/workflow/templates/${templateId}/transitions/`);
  }

  async getWorkflowTemplateMetrics(templateId: string, days: number = 30): Promise<AxiosResponse<WorkflowMetrics[]>> {
    return this.client.get(`/api/workflow/templates/${templateId}/metrics/?days=${days}`);
  }

  async getWorkflowTemplateUsageStats(templateId: string, days: number = 30): Promise<AxiosResponse<{
    period: { start: string; end: string; days: number };
    totals: { transitions: number; unique_entities: number; avg_transitions_per_day: number };
    state_distribution: Array<{ to_state__name: string; count: number }>;
    daily_activity: Array<{ day: string; count: number }>;
  }>> {
    return this.client.get(`/api/workflow/templates/${templateId}/usage_stats/?days=${days}`);
  }

  // Workflow States
  async getWorkflowStates(): Promise<AxiosResponse<{ results: WorkflowState[] }>> {
    return this.client.get('/api/workflow/states/');
  }

  async createWorkflowState(data: CreateWorkflowStateRequest): Promise<AxiosResponse<WorkflowState>> {
    return this.client.post('/api/workflow/states/', data);
  }

  async updateWorkflowState(stateId: string, data: Partial<WorkflowState>): Promise<AxiosResponse<WorkflowState>> {
    return this.client.patch(`/api/workflow/states/${stateId}/`, data);
  }

  async deleteWorkflowState(stateId: string): Promise<void> {
    await this.client.delete(`/api/workflow/states/${stateId}/`);
  }

  // Workflow Transitions
  async getWorkflowTransitions(): Promise<AxiosResponse<{ results: WorkflowTransition[] }>> {
    return this.client.get('/api/workflow/transitions/');
  }

  async createWorkflowTransition(data: CreateWorkflowTransitionRequest): Promise<AxiosResponse<WorkflowTransition>> {
    return this.client.post('/api/workflow/transitions/', data);
  }

  async updateWorkflowTransition(transitionId: string, data: Partial<WorkflowTransition>): Promise<AxiosResponse<WorkflowTransition>> {
    return this.client.patch(`/api/workflow/transitions/${transitionId}/`, data);
  }

  async deleteWorkflowTransition(transitionId: string): Promise<void> {
    await this.client.delete(`/api/workflow/transitions/${transitionId}/`);
  }

  // Workflow History
  async getWorkflowHistory(filters?: {
    entity_type?: string;
    entity_id?: string;
    template?: string;
  }): Promise<AxiosResponse<{ results: WorkflowHistory[] }>> {
    const params = new URLSearchParams();
    if (filters?.entity_type) params.set('entity_type', filters.entity_type);
    if (filters?.entity_id) params.set('entity_id', filters.entity_id);
    if (filters?.template) params.set('template', filters.template);
    
    const queryString = params.toString();
    return this.client.get(`/api/workflow/history/${queryString ? `?${queryString}` : ''}`);
  }

  async getEntityWorkflowHistory(entityType: string, entityId: string): Promise<AxiosResponse<{ results: WorkflowHistory[] }>> {
    return this.client.get(`/api/workflow/history/entity_history/?entity_type=${entityType}&entity_id=${entityId}`);
  }

  // Workflow Rules
  async getWorkflowRules(): Promise<AxiosResponse<{ results: WorkflowRule[] }>> {
    return this.client.get('/api/workflow/rules/');
  }

  async createWorkflowRule(data: CreateWorkflowRuleRequest): Promise<AxiosResponse<WorkflowRule>> {
    return this.client.post('/api/workflow/rules/', data);
  }

  async updateWorkflowRule(ruleId: string, data: Partial<WorkflowRule>): Promise<AxiosResponse<WorkflowRule>> {
    return this.client.patch(`/api/workflow/rules/${ruleId}/`, data);
  }

  async deleteWorkflowRule(ruleId: string): Promise<void> {
    await this.client.delete(`/api/workflow/rules/${ruleId}/`);
  }

  async toggleWorkflowRule(ruleId: string): Promise<AxiosResponse<{ detail: string; rule: WorkflowRule }>> {
    return this.client.post(`/api/workflow/rules/${ruleId}/toggle_active/`);
  }

  // Workflow Metrics
  async calculateWorkflowMetrics(data: {
    template_id: string;
    start_date: string;
    end_date: string;
  }): Promise<AxiosResponse<{
    detail: string;
    metrics_count: number;
    template: string;
  }>> {
    return this.client.post('/api/workflow/metrics/calculate/', data);
  }
}

export const apiService = new ApiService();
export default apiService;