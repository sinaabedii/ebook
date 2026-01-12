import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn,
  ZoomOut,
  Maximize,
  Volume2,
  VolumeX,
  BookOpen
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

export const PresentationViewer: React.FC<PresentationViewerProps> = ({
  pages,
  initialPage = 1,
  bookTitle = 'کتاب',
  onClose,
  onPageChange,
}) => {
  const { isMobile, screenWidth, screenHeight } = useResponsive();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipProgress, setFlipProgress] = useState(0);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev' | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // For smooth animation
  const animationRef = useRef<number | null>(null);
  const flipDuration = 600; // ms
  
  // For drag-based flipping
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragCurrentX, setDragCurrentX] = useState(0);
  const dragThreshold = 0.3; // 30% drag to complete flip
  
  // For double page view in desktop
  const isDoublePage = !isMobile && screenWidth > 900;
  const totalPages = pages.length;

  // Portal mounting
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Calculate page dimensions based on zoom level
  const pageDimensions = useMemo(() => {
    const aspectRatio = 3 / 4; // Standard book aspect ratio
    const maxWidth = screenWidth * (isMobile ? 0.92 : isDoublePage ? 0.75 : 0.55);
    const maxHeight = screenHeight * 0.78;
    
    let pageWidth: number;
    let pageHeight: number;
    
    if (isDoublePage) {
      // Two pages side by side
      const availableWidthPerPage = (maxWidth - 20) / 2;
      pageWidth = Math.min(availableWidthPerPage, maxHeight * aspectRatio);
      pageHeight = pageWidth / aspectRatio;
      
      if (pageHeight > maxHeight) {
        pageHeight = maxHeight;
        pageWidth = pageHeight * aspectRatio;
      }
    } else {
      // Single page
      pageWidth = Math.min(maxWidth, maxHeight * aspectRatio);
      pageHeight = pageWidth / aspectRatio;
      
      if (pageHeight > maxHeight) {
        pageHeight = maxHeight;
        pageWidth = pageHeight * aspectRatio;
      }
    }
    
    return { width: pageWidth * zoomLevel, height: pageHeight * zoomLevel };
  }, [screenWidth, screenHeight, isMobile, isDoublePage, zoomLevel]);

  // Navigation
  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    if (validPage !== currentPage && !isFlipping) {
      setCurrentPage(validPage);
      onPageChange?.(validPage);
    }
  }, [currentPage, totalPages, isFlipping, onPageChange]);

  // Smooth flip animation using requestAnimationFrame
  const animateFlip = useCallback((direction: 'next' | 'prev') => {
    if (isFlipping) return;
    if (direction === 'next' && currentPage >= totalPages) return;
    if (direction === 'prev' && currentPage <= 1) return;
    
    setIsFlipping(true);
    setFlipDirection(direction);
    setFlipProgress(0);
    
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / flipDuration, 1);
      
      // Easing function for smooth animation (ease-in-out)
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      setFlipProgress(easeProgress);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete - update page
        const increment = isDoublePage ? 2 : 1;
        if (direction === 'next') {
          goToPage(Math.min(currentPage + increment, totalPages));
        } else {
          goToPage(Math.max(currentPage - increment, 1));
        }
        setIsFlipping(false);
        setFlipDirection(null);
        setFlipProgress(0);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isFlipping, currentPage, totalPages, isDoublePage, goToPage, flipDuration]);

  const flipNext = useCallback(() => animateFlip('next'), [animateFlip]);
  const flipPrev = useCallback(() => animateFlip('prev'), [animateFlip]);
  
  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
          onClose();
          break;
        case 'Home':
          goToPage(1);
          break;
        case 'End':
          goToPage(totalPages);
          break;
        case '+':
        case '=':
          setZoomLevel(z => Math.min(z + 0.1, 1.5));
          break;
        case '-':
          setZoomLevel(z => Math.max(z - 0.1, 0.7));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipNext, flipPrev, goToPage, onClose, totalPages]);

  // Calculate drag progress (0 to 1)
  const dragProgress = useMemo(() => {
    if (!isDragging) return 0;
    const dragDistance = dragCurrentX - dragStartX;
    const maxDrag = pageDimensions.width;
    return Math.min(Math.max(Math.abs(dragDistance) / maxDrag, 0), 1);
  }, [isDragging, dragStartX, dragCurrentX, pageDimensions.width]);
  
  // Determine drag direction
  const dragDirection = useMemo(() => {
    if (!isDragging) return null;
    const dragDistance = dragCurrentX - dragStartX;
    // In RTL, dragging right = next page, dragging left = prev page
    return dragDistance < 0 ? 'next' : 'prev';
  }, [isDragging, dragStartX, dragCurrentX]);

  // Mouse handlers for drag flipping
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isFlipping) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragCurrentX(e.clientX);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setDragCurrentX(e.clientX);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    const dragDistance = dragCurrentX - dragStartX;
    const maxDrag = pageDimensions.width;
    const progress = Math.abs(dragDistance) / maxDrag;
    
    if (progress > dragThreshold) {
      // Complete the flip
      if (dragDistance < 0 && currentPage < totalPages) {
        // Dragged left = next page
        completeFlipFromDrag('next', progress);
      } else if (dragDistance > 0 && currentPage > 1) {
        // Dragged right = prev page
        completeFlipFromDrag('prev', progress);
      } else {
        // Can't flip, spring back
        springBack();
      }
    } else {
      // Not enough drag, spring back
      springBack();
    }
    
    setIsDragging(false);
  }, [isDragging, dragStartX, dragCurrentX, pageDimensions.width, currentPage, totalPages, dragThreshold]);

  // Touch handlers for drag flipping
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isFlipping) return;
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragCurrentX(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // Complete flip animation from drag position
  const completeFlipFromDrag = useCallback((direction: 'next' | 'prev', startProgress: number) => {
    setIsFlipping(true);
    setFlipDirection(direction);
    setFlipProgress(startProgress);
    
    const startTime = performance.now();
    const remainingDuration = flipDuration * (1 - startProgress);
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / remainingDuration, 1);
      
      // Ease out for completion
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const totalProgress = startProgress + (1 - startProgress) * easeProgress;
      
      setFlipProgress(totalProgress);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        const increment = isDoublePage ? 2 : 1;
        if (direction === 'next') {
          goToPage(Math.min(currentPage + increment, totalPages));
        } else {
          goToPage(Math.max(currentPage - increment, 1));
        }
        setIsFlipping(false);
        setFlipDirection(null);
        setFlipProgress(0);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [flipDuration, isDoublePage, currentPage, totalPages, goToPage]);

  // Spring back animation when drag is cancelled
  const springBack = useCallback(() => {
    const startProgress = dragProgress;
    if (startProgress === 0) return;
    
    const startTime = performance.now();
    const springDuration = 300;
    
    // Temporarily set flip direction for visual
    setFlipDirection(dragDirection);
    setFlipProgress(startProgress);
    setIsFlipping(true);
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / springDuration, 1);
      
      // Ease out for spring back
      const easeProgress = 1 - Math.pow(1 - progress, 2);
      const currentFlipProgress = startProgress * (1 - easeProgress);
      
      setFlipProgress(currentFlipProgress);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsFlipping(false);
        setFlipDirection(null);
        setFlipProgress(0);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
  }, [dragProgress, dragDirection]);

  // Add/remove mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Get page image URL
  const getPageImage = (pageNum: number) => {
    const page = pages[pageNum - 1];
    if (!page) return null;
    
    // Use full image URL from API
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return page.image_url?.startsWith('http') 
      ? page.image_url 
      : `${baseUrl}${page.image_url}`;
  };

  // Render a book page with realistic paper styling
  const renderPage = (pageNum: number, isLeft: boolean = false) => {
    const imageUrl = getPageImage(pageNum);
    if (!imageUrl && pageNum > totalPages) return null;
    
    return (
      <div
        className="relative overflow-hidden"
        style={{
          width: pageDimensions.width,
          height: pageDimensions.height,
          background: 'linear-gradient(135deg, #FFFEF7 0%, #FBF9F3 50%, #F7F4ED 100%)',
          borderRadius: isLeft ? '2px 0 0 2px' : '0 2px 2px 0',
          boxShadow: isLeft 
            ? 'inset -2px 0 8px rgba(0,0,0,0.08), -1px 0 3px rgba(0,0,0,0.05)'
            : 'inset 2px 0 8px rgba(0,0,0,0.08), 1px 0 3px rgba(0,0,0,0.05)',
        }}
      >
        {/* Paper texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            mixBlendMode: 'multiply',
          }}
        />
        
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`صفحه ${pageNum}`}
            className="w-full h-full object-contain select-none relative z-10"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative z-10">
            <div className="text-center">
              <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" style={{ color: 'rgba(242, 119, 148, 0.5)' }} />
              <p className="text-sm mt-2" style={{ color: 'rgba(242, 119, 148, 0.4)' }}>صفحه {pageNum}</p>
            </div>
          </div>
        )}
        
        {/* Inner shadow for page depth - enhanced */}
        <div 
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: isLeft
              ? `linear-gradient(to left, 
                  rgba(0,0,0,0.12) 0%, 
                  rgba(0,0,0,0.04) 3%,
                  transparent 10%
                )`
              : `linear-gradient(to right, 
                  rgba(0,0,0,0.12) 0%, 
                  rgba(0,0,0,0.04) 3%,
                  transparent 10%
                )`,
          }}
        />
        
        {/* Top edge highlight */}
        <div 
          className="absolute top-0 left-0 right-0 h-px pointer-events-none z-20"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5) 20%, rgba(255,255,255,0.5) 80%, transparent)',
          }}
        />
        
        {/* Page curl effect - bottom corner */}
        <div 
          className={`absolute bottom-0 w-16 h-16 pointer-events-none z-20 ${isLeft ? 'left-0' : 'right-0'}`}
          style={{
            background: isLeft
              ? 'linear-gradient(135deg, transparent 60%, rgba(0,0,0,0.04) 60%, rgba(0,0,0,0.08) 100%)'
              : 'linear-gradient(-135deg, transparent 60%, rgba(0,0,0,0.04) 60%, rgba(0,0,0,0.08) 100%)',
          }}
        />
        
        {/* Page number indicator */}
        <div 
          className={`absolute bottom-2 text-xs text-gray-400/60 z-20 ${isLeft ? 'left-3' : 'right-3'}`}
        >
          {pageNum}
        </div>
      </div>
    );
  };

  if (!mounted) return null;

  // Get left and right page numbers for double page view
  const leftPageNum = isDoublePage && currentPage > 1 ? currentPage - 1 : null;
  const rightPageNum = currentPage;

  const content = (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999] flex flex-col select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        background: `
          radial-gradient(ellipse at top, rgba(255,255,255,0.3) 0%, transparent 50%),
          radial-gradient(ellipse at bottom, rgba(0,0,0,0.1) 0%, transparent 50%),
          linear-gradient(180deg, #e5e0d8 0%, #d8d2c8 30%, #cec6ba 60%, #c4bbb0 100%)
        `,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
        <button
          onClick={() => setZoomLevel(z => Math.min(z + 0.1, 1.5))}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all"
          title="بزرگنمایی"
        >
          <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => {
            if (containerRef.current?.requestFullscreen) {
              containerRef.current.requestFullscreen();
            }
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all"
          title="تمام صفحه"
        >
          <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-gray-600 hover:text-gray-800 transition-all"
          title={soundEnabled ? 'قطع صدا' : 'پخش صدا'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={flipPrev}
        onMouseDown={e => e.stopPropagation()}
        disabled={currentPage <= 1 || isFlipping}
        className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/60 hover:bg-white/90 shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="صفحه قبل"
      >
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      
      <button
        onClick={flipNext}
        onMouseDown={e => e.stopPropagation()}
        disabled={currentPage >= totalPages || isFlipping}
        className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/60 hover:bg-white/90 shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="صفحه بعد"
      >
        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Book Container */}
      <div className="flex-1 flex items-center justify-center px-16 sm:px-24 py-8">
        <div 
          className="relative"
          style={{
            perspective: '2000px',
          }}
        >
          {/* Book Wrapper with realistic styling */}
          <div 
            className="relative"
            style={{
              transform: 'rotateX(3deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Book outer frame/cover effect */}
            <div
              className="absolute -inset-3 sm:-inset-4 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #8B7355 0%, #6B5344 50%, #5D4637 100%)',
                boxShadow: `
                  0 25px 50px -12px rgba(0,0,0,0.5),
                  0 12px 24px -8px rgba(0,0,0,0.3),
                  inset 0 1px 0 rgba(255,255,255,0.1),
                  inset 0 -1px 0 rgba(0,0,0,0.2)
                `,
                transform: 'translateZ(-10px)',
              }}
            />
            
            {/* Page edges effect - left side */}
            {isDoublePage && (
              <div
                className="absolute top-1 bottom-1 -left-2 w-2"
                style={{
                  background: `repeating-linear-gradient(
                    to bottom,
                    #f5f2ed 0px,
                    #e8e5e0 1px,
                    #f5f2ed 2px
                  )`,
                  borderRadius: '2px 0 0 2px',
                  boxShadow: 'inset 1px 0 2px rgba(0,0,0,0.1)',
                }}
              />
            )}
            
            {/* Page edges effect - right side */}
            <div
              className="absolute top-1 bottom-1 -right-2 w-2"
              style={{
                background: `repeating-linear-gradient(
                  to bottom,
                  #f5f2ed 0px,
                  #e8e5e0 1px,
                  #f5f2ed 2px
                )`,
                borderRadius: '0 2px 2px 0',
                boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.1)',
              }}
            />
            
            {/* Main book pages container */}
            <div className="relative flex">
            {isDoublePage ? (
              <>
                {/* Left Page (static) */}
                <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
                  {leftPageNum && renderPage(leftPageNum, true)}
                  {!leftPageNum && (
                    <div 
                      style={{ 
                        width: pageDimensions.width, 
                        height: pageDimensions.height,
                        backgroundColor: '#f5f2ed',
                        borderRadius: '3px 0 0 3px',
                      }} 
                    />
                  )}
                  
                  {/* Flipping page overlay for prev (drag or animation) */}
                  {(flipDirection === 'prev' || (isDragging && dragDirection === 'prev')) && currentPage > 1 && (() => {
                    const progress = isDragging ? dragProgress : flipProgress;
                    const bendAmount = Math.sin(progress * Math.PI) * 15;
                    const shadowIntensity = Math.sin(progress * Math.PI) * 0.4;
                    
                    return (
                      <div
                        className="absolute inset-0"
                        style={{
                          transformStyle: 'preserve-3d',
                          transformOrigin: 'left center',
                          transform: `
                            perspective(1800px) 
                            rotateY(${-180 + (progress * 180)}deg)
                            skewY(${-bendAmount * (progress < 0.5 ? 1 : -1) * 0.3}deg)
                          `,
                          zIndex: 20,
                          filter: `drop-shadow(${10 * shadowIntensity}px ${5 * shadowIntensity}px ${20 * shadowIntensity}px rgba(0,0,0,${shadowIntensity}))`,
                        }}
                      >
                        {/* Front of flipping page */}
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{
                            backfaceVisibility: 'hidden',
                            backgroundColor: '#FFFEF7',
                            borderRadius: '4px 0 0 4px',
                          }}
                        >
                          {getPageImage(currentPage - (isDoublePage ? 2 : 1)) && (
                            <img src={getPageImage(currentPage - (isDoublePage ? 2 : 1))!} className="w-full h-full object-contain" draggable={false} />
                          )}
                          {/* Page bend gradient */}
                          <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `linear-gradient(
                                to left,
                                transparent ${100 - progress * 60}%,
                                rgba(0,0,0,${0.15 * progress}) 100%
                              )`,
                            }}
                          />
                          {/* Shine effect */}
                          <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `linear-gradient(
                                ${70 - progress * 30}deg,
                                transparent 40%,
                                rgba(255,255,255,${0.3 * Math.sin(progress * Math.PI)}) 50%,
                                transparent 60%
                              )`,
                            }}
                          />
                        </div>
                        {/* Back of flipping page */}
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            backgroundColor: '#FFFEF7',
                            borderRadius: '0 4px 4px 0',
                          }}
                        >
                          {getPageImage(currentPage - (isDoublePage ? 1 : 0)) && (
                            <img src={getPageImage(currentPage - (isDoublePage ? 1 : 0))!} className="w-full h-full object-contain" draggable={false} />
                          )}
                          {/* Back page shadow */}
                          <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `linear-gradient(
                                to right,
                                transparent ${progress * 60}%,
                                rgba(0,0,0,${0.1 * (1 - progress)}) 100%
                              )`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Book Binding/Spine - Enhanced */}
                <div 
                  className="relative z-10"
                  style={{
                    width: '12px',
                    height: pageDimensions.height,
                    background: `linear-gradient(90deg, 
                      #8B7355 0%, 
                      #A08060 15%,
                      #c4b8a8 30%, 
                      #f0ece6 50%, 
                      #c4b8a8 70%,
                      #A08060 85%,
                      #8B7355 100%
                    )`,
                    boxShadow: `
                      inset 2px 0 4px rgba(0,0,0,0.2),
                      inset -2px 0 4px rgba(0,0,0,0.2),
                      inset 0 2px 4px rgba(0,0,0,0.1),
                      inset 0 -2px 4px rgba(0,0,0,0.1)
                    `,
                    borderLeft: '1px solid rgba(139,115,85,0.5)',
                    borderRight: '1px solid rgba(139,115,85,0.5)',
                  }}
                >
                  {/* Spine texture lines */}
                  <div className="absolute inset-0" style={{
                    background: `repeating-linear-gradient(
                      0deg,
                      transparent 0px,
                      rgba(0,0,0,0.03) 2px,
                      transparent 4px
                    )`,
                  }} />
                </div>

                {/* Right Page (static) */}
                <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
                  {renderPage(rightPageNum, false)}
                  
                  {/* Flipping page overlay for next (drag or animation) */}
                  {(flipDirection === 'next' || (isDragging && dragDirection === 'next')) && (() => {
                    const progress = isDragging ? dragProgress : flipProgress;
                    // Create a natural curve effect
                    const bendAmount = Math.sin(progress * Math.PI) * 15;
                    const shadowIntensity = Math.sin(progress * Math.PI) * 0.4;
                    
                    return (
                      <div
                        className="absolute inset-0"
                        style={{
                          transformStyle: 'preserve-3d',
                          transformOrigin: 'right center',
                          transform: `
                            perspective(1800px) 
                            rotateY(${-progress * 180}deg)
                            skewY(${bendAmount * (progress < 0.5 ? 1 : -1) * 0.3}deg)
                          `,
                          zIndex: 20,
                          filter: `drop-shadow(${-10 * shadowIntensity}px ${5 * shadowIntensity}px ${20 * shadowIntensity}px rgba(0,0,0,${shadowIntensity}))`,
                        }}
                      >
                        {/* Front of flipping page */}
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{
                            backfaceVisibility: 'hidden',
                            backgroundColor: '#FFFEF7',
                            borderRadius: '0 4px 4px 0',
                          }}
                        >
                          {getPageImage(rightPageNum) && (
                            <img src={getPageImage(rightPageNum)!} className="w-full h-full object-contain" draggable={false} />
                          )}
                          {/* Page bend gradient overlay */}
                          <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `linear-gradient(
                                to right,
                                transparent ${100 - progress * 60}%,
                                rgba(0,0,0,${0.15 * progress}) 100%
                              )`,
                            }}
                          />
                          {/* Shine effect */}
                          <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `linear-gradient(
                                ${110 + progress * 30}deg,
                                transparent 40%,
                                rgba(255,255,255,${0.3 * Math.sin(progress * Math.PI)}) 50%,
                                transparent 60%
                              )`,
                            }}
                          />
                        </div>
                        {/* Back of flipping page */}
                        <div
                          className="absolute inset-0 overflow-hidden"
                          style={{
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            backgroundColor: '#FFFEF7',
                            borderRadius: '4px 0 0 4px',
                          }}
                        >
                          {getPageImage(rightPageNum + 1) && (
                            <img src={getPageImage(rightPageNum + 1)!} className="w-full h-full object-contain" draggable={false} />
                          )}
                          {/* Back page shadow */}
                          <div 
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background: `linear-gradient(
                                to left,
                                transparent ${progress * 60}%,
                                rgba(0,0,0,${0.1 * (1 - progress)}) 100%
                              )`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              /* Single Page Mode */
              <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
                {renderPage(currentPage, false)}
                
                {/* Flipping page for single mode */}
                {(flipDirection || (isDragging && dragDirection)) && (() => {
                  const dir = flipDirection || dragDirection;
                  const progress = isDragging ? dragProgress : flipProgress;
                  const bendAmount = Math.sin(progress * Math.PI) * 12;
                  const shadowIntensity = Math.sin(progress * Math.PI) * 0.35;
                  
                  return (
                    <div
                      className="absolute inset-0"
                      style={{
                        transformStyle: 'preserve-3d',
                        transformOrigin: dir === 'next' ? 'right center' : 'left center',
                        transform: dir === 'next'
                          ? `perspective(1800px) rotateY(${-progress * 180}deg) skewY(${bendAmount * (progress < 0.5 ? 1 : -1) * 0.25}deg)`
                          : `perspective(1800px) rotateY(${-180 + (progress * 180)}deg) skewY(${-bendAmount * (progress < 0.5 ? 1 : -1) * 0.25}deg)`,
                        zIndex: 20,
                        filter: `drop-shadow(0 ${8 * shadowIntensity}px ${15 * shadowIntensity}px rgba(0,0,0,${shadowIntensity}))`,
                      }}
                    >
                      {/* Front of page */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{
                          backfaceVisibility: 'hidden',
                          backgroundColor: '#FFFEF7',
                          borderRadius: '4px',
                        }}
                      >
                        {getPageImage(currentPage) && (
                          <img src={getPageImage(currentPage)!} className="w-full h-full object-contain" draggable={false} />
                        )}
                        {/* Bend shadow */}
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: dir === 'next' 
                              ? `linear-gradient(to right, transparent ${100 - progress * 50}%, rgba(0,0,0,${0.12 * progress}) 100%)`
                              : `linear-gradient(to left, transparent ${100 - progress * 50}%, rgba(0,0,0,${0.12 * progress}) 100%)`,
                          }}
                        />
                        {/* Shine */}
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `linear-gradient(
                              ${dir === 'next' ? 110 + progress * 30 : 70 - progress * 30}deg,
                              transparent 35%,
                              rgba(255,255,255,${0.25 * Math.sin(progress * Math.PI)}) 50%,
                              transparent 65%
                            )`,
                          }}
                        />
                      </div>
                      {/* Back of page */}
                      <div
                        className="absolute inset-0 overflow-hidden"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          backgroundColor: '#FFFEF7',
                          borderRadius: '4px',
                        }}
                      >
                        {getPageImage(dir === 'next' ? currentPage + 1 : currentPage - 1) && (
                          <img src={getPageImage(dir === 'next' ? currentPage + 1 : currentPage - 1)!} className="w-full h-full object-contain" draggable={false} />
                        )}
                        <div 
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: dir === 'next'
                              ? `linear-gradient(to left, transparent ${progress * 50}%, rgba(0,0,0,${0.08 * (1 - progress)}) 100%)`
                              : `linear-gradient(to right, transparent ${progress * 50}%, rgba(0,0,0,${0.08 * (1 - progress)}) 100%)`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
            </div>
          </div>
          
          {/* Book Shadow - Enhanced */}
          <div 
            className="absolute -bottom-8 left-1/2 -translate-x-1/2"
            style={{
              width: isDoublePage ? pageDimensions.width * 2 + 40 : pageDimensions.width + 20,
              height: '40px',
              background: `
                radial-gradient(ellipse 100% 100% at center, 
                  rgba(0,0,0,0.35) 0%, 
                  rgba(0,0,0,0.2) 30%,
                  rgba(0,0,0,0.1) 50%,
                  transparent 70%
                )
              `,
              filter: 'blur(8px)',
              transform: 'translateZ(-20px)',
            }}
          />
        </div>
      </div>

      {/* Bottom Left Logo */}
      <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5c0025' }}>
          <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <span className="text-gray-600 font-medium text-sm sm:text-base hidden sm:block">
          ArianDoc
        </span>
      </div>

      {/* Close/Back Button - Bottom Right */}
      <button
        onClick={onClose}
        onMouseDown={e => e.stopPropagation()}
        className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors shadow-lg"
      >
        خروج
      </button>

      {/* Page Info - Bottom Center */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm shadow-md" onMouseDown={e => e.stopPropagation()}>
        <span className="text-gray-600 text-xs sm:text-sm">صفحه</span>
        <input
          type="number"
          min={1}
          max={totalPages}
          value={currentPage}
          onChange={(e) => {
            const page = parseInt(e.target.value);
            if (!isNaN(page) && page >= 1 && page <= totalPages) {
              goToPage(page);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur();
            }
            e.stopPropagation();
          }}
          className="w-12 sm:w-14 px-2 py-1 text-center text-gray-800 font-bold bg-white/80 rounded-lg border border-gray-300 outline-none text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          style={{ borderColor: 'var(--border-color)' }}
          onFocus={(e) => { e.target.style.borderColor = '#5c0025'; e.target.style.boxShadow = '0 0 0 3px rgba(92, 0, 37, 0.2)'; }}
          onBlur={(e) => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
        />
        <span className="text-gray-500 text-xs sm:text-sm">از</span>
        <span className="text-gray-600 font-medium text-sm sm:text-base">{totalPages}</span>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default PresentationViewer;
