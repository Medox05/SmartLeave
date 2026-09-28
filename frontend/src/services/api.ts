import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  withCredentials: true,
  timeout: 15000, // 15s connection timeout for cold-boots
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Helper to fetch CSRF cookie before authentication requests
export const getCsrfCookie = async (): Promise<void> => {
  try {
    const sanctumBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api')
      .replace('/api', '/sanctum/csrf-cookie');
    await axios.get(sanctumBaseUrl, { withCredentials: true, timeout: 8000 });
  } catch {
    // Graceful fallback if CSRF endpoint fails or times out
  }
};

// Request Interceptor: Attach X-XSRF-TOKEN header and Bearer token fallback
api.interceptors.request.use((config) => {
  // 1. Manually extract XSRF-TOKEN from cookies if present
  const match = document.cookie.match(new RegExp('(^|; )XSRF-TOKEN=([^;]+)'));
  if (match) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(match[2]);
  }

  // 2. Attach Bearer token fallback if stored in localStorage
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('auth_token');
      localStorage.removeItem('auth_token');
      if (token && window.location.pathname !== '/login') {
        window.location.href = '/login?deactivated=1';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
