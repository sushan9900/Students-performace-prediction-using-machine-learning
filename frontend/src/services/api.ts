
import axios from 'axios';

const DEFAULT_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000,
});

// Interceptor for automatic port 8000 -> 8001 retry fallback
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.code === 'ERR_NETWORK' && !originalRequest._retry) {
      originalRequest._retry = true;
      if (originalRequest.baseURL.includes('8000')) {
        originalRequest.baseURL = originalRequest.baseURL.replace('8000', '8001');
      } else if (originalRequest.baseURL.includes('8001')) {
        originalRequest.baseURL = originalRequest.baseURL.replace('8001', '8000');
      }
      return api(originalRequest);
    }

    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred while communicating with backend API.';

    console.error('API Error:', errorMessage);
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
