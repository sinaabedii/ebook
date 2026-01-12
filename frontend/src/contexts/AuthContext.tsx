/**
 * Auth Context
 * Provides authentication state and methods throughout the application
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { authApi } from '@/api/djangoApi';
import { STORAGE_KEYS } from '@/lib/constants';
import { getStorageItem, removeStorageItem } from '@/lib/utils';
import type { User, AuthState, RegisterFormData } from '@/types';

// =============================================================================
// Types
// =============================================================================

interface AuthContextType extends AuthState {
  login: (phone: string, code: string) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

// =============================================================================
// Context
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// Provider Component
// =============================================================================

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(initialState);

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = async () => {
      const token = getStorageItem(STORAGE_KEYS.authToken);

      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const user = await authApi.getProfile();
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        // Token invalid - clear it
        removeStorageItem(STORAGE_KEYS.authToken);
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (phone: string, code: string) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await authApi.login(phone, code);
      setState({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterFormData) => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const response = await authApi.register(data);
      setState({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
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
      setState((prev) => ({ ...prev, user }));
    } catch {
      await logout();
    }
  }, [state.token, logout]);

  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      login,
      register,
      logout,
      refreshUser,
    }),
    [state, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// Hook
// =============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
