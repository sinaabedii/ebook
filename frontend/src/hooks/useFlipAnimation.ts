import { useState, useCallback, useRef, useEffect } from 'react';
import type { FlipAnimation, GestureState } from '@/types';

interface FlipAnimationConfig {
  duration?: number;
  threshold?: number;
  onFlipStart?: (direction: 'left' | 'right') => void;
  onFlipEnd?: (direction: 'left' | 'right') => void;
}

interface UseFlipAnimationReturn {
  animation: FlipAnimation;
  isFlipping: boolean;
  flipLeft: () => void;
  flipRight: () => void;
  cancelFlip: () => void;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: (e: React.MouseEvent) => void;
    onMouseLeave: (e: React.MouseEvent) => void;
  };
}

export function useFlipAnimation(config: FlipAnimationConfig = {}): UseFlipAnimationReturn {
  const {
    duration = 600,
    threshold = 50,
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

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const animateFlip = useCallback((
    direction: 'left' | 'right',
    startProgress = 0
  ) => {
    const startTime = performance.now();
    const endProgress = 100;
    const progressDelta = endProgress - startProgress;

    setAnimation(prev => ({
      ...prev,
      direction,
      isActive: true,
    }));

    onFlipStart?.(direction);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawProgress = startProgress + (progressDelta * (elapsed / duration));
      const progress = Math.min(rawProgress, 100);

      setAnimation(prev => ({
        ...prev,
        progress,
      }));

      if (progress < 100) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setAnimation({
          direction,
          progress: 0,
          isActive: false,
        });
        onFlipEnd?.(direction);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [duration, onFlipStart, onFlipEnd]);

  const flipLeft = useCallback(() => {
    if (!animation.isActive) {
      animateFlip('left');
    }
  }, [animation.isActive, animateFlip]);

  const flipRight = useCallback(() => {
    if (!animation.isActive) {
      animateFlip('right');
    }
  }, [animation.isActive, animateFlip]);

  const cancelFlip = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAnimation({
      direction: 'right',
      progress: 0,
      isActive: false,
    });
  }, []);

  // Touch/Mouse event handlers
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

    // Determine direction
    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    gestureRef.current = {
      ...gestureRef.current,
      deltaX,
      deltaY,
      velocity,
      direction,
    };

    lastTimeRef.current = currentTime;

    // Update animation progress during drag
    if (Math.abs(deltaX) > 10) {
      const progress = Math.min(Math.abs(deltaX) / 200 * 100, 50);
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

    // Check if gesture meets threshold for flip
    if (
      (Math.abs(deltaX) > threshold || velocity > 0.5) &&
      (direction === 'left' || direction === 'right')
    ) {
      animateFlip(direction, animation.progress);
    } else {
      // Cancel animation
      cancelFlip();
    }
  }, [threshold, animation.progress, animateFlip, cancelFlip]);

  const handlers = {
    onTouchStart: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    },
    onTouchMove: (e: React.TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    },
    onTouchEnd: () => {
      handleEnd();
    },
    onMouseDown: (e: React.MouseEvent) => {
      handleStart(e.clientX, e.clientY);
    },
    onMouseMove: (e: React.MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    },
    onMouseUp: () => {
      handleEnd();
    },
    onMouseLeave: () => {
      if (isDraggingRef.current) {
        handleEnd();
      }
    },
  };

  return {
    animation,
    isFlipping: animation.isActive,
    flipLeft,
    flipRight,
    cancelFlip,
    handlers,
  };
}

export default useFlipAnimation;
