import { apiClient } from '@shared/api/client';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  entityType: string | null;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  items: AppNotification[];
  unread?: number;
}

export const notificationsApi = {
  list: (limit = 50) =>
    apiClient.get<NotificationsListResponse>(`/notifications?limit=${limit}`),
  unreadCount: () => apiClient.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) =>
    apiClient.put<AppNotification>(`/notifications/${encodeURIComponent(id)}/read`),
  markAllRead: () => apiClient.put<{ updated: number }>('/notifications/read-all'),
  registerToken: (body: {
    token: string;
    platform: 'web' | 'ios' | 'android';
    deviceLabel?: string;
  }) => apiClient.post<unknown>('/notifications/device-tokens', body),
  revokeToken: (token: string) =>
    apiClient.delete<{ message: string }>(
      `/notifications/device-tokens/${encodeURIComponent(token)}`,
    ),
};
