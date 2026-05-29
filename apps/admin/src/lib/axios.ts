import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { ApiError } from './api-error';

export function getApiBase(): string {
  if (typeof window !== 'undefined' && (window as Window & { __VITE_API_URL__?: string }).__VITE_API_URL__) {
    return (window as Window & { __VITE_API_URL__?: string }).__VITE_API_URL__!;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const isProduction =
    import.meta.env.PROD ||
    (typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      !window.location.hostname.includes('localhost'));
  if (typeof window !== 'undefined' && window.location.hostname === 'admin.acoustic.uz') {
    return '/api';
  }
  return isProduction ? 'https://a.acoustic.uz/api' : 'http://localhost:3001/api';
}

const api = axios.create({
  baseURL: getApiBase(),
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('acoustic_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await axios.post(
          `${getApiBase()}/auth/refresh`,
          {},
          { withCredentials: true, headers: { 'Content-Type': 'application/json' } },
        );
        const token = res.data?.access_token as string | undefined;
        if (token) {
          localStorage.setItem('acoustic_token', token);
        }
        return res.status >= 200 && res.status < 300;
      } catch {
        return false;
      } finally {
        setTimeout(() => {
          refreshPromise = null;
        }, 1000);
      }
    })();
  }
  return refreshPromise;
}

function toApiError(error: AxiosError<{ message?: string | string[] }>): ApiError {
  const status = error.response?.status ?? 0;
  let message = error.message;
  const data = error.response?.data;
  if (data?.message) {
    message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
  } else if (typeof error.response?.data === 'string') {
    message = error.response.data;
  }
  const fallback =
    status === 400
      ? 'Ma\'lumotlar noto\'g\'ri. Maydonlarni tekshiring.'
      : status >= 500
        ? 'Server xatosi. Keyinroq urinib ko\'ring.'
        : `Request failed with status ${status}`;
  return new ApiError(message || fallback, status);
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ message?: string | string[] }>) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url ?? '';

    if (status === 401 && original && !original.headers?.['X-Retry']) {
      if (url !== '/auth/login' && url !== '/auth/refresh') {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          original.headers = original.headers ?? {};
          original.headers['X-Retry'] = '1';
          return api.request(original);
        }
      }

      localStorage.removeItem('acoustic_token');
      localStorage.removeItem('admin_user');
      const queryClient = (window as unknown as { __queryClient?: { clear: () => void } }).__queryClient;
      queryClient?.clear();

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(toApiError(error));
  },
);

export default api;
