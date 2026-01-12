/**
 * Flip Animation Hook
 * Manages page flip animations and gesture handling for the book viewer
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { FlipAnimation, GestureState } from '@/types';

// =============================================================================
// Types
// =============================================================================

interface FlipAnimationConfig {
  duration?: number;
  threshold?: number;
  onFlipStart?: (direction: 'left' | 'right') => void;
  onFlipEnd?: (direction: 'left' | 'right') => void;
}

interface GestureHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
}

interface UseFlipAnimationReturn {
  animation: FlipAnimation;
  isFlipping: boolean;
  flipLeft: () => void;
  flipRight: () => void;
  cancelFlip: () => void;
  handlers: GestureHandlers;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_DURATION = 600;
const DEFAULT_THRESHOLD = 50;
const DRAG_SENSITIVITY = 200;
const MIN_DRAG_DISTANCE = 10;

// =============================================================================
// Hook Implementation
// =============================================================================

export function useFlipAnimation(config: FlipAnimationConfig = {}): UseFlipAnimationReturn {
  const {
    duration = DEFAULT_DURATION,
    threshold = DEFAULT_THRESHOLD,
    onFlipStart,
    onFlipEnd,
  } = config;

  const [animation, setAnimation] = useState<FlipAnimation>({
    direction: 'right',
    progress: 0,
    isActive: false,
  });

  const gestureRef = useRef<GestureState>({
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
    direction: null,
  });
  const isDraggingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const animateFlip = useCallback(
    (direction: 'left' | 'right', startProgress = 0) => {
      const startTime = performance.now();
      const endProgress = 100;
      const progressDelta = endProgress - startProgress;

      setAnimation((prev) => ({ ...prev, direction, isActive: true }));
      onFlipStart?.(direction);

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const rawProgress = startProgress + (progressDelta * elapsed) / duration;
        const progress = Math.min(rawProgress, 100);

        setAnimation((prev) => ({ ...prev, progress }));

        if (progress < 100) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setAnimation({ direction, progress: 0, isActive: false });
          onFlipEnd?.(direction);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [duration, onFlipStart, onFlipEnd]
  );

  const flipLeft = useCallback(() => {
    if (!animation.isActive) animateFlip('left');
  }, [animation.isActive, animateFlip]);

  const flipRight = useCallback(() => {
    if (!animation.isActive) animateFlip('right');
  }, [animation.isActive, animateFlip]);

  const cancelFlip = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAnimation({ direction: 'right', progress: 0, isActive: false });
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    lastTimeRef.current = performance.now();
    gestureRef.current = {
      startX: clientX,
      startY: clientY,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
      direction: null,
    };
  }, []);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - lastTimeRef.current;
    const deltaX = clientX - gestureRef.current.startX;
    const deltaY = clientY - gestureRef.current.startY;
    const velocity = Math.abs(deltaX) / deltaTime;

    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    gestureRef.current = { ...gestureRef.current, deltaX, deltaY, velocity, direction };
    lastTimeRef.current = currentTime;

    if (Math.abs(deltaX) > MIN_DRAG_DISTANCE) {
      const progress = Math.min((Math.abs(deltaX) / DRAG_SENSITIVITY) * 100, 50);
      setAnimation({
        direction: deltaX > 0 ? 'right' : 'left',
        progress,
        isActive: true,
      });
    }
  }, []);

  const handleEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const { deltaX, velocity, direction } = gestureRef.current;

    if (
      (Math.abs(deltaX) > threshold || velocity > 0.5) &&
      (direction === 'left' || direction === 'right')
    ) {
      animateFlip(direction, animation.progress);
    } else {
      cancelFlip();
    }
  }, [threshold, animation.progress, animateFlip, cancelFlip]);

  const handlers: GestureHandlers = {
    onTouchStart: (e) => handleStart(e.touches[0].clientX, e.touches[0].clientY),
    onTouchMove: (e) => handleMove(e.touches[0].clientX, e.touches[0].clientY),
    onTouchEnd: () => handleEnd(),
    onMouseDown: (e) => handleStart(e.clientX, e.clientY),
    onMouseMove: (e) => handleMove(e.clientX, e.clientY),
    onMouseUp: () => handleEnd(),
    onMouseLeave: () => isDraggingRef.current && handleEnd(),
  };

  return { animation, isFlipping: animation.isActive, flipLeft, flipRight, cancelFlip, handlers };
}

export default useFlipAnimation;
