import { apiClient } from '@shared/api/client';

export interface VehicleLocation {
  id?: string;
  vehicleNumber?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  speed?: number;
  status?: string;
  updatedAt?: string;
  [k: string]: unknown;
}

export const trackingApi = {
  fetchLocations: () => apiClient.get<VehicleLocation[]>('/home/fetch-locations'),
  historyFor: (vehicleNumber: string) =>
    apiClient.get<VehicleLocation[]>(`/home/history/${vehicleNumber}`),
  parkingFor: (vehicleNumber: string) =>
    apiClient.get<VehicleLocation[]>(`/home/parking/${vehicleNumber}`),
};
