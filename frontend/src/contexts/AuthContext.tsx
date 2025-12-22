'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, handleApiError } from '@/api/djangoApi';
import type { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (phone: string, code: string) => Promise<void>;
  register: (data: {
    phone: string;
    code: string;
    first_name?: string;
    last_name?: string;
    password?: string;
    organization_code?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          const user = await authApi.getProfile();
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          // Token invalid - clear it
          localStorage.removeItem('auth_token');
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (phone: string, code: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await authApi.login(phone, code);
      setState({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: {
    phone: string;
    code: string;
    first_name?: string;
    last_name?: string;
    password?: string;
    organization_code?: string;
  }) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await authApi.register(data);
      setState({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.token) return;
    
    try {
      const user = await authApi.getProfile();
      setState(prev => ({ ...prev, user }));
    } catch (error) {
      // Token might be invalid
      await logout();
    }
  }, [state.token, logout]);

  return (
    <AuthContext.Provider value={{
      ...state,
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
