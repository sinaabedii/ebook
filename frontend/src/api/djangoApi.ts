import axios, { AxiosInstance, AxiosProgressEvent } from 'axios';
import type { 
  Book, Page, Bookmark, UploadResponse, PaginatedResponse, ApiResponse,
  User, AuthResponse, OTPResponse, OTPVerifyResponse 
} from '@/types';

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
    const response = await api.get(`/pages/${bookId}/`);
    // Handle both paginated and non-paginated responses
    if (response.data.results) {
      // Paginated response - fetch all pages
      let allPages: Page[] = response.data.results;
      let nextUrl = response.data.next;
      
      // Fetch remaining pages if paginated
      while (nextUrl) {
        const nextResponse = await axios.get(nextUrl);
        allPages = [...allPages, ...nextResponse.data.results];
        nextUrl = nextResponse.data.next;
      }
      return allPages;
    }
    // Non-paginated response
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

// ==================== Auth API ====================
export const authApi = {
  // Request OTP code
  requestOTP: async (phone: string): Promise<OTPResponse> => {
    const response = await api.post<OTPResponse>('/auth/otp/request/', { phone });
    return response.data;
  },

  // Verify OTP code
  verifyOTP: async (phone: string, code: string): Promise<OTPVerifyResponse> => {
    const response = await api.post<OTPVerifyResponse>('/auth/otp/verify/', { phone, code });
    return response.data;
  },

  // Register new user
  register: async (data: {
    phone: string;
    code: string;
    first_name?: string;
    last_name?: string;
    password?: string;
    organization_code?: string;
  }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register/', data);
    // Store token
    if (response.data.access_token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.data.access_token);
    }
    return response.data;
  },

  // Login with OTP
  login: async (phone: string, code: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login/', { phone, code });
    // Store token
    if (response.data.access_token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.data.access_token);
    }
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
      }
    }
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/profile/');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    national_id?: string;
  }): Promise<User> => {
    const response = await api.patch<User>('/auth/profile/', data);
    return response.data;
  },

  // Change password
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
