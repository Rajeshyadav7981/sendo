import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leaveApi, type LeaveListQuery, type UpdateLeaveBody } from './leave.api';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export const leaveKeys = {
  all: ['leave'] as const,
  byDriver: (driverId: string) => [...leaveKeys.all, 'driver', driverId] as const,
  byDriverPaginated: (driverId: string, query: LeaveListQuery) =>
    [...leaveKeys.all, 'driver', driverId, 'paginated', query] as const,
};

export function useDriverLeaves(driverId: string) {
  return useQuery({
    queryKey: leaveKeys.byDriver(driverId),
    queryFn: () => leaveApi.byDriver(driverId),
    enabled: !!driverId,
  });
}

export function useDriverLeavesPaginated(driverId: string, query: LeaveListQuery) {
  return useQuery({
    queryKey: leaveKeys.byDriverPaginated(driverId, query),
    queryFn: () => leaveApi.byDriverPaginated(driverId, query),
    enabled: !!driverId,
    placeholderData: (prev) => prev,
  });
}

export function useRequestLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveApi.request,
    onSuccess: () => {
      toastSuccess('Leave request submitted');
      void qc.invalidateQueries({ queryKey: leaveKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUpdateLeave(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateLeaveBody }) =>
      leaveApi.update(id, body),
    onSuccess: () => {
      toastSuccess('Leave request updated');
      void qc.invalidateQueries({ queryKey: leaveKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCancelLeave(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leaveApi.cancel(id),
    onSuccess: () => {
      toastSuccess('Leave request cancelled');
      void qc.invalidateQueries({ queryKey: leaveKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
