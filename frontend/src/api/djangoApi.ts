import axios, { AxiosInstance, AxiosProgressEvent } from 'axios';
import type { Book, Page, Bookmark, UploadResponse, PaginatedResponse, ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login or refresh token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    }
    return Promise.reject(error);
  }
);

// ==================== Book API ====================
export const bookApi = {
  // Get all books with pagination
  getBooks: async (page = 1, pageSize = 10): Promise<PaginatedResponse<Book>> => {
    const response = await api.get<PaginatedResponse<Book>>('/books/', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  // Get single book by ID
  getBook: async (id: number): Promise<Book> => {
    const response = await api.get<Book>(`/books/${id}/`);
    return response.data;
  },

  // Create new book (metadata only)
  createBook: async (data: Partial<Book>): Promise<Book> => {
    const response = await api.post<Book>('/books/', data);
    return response.data;
  },

  // Update book
  updateBook: async (id: number, data: Partial<Book>): Promise<Book> => {
    const response = await api.patch<Book>(`/books/${id}/`, data);
    return response.data;
  },

  // Delete book
  deleteBook: async (id: number): Promise<void> => {
    await api.delete(`/books/${id}/`);
  },

  // Search books
  searchBooks: async (query: string): Promise<Book[]> => {
    const response = await api.get<Book[]>('/books/search/', {
      params: { q: query },
    });
    return response.data;
  },
};

// ==================== Upload API ====================
export const uploadApi = {
  // Upload PDF file
  uploadPdf: async (
    file: File,
    metadata: { title?: string; description?: string },
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);

    const response = await api.post<UploadResponse>('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 600000, // 10 minutes for large files
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  // Check upload/processing status
  checkStatus: async (bookId: number): Promise<UploadResponse> => {
    const response = await api.get<UploadResponse>(`/upload/status/${bookId}/`);
    return response.data;
  },

  // Cancel upload
  cancelUpload: async (bookId: number): Promise<void> => {
    await api.post(`/upload/cancel/${bookId}/`);
  },
};

// ==================== Pages API ====================
export const pagesApi = {
  // Get all pages for a book
  getPages: async (bookId: number): Promise<Page[]> => {
    const response = await api.get<Page[]>(`/pages/${bookId}/`);
    return response.data;
  },

  // Get single page
  getPage: async (bookId: number, pageNumber: number): Promise<Page> => {
    const response = await api.get<Page>(`/pages/${bookId}/${pageNumber}/`);
    return response.data;
  },

  // Get page range (for preloading)
  getPageRange: async (bookId: number, start: number, end: number): Promise<Page[]> => {
    const response = await api.get<Page[]>(`/pages/${bookId}/range/`, {
      params: { start, end },
    });
    return response.data;
  },
};

// ==================== Bookmark API ====================
export const bookmarkApi = {
  // Get all bookmarks for a book
  getBookmarks: async (bookId: number): Promise<Bookmark[]> => {
    const response = await api.get<Bookmark[]>('/bookmarks/', {
      params: { book_id: bookId },
    });
    return response.data;
  },

  // Create bookmark
  createBookmark: async (data: { book_id: number; page_number: number; note?: string }): Promise<Bookmark> => {
    const response = await api.post<Bookmark>('/bookmarks/', data);
    return response.data;
  },

  // Update bookmark
  updateBookmark: async (id: number, data: Partial<Bookmark>): Promise<Bookmark> => {
    const response = await api.patch<Bookmark>(`/bookmarks/${id}/`, data);
    return response.data;
  },

  // Delete bookmark
  deleteBookmark: async (id: number): Promise<void> => {
    await api.delete(`/bookmarks/${id}/`);
  },
};

// ==================== Helper Functions ====================
export const getFullImageUrl = (path: string): string => {
  if (path.startsWith('http')) return path;
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || API_BASE_URL;
  return `${cdnUrl}${path}`;
};

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error
      const data = error.response.data;
      if (typeof data === 'string') return data;
      if (data.message) return data.message;
      if (data.detail) return data.detail;
      if (data.error) return data.error;
      return `خطای سرور: ${error.response.status}`;
    } else if (error.request) {
      // No response received
      return 'ارتباط با سرور برقرار نشد';
    }
  }
  return 'خطای ناشناخته رخ داد';
};

export default api;
