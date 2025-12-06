import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePdfProcessor, useFlipAnimation, useResponsive } from '@/hooks';
import { PageRenderer, PageThumbnail } from './PageRenderer';
import { PageControls, CompactPageControls } from './PageControls';
import { BookLoadingSpinner, ErrorMessage } from '@/components/common';
import type { ViewerSettings, Page } from '@/types';

interface FlipBookViewerProps {
  file?: File;
  pdfUrl?: string;
  bookId?: number;
  pages?: Page[];
  initialPage?: number;
  className?: string;
  onPageChange?: (page: number) => void;
  onClose?: () => void;
}

const defaultSettings: ViewerSettings = {
  pageMode: 'double',
  fitMode: 'page',
  zoomLevel: 1,
  flipSpeed: 'normal',
  showThumbnails: true,
  enableSounds: false,
};

export const FlipBookViewer: React.FC<FlipBookViewerProps> = ({
  file,
  pdfUrl,
  bookId,
  pages: externalPages,
  initialPage = 1,
  className = '',
  onPageChange,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet, screenWidth } = useResponsive();
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settings, setSettings] = useState<ViewerSettings>({
    ...defaultSettings,
    pageMode: isMobile ? 'single' : 'double',
  });

  const {
    pages,
    totalPages,
    isLoading,
    error,
    progress,
    loadPdf,
    renderPage,
  } = usePdfProcessor();

  const {
    animation,
    isFlipping,
    flipLeft,
    flipRight,
    handlers,
  } = useFlipAnimation({
    duration: settings.flipSpeed === 'slow' ? 1000 : settings.flipSpeed === 'fast' ? 300 : 600,
    onFlipEnd: (direction) => {
      if (direction === 'left') {
        goToPage(currentPage + (settings.pageMode === 'double' ? 2 : 1));
      } else {
        goToPage(currentPage - (settings.pageMode === 'double' ? 2 : 1));
      }
    },
  });

  // Load PDF on mount
  useEffect(() => {
    if (file) {
      loadPdf(file);
    } else if (pdfUrl) {
      loadPdf(pdfUrl);
    }
  }, [file, pdfUrl, loadPdf]);

  // Update page mode based on screen size
  useEffect(() => {
    if (isMobile) {
      setSettings(prev => ({ ...prev, pageMode: 'single' }));
    }
  }, [isMobile]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.key === 'ArrowLeft') {
          flipLeft();
        } else {
          flipRight();
        }
      } else if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      } else if (e.key === 'Home') {
        goToPage(1);
      } else if (e.key === 'End') {
        goToPage(totalPages);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalPages, isFullscreen, flipLeft, flipRight]);

  const goToPage = useCallback((page: number) => {
    const effectivePages = externalPages?.length || totalPages;
    const validPage = Math.max(1, Math.min(page, effectivePages));
    setCurrentPage(validPage);
    onPageChange?.(validPage);
  }, [totalPages, externalPages, onPageChange]);

  const handleSettingsChange = useCallback((newSettings: Partial<ViewerSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, [isFullscreen]);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const effectivePages = externalPages?.length || totalPages;
  const effectiveIsLoading = isLoading && !externalPages;

  // Calculate page dimensions
  const getPageDimensions = () => {
    const containerWidth = containerRef.current?.clientWidth || screenWidth;
    const containerHeight = containerRef.current?.clientHeight || 600;
    
    const pageRatio = 3 / 4;
    let pageWidth: number;
    let pageHeight: number;

    if (settings.pageMode === 'double' && !isMobile) {
      pageWidth = Math.min((containerWidth - 48) / 2, 500);
    } else {
      pageWidth = Math.min(containerWidth - 32, 600);
    }
    
    pageHeight = pageWidth / pageRatio;
    
    if (pageHeight > containerHeight - 100) {
      pageHeight = containerHeight - 100;
      pageWidth = pageHeight * pageRatio;
    }

    return { pageWidth: pageWidth * settings.zoomLevel, pageHeight: pageHeight * settings.zoomLevel };
  };

  const { pageWidth, pageHeight } = getPageDimensions();

  if (effectiveIsLoading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[500px] ${className}`}>
        <BookLoadingSpinner />
        {progress > 0 && progress < 100 && (
          <div className="mt-4 w-48">
            <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-slate-400 text-center mt-2">
              {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title="خطا در بارگذاری PDF"
        message={error}
        onRetry={() => file ? loadPdf(file) : pdfUrl ? loadPdf(pdfUrl) : null}
        className={className}
      />
    );
  }

  if (effectivePages === 0) {
    return (
      <div className={`flex items-center justify-center min-h-[500px] ${className}`}>
        <p className="text-slate-400">هیچ صفحه‌ای یافت نشد</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`
        flex flex-col bg-slate-900 rounded-xl overflow-hidden
        ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}
        ${className}
      `}
    >
      {/* Controls - Top */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700/50 glass">
        {isMobile || isTablet ? (
          <CompactPageControls
            currentPage={currentPage}
            totalPages={effectivePages}
            isFullscreen={isFullscreen}
            onPageChange={goToPage}
            onToggleFullscreen={toggleFullscreen}
          />
        ) : (
          <PageControls
            currentPage={currentPage}
            totalPages={effectivePages}
            settings={settings}
            isFullscreen={isFullscreen}
            onPageChange={goToPage}
            onSettingsChange={handleSettingsChange}
            onToggleFullscreen={toggleFullscreen}
          />
        )}
      </div>

      {/* Book Area */}
      <div
        className="flex-1 flex items-center justify-center p-4 overflow-auto"
        {...handlers}
      >
        <div
          className="book-container flex gap-1"
          style={{
            transform: `scale(${isFlipping ? 0.98 : 1})`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          {/* Left Page (in double mode) */}
          {settings.pageMode === 'double' && !isMobile && currentPage > 1 && (
            <div
              className="relative"
              style={{
                width: pageWidth,
                height: pageHeight,
                transform: animation.isActive && animation.direction === 'right'
                  ? `rotateY(${animation.progress * 1.8}deg)`
                  : 'rotateY(0deg)',
                transformOrigin: 'right center',
                transformStyle: 'preserve-3d',
                transition: animation.isActive ? 'none' : 'transform 0.3s ease-out',
              }}
            >
              <PageRenderer
                pageNumber={currentPage - 1}
                imageUrl={externalPages?.[currentPage - 2]?.image_url || null}
                renderPage={renderPage}
                width={pageWidth}
                height={pageHeight}
                scale={settings.zoomLevel}
              />
            </div>
          )}

          {/* Current Page / Right Page */}
          <div
            className="relative book-page"
            style={{
              width: pageWidth,
              height: pageHeight,
              transform: animation.isActive && animation.direction === 'left'
                ? `rotateY(${-animation.progress * 1.8}deg)`
                : 'rotateY(0deg)',
              transformOrigin: 'left center',
              transformStyle: 'preserve-3d',
              transition: animation.isActive ? 'none' : 'transform 0.3s ease-out',
            }}
          >
            <PageRenderer
              pageNumber={currentPage}
              imageUrl={externalPages?.[currentPage - 1]?.image_url || null}
              renderPage={renderPage}
              width={pageWidth}
              height={pageHeight}
              scale={settings.zoomLevel}
            />
          </div>
        </div>
      </div>

      {/* Thumbnail Strip */}
      {settings.showThumbnails && !isMobile && (
        <div className="flex-shrink-0 border-t border-slate-700/50 p-2">
          <div className="thumbnail-strip">
            {Array.from({ length: effectivePages }, (_, i) => i + 1).map((pageNum) => (
              <PageThumbnail
                key={pageNum}
                pageNumber={pageNum}
                imageUrl={externalPages?.[pageNum - 1]?.thumbnail_url || null}
                renderPage={renderPage}
                isActive={pageNum === currentPage || (settings.pageMode === 'double' && pageNum === currentPage - 1)}
                onClick={() => goToPage(pageNum)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlipBookViewer;
