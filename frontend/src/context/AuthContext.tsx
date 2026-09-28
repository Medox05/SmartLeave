import React, { createContext, useContext, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { getCsrfCookie } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<any>;
  logout: () => Promise<any>;
  isAdmin: boolean;
  isHR: boolean;
  isManager: boolean;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  const tokenExists = !!localStorage.getItem('auth_token');

  // 1. Core Profile Query
  const {
    data: user = null,
    isPending,
    isFetched,
  } = useQuery<User | null>({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;

      try {
        const response = await api.get('/user');
        const fetchedUser = response.data.user;
        if (fetchedUser && fetchedUser.status !== 'active') {
          localStorage.removeItem('auth_token');
          queryClient.setQueryData(['auth-user'], null);
          return null;
        }
        return fetchedUser;
      } catch (err: any) {
        localStorage.removeItem('auth_token');
        queryClient.setQueryData(['auth-user'], null);
        return null;
      }
    },
    enabled: tokenExists,
    retry: false,
    refetchInterval: 3000,
    staleTime: 2 * 1000,
  });

  useEffect(() => {
    if (tokenExists && isPending && !isFetched) {
      const timer = setTimeout(() => {
        localStorage.removeItem('auth_token');
        queryClient.setQueryData(['auth-user'], null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [tokenExists, isPending, isFetched, queryClient]);

  const isLoading = tokenExists ? (isPending && !isFetched) : false;

  // 2. Login Mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password, remember }: any) => {
      // Initialize CSRF protection
      try {
        await getCsrfCookie();
      } catch {
        // Fallback gracefully
      }
      // Execute authentication request
      const response = await api.post('/login', { email, password, remember });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      queryClient.setQueryData(['auth-user'], data.user);
    },
  });

  // 3. Logout Mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.post('/logout');
      } finally {
        localStorage.removeItem('auth_token');
      }
    },
    onSuccess: () => {
      localStorage.removeItem('auth_token');
      queryClient.setQueryData(['auth-user'], null);
      queryClient.clear();
    },
  });

  // Helper getters
  const isAuthenticated = !!user;
  const hasRole = (role: string) => user?.roles.includes(role) ?? false;
  const hasPermission = (permission: string) => user?.permissions.includes(permission) ?? false;

  const isAdmin = hasRole('Admin');
  const isHR = hasRole('HR');
  const isManager = hasRole('Manager');

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isAdmin,
    isHR,
    isManager,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
