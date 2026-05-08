import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeesApi, type Employee, type ScheduleConfig } from './employees.api';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export const employeesKeys = {
  all: ['employees'] as const,
  list: () => [...employeesKeys.all, 'list'] as const,
  attendancePending: () => ['employees', 'attendance', 'pending'] as const,
  attendanceAll: () => ['employees', 'attendance', 'all'] as const,
  leaves: () => ['employees', 'leaves'] as const,
  advancesPending: () => ['employees', 'advances', 'pending'] as const,
  advancesRecords: () => ['employees', 'advances', 'records'] as const,
  salaryAll: (month: string) => ['employees', 'salary', 'all', month] as const,
  salarySingle: (id: string, month: string) =>
    ['employees', 'salary', id, month] as const,
  deductions: () => ['employees', 'deductions'] as const,
  escalations: () => ['employees', 'escalations'] as const,
  schedule: () => ['employees', 'schedule'] as const,
  timesheet: () => ['employees', 'timesheet'] as const,
};

export const useEmployees = () =>
  useQuery({ queryKey: employeesKeys.list(), queryFn: employeesApi.list });

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Employee>) => employeesApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.list() });
      toastSuccess('Employee added');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, body }: { name: string; body: Partial<Employee> }) =>
      employeesApi.update(name, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.list() });
      toastSuccess('Employee updated');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => employeesApi.remove(name),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.list() });
      toastSuccess('Employee deleted');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export const useAttendancePending = () =>
  useQuery({ queryKey: employeesKeys.attendancePending(), queryFn: employeesApi.attendancePending });

export const useAttendanceAll = () =>
  useQuery({ queryKey: employeesKeys.attendanceAll(), queryFn: employeesApi.attendanceAll });

export function useUpdateAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'Approved' | 'Rejected' }) =>
      employeesApi.attendanceUpdate(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.attendancePending() });
      void qc.invalidateQueries({ queryKey: employeesKeys.attendanceAll() });
      toastSuccess('Attendance updated');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useDeleteEmployeeAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.attendanceDelete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.attendancePending() });
      void qc.invalidateQueries({ queryKey: employeesKeys.attendanceAll() });
      toastSuccess('Attendance deleted');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export const useEmployeeLeaves = () =>
  useQuery({ queryKey: employeesKeys.leaves(), queryFn: employeesApi.leaves });

export function useUpdateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { status?: 'Approved' | 'Rejected'; leaveType?: string | null; reason?: string };
    }) => employeesApi.leaveUpdate(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.leaves() });
      toastSuccess('Leave updated');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useDeleteLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.leaveDelete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.leaves() });
      toastSuccess('Leave deleted');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export const usePendingAdvances = () =>
  useQuery({
    queryKey: employeesKeys.advancesPending(),
    queryFn: employeesApi.advancesPending,
  });

export const useAdvanceRecords = () =>
  useQuery({
    queryKey: employeesKeys.advancesRecords(),
    queryFn: employeesApi.advancesRecords,
  });

export function useUpdateAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      approvedAmount,
    }: {
      id: string;
      status: 'Approved' | 'Rejected';
      approvedAmount: number;
    }) => employeesApi.advanceUpdate(id, { status, approvedAmount }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.advancesPending() });
      void qc.invalidateQueries({ queryKey: employeesKeys.advancesRecords() });
      toastSuccess('Advance updated');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useManualAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.advanceManual,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.advancesPending() });
      toastSuccess('Manual advance submitted');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export const useSalariesAll = (month: string) =>
  useQuery({
    queryKey: employeesKeys.salaryAll(month),
    queryFn: () => employeesApi.salariesAll(month),
    enabled: !!month,
  });

export const useSalarySingle = (driverId: string, month: string) =>
  useQuery({
    queryKey: employeesKeys.salarySingle(driverId, month),
    queryFn: () => employeesApi.salarySingle(driverId, month),
    enabled: !!driverId && !!month,
  });

export function useApproveSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, month }: { driverId: string; month: string }) =>
      employeesApi.salaryApprove(driverId, month),
    onSuccess: (_d, vars) => {
      void qc.invalidateQueries({ queryKey: employeesKeys.salaryAll(vars.month) });
      toastSuccess('Payout approved');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export const useDeductions = () =>
  useQuery({ queryKey: employeesKeys.deductions(), queryFn: employeesApi.deductions });

export function useCreateDeduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.deductionCreate,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.deductions() });
      toastSuccess('Deduction saved');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useDeleteDeduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.deductionDelete,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.deductions() });
      toastSuccess('Deduction deleted');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export const useEscalations = () =>
  useQuery({ queryKey: employeesKeys.escalations(), queryFn: employeesApi.escalations });

export function useCreateEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.escalationCreate,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.escalations() });
      toastSuccess('Escalation submitted');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useUpdateEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: string;
      status?: 'open' | 'resolved' | 'reopened';
      note?: string;
    }) => employeesApi.escalationUpdate(id, { status, note }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.escalations() });
      toastSuccess('Escalation updated');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useDeleteEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.escalationDelete,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.escalations() });
      toastSuccess('Escalation deleted');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export const useScheduleConfig = () =>
  useQuery({ queryKey: employeesKeys.schedule(), queryFn: employeesApi.schedule });

export function useSaveSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ScheduleConfig) => employeesApi.scheduleSave(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.schedule() });
      toastSuccess('Schedule saved');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export const useTimesheet = () =>
  useQuery({ queryKey: employeesKeys.timesheet(), queryFn: employeesApi.timesheet });

export function useCreateTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.timesheetCreate,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.timesheet() });
      toastSuccess('Timesheet saved');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useDeleteTimesheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeesApi.timesheetDelete,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: employeesKeys.timesheet() });
      toastSuccess('Timesheet deleted');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}
