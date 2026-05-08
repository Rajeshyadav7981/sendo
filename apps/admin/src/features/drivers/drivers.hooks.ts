import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { driversApi, type Driver } from './drivers.api';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export const driversKeys = {
  all: ['drivers'] as const,
  list: () => [...driversKeys.all, 'list'] as const,
  latestId: () => [...driversKeys.all, 'latest-id'] as const,
  drafts: () => [...driversKeys.all, 'drafts'] as const,
  shift: (id: string) => [...driversKeys.all, 'shift', id] as const,
  draft: (id: string) => [...driversKeys.all, 'draft', id] as const,
  vehiclesForDriver: (id: string) =>
    [...driversKeys.all, 'vehicles-for-driver', id] as const,
};

export const useVehiclesForDriver = (driverId: string) =>
  useQuery({
    queryKey: driversKeys.vehiclesForDriver(driverId),
    queryFn: () => driversApi.vehiclesForDriver(driverId),
    enabled: !!driverId,
  });

export const useDrivers = () =>
  useQuery({ queryKey: driversKeys.list(), queryFn: driversApi.list });

export const useLatestDriverId = () =>
  useQuery({ queryKey: driversKeys.latestId(), queryFn: driversApi.latestId });

export const useDriverShift = (driverId: string) =>
  useQuery({
    queryKey: driversKeys.shift(driverId),
    queryFn: () => driversApi.getShift(driverId),
    enabled: !!driverId,
  });

export const useDrafts = () =>
  useQuery({ queryKey: driversKeys.drafts(), queryFn: driversApi.drafts });

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => driversApi.create(form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: driversKeys.list() });
      toastSuccess('Driver onboarded');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, body }: { driverId: string; body: Partial<Driver> }) =>
      driversApi.update(driverId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: driversKeys.list() });
      toastSuccess('Driver updated');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (driverId: string) => driversApi.delete(driverId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: driversKeys.list() });
      toastSuccess('Driver deleted');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useSaveDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: driversApi.saveDraft,
    onSuccess: () => qc.invalidateQueries({ queryKey: driversKeys.drafts() }),
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCancelDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: driversApi.cancelDraft,
    onSuccess: () => qc.invalidateQueries({ queryKey: driversKeys.drafts() }),
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useAssignVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      driverId: string;
      vehicleNumber: string;
      assignedBy?: string;
      isPrimary?: boolean;
    }) => driversApi.assignVehicle(body),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: driversKeys.list() });
      void qc.invalidateQueries({
        queryKey: driversKeys.vehiclesForDriver(vars.driverId),
      });
      toastSuccess('Vehicle assigned');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUnassignVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, vehicleNumber }: { driverId: string; vehicleNumber: string }) =>
      driversApi.unassignVehicle(driverId, vehicleNumber),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: driversKeys.list() });
      void qc.invalidateQueries({
        queryKey: driversKeys.vehiclesForDriver(vars.driverId),
      });
      toastSuccess('Vehicle unassigned');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
