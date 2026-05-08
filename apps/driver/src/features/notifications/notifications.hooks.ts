import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError } from '@shared/lib/toast';
import { notificationsApi } from './notifications.api';

export const notificationsKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationsKeys.all, 'list'] as const,
  unread: () => [...notificationsKeys.all, 'unread'] as const,
};

export function useNotifications(limit = 50) {
  return useQuery({
    queryKey: notificationsKeys.list(),
    queryFn: () => notificationsApi.list(limit),
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationsKeys.unread(),
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationsKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: notificationsKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
