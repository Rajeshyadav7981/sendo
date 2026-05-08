import { apiClient } from '@shared/api/client';

export interface TripStatus {
  isRunning: boolean;
  startTime?: string;
  duration?: number;
}

export interface TripSheet {
  id?: string;
  tripNumber?: string;
  vehicleNumber?: string;
  driverId?: string;
  driverName?: string;
  customerName?: string;
  vendorName?: string;
  origin?: string;
  destination?: string;
  loadingDate?: string;
  unloadingDate?: string;
  material?: string;
  weight?: string | number;
  freight?: string | number;
  status?: string;
  podUrl?: string | null;
  loadingSlipUrl?: string | null;
}

export interface TripSheetListQuery {
  driverId?: string;
  page?: number;
  limit?: number;
  status?: string;
  loadingDateFrom?: string;
  loadingDateTo?: string;
}

export interface PaginatedTripSheets {
  items: TripSheet[];
  total: number;
  page: number;
  limit: number;
}

function toQs(q: TripSheetListQuery): string {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v == null || v === '') return;
    p.append(k, String(v));
  });
  return p.toString();
}

export const tripsApi = {
  start: (driverId: string, vehicleNumber: string) =>
    apiClient.post<{ message: string; tripId: string }>('/trip/start-trip', {
      driverId,
      vehicleNumber,
    }),
  stop: (driverId: string) =>
    apiClient.post<{ message: string; duration: number }>('/trip/stop-trip', { driverId }),
  status: (driverId: string) => apiClient.get<TripStatus>(`/trip/get-trip-status/${driverId}`),
  myTripSheets: (driverId: string) =>
    apiClient.getList<TripSheet>(
      `/trip/trip-sheet?driverId=${encodeURIComponent(driverId)}&limit=50`,
    ),
  myTripSheetsPaginated: (query: TripSheetListQuery) => {
    const qs = toQs(query);
    return apiClient.get<PaginatedTripSheets>(`/trip/trip-sheet${qs ? `?${qs}` : ''}`);
  },
};
