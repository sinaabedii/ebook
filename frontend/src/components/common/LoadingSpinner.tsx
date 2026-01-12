/**
 * Loading Components
 * Various loading indicators and skeleton loaders
 */

import React from 'react';

// =============================================================================
// Types
// =============================================================================

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  text?: string;
}

interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  className?: string;
  label?: string;
}

interface SkeletonProps {
  className?: string;
}

// =============================================================================
// Size Classes
// =============================================================================

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

// =============================================================================
// Loading Spinner
// =============================================================================

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  text,
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full border-4 border-slate-700 animate-pulse`} />
        <div
          className={`${sizeClasses[size]} absolute top-0 left-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin`}
        />
      </div>
      {text && <span className="text-sm text-slate-400 animate-pulse">{text}</span>}
    </div>
  );
};

// =============================================================================
// Book Loading Spinner
// =============================================================================

export const BookLoadingSpinner: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative w-16 h-20">
        {/* Book shape */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-800 to-amber-900 rounded-r-md shadow-lg">
          {/* Spine */}
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-950 rounded-l-sm" />
          {/* Pages animation */}
          <div className="absolute right-1 top-1 bottom-1 left-3 bg-amber-50 rounded-r-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-300/50 to-transparent animate-pulse" />
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-1 mx-1 my-2 bg-slate-300/50 rounded animate-pulse"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
        {/* Floating page */}
        <div
          className="absolute right-0 top-0 w-10 h-14 bg-amber-50 rounded-sm shadow-md animate-float origin-left"
          style={{ animationDuration: '1.5s' }}
        />
      </div>
      <span className="text-slate-400 text-sm animate-pulse">در حال بارگذاری کتاب...</span>
    </div>
  );
};

// =============================================================================
// Progress Bar
// =============================================================================

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showPercentage = true,
  className = '',
  label,
}) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between mb-2 text-sm text-slate-400">
          {label && <span>{label}</span>}
          {showPercentage && <span>{Math.round(clampedProgress)}%</span>}
        </div>
      )}
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${clampedProgress}%` }} />
      </div>
    </div>
  );
};

// =============================================================================
// Book Card Skeleton
// =============================================================================

export const BookCardSkeleton: React.FC = () => {
  return (
    <div className="book-card p-4 animate-pulse">
      <div className="skeleton w-full h-48 mb-4" />
      <div className="skeleton h-6 w-3/4 mb-2" />
      <div className="skeleton h-4 w-1/2 mb-4" />
      <div className="flex gap-2">
        <div className="skeleton h-8 w-20" />
        <div className="skeleton h-8 w-20" />
      </div>
    </div>
  );
};

// =============================================================================
// Page Skeleton
// =============================================================================

export const PageSkeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`skeleton ${className}`}>
      <div className="absolute inset-4">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="h-3 bg-slate-600/30 rounded mb-3"
            style={{ width: `${70 + Math.random() * 25}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingSpinner;
