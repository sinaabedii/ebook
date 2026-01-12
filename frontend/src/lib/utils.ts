/**
 * Utility Functions
 * Reusable helper functions used throughout the application
 */

import { API_BASE_URL, CDN_URL } from './constants';

// =============================================================================
// URL Utilities
// =============================================================================

/**
 * Constructs full URL for image assets
 * @param path - Relative or absolute image path
 * @returns Full URL to the image
 */
export function getFullImageUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${CDN_URL}${path}`;
}

/**
 * Constructs full API endpoint URL
 * @param endpoint - API endpoint path
 * @returns Full API URL
 */
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

// =============================================================================
// Formatting Utilities
// =============================================================================

/**
 * Formats byte size to human-readable string
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formats date string to localized format
 * @param dateString - ISO date string
 * @param locale - Locale identifier (default: 'fa-IR')
 * @returns Localized date string
 */
export function formatDate(dateString: string, locale: string = 'fa-IR'): string {
  return new Date(dateString).toLocaleDateString(locale);
}

/**
 * Extracts clean title from filename
 * @param filename - Original filename
 * @returns Cleaned title string
 */
export function extractTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.pdf$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formats phone number for display
 * @param phone - Raw phone number
 * @returns Formatted phone number (e.g., "0912 345 6789")
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`;
}

// =============================================================================
// Validation Utilities
// =============================================================================

/**
 * Validates if file is a PDF
 * @param file - File to validate
 * @returns True if file is a valid PDF
 */
export function isValidPdf(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

/**
 * Validates file size against limit
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in megabytes
 * @returns True if file size is within limit
 */
export function isFileSizeValid(file: File, maxSizeMB: number): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}

/**
 * Validates Iranian mobile phone number
 * @param phone - Phone number to validate
 * @returns True if phone number is valid
 */
export function isValidIranianPhone(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}

/**
 * Validates email format
 * @param email - Email to validate
 * @returns True if email format is valid
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// =============================================================================
// Number Utilities
// =============================================================================

/**
 * Clamps a number between min and max values
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Converts Persian/Arabic digits to English
 * @param str - String containing Persian/Arabic digits
 * @returns String with English digits
 */
export function toEnglishDigits(str: string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const arabicDigits = '٠١٢٣٤٥٦٧٨٩';

  return str
    .split('')
    .map((char) => {
      const persianIndex = persianDigits.indexOf(char);
      if (persianIndex !== -1) return persianIndex.toString();

      const arabicIndex = arabicDigits.indexOf(char);
      if (arabicIndex !== -1) return arabicIndex.toString();

      return char;
    })
    .join('');
}

/**
 * Converts English digits to Persian
 * @param str - String containing English digits
 * @returns String with Persian digits
 */
export function toPersianDigits(str: string): string {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return str.replace(/\d/g, (digit) => persianDigits[parseInt(digit)]);
}

// =============================================================================
// DOM Utilities
// =============================================================================

/**
 * Checks if code is running in browser environment
 * @returns True if running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safely retrieves value from localStorage
 * @param key - Storage key
 * @returns Stored value or null
 */
export function getStorageItem(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely stores value in localStorage
 * @param key - Storage key
 * @param value - Value to store
 */
export function setStorageItem(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage might be full or disabled
  }
}

/**
 * Safely removes value from localStorage
 * @param key - Storage key
 */
export function removeStorageItem(key: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

// =============================================================================
// Async Utilities
// =============================================================================

/**
 * Creates a promise that resolves after specified delay
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a debounced version of a function
 * @param func - Function to debounce
 * @param wait - Debounce delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

/**
 * Creates a throttled version of a function
 * @param func - Function to throttle
 * @param limit - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// =============================================================================
// Class Name Utilities
// =============================================================================

type ClassValue = string | boolean | undefined | null | Record<string, boolean>;

/**
 * Conditionally joins class names
 * @param classes - Class names or conditions
 * @returns Joined class string
 */
export function cn(...classes: ClassValue[]): string {
  return classes
    .flatMap((cls) => {
      if (!cls) return [];
      if (typeof cls === 'string') return cls;
      if (typeof cls === 'object') {
        return Object.entries(cls)
          .filter(([, value]) => value)
          .map(([key]) => key);
      }
      return [];
    })
    .join(' ');
}

// =============================================================================
// ID Generation
// =============================================================================

/**
 * Generates a unique ID
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}
