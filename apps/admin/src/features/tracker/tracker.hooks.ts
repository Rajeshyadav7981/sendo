import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  trackerApi,
  type Escalation,
  type EscalationsQuery,
  type OdometerCreateBody,
} from './tracker.api';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export const trackerKeys = {
  all: ['tracker'] as const,
  fillsByMonth: (mk: string) => [...trackerKeys.all, 'fills', mk] as const,
  allFills: () => [...trackerKeys.all, 'fills', 'all'] as const,
  schedule: () => [...trackerKeys.all, 'schedule'] as const,
  escalations: () => [...trackerKeys.all, 'escalations'] as const,
  escalationsPaginated: (q: EscalationsQuery) =>
    [
      ...trackerKeys.all,
      'escalations',
      q.vehicle ?? '',
      q.status ?? '',
      q.from ?? '',
      q.to ?? '',
      q.page,
      q.limit,
    ] as const,
  employees: () => [...trackerKeys.all, 'employees'] as const,
  vehicles: () => [...trackerKeys.all, 'vehicles'] as const,
  drivers: () => [...trackerKeys.all, 'drivers'] as const,
  diesel: (mk: string) => [...trackerKeys.all, 'diesel', mk] as const,
  odometer: (vehicle: string) => [...trackerKeys.all, 'odometer', vehicle] as const,
};

export const useFillsByMonth = (monthKey: string) =>
  useQuery({
    queryKey: trackerKeys.fillsByMonth(monthKey),
    queryFn: () => trackerApi.fillsByMonth(monthKey),
    enabled: Boolean(monthKey),
  });

export const useAllFills = () =>
  useQuery({ queryKey: trackerKeys.allFills(), queryFn: trackerApi.allFills });

export const useScheduleConfig = () =>
  useQuery({ queryKey: trackerKeys.schedule(), queryFn: trackerApi.schedule });

export const useEscalations = () =>
  useQuery({ queryKey: trackerKeys.escalations(), queryFn: trackerApi.escalations });

export const useEscalationsPaginated = (q: EscalationsQuery) =>
  useQuery({
    queryKey: trackerKeys.escalationsPaginated(q),
    queryFn: () => trackerApi.escalationsPaginated(q),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

export const useEmployees = () =>
  useQuery({ queryKey: trackerKeys.employees(), queryFn: trackerApi.employees });

export const useTrackerVehicles = () =>
  useQuery({ queryKey: trackerKeys.vehicles(), queryFn: trackerApi.allVehicles });

export const useTrackerDrivers = () =>
  useQuery({ queryKey: trackerKeys.drivers(), queryFn: trackerApi.drivers });

export const useDieselByMonth = (monthKey: string) =>
  useQuery({
    queryKey: trackerKeys.diesel(monthKey),
    queryFn: () => trackerApi.dieselByMonth(monthKey),
    enabled: Boolean(monthKey),
  });

export function useCreateFill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trackerApi.createFill,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trackerKeys.all });
      toastSuccess('Fill saved');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useBulkFills() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trackerApi.bulkFills,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trackerKeys.all });
      toastSuccess('Bulk fills saved');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useBulkSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trackerApi.bulkSchedule,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trackerKeys.schedule() });
      toastSuccess('Schedule saved');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useCreateEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trackerApi.createEscalation,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trackerKeys.escalations() });
      toastSuccess('Escalation submitted');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useBulkEscalations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trackerApi.bulkEscalations,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trackerKeys.escalations() });
      toastSuccess('Escalations synced');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useUpdateEscalationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: Escalation['status'] }) =>
      trackerApi.updateEscalationStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trackerKeys.escalations() });
      toastSuccess('Escalation updated');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useDeleteEscalation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trackerApi.deleteEscalation,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trackerKeys.escalations() });
      toastSuccess('Escalation deleted');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trackerApi.createEmployee,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trackerKeys.employees() });
      toastSuccess('Employee added');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, body }: { name: string; body: { password?: string } }) =>
      trackerApi.updateEmployee(name, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trackerKeys.employees() });
      toastSuccess('Employee updated');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export function useDeleteEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: trackerApi.deleteEmployee,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trackerKeys.employees() });
      toastSuccess('Employee deleted');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}

export const useOdometer = (vehicle: string) =>
  useQuery({
    queryKey: trackerKeys.odometer(vehicle),
    queryFn: () => trackerApi.odometer(vehicle),
    enabled: Boolean(vehicle),
  });

export function useCreateOdometer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicle, body }: { vehicle: string; body: OdometerCreateBody }) =>
      trackerApi.createOdometer(vehicle, body),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: trackerKeys.odometer(vars.vehicle) });
      toastSuccess('Odometer reading saved');
    },
    onError: (e) => toastError(getApiErrorMessage(e)),
  });
}
