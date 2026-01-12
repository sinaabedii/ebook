/**
 * PDF Processor Hook
 * Handles PDF loading, rendering, and page management
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import * as pdfjs from 'pdfjs-dist';
import type { Page } from '@/types';

// =============================================================================
// PDF.js Worker Configuration
// =============================================================================

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

// =============================================================================
// Types
// =============================================================================

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

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_RENDER_SCALE = 1.5;
const JPEG_QUALITY = 0.9;

// =============================================================================
// Initial State
// =============================================================================

const initialState: PdfProcessorState = {
  pages: [],
  totalPages: 0,
  isLoading: false,
  error: null,
  progress: 0,
};

// =============================================================================
// Hook Implementation
// =============================================================================

export function usePdfProcessor(): UsePdfProcessorReturn {
  const [state, setState] = useState<PdfProcessorState>(initialState);

  const pdfDocRef = useRef<pdfjs.PDFDocumentProxy | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pageCanvasCache = useRef<Map<number, string>>(new Map());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pdfDocRef.current?.destroy();
      abortControllerRef.current?.abort();
      pageCanvasCache.current.clear();
    };
  }, []);

  /**
   * Loads PDF from file or URL
   */
  const loadPdf = useCallback(async (source: File | string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null, progress: 0 }));
      abortControllerRef.current = new AbortController();

      // Cleanup previous document
      if (pdfDocRef.current) {
        await pdfDocRef.current.destroy();
        pdfDocRef.current = null;
      }
      pageCanvasCache.current.clear();

      // Prepare PDF source
      let pdfSource: string | ArrayBuffer;
      if (source instanceof File) {
        pdfSource = await source.arrayBuffer();
      } else {
        pdfSource = source;
      }

      // Load PDF document
      const loadingTask = pdfjs.getDocument({
        data: pdfSource instanceof ArrayBuffer ? pdfSource : undefined,
        url: typeof pdfSource === 'string' ? pdfSource : undefined,
      });

      loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
        if (progress.total > 0) {
          const percentage = (progress.loaded / progress.total) * 100;
          setState((prev) => ({ ...prev, progress: percentage }));
        }
      };

      const pdfDoc = await loadingTask.promise;
      pdfDocRef.current = pdfDoc;

      // Extract page metadata
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
    } catch (err: unknown) {
      const error = err as Error;
      if (error && error.name !== 'AbortError') {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || 'Failed to load PDF',
        }));
      }
    }
  }, []);

  /**
   * Renders a single page to canvas and returns data URL
   */
  const renderPage = useCallback(
    async (pageNumber: number, scale = DEFAULT_RENDER_SCALE): Promise<string | null> => {
      if (!pdfDocRef.current || pageNumber < 1 || pageNumber > state.totalPages) {
        return null;
      }

      // Check cache
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

        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

        // Cache result
        pageCanvasCache.current.set(pageNumber, dataUrl);

        return dataUrl;
      } catch (error) {
        console.error(`Error rendering page ${pageNumber}:`, error);
        return null;
      }
    },
    [state.totalPages]
  );

  /**
   * Cancels ongoing PDF loading
   */
  const cancelLoading = useCallback(() => {
    abortControllerRef.current?.abort();
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  /**
   * Resets processor state
   */
  const reset = useCallback(() => {
    pdfDocRef.current?.destroy();
    pdfDocRef.current = null;
    pageCanvasCache.current.clear();
    setState(initialState);
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
