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
  parent_title: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  due_date: string | null;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
  order: number;
  is_overdue: boolean;
  is_completed: boolean;
  hierarchy_level: number;
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

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
            window.location.href = '/auth/login';
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
}

export const apiService = new ApiService();
export default apiService;