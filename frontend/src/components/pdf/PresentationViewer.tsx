import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  X,
  Highlighter,
  BookOpen,
  Search
} from 'lucide-react';
import { useResponsive } from '@/hooks';
import type { Page } from '@/types';

interface PresentationViewerProps {
  pages: Page[];
  initialPage?: number;
  bookTitle?: string;
  onClose: () => void;
  onPageChange?: (page: number) => void;
}

interface Highlight {
  id: string;
  pageNum: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export const PresentationViewer: React.FC<PresentationViewerProps> = ({
  pages,
  initialPage = 1,
  bookTitle = 'کتاب',
  onClose,
  onPageChange,
}) => {
  const { isMobile, screenWidth, screenHeight } = useResponsive();
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPageRef = useRef<HTMLDivElement>(null);
  const rightPageRef = useRef<HTMLDivElement>(null);
  
  const [currentSpread, setCurrentSpread] = useState(Math.floor((initialPage - 1) / 2));
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Page flip animation state
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipProgress, setFlipProgress] = useState(0);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchPage, setSearchPage] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Highlight state
  const [isHighlightMode, setIsHighlightMode] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [currentDraw, setCurrentDraw] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [highlightColor, setHighlightColor] = useState('rgba(92, 0, 37, 0.3)');
  const [activePageForHighlight, setActivePageForHighlight] = useState<'left' | 'right' | null>(null);

  const totalPages = pages.length;
  const totalSpreads = Math.ceil(totalPages / 2);
  const minZoom = 0.5;
  const maxZoom = 2.0;

  const leftPageNum = currentSpread * 2 + 1;
  const rightPageNum = currentSpread * 2 + 2;

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { 
      document.body.style.overflow = ''; 
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const pageDimensions = useMemo(() => {
    const aspectRatio = 3 / 4;
    const maxBookWidth = screenWidth * (isMobile ? 0.95 : 0.85);
    const maxBookHeight = screenHeight * 0.72;
    
    let pageWidth = (maxBookWidth - 20) / 2;
    let pageHeight = pageWidth / aspectRatio;
    
    if (pageHeight > maxBookHeight) {
      pageHeight = maxBookHeight;
      pageWidth = pageHeight * aspectRatio;
    }
    
    return { 
      width: pageWidth * zoomLevel, 
      height: pageHeight * zoomLevel,
      bookWidth: (pageWidth * 2 + 20) * zoomLevel
    };
  }, [screenWidth, screenHeight, isMobile, zoomLevel]);

  const goToSpread = useCallback((spread: number) => {
    const validSpread = Math.max(0, Math.min(spread, totalSpreads - 1));
    if (validSpread !== currentSpread) {
      setCurrentSpread(validSpread);
      onPageChange?.(validSpread * 2 + 1);
    }
  }, [currentSpread, totalSpreads, onPageChange]);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    const spread = Math.floor((validPage - 1) / 2);
    goToSpread(spread);
  }, [totalPages, goToSpread]);

  // Smooth realistic page flip animation
  const animateFlip = useCallback((direction: 'next' | 'prev') => {
    if (isFlipping) return;
    if (direction === 'next' && currentSpread >= totalSpreads - 1) return;
    if (direction === 'prev' && currentSpread <= 0) return;

    setIsFlipping(true);
    setFlipDirection(direction);
    setFlipProgress(0);

    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);
      
      // Smooth easing curve
      const progress = rawProgress < 0.5
        ? 4 * rawProgress * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;

      setFlipProgress(progress);

      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Complete flip
        if (direction === 'next') {
          goToSpread(currentSpread + 1);
        } else {
          goToSpread(currentSpread - 1);
        }
        setIsFlipping(false);
        setFlipDirection(null);
        setFlipProgress(0);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [isFlipping, currentSpread, totalSpreads, goToSpread]);

  const flipNext = useCallback(() => animateFlip('next'), [animateFlip]);
  const flipPrev = useCallback(() => animateFlip('prev'), [animateFlip]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSearch) {
        if (e.key === 'Escape') setShowSearch(false);
        return;
      }
      if (isHighlightMode && e.key === 'Escape') {
        setIsHighlightMode(false);
        return;
      }
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          flipNext();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          flipPrev();
          break;
        case 'Escape':
          isFullscreen ? document.exitFullscreen() : onClose();
          break;
        case 'f':
        case 'F':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowSearch(true);
          }
          break;
        case 'g':
        case 'G':
          e.preventDefault();
          setShowSearch(true);
          break;
        case '+':
        case '=':
          setZoomLevel(z => Math.min(z + 0.1, maxZoom));
          break;
        case '-':
          setZoomLevel(z => Math.max(z - 0.1, minZoom));
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipNext, flipPrev, onClose, isFullscreen, isHighlightMode, showSearch]);

  // Touch handling
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isHighlightMode || showSearch) return;
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isHighlightMode || showSearch) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? flipNext() : flipPrev();
    }
  };

  const getPageImage = (pageNum: number) => {
    const page = pages[pageNum - 1];
    if (!page) return null;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return page.image_url?.startsWith('http') ? page.image_url : `${baseUrl}${page.image_url}`;
  };

  const toggleFullscreen = () => {
    !document.fullscreenElement ? containerRef.current?.requestFullscreen() : document.exitFullscreen();
  };

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(searchPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      goToPage(page);
      setShowSearch(false);
      setSearchPage('');
    }
  };

  // Highlight handlers
  const handleHighlightStart = (e: React.MouseEvent, side: 'left' | 'right') => {
    if (!isHighlightMode) return;
    const ref = side === 'left' ? leftPageRef.current : rightPageRef.current;
    if (!ref) return;
    const rect = ref.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDrawing(true);
    setActivePageForHighlight(side);
    setDrawStart({ x, y });
    setCurrentDraw({ x, y, width: 0, height: 0 });
  };

  const handleHighlightMove = (e: React.MouseEvent) => {
    if (!isDrawing || !activePageForHighlight) return;
    const ref = activePageForHighlight === 'left' ? leftPageRef.current : rightPageRef.current;
    if (!ref) return;
    const rect = ref.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const currentY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setCurrentDraw({
      x: Math.min(drawStart.x, currentX),
      y: Math.min(drawStart.y, currentY),
      width: Math.abs(currentX - drawStart.x),
      height: Math.abs(currentY - drawStart.y),
    });
  };

  const handleHighlightEnd = () => {
    if (!isDrawing || !activePageForHighlight) return;
    if (currentDraw.width > 1 && currentDraw.height > 1) {
      const pageNum = activePageForHighlight === 'left' ? leftPageNum : rightPageNum;
      setHighlights(prev => [...prev, {
        id: Date.now().toString(),
        pageNum,
        x: currentDraw.x,
        y: currentDraw.y,
        width: currentDraw.width,
        height: currentDraw.height,
        color: highlightColor,
      }]);
    }
    setIsDrawing(false);
    setActivePageForHighlight(null);
    setCurrentDraw({ x: 0, y: 0, width: 0, height: 0 });
  };

  const highlightColors = [
    { name: 'برند', color: 'rgba(92, 0, 37, 0.3)' },
    { name: 'زرد', color: 'rgba(255, 235, 59, 0.4)' },
    { name: 'سبز', color: 'rgba(76, 175, 80, 0.3)' },
    { name: 'آبی', color: 'rgba(33, 150, 243, 0.3)' },
  ];

  if (!mounted) return null;

  // Render page
  const renderPage = (pageNum: number, side: 'left' | 'right') => {
    const imageUrl = getPageImage(pageNum);
    const isValidPage = pageNum <= totalPages && pageNum > 0;
    const pageHighlights = highlights.filter(h => h.pageNum === pageNum);
    const ref = side === 'left' ? leftPageRef : rightPageRef;

    return (
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          width: pageDimensions.width,
          height: pageDimensions.height,
          background: isValidPage 
            ? 'linear-gradient(135deg, #FFFEF7 0%, #FBF9F3 50%, #F5F0E8 100%)'
            : 'linear-gradient(135deg, #f5f2ed 0%, #ebe7e0 100%)',
          borderRadius: side === 'left' ? '3px 0 0 3px' : '0 3px 3px 0',
          cursor: isHighlightMode ? 'crosshair' : 'default',
        }}
        onMouseDown={(e) => handleHighlightStart(e, side)}
        onMouseMove={handleHighlightMove}
        onMouseUp={handleHighlightEnd}
        onMouseLeave={handleHighlightEnd}
      >
        {/* Paper texture */}
        <div className="absolute inset-0 opacity-[0.15] pointer-events-none" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />

        {isValidPage && imageUrl ? (
          <img src={imageUrl} alt={`صفحه ${pageNum}`} className="w-full h-full object-contain select-none relative z-10" draggable={false} />
        ) : isValidPage ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300" />
              <p className="text-sm mt-2 text-gray-400">صفحه {pageNum}</p>
            </div>
          </div>
        ) : null}

        {/* Inner shadow */}
        <div className="absolute inset-0 pointer-events-none z-20" style={{
          background: side === 'left'
            ? 'linear-gradient(to left, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.03) 5%, transparent 15%)'
            : 'linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.03) 5%, transparent 15%)',
        }} />

        {/* Highlights */}
        {pageHighlights.map((h) => (
          <div key={h.id} className="absolute z-30 group cursor-pointer" style={{
            left: `${h.x}%`, top: `${h.y}%`, width: `${h.width}%`, height: `${h.height}%`,
            backgroundColor: h.color, borderRadius: '2px',
          }} onClick={() => isHighlightMode && setHighlights(prev => prev.filter(x => x.id !== h.id))}>
            {isHighlightMode && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center">
                <X className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Current drawing */}
        {isDrawing && activePageForHighlight === side && currentDraw.width > 0 && (
          <div className="absolute pointer-events-none z-40" style={{
            left: `${currentDraw.x}%`, top: `${currentDraw.y}%`,
            width: `${currentDraw.width}%`, height: `${currentDraw.height}%`,
            backgroundColor: highlightColor, border: '2px dashed rgba(92,0,37,0.5)', borderRadius: '2px',
          }} />
        )}

        {/* Page number */}
        <div className={`absolute bottom-2 text-xs text-gray-400 z-20 ${side === 'left' ? 'left-3' : 'right-3'}`}>
          {isValidPage ? pageNum : ''}
        </div>
      </div>
    );
  };

  // Render flipping page overlay
  const renderFlippingPage = () => {
    if (!isFlipping || !flipDirection) return null;

    const progress = flipProgress;
    const rotation = flipDirection === 'next' ? -progress * 180 : -180 + progress * 180;
    const pageNum = flipDirection === 'next' ? rightPageNum : leftPageNum;
    const nextPageNum = flipDirection === 'next' ? rightPageNum + 1 : leftPageNum - 1;
    const imageUrl = getPageImage(pageNum);
    const backImageUrl = getPageImage(nextPageNum);
    
    // Calculate shadow and lighting
    const shadowIntensity = Math.sin(progress * Math.PI) * 0.5;
    const bendAmount = Math.sin(progress * Math.PI) * 8;

    return (
      <div
        className="absolute top-0 pointer-events-none"
        style={{
          width: pageDimensions.width,
          height: pageDimensions.height,
          left: flipDirection === 'next' ? pageDimensions.width + (isMobile ? 8 : 14) : 0,
          transformStyle: 'preserve-3d',
          transformOrigin: flipDirection === 'next' ? 'left center' : 'right center',
          transform: `perspective(2500px) rotateY(${rotation}deg)`,
          zIndex: 50,
          filter: `drop-shadow(${flipDirection === 'next' ? -1 : 1} * ${15 * shadowIntensity}px ${10 * shadowIntensity}px ${25 * shadowIntensity}px rgba(0,0,0,${shadowIntensity * 0.6}))`,
        }}
      >
        {/* Front of page */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #FFFEF7 0%, #FBF9F3 50%, #F5F0E8 100%)',
            borderRadius: flipDirection === 'next' ? '0 3px 3px 0' : '3px 0 0 3px',
          }}
        >
          {imageUrl && (
            <img src={imageUrl} className="w-full h-full object-contain" draggable={false} />
          )}
          {/* Bend shadow */}
          <div className="absolute inset-0" style={{
            background: flipDirection === 'next'
              ? `linear-gradient(to right, transparent ${100 - progress * 40}%, rgba(0,0,0,${0.15 * progress}) 100%)`
              : `linear-gradient(to left, transparent ${100 - progress * 40}%, rgba(0,0,0,${0.15 * progress}) 100%)`,
          }} />
          {/* Shine effect */}
          <div className="absolute inset-0" style={{
            background: `linear-gradient(${flipDirection === 'next' ? 110 + progress * 40 : 70 - progress * 40}deg, transparent 30%, rgba(255,255,255,${0.25 * Math.sin(progress * Math.PI)}) 50%, transparent 70%)`,
          }} />
        </div>

        {/* Back of page */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            background: 'linear-gradient(135deg, #FFFEF7 0%, #FBF9F3 50%, #F5F0E8 100%)',
            borderRadius: flipDirection === 'next' ? '3px 0 0 3px' : '0 3px 3px 0',
          }}
        >
          {backImageUrl && (
            <img src={backImageUrl} className="w-full h-full object-contain" draggable={false} />
          )}
          {/* Back shadow */}
          <div className="absolute inset-0" style={{
            background: flipDirection === 'next'
              ? `linear-gradient(to left, transparent ${progress * 40}%, rgba(0,0,0,${0.1 * (1 - progress)}) 100%)`
              : `linear-gradient(to right, transparent ${progress * 40}%, rgba(0,0,0,${0.1 * (1 - progress)}) 100%)`,
          }} />
        </div>
      </div>
    );
  };

  const content = (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        background: `
          radial-gradient(ellipse at top, rgba(92, 0, 37, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(92, 0, 37, 0.1) 0%, transparent 50%),
          linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%)
        `,
      }}
    >
      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 z-50 p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden shadow-lg">
            <img src="/logo/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-white/80 font-medium text-sm sm:text-base hidden sm:block truncate max-w-[200px]">{bookTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <button onClick={() => setShowSearch(true)} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all" title="جستجوی صفحه (G)">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Zoom */}
          <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full px-2 py-1">
            <button onClick={() => setZoomLevel(z => Math.max(z - 0.2, minZoom))} className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30" disabled={zoomLevel <= minZoom}>
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs text-white/70 min-w-[40px] text-center">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={() => setZoomLevel(z => Math.min(z + 0.2, maxZoom))} className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30" disabled={zoomLevel >= maxZoom}>
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Highlight */}
          <button onClick={() => setIsHighlightMode(!isHighlightMode)} className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all ${isHighlightMode ? 'text-white shadow-lg' : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'}`} style={isHighlightMode ? { backgroundColor: '#5c0025' } : {}}>
            <Highlighter className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20">
            {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>

          {/* Close */}
          <button onClick={onClose} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/50">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Highlight Colors */}
      {isHighlightMode && (
        <div className="absolute top-16 sm:top-20 right-4 z-50 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-3 py-2">
          <span className="text-white/60 text-xs ml-2">رنگ:</span>
          {highlightColors.map((c) => (
            <button key={c.color} onClick={() => setHighlightColor(c.color)} className={`w-6 h-6 rounded-full border-2 transition-all ${highlightColor === c.color ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: c.color.replace(/0\.[34]/, '0.8') }} />
          ))}
        </div>
      )}
