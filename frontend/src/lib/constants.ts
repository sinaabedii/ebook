/**
 * Application Constants
 * Centralized configuration values used throughout the application
 */

// =============================================================================
// API Configuration
// =============================================================================

/** Base URL for API requests */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

/** CDN URL for static assets */
export const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || API_BASE_URL;

// =============================================================================
// Request Timeouts (milliseconds)
// =============================================================================

/** Default API request timeout */
export const API_TIMEOUT = 30_000;

/** Extended timeout for file uploads */
export const UPLOAD_TIMEOUT = 600_000;

/** Interval between status polling requests */
export const POLLING_INTERVAL = 5_000;

/** Maximum number of polling attempts before timeout */
export const MAX_POLLING_ATTEMPTS = 60;

// =============================================================================
// File Upload Limits
// =============================================================================

/** Maximum file size in megabytes */
export const MAX_FILE_SIZE_MB = 500;

/** Maximum file size in bytes */
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/** Allowed MIME types for upload */
export const ALLOWED_FILE_TYPES = ['application/pdf'] as const;

/** Allowed file extensions */
export const ALLOWED_EXTENSIONS = ['.pdf'] as const;

// =============================================================================
// Pagination
// =============================================================================

/** Default number of items per page */
export const DEFAULT_PAGE_SIZE = 12;

/** Maximum search results to display */
export const SEARCH_RESULTS_LIMIT = 20;

// =============================================================================
// Responsive Breakpoints (pixels)
// =============================================================================

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// =============================================================================
// Animation Durations (milliseconds)
// =============================================================================

export const FLIP_DURATION = {
  slow: 1000,
  normal: 600,
  fast: 300,
} as const;

/** Duration for spring-back animation when flip is cancelled */
export const SPRING_BACK_DURATION = 300;

/** Debounce delay for resize events */
export const DEBOUNCE_DELAY = 100;

// =============================================================================
// Viewer Settings
// =============================================================================

/** Default zoom level (1 = 100%) */
export const DEFAULT_ZOOM_LEVEL = 1;

/** Minimum allowed zoom level */
export const MIN_ZOOM_LEVEL = 0.5;

/** Maximum allowed zoom level */
export const MAX_ZOOM_LEVEL = 3;

/** Zoom increment/decrement step */
export const ZOOM_STEP = 0.25;

/** Minimum drag progress to complete flip (0-1) */
export const DRAG_THRESHOLD = 0.3;

/** Minimum swipe distance to trigger page turn (pixels) */
export const SWIPE_THRESHOLD = 50;

// =============================================================================
// PDF Rendering
// =============================================================================

/** Default scale for PDF page rendering */
export const DEFAULT_PDF_SCALE = 1.5;

/** Scale for thumbnail generation */
export const THUMBNAIL_SCALE = 0.3;

/** Standard book page aspect ratio (width/height) */
export const PAGE_ASPECT_RATIO = 3 / 4;

// =============================================================================
// Local Storage Keys
// =============================================================================

export const STORAGE_KEYS = {
  authToken: 'auth_token',
  theme: 'theme',
  language: 'language',
  readingProgress: 'reading_progress',
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;

// =============================================================================
// Internationalization
// =============================================================================

export const SUPPORTED_LANGUAGES = ['fa', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: SupportedLanguage = 'fa';

export const LANGUAGE_DIRECTIONS: Record<SupportedLanguage, 'rtl' | 'ltr'> = {
  fa: 'rtl',
  en: 'ltr',
};

// =============================================================================
// Theming
// =============================================================================

export const SUPPORTED_THEMES = ['light', 'dark'] as const;
export type SupportedTheme = (typeof SUPPORTED_THEMES)[number];

export const DEFAULT_THEME: SupportedTheme = 'dark';

// =============================================================================
// Error Messages (Persian)
// =============================================================================

export const ERROR_MESSAGES = {
  networkError: 'ارتباط با سرور برقرار نشد',
  unknownError: 'خطای ناشناخته رخ داد',
  invalidPhone: 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود',
  invalidOtp: 'لطفاً کد ۶ رقمی را وارد کنید',
  uploadFailed: 'خطا در آپلود فایل',
  processingTimeout: 'زمان پردازش بیش از حد انتظار طول کشید',
  fileTooLarge: `حداکثر حجم فایل ${MAX_FILE_SIZE_MB} مگابایت است`,
  invalidFileType: 'فقط فایل‌های PDF قابل قبول هستند',
} as const;
