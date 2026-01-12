/**
 * Theme Context
 * Provides theme management (light/dark mode) throughout the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { STORAGE_KEYS, DEFAULT_THEME, SUPPORTED_THEMES, type SupportedTheme } from '@/lib/constants';
import { getStorageItem, setStorageItem, isBrowser } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface ThemeContextType {
  theme: SupportedTheme;
  isDark: boolean;
  setTheme: (theme: SupportedTheme) => void;
  toggleTheme: () => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

// =============================================================================
// Context
// =============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// =============================================================================
// Provider Component
// =============================================================================

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<SupportedTheme>(DEFAULT_THEME);
  const [mounted, setMounted] = useState(false);

  // Load theme from storage on mount
  useEffect(() => {
    const savedTheme = getStorageItem(STORAGE_KEYS.theme) as SupportedTheme | null;
    if (savedTheme && SUPPORTED_THEMES.includes(savedTheme)) {
      setThemeState(savedTheme);
    }
    setMounted(true);
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted || !isBrowser()) return;

    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    setStorageItem(STORAGE_KEYS.theme, theme);
  }, [theme, mounted]);

  const setTheme = (newTheme: SupportedTheme) => {
    if (SUPPORTED_THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      isDark: theme === 'dark',
      setTheme,
      toggleTheme,
    }),
    [theme]
  );

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

// =============================================================================
// Hook
// =============================================================================

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
