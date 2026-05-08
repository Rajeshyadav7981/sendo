import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from './attendance.api';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export const attendanceKeys = {
  all: ['attendance'] as const,
  list: () => [...attendanceKeys.all, 'list'] as const,
  byDriver: (id: string) => [...attendanceKeys.all, 'driver', id] as const,
  byId: (id: string) => [...attendanceKeys.all, 'record', id] as const,
  timesheets: () => [...attendanceKeys.all, 'timesheets'] as const,
};

export const useAllAttendance = () =>
  useQuery({ queryKey: attendanceKeys.list(), queryFn: attendanceApi.all });

export const useAttendanceByDriver = (driverId: string) =>
  useQuery({
    queryKey: attendanceKeys.byDriver(driverId),
    queryFn: () => attendanceApi.byDriver(driverId),
    enabled: !!driverId,
  });

export const useAttendanceById = (id: string) =>
  useQuery({
    queryKey: attendanceKeys.byId(id),
    queryFn: () => attendanceApi.byId(id),
    enabled: !!id,
  });

export function useUpdateAttendanceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Approved' | 'Rejected' }) =>
      attendanceApi.updateStatus(id, status),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: attendanceKeys.list() });
      toastSuccess(`Attendance ${vars.status}`);
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export const useTimesheets = () =>
  useQuery({ queryKey: attendanceKeys.timesheets(), queryFn: attendanceApi.timesheets });

export function useCreateTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.createTimesheet,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: attendanceKeys.timesheets() });
      toastSuccess('Timesheet saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useDeleteTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceApi.deleteTimesheet(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: attendanceKeys.timesheets() });
      toastSuccess('Timesheet deleted');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useDeleteAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: attendanceKeys.list() });
      toastSuccess('Attendance deleted');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
