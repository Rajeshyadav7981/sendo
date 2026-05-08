import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';
import { profileApi, type DriverProfile } from './profile.api';

export const profileKeys = {
  all: ['profile'] as const,
  shift: (driverId: string) => [...profileKeys.all, 'shift', driverId] as const,
  vehicles: (driverId: string) => [...profileKeys.all, 'vehicles', driverId] as const,
};

export function useDriverShift(driverId: string) {
  return useQuery({
    queryKey: profileKeys.shift(driverId),
    queryFn: () => profileApi.shift(driverId),
    enabled: !!driverId,
  });
}

export function useDriverVehicles(driverId: string) {
  return useQuery({
    queryKey: profileKeys.vehicles(driverId),
    queryFn: () => profileApi.vehiclesForDriver(driverId),
    enabled: !!driverId,
  });
}

export function useUpdateProfile(driverId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<DriverProfile>) => profileApi.update(driverId, body),
    onSuccess: () => {
      toastSuccess('Profile updated');
      void qc.invalidateQueries({ queryKey: profileKeys.shift(driverId) });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
