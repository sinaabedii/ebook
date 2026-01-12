/**
 * Responsive Hooks
 * Hooks for detecting screen size and responsive behavior
 */

import { useState, useEffect, useCallback } from 'react';
import { BREAKPOINTS, DEBOUNCE_DELAY } from '@/lib/constants';
import { isBrowser } from '@/lib/utils';
import type { UIState, Orientation } from '@/types';

// =============================================================================
// Initial State
// =============================================================================

const getInitialState = (): UIState => ({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  orientation: 'landscape',
  screenWidth: isBrowser() ? window.innerWidth : 1280,
  screenHeight: isBrowser() ? window.innerHeight : 720,
});

// =============================================================================
// useResponsive Hook
// =============================================================================

/**
 * Hook for responsive UI state detection
 * @returns Current UI state including device type and dimensions
 */
export function useResponsive(): UIState {
  const [state, setState] = useState<UIState>(getInitialState);

  const updateState = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation: Orientation = width > height ? 'landscape' : 'portrait';

    setState({
      isMobile: width < BREAKPOINTS.mobile,
      isTablet: width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet,
      isDesktop: width >= BREAKPOINTS.tablet,
      orientation,
      screenWidth: width,
      screenHeight: height,
    });
  }, []);

  useEffect(() => {
    if (!isBrowser()) return;

    // Initial update
    updateState();

    // Debounced resize handler
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateState, DEBOUNCE_DELAY);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', updateState);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', updateState);
      clearTimeout(timeoutId);
    };
  }, [updateState]);

  return state;
}

// =============================================================================
// useMediaQuery Hook
// =============================================================================

/**
 * Hook for matching CSS media queries
 * @param query - CSS media query string
 * @returns Whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (!isBrowser()) return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

// =============================================================================
// useWindowSize Hook
// =============================================================================

interface WindowSize {
  width: number;
  height: number;
}

/**
 * Hook for tracking window dimensions
 * @returns Current window width and height
 */
export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width: isBrowser() ? window.innerWidth : 0,
    height: isBrowser() ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (!isBrowser()) return;

    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

export default useResponsive;
