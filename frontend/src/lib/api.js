import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses - but NOT for auth/me or auth/refresh calls
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const url = error.config?.url || '';
    const isAuthCheck = url.includes('/auth/me') || url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register');

    if (error.response?.status === 401 && !error.config._retry && !isAuthCheck) {
      error.config._retry = true;
      try {
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {}, { withCredentials: true });
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api(error.config);
        }
      } catch {
        localStorage.removeItem('access_token');
      }
    }
    return Promise.reject(error);
  }
);

export function formatApiError(detail) {
  if (detail == null) return 'Something went wrong.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(e => e?.msg || JSON.stringify(e)).join(' ');
  if (detail?.msg) return detail.msg;
  return String(detail);
}

export default api;
