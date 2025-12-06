import { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import type { Page } from '@/types';

// Set the worker source
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

interface PdfProcessorState {
  pages: Page[];
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  progress: number;
}

interface UsePdfProcessorReturn extends PdfProcessorState {
  loadPdf: (file: File | string) => Promise<void>;
  renderPage: (pageNumber: number, scale?: number) => Promise<string | null>;
  cancelLoading: () => void;
  reset: () => void;
}

export function usePdfProcessor(): UsePdfProcessorReturn {
  const [state, setState] = useState<PdfProcessorState>({
    pages: [],
    totalPages: 0,
    isLoading: false,
    error: null,
    progress: 0,
  });

  const pdfDocRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pageCanvasCache = useRef<Map<number, string>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy();
      }
      abortControllerRef.current?.abort();
      pageCanvasCache.current.clear();
    };
  }, []);

  const loadPdf = useCallback(async (source: File | string) => {
    try {
      // Reset previous state
      setState(prev => ({ ...prev, isLoading: true, error: null, progress: 0 }));
      abortControllerRef.current = new AbortController();

      // Clean up previous document
      if (pdfDocRef.current) {
        await pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
      pageCanvasCache.current.clear();

      // Load PDF
      let pdfSource: string | ArrayBuffer;
      if (source instanceof File) {
        pdfSource = await source.arrayBuffer();
      } else {
        pdfSource = source;
      }

      const loadingTask = pdfjs.getDocument({
        data: pdfSource instanceof ArrayBuffer ? pdfSource : undefined,
        url: typeof pdfSource === 'string' ? pdfSource : undefined,
      });

      loadingTask.onProgress = (progress) => {
        if (progress.total > 0) {
          const percentage = (progress.loaded / progress.total) * 100;
          setState(prev => ({ ...prev, progress: percentage }));
        }
      };

      const pdfDoc = await loadingTask.promise;
      pdfDocRef.current = pdfDoc;

      // Create page metadata
      const pages: Page[] = [];
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        
        pages.push({
          id: i,
          book_id: 0,
          page_number: i,
          image_url: '',
          thumbnail_url: '',
          width: viewport.width,
          height: viewport.height,
        });
      }

      setState({
        pages,
        totalPages: pdfDoc.numPages,
        isLoading: false,
        error: null,
        progress: 100,
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to load PDF',
        }));
      }
    }
  }, []);

  const renderPage = useCallback(async (pageNumber: number, scale = 1.5): Promise<string | null> => {
    if (!pdfDocRef.current || pageNumber < 1 || pageNumber > state.totalPages) {
      return null;
    }

    // Check cache
    const cacheKey = `${pageNumber}-${scale}`;
    if (pageCanvasCache.current.has(pageNumber)) {
      return pageCanvasCache.current.get(pageNumber) || null;
    }

    try {
      const page = await pdfDocRef.current.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      // Create offscreen canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return null;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Cache the result
      pageCanvasCache.current.set(pageNumber, dataUrl);
      
      return dataUrl;
    } catch (error) {
      console.error(`Error rendering page ${pageNumber}:`, error);
      return null;
    }
  }, [state.totalPages]);

  const cancelLoading = useCallback(() => {
    abortControllerRef.current?.abort();
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    if (pdfDocRef.current) {
      pdfDocRef.current.destroy();
      pdfDocRef.current = null;
    }
    pageCanvasCache.current.clear();
    setState({
      pages: [],
      totalPages: 0,
      isLoading: false,
      error: null,
      progress: 0,
    });
  }, []);

  return {
    ...state,
    loadPdf,
    renderPage,
    cancelLoading,
    reset,
  };
}

export default usePdfProcessor;
