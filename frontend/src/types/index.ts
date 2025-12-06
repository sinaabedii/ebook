// ==================== Book Types ====================
export interface Book {
  id: number;
  title: string;
  description: string;
  page_count: number;
  thumbnail_url: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  is_processed: boolean;
  uploaded_by?: string;
}

export interface Page {
  id: number;
  book_id: number;
  page_number: number;
  image_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
}

export interface Bookmark {
  id: number;
  book_id: number;
  page_number: number;
  created_at: string;
  note?: string;
}

// ==================== Upload Types ====================
export interface UploadResponse {
  book_id: number;
  status: 'processing' | 'completed' | 'failed';
  estimated_time?: number;
  message?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: 'uploading' | 'processing' | 'optimizing' | 'complete';
}

// ==================== Viewer Types ====================
export interface ViewerSettings {
  pageMode: 'single' | 'double';
  fitMode: 'width' | 'height' | 'page';
  zoomLevel: number;
  flipSpeed: 'slow' | 'normal' | 'fast';
  showThumbnails: boolean;
  enableSounds: boolean;
}

export interface FlipbookState {
  currentPage: number;
  totalPages: number;
  isFlipping: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
  settings: ViewerSettings;
}

// ==================== Animation Types ====================
export interface FlipAnimation {
  direction: 'left' | 'right';
  progress: number;
  isActive: boolean;
}

// ==================== Touch/Gesture Types ====================
export interface GestureState {
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  velocity: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

export interface PinchState {
  scale: number;
  centerX: number;
  centerY: number;
}

// ==================== Cache Types ====================
export interface CacheEntry {
  key: string;
  data: Blob | string;
  timestamp: number;
  expiresAt: number;
}

export interface CacheConfig {
  thumbnails: number; // days
  pages: number; // hours
  metadata: number; // days
}

// ==================== API Response Types ====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ==================== Performance Types ====================
export interface PerformanceMetrics {
  firstPageRenderTime: number;
  pageTurnLatency: number;
  memoryUsage: number;
  fps: number;
}

// ==================== UI State Types ====================
export interface UIState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: 'portrait' | 'landscape';
  screenWidth: number;
  screenHeight: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}
