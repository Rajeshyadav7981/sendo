import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';
import type { DriverVehicle } from '@features/profile/profile.api';

interface FleetVehicleRow {
  vehicleNumber?: string;
  vehicleType?: string;
  registerName?: string;
}

export function useFleetVehicles(): {
  vehicles: DriverVehicle[];
  isLoading: boolean;
} {
  const query = useQuery({
    queryKey: ['fleet', 'vehicleList'],
    queryFn: () => apiClient.getList<FleetVehicleRow>('/onboarding/vehicleList'),
    staleTime: 5 * 60_000,
  });
  const vehicles: DriverVehicle[] = (query.data ?? [])
    .map((v) => ({
      vehicleNumber: String(v.vehicleNumber ?? '').trim(),
      vehicleType: v.vehicleType ?? undefined,
      registerName: v.registerName ?? undefined,
    }))
    .filter((v) => !!v.vehicleNumber)
    .sort((a, b) =>
      (a.vehicleNumber ?? '').localeCompare(b.vehicleNumber ?? '', undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );
  return { vehicles, isLoading: query.isLoading };
}
