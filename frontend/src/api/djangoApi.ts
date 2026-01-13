/**
 * Django API Client
 * Centralized API client for all backend communication
 */

import axios, { AxiosInstance, AxiosProgressEvent, AxiosError } from 'axios';
import {
  API_BASE_URL,
  API_TIMEOUT,
  UPLOAD_TIMEOUT,
  STORAGE_KEYS,
} from '@/lib/constants';
import { getStorageItem, removeStorageItem, setStorageItem, getFullImageUrl } from '@/lib/utils';
import type {
  Book,
  Page,
  Bookmark,
  UploadResponse,
  PaginatedResponse,
  User,
  AuthResponse,
  OTPResponse,
  OTPVerifyResponse,
  RegisterFormData,
  BookMetadata,
  ProfileUpdateData,
} from '@/types';

// =============================================================================
// Axios Instance Configuration
// =============================================================================

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  (config) => {
    const token = getStorageItem(STORAGE_KEYS.authToken);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeStorageItem(STORAGE_KEYS.authToken);
    }
    return Promise.reject(error);
  }
);

// =============================================================================
// Book API
// =============================================================================

export const bookApi = {
  /**
   * Fetches paginated list of books
   */
  getBooks: async (page = 1, pageSize = 10): Promise<PaginatedResponse<Book>> => {
    const response = await api.get<PaginatedResponse<Book>>('/books/', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  /**
   * Fetches single book by ID
   */
  getBook: async (id: number): Promise<Book> => {
    const response = await api.get<Book>(`/books/${id}/`);
    return response.data;
  },

  /**
   * Creates a new book
   */
  createBook: async (data: Partial<Book>): Promise<Book> => {
    const response = await api.post<Book>('/books/', data);
    return response.data;
  },

  /**
   * Updates existing book
   */
  updateBook: async (id: number, data: Partial<Book>): Promise<Book> => {
    const response = await api.patch<Book>(`/books/${id}/`, data);
    return response.data;
  },

  /**
   * Deletes a book
   */
  deleteBook: async (id: number): Promise<void> => {
    await api.delete(`/books/${id}/`);
  },

  /**
   * Searches books by query
   */
  searchBooks: async (query: string): Promise<Book[]> => {
    const response = await api.get<Book[]>('/books/search/', {
      params: { q: query },
    });
    return response.data;
  },
};

// =============================================================================
// Upload API
// =============================================================================

export const uploadApi = {
  /**
   * Uploads PDF file with metadata
   */
  uploadPdf: async (
    file: File,
    metadata: BookMetadata,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);

    const response = await api.post<UploadResponse>('/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT,
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    });
    return response.data;
  },

  /**
   * Checks processing status of uploaded book
   */
  checkStatus: async (bookId: number): Promise<UploadResponse> => {
    const response = await api.get<UploadResponse>(`/upload/status/${bookId}/`);
    return response.data;
  },

  /**
   * Cancels ongoing upload
   */
  cancelUpload: async (bookId: number): Promise<void> => {
    await api.post(`/upload/cancel/${bookId}/`);
  },
};

// =============================================================================
// Pages API
// =============================================================================

export const pagesApi = {
  /**
   * Fetches all pages for a book (handles pagination automatically)
   */
  getPages: async (bookId: number): Promise<Page[]> => {
    const response = await api.get(`/pages/${bookId}/`);

    // Handle paginated response
    if (response.data.results) {
      let allPages: Page[] = response.data.results;
      let nextUrl = response.data.next;

      while (nextUrl) {
        const nextResponse = await axios.get(nextUrl);
        allPages = [...allPages, ...nextResponse.data.results];
        nextUrl = nextResponse.data.next;
      }
      return allPages;
    }

    return response.data;
  },

  /**
   * Fetches single page by number
   */
  getPage: async (bookId: number, pageNumber: number): Promise<Page> => {
    const response = await api.get<Page>(`/pages/${bookId}/${pageNumber}/`);
    return response.data;
  },

  /**
   * Fetches range of pages
   */
  getPageRange: async (bookId: number, start: number, end: number): Promise<Page[]> => {
    const response = await api.get<Page[]>(`/pages/${bookId}/range/`, {
      params: { start, end },
    });
    return response.data;
  },
};

// =============================================================================
// Bookmark API
// =============================================================================

