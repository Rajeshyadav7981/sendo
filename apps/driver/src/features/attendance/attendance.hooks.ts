import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import {
  attendanceApi,
  type AttendanceListQuery,
  type AttendanceRecord,
  type UpdateAttendanceFieldsBody,
} from './attendance.api';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export const attendanceKeys = {
  all: ['attendance'] as const,
  byDriver: (driverId: string) => [...attendanceKeys.all, 'driver', driverId] as const,
  byDriverPaginated: (driverId: string, query: AttendanceListQuery) =>
    [...attendanceKeys.all, 'driver', driverId, 'paginated', query] as const,
  pending: () => [...attendanceKeys.all, 'pending'] as const,
};

export function useDriverAttendance(driverId: string) {
  return useQuery({
    queryKey: attendanceKeys.byDriver(driverId),
    queryFn: () => attendanceApi.byDriver(driverId),
    enabled: !!driverId,
  });
}

export function useDriverAttendancePaginated(driverId: string, query: AttendanceListQuery) {
  return useQuery({
    queryKey: attendanceKeys.byDriverPaginated(driverId, query),
    queryFn: () => attendanceApi.byDriverPaginated(driverId, query),
    enabled: !!driverId,
    placeholderData: (prev) => prev,
  });
}

export function useDeleteAttendance(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceApi.delete(id),
    onSuccess: () => {
      toastSuccess('Attendance deleted');
      void qc.invalidateQueries({ queryKey: attendanceKeys.all });
      void qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function usePendingAttendance() {
  return useQuery({
    queryKey: attendanceKeys.pending(),
    queryFn: () => apiClient.get<AttendanceRecord[]>('/attendance/pending'),
  });
}

export function useSendAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<AttendanceRecord, 'status'>) => attendanceApi.send(body),
    onSuccess: (_, body) => {
      toastSuccess('Attendance recorded');
      void qc.invalidateQueries({ queryKey: attendanceKeys.byDriver(body.driverId) });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUpdateAttendanceFields(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAttendanceFieldsBody }) =>
      attendanceApi.update(id, body),
    onSuccess: () => {
      toastSuccess('Attendance updated');
      void qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUpdateAttendanceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Approved' | 'Rejected' }) =>
      apiClient.put<AttendanceRecord>(`/attendance/${id}`, { status }),
    onSuccess: (_, { status }) => {
      toastSuccess(`Attendance ${status.toLowerCase()}`);
      void qc.invalidateQueries({ queryKey: attendanceKeys.pending() });
      void qc.invalidateQueries({ queryKey: attendanceKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
