import axios, { type AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { config } from '@config/env';
import { useAuthStore } from '@store/auth.store';
import type { ApiEnvelope, ApiErrorBody } from '@shared/types/api';

const api = axios.create({
  baseURL: config.apiBase,
  withCredentials: true,
  timeout: 30_000,
});

const BASENAME = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiErrorBody>) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname.replace(BASENAME, '') || '/';
      if (!path.startsWith('/login') && !path.startsWith('/otp-sent')) {
        try {
          useAuthStore.getState().logout();
        } catch {
          /* store may be uninitialized; safe to ignore */
        }
        window.location.assign(`${BASENAME}/login`);
      }
    }
    return Promise.reject(err);
  },
);

function unwrap<T>(res: AxiosResponse<T | ApiEnvelope<T>>): T {
  const body = res.data as ApiEnvelope<T> | T;
  if (
    body !== null &&
    typeof body === 'object' &&
    'success' in body &&
    'data' in body
  ) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const apiClient = {
  raw: api,
  get: async <T>(url: string, cfg?: AxiosRequestConfig): Promise<T> =>
    unwrap<T>(await api.get(url, cfg)),
  getList: async <T>(url: string, cfg?: AxiosRequestConfig): Promise<T[]> => {
    const data = unwrap<T[] | PaginatedResponse<T>>(await api.get(url, cfg));
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as PaginatedResponse<T>).items)) {
      return (data as PaginatedResponse<T>).items;
    }
    return [];
  },
  post: async <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig): Promise<T> =>
    unwrap<T>(await api.post(url, data, cfg)),
  put: async <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig): Promise<T> =>
    unwrap<T>(await api.put(url, data, cfg)),
  patch: async <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig): Promise<T> =>
    unwrap<T>(await api.patch(url, data, cfg)),
  delete: async <T>(url: string, cfg?: AxiosRequestConfig): Promise<T> =>
    unwrap<T>(await api.delete(url, cfg)),
};
