import React, { useEffect, useState, useRef, memo } from 'react';
import { PageSkeleton } from '@/components/common';

interface PageRendererProps {
  pageNumber: number;
  imageUrl: string | null;
  renderPage: (pageNumber: number, scale?: number) => Promise<string | null>;
  width?: number;
  height?: number;
  scale?: number;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

const PageRendererComponent: React.FC<PageRendererProps> = ({
  pageNumber,
  imageUrl,
  renderPage,
  width,
  height,
  scale = 1.5,
  className = '',
  onLoad,
  onError,
}) => {
  const [renderedImage, setRenderedImage] = useState<string | null>(imageUrl);
  const [isLoading, setIsLoading] = useState(!imageUrl);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (imageUrl) {
      setRenderedImage(imageUrl);
      setIsLoading(false);
      return;
    }

    const loadPage = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const image = await renderPage(pageNumber, scale);
        if (mountedRef.current) {
          if (image) {
            setRenderedImage(image);
            onLoad?.();
          } else {
            setHasError(true);
            onError?.(new Error(`Failed to render page ${pageNumber}`));
          }
          setIsLoading(false);
        }
      } catch (error) {
        if (mountedRef.current) {
          setHasError(true);
          setIsLoading(false);
          onError?.(error instanceof Error ? error : new Error('Unknown error'));
        }
      }
    };

    loadPage();
  }, [pageNumber, imageUrl, renderPage, scale, onLoad, onError]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-book-page shadow-page overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
        aspectRatio: !height ? '3/4' : undefined,
      }}
    >
      {/* Page content */}
      {isLoading && (
        <PageSkeleton className="absolute inset-0 w-full h-full" />
      )}

      {renderedImage && !isLoading && (
        <img
          src={renderedImage}
          alt={`صفحه ${pageNumber}`}
          className="w-full h-full object-contain"
          draggable={false}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
        />
      )}

      {hasError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50">
          <p className="text-slate-400 text-sm">خطا در بارگذاری صفحه {pageNumber}</p>
        </div>
      )}

      {/* Page number badge */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 
                      px-2 py-1 rounded bg-black/50 text-xs text-white/70">
        {pageNumber}
      </div>

      {/* Page shadow effect */}
      <div className="page-shadow" />
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const PageRenderer = memo(PageRendererComponent, (prevProps, nextProps) => {
  return (
    prevProps.pageNumber === nextProps.pageNumber &&
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.scale === nextProps.scale &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height
  );
});

// Thumbnail component
interface ThumbnailProps {
  pageNumber: number;
  imageUrl: string | null;
  renderPage: (pageNumber: number, scale?: number) => Promise<string | null>;
  isActive?: boolean;
  onClick?: () => void;
}

export const PageThumbnail: React.FC<ThumbnailProps> = memo(({
  pageNumber,
  imageUrl,
  renderPage,
  isActive = false,
  onClick,
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(imageUrl);
  const [isLoading, setIsLoading] = useState(!imageUrl);

  useEffect(() => {
    if (imageUrl) {
      setThumbnail(imageUrl);
      setIsLoading(false);
      return;
    }

    const loadThumbnail = async () => {
      setIsLoading(true);
      try {
        const image = await renderPage(pageNumber, 0.3);
        setThumbnail(image);
      } catch {
        // Silently fail for thumbnails
      }
      setIsLoading(false);
    };

    loadThumbnail();
  }, [pageNumber, imageUrl, renderPage]);

  return (
    <button
      onClick={onClick}
      className={`thumbnail-item ${isActive ? 'active' : ''}`}
    >
      {isLoading ? (
        <div className="w-full h-full skeleton" />
      ) : thumbnail ? (
        <img
          src={thumbnail}
          alt={`تامبنیل صفحه ${pageNumber}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-slate-700 flex items-center justify-center">
          <span className="text-xs text-slate-400">{pageNumber}</span>
        </div>
      )}
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute inset-0 border-2 border-primary-400 rounded-md" />
      )}
    </button>
  );
});

PageThumbnail.displayName = 'PageThumbnail';
PageRenderer.displayName = 'PageRenderer';

export default PageRenderer;
