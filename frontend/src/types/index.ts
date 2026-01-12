/**
 * Application Type Definitions
 * Centralized type definitions for the entire frontend application
 */

// =============================================================================
// Book & Content Types
// =============================================================================

/** Book entity representing a digital book */
export interface Book {
  readonly id: number;
  title: string;
  description: string;
  page_count: number;
  thumbnail_url: string;
  file_size: number;
  readonly created_at: string;
  readonly updated_at: string;
  is_processed: boolean;
  uploaded_by?: string;
}

/** Single page within a book */
export interface Page {
  readonly id: number;
  readonly book_id: number;
  page_number: number;
  image_url: string;
  thumbnail_url: string;
  width: number;
  height: number;
}

/** User bookmark for a specific page */
export interface Bookmark {
  readonly id: number;
  readonly book_id: number;
  page_number: number;
  readonly created_at: string;
  note?: string;
}

/** Metadata for book creation/upload */
export interface BookMetadata {
  title: string;
  description: string;
}

// =============================================================================
// Upload Types
// =============================================================================

/** Upload processing status */
export type UploadStatus = 'processing' | 'completed' | 'failed';

/** Upload stage during the upload process */
export type UploadStage = 'uploading' | 'processing' | 'optimizing' | 'complete';

/** Response from upload API */
export interface UploadResponse {
  readonly book_id: number;
  status: UploadStatus;
  estimated_time?: number;
  message?: string;
}

/** Upload progress tracking */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage: UploadStage;
}

// =============================================================================
// Viewer Types
// =============================================================================

/** Page display mode */
export type PageMode = 'single' | 'double';

/** Page fit mode within viewport */
export type FitMode = 'width' | 'height' | 'page';

/** Animation speed for page flipping */
export type FlipSpeed = 'slow' | 'normal' | 'fast';

/** Viewer configuration settings */
export interface ViewerSettings {
  pageMode: PageMode;
  fitMode: FitMode;
  zoomLevel: number;
  flipSpeed: FlipSpeed;
  showThumbnails: boolean;
  enableSounds: boolean;
}

/** Current state of the flipbook viewer */
export interface FlipbookState {
  currentPage: number;
  totalPages: number;
  isFlipping: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
  settings: ViewerSettings;
}

// =============================================================================
// Animation Types
// =============================================================================

/** Direction of page flip animation */
export type FlipDirection = 'left' | 'right';

/** State of flip animation */
export interface FlipAnimation {
  direction: FlipDirection;
  progress: number;
  isActive: boolean;
}

// =============================================================================
// Gesture Types
// =============================================================================

/** Swipe gesture direction */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null;

/** Touch/mouse gesture state */
export interface GestureState {
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  velocity: number;
  direction: SwipeDirection;
}

/** Pinch zoom gesture state */
export interface PinchState {
  scale: number;
  centerX: number;
  centerY: number;
}

// =============================================================================
// Cache Types
// =============================================================================

/** Single cache entry */
export interface CacheEntry {
  key: string;
  data: Blob | string;
  timestamp: number;
  expiresAt: number;
}

/** Cache configuration by content type */
export interface CacheConfig {
  thumbnails: number;
  pages: number;
  metadata: number;
}

// =============================================================================
// API Types
// =============================================================================

/** Generic API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Paginated API response */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// =============================================================================
// Performance Types
// =============================================================================

/** Performance metrics for monitoring */
export interface PerformanceMetrics {
  firstPageRenderTime: number;
  pageTurnLatency: number;
  memoryUsage: number;
  fps: number;
}

// =============================================================================
// UI Types
// =============================================================================

/** Device orientation */
export type Orientation = 'portrait' | 'landscape';

/** Responsive UI state */
export interface UIState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: Orientation;
  screenWidth: number;
  screenHeight: number;
}

/** Toast notification type */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Toast notification data */
export interface Toast {
  readonly id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// =============================================================================
// Auth Types
// =============================================================================

/** User role levels */
export type UserRole = 'admin' | 'org_admin' | 'manager' | 'member';

/** User entity */
export interface User {
  readonly id: number;
  phone: string;
  email?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  national_id?: string;
  avatar?: string;
  organization?: number;
  organization_name?: string;
  role: UserRole;
  is_verified: boolean;
  readonly date_joined: string;
}

/** Organization entity */
export interface Organization {
  readonly id: number;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  is_active: boolean;
  max_users: number;
  user_count: number;
  readonly created_at: string;
}

/** Authentication response from login/register */
export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  message?: string;
}

/** OTP request response */
export interface OTPResponse {
  message: string;
  expires_in: number;
  debug_code?: string;
}

/** OTP verification response */
export interface OTPVerifyResponse {
  valid: boolean;
  user_exists: boolean;
  message: string;
}

/** Authentication state */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** Registration form data */
export interface RegisterFormData {
  phone: string;
  code: string;
  first_name?: string;
  last_name?: string;
  password?: string;
  organization_code?: string;
}

/** Profile update data */
export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  email?: string;
  national_id?: string;
}
