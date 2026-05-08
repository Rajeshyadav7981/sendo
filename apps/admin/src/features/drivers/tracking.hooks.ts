import { useQuery } from '@tanstack/react-query';
import { trackingApi } from './tracking.api';

export const trackingKeys = {
  all: ['tracking'] as const,
  locations: () => [...trackingKeys.all, 'locations'] as const,
  history: (vehicle: string) => [...trackingKeys.all, 'history', vehicle] as const,
  parking: (vehicle: string) => [...trackingKeys.all, 'parking', vehicle] as const,
};

export const useVehicleLocations = (enabled: boolean, refetchMs?: number) =>
  useQuery({
    queryKey: trackingKeys.locations(),
    queryFn: trackingApi.fetchLocations,
    enabled,
    refetchInterval: enabled ? (refetchMs ?? 5_000) : false,
  });

export const useVehicleHistory = (vehicleNumber: string) =>
  useQuery({
    queryKey: trackingKeys.history(vehicleNumber),
    queryFn: () => trackingApi.historyFor(vehicleNumber),
    enabled: !!vehicleNumber,
  });

export const useVehicleParking = (vehicleNumber: string) =>
  useQuery({
    queryKey: trackingKeys.parking(vehicleNumber),
    queryFn: () => trackingApi.parkingFor(vehicleNumber),
    enabled: !!vehicleNumber,
  });
