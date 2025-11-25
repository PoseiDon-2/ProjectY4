import axios from 'axios';

// API Base URL - adjust this based on your environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const donationRequestsAPI = {
  // Get all donation requests (public)
  getAll: (params?: any) => api.get('/donation-requests', { params }),

  // Get single donation request (public)
  getById: (id: string) => api.get(`/donation-requests/${id}`),

  // Get categories (public)
  getCategories: () => api.get('/donation-requests/categories'),

  // Get organizer's own requests (protected)
  getMyRequests: () => api.get('/donation-requests/my/requests'),

  // Create new donation request (protected)
  create: (data: any) => api.post('/donation-requests', data),

  // Update donation request (protected)
  update: (id: string, data: any) => api.put(`/donation-requests/${id}`, data),

  // Delete donation request (protected)
  delete: (id: string) => api.delete(`/donation-requests/${id}`),
};