export const bookmarkApi = {
  /**
   * Fetches bookmarks for a book
   */
  getBookmarks: async (bookId: number): Promise<Bookmark[]> => {
    const response = await api.get<Bookmark[]>('/bookmarks/', {
      params: { book_id: bookId },
    });
    return response.data;
  },

  /**
   * Creates a new bookmark
   */
  createBookmark: async (data: {
    book_id: number;
    page_number: number;
    note?: string;
  }): Promise<Bookmark> => {
    const response = await api.post<Bookmark>('/bookmarks/', data);
    return response.data;
  },

  /**
   * Updates existing bookmark
   */
  updateBookmark: async (id: number, data: Partial<Bookmark>): Promise<Bookmark> => {
    const response = await api.patch<Bookmark>(`/bookmarks/${id}/`, data);
    return response.data;
  },

  /**
   * Deletes a bookmark
   */
  deleteBookmark: async (id: number): Promise<void> => {
    await api.delete(`/bookmarks/${id}/`);
  },
};

// =============================================================================
// Auth API
// =============================================================================

export const authApi = {
  /**
   * Requests OTP for phone number
   */
  requestOTP: async (phone: string): Promise<OTPResponse> => {
    const response = await api.post<OTPResponse>('/auth/otp/request/', { phone });
    return response.data;
  },

  /**
   * Verifies OTP code
   */
  verifyOTP: async (phone: string, code: string): Promise<OTPVerifyResponse> => {
    const response = await api.post<OTPVerifyResponse>('/auth/otp/verify/', { phone, code });
    return response.data;
  },

  /**
   * Registers new user
   */
  register: async (data: RegisterFormData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register/', data);
    if (response.data.access_token) {
      setStorageItem(STORAGE_KEYS.authToken, response.data.access_token);
    }
    return response.data;
  },

  /**
   * Logs in existing user
   */
  login: async (phone: string, code: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login/', { phone, code });
    if (response.data.access_token) {
      setStorageItem(STORAGE_KEYS.authToken, response.data.access_token);
    }
    return response.data;
  },

  /**
   * Logs out current user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/');
    } finally {
      removeStorageItem(STORAGE_KEYS.authToken);
    }
  },

  /**
   * Fetches current user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/profile/');
    return response.data;
  },

  /**
   * Updates user profile
   */
  updateProfile: async (data: ProfileUpdateData): Promise<User> => {
    const response = await api.patch<User>('/auth/profile/', data);
    return response.data;
  },

  /**
   * Changes user password
   */
  changePassword: async (
    oldPassword: string,
    newPassword: string,
    newPasswordConfirm: string
  ): Promise<{ message: string }> => {
    const response = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
    return response.data;
  },
};

// =============================================================================
// Error Handling
// =============================================================================

interface ApiErrorData {
  message?: string;
  detail?: string;
  error?: string;
}

/**
 * Error keys for translation
 */
export type ErrorKey = 'networkError' | 'unknownError' | 'serverError';

/**
 * Extracts error key from API error for translation
 * @param error - Error object from API call
 * @returns Error key or direct message from server
 */
export function getApiErrorKey(error: unknown): { key: ErrorKey; message?: string; status?: number } {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorData>;

    if (axiosError.response) {
      const data = axiosError.response.data;
      if (typeof data === 'string') return { key: 'serverError', message: data };
      if (data?.message) return { key: 'serverError', message: data.message };
      if (data?.detail) return { key: 'serverError', message: data.detail };
      if (data?.error) return { key: 'serverError', message: data.error };
      return { key: 'serverError', status: axiosError.response.status };
    }

    if (axiosError.request) {
      return { key: 'networkError' };
    }
  }

  return { key: 'unknownError' };
}

/**
 * Extracts user-friendly error message from API error
 * @param error - Error object from API call
 * @returns User-friendly error message in Persian (legacy support)
 */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorData>;

    if (axiosError.response) {
      const data = axiosError.response.data;
      if (typeof data === 'string') return data;
      if (data?.message) return data.message;
      if (data?.detail) return data.detail;
      if (data?.error) return data.error;
      return `Server Error: ${axiosError.response.status}`;
    }

    if (axiosError.request) {
      return 'errors.networkError';
    }
  }

  return 'errors.unknownError';
}

// =============================================================================
// Exports
// =============================================================================

export { getFullImageUrl };
export default api;
