import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { config } from '@config/env';
import { useAuthStore } from '@store/auth.store';
import type { ApiErrorBody } from '@shared/types/api';

const trimmedApiBase = String(config.apiBase ?? '').replace(/\/+$/, '');
const apiBaseWithPrefix = trimmedApiBase.endsWith('/api')
  ? trimmedApiBase
  : `${trimmedApiBase}/api`;

const tracker = axios.create({
  baseURL: apiBaseWithPrefix,
  withCredentials: false,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
});

const backend = axios.create({
  baseURL: apiBaseWithPrefix,
  withCredentials: false,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
});

function applyInterceptors(
  instance: typeof tracker,
  opts: { redirectOn401: boolean },
): void {
  instance.interceptors.request.use((cfg) => {
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      if (typeof cfg.baseURL === 'string' && cfg.baseURL.startsWith('http://')) {
        cfg.baseURL = `https://${cfg.baseURL.slice('http://'.length)}`;
      }
    }
    if (typeof cfg.baseURL === 'string' && cfg.baseURL.includes('ngrok')) {
      cfg.headers.set('ngrok-skip-browser-warning', 'true');
    }
    const password = useAuthStore.getState().password;
    if (password) {
      cfg.headers.set('x-emp-password', password);
    }
    return cfg;
  });

  instance.interceptors.response.use(
    (res) => res,
    (err: AxiosError<ApiErrorBody>) => {
      if (
        opts.redirectOn401 &&
        err.response?.status === 401 &&
        typeof window !== 'undefined'
      ) {
        const path = window.location.pathname;
        if (!path.startsWith('/login')) {
          useAuthStore.getState().clearSession();
          window.location.assign('/login');
        }
      }
      return Promise.reject(err);
    },
  );
}

applyInterceptors(tracker, { redirectOn401: true });
applyInterceptors(backend, { redirectOn401: false });

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

function makeClient(instance: typeof tracker): {
  raw: typeof tracker;
  get: <T>(url: string, cfg?: AxiosRequestConfig) => Promise<T>;
  getList: <T>(url: string, cfg?: AxiosRequestConfig) => Promise<T[]>;
  post: <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig) => Promise<T>;
  put: <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig) => Promise<T>;
  patch: <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig) => Promise<T>;
  delete: <T>(url: string, cfg?: AxiosRequestConfig) => Promise<T>;
} {
  return {
    raw: instance,
    get: async <T>(url: string, cfg?: AxiosRequestConfig): Promise<T> =>
      (await instance.get<T>(url, cfg)).data,
    getList: async <T>(url: string, cfg?: AxiosRequestConfig): Promise<T[]> => {
      const data = (await instance.get<T[] | PaginatedResponse<T>>(url, cfg)).data;
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object' && Array.isArray((data as PaginatedResponse<T>).items)) {
        return (data as PaginatedResponse<T>).items;
      }
      return [];
    },
    post: async <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig): Promise<T> =>
      (await instance.post<T>(url, data, cfg)).data,
    put: async <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig): Promise<T> =>
      (await instance.put<T>(url, data, cfg)).data,
    patch: async <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig): Promise<T> =>
      (await instance.patch<T>(url, data, cfg)).data,
    delete: async <T>(url: string, cfg?: AxiosRequestConfig): Promise<T> =>
      (await instance.delete<T>(url, cfg)).data,
  };
}

export const trackerClient = makeClient(tracker);
export const backendClient = makeClient(backend);

export function formatTrackerRequestError(err: unknown): string {
  const ax = err as AxiosError<ApiErrorBody>;
  if (ax?.isAxiosError) {
    if (ax.code === 'ERR_NETWORK' || ax.message === 'Network Error') {
      return 'Network error — server unreachable.';
    }
    const st = ax.response?.status;
    const data = ax.response?.data;
    let tail = '';
    if (data && typeof data === 'object') {
      const m = data as { error?: string; message?: string | string[] };
      tail = String(
        m.error ??
          (Array.isArray(m.message) ? m.message.join(', ') : m.message ?? ''),
      ).trim();
    } else if (typeof data === 'string') {
      tail = (data as string).trim().slice(0, 240);
    }
    if (st) return tail ? `HTTP ${st}: ${tail}` : `HTTP ${st}`;
    return String(ax.message || 'Request failed');
  }
  if (err instanceof Error) return err.message;
  return String(err);
}
