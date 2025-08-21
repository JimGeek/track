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
}

export const apiService = new ApiService();
export default apiService;