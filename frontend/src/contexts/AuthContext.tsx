import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest } from '../services/api';
import apiService from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    setIsLoading(true);
    try {
      // Check if user is stored locally
      const storedUser = apiService.getUser();
      const hasToken = apiService.getAccessToken();

      if (storedUser && hasToken) {
        // Verify token is still valid by fetching fresh user data
        try {
          const response = await apiService.getProfile();
          setUser(response.data);
          apiService.setUser(response.data); // Update stored user data
        } catch (error) {
          // Token might be expired, clear everything
          apiService.clearTokens();
          apiService.clearUser();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(data);
      setUser(response.data.user);
    } catch (error) {
      throw error; // Re-throw to let components handle the error
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setIsLoading(true);
      const response = await apiService.register(data);
      setUser(response.data.user);
    } catch (error) {
      throw error; // Re-throw to let components handle the error
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
      setUser(null);
    } catch (error) {
      // Even if logout fails, clear local state
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    apiService.setUser(updatedUser);
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const response = await apiService.getProfile();
      setUser(response.data);
      apiService.setUser(response.data);
    } catch (error) {
      console.error('Error refreshing profile:', error);
      // If refresh fails, user might need to re-authenticate
      if ((error as any).response?.status === 401) {
        setUser(null);
        apiService.clearTokens();
        apiService.clearUser();
      }
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;