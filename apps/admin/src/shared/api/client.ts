import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { config } from '@config/env';
import type { ApiErrorBody } from '@shared/types/api';

const api = axios.create({
  baseURL: config.apiBase,
  withCredentials: true,
  timeout: 30_000,
});

api.interceptors.request.use((cfg) => {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (typeof cfg.baseURL === 'string' && cfg.baseURL.startsWith('http://')) {
      cfg.baseURL = `https://${cfg.baseURL.slice('http://'.length)}`;
    }
  }
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiErrorBody>) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/forgot-password')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(err);
  },
);

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const apiClient = {
  raw: api,
  get: async <T>(url: string, cfg?: AxiosRequestConfig): Promise<T> =>
    (await api.get<T>(url, cfg)).data,
  getList: async <T>(url: string, cfg?: AxiosRequestConfig): Promise<T[]> => {
    const data = (await api.get<T[] | PaginatedResponse<T>>(url, cfg)).data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as PaginatedResponse<T>).items)) {
      return (data as PaginatedResponse<T>).items;
    }
    return [];
  },
  getPaginated: async <T>(
    url: string,
    cfg?: AxiosRequestConfig,
  ): Promise<PaginatedResponse<T>> => {
    const data = (await api.get<T[] | PaginatedResponse<T>>(url, cfg)).data;
    if (Array.isArray(data)) {
      return { items: data, total: data.length, page: 1, limit: data.length };
    }
    return data as PaginatedResponse<T>;
  },
  post: async <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig): Promise<T> =>
    (await api.post<T>(url, data, cfg)).data,
  put: async <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig): Promise<T> =>
    (await api.put<T>(url, data, cfg)).data,
  patch: async <T>(url: string, data?: unknown, cfg?: AxiosRequestConfig): Promise<T> =>
    (await api.patch<T>(url, data, cfg)).data,
  delete: async <T>(url: string, cfg?: AxiosRequestConfig): Promise<T> =>
    (await api.delete<T>(url, cfg)).data,
  postForm: async <T>(url: string, form: FormData, cfg?: AxiosRequestConfig): Promise<T> =>
    (
      await api.post<T>(url, form, {
        ...cfg,
        headers: { ...(cfg?.headers ?? {}), 'Content-Type': 'multipart/form-data' },
      })
    ).data,
  patchForm: async <T>(url: string, form: FormData, cfg?: AxiosRequestConfig): Promise<T> =>
    (
      await api.patch<T>(url, form, {
        ...cfg,
        headers: { ...(cfg?.headers ?? {}), 'Content-Type': 'multipart/form-data' },
      })
    ).data,
};

export type ApiClient = typeof apiClient;
