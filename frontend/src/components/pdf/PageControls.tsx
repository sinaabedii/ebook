/**
 * Page Controls Components
 * Navigation and settings controls for the book viewer
 */

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  BookOpen,
  FileText,
  Settings,
} from 'lucide-react';
import type { ViewerSettings } from '@/types';

// =============================================================================
// Types
// =============================================================================

interface PageControlsProps {
  currentPage: number;
  totalPages: number;
  settings: ViewerSettings;
  isFullscreen: boolean;
  onPageChange: (page: number) => void;
  onSettingsChange: (settings: Partial<ViewerSettings>) => void;
  onToggleFullscreen: () => void;
  className?: string;
}

interface CompactPageControlsProps {
  currentPage: number;
  totalPages: number;
  isFullscreen: boolean;
  onPageChange: (page: number) => void;
  onToggleFullscreen: () => void;
  className?: string;
}

// =============================================================================
// Full Page Controls (Desktop)
// =============================================================================

export const PageControls: React.FC<PageControlsProps> = ({
  currentPage,
  totalPages,
  settings,
  isFullscreen,
  onPageChange,
  onSettingsChange,
  onToggleFullscreen,
  className = '',
}) => {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    onPageChange(validPage);
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(settings.zoomLevel + 0.25, 3);
    onSettingsChange({ zoomLevel: newZoom });
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(settings.zoomLevel - 0.25, 0.5);
    onSettingsChange({ zoomLevel: newZoom });
  };

  const togglePageMode = () => {
    onSettingsChange({
      pageMode: settings.pageMode === 'single' ? 'double' : 'single',
    });
  };

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Navigation Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(1)}
          disabled={!canGoPrevious}
          className="control-btn"
          aria-label="صفحه اول"
          title="صفحه اول"
        >
          <ChevronsRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={!canGoPrevious}
          className="control-btn"
          aria-label="صفحه قبل"
          title="صفحه قبل"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Page indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
          <input
            type="number"
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
            className="w-12 text-center bg-transparent text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min={1}
            max={totalPages}
          />
          <span className="text-slate-400">از</span>
          <span className="text-white">{totalPages}</span>
        </div>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={!canGoNext}
          className="control-btn"
          aria-label="صفحه بعد"
          title="صفحه بعد"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => goToPage(totalPages)}
          disabled={!canGoNext}
          className="control-btn"
          aria-label="صفحه آخر"
          title="صفحه آخر"
        >
          <ChevronsLeft className="w-5 h-5" />
        </button>
      </div>

      {/* View Controls */}
      <div className="flex items-center gap-1">
        {/* Zoom controls */}
        <button
          onClick={handleZoomOut}
          disabled={settings.zoomLevel <= 0.5}
          className="control-btn"
          aria-label="کوچک‌نمایی"
          title="کوچک‌نمایی"
        >
          <ZoomOut className="w-5 h-5" />
        </button>

        <span className="px-2 text-sm text-slate-400 min-w-[4rem] text-center">
          {Math.round(settings.zoomLevel * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          disabled={settings.zoomLevel >= 3}
          className="control-btn"
          aria-label="بزرگ‌نمایی"
          title="بزرگ‌نمایی"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-slate-700 mx-2" />

        {/* Page mode toggle */}
        <button
          onClick={togglePageMode}
          className={`control-btn ${settings.pageMode === 'double' ? 'bg-primary-500/20' : ''}`}
          aria-label="تغییر حالت نمایش"
          title={settings.pageMode === 'single' ? 'نمایش دو صفحه' : 'نمایش تک صفحه'}
        >
          {settings.pageMode === 'single' ? (
            <FileText className="w-5 h-5" />
          ) : (
            <BookOpen className="w-5 h-5" />
          )}
        </button>

        {/* Fullscreen toggle */}
        <button
          onClick={onToggleFullscreen}
          className="control-btn"
          aria-label={isFullscreen ? 'خروج از تمام صفحه' : 'تمام صفحه'}
          title={isFullscreen ? 'خروج از تمام صفحه' : 'تمام صفحه'}
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>

        {/* Settings */}
        <button
          onClick={() => onSettingsChange({ showThumbnails: !settings.showThumbnails })}
          className={`control-btn ${settings.showThumbnails ? 'bg-primary-500/20' : ''}`}
          aria-label="تنظیمات"
          title="تنظیمات"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// Compact Page Controls (Mobile)
// =============================================================================

export const CompactPageControls: React.FC<CompactPageControlsProps> = ({
  currentPage,
  totalPages,
  isFullscreen,
  onPageChange,
  onToggleFullscreen,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage <= 1}
        className="p-2 sm:p-2.5 rounded-lg bg-surface-800/50 text-surface-300 hover:bg-surface-700 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="صفحه قبل"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <div className="flex items-center gap-2 text-sm sm:text-base bg-surface-800/30 px-3 py-1.5 rounded-lg">
        <span className="text-white font-medium">{currentPage}</span>
        <span className="text-surface-600">/</span>
        <span className="text-surface-400">{totalPages}</span>
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage >= totalPages}
        className="p-2 sm:p-2.5 rounded-lg bg-surface-800/50 text-surface-300 hover:bg-surface-700 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="صفحه بعد"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <button
        onClick={onToggleFullscreen}
        className="p-2 sm:p-2.5 rounded-lg bg-surface-800/50 text-surface-300 hover:bg-surface-700 hover:text-white transition-colors"
        aria-label={isFullscreen ? 'خروج از تمام صفحه' : 'تمام صفحه'}
      >
        {isFullscreen ? (
          <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
        ) : (
          <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
      </button>
    </div>
  );
};

export default PageControls;
