import { apiClient } from '@shared/api/client';

export interface DieselRecord {
  _id?: string;
  id?: string;
  vehicleNumber?: string;
  vehicleNo?: string;
  ownerName?: string;
  registerName?: string;
  vehicleOwner?: string;
  owner?: string;
  driverName?: string;
  volume?: number | string;
  totalAmount?: number | string;
  amount?: number | string;
  paymentMode?: string;
  paymentType?: string;
  paidBy?: string;
  pumpName?: string;
  fuelStation?: string;
  stationName?: string;
  startKm?: number | string;
  endKm?: number | string;
  totalKm?: number | string;
  expKmPerL?: number | string;
  expectedKmPerL?: number | string;
  scheduleKmPerLitre?: number | string;
  actualKmPerL?: number | string;
  actualMileage?: number | string;
  mileage?: number | string;
  expKm?: number | string;
  expectedKm?: number | string;
  kmDifference?: number | string;
  ratePerLiter?: number | string;
  pricePerLiter?: number | string;
  date?: string;
  fuelDate?: string;
  createdAt?: string;
  time?: string;
}

export interface DieselListQuery {
  vehicleNumber?: string;
  driverName?: string;
  monthKey?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreateDieselBody {
  date?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  driverName?: string;
  pumpName?: string;
  fuelType?: string;
  volume?: number;
  ratePerLiter?: number;
  totalAmount?: number;
  startKm?: number;
  endKm?: number;
  totalKm?: number;
  mileage?: number;
  paymentMode?: string;
  paidBy?: string;
  remarks?: string;
  dieselSlipPhoto?: string;
}

export interface PaginatedDiesel {
  items: DieselRecord[];
  total: number;
  page: number;
  limit: number;
}

function toQs(q: DieselListQuery): string {
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v == null || v === '') return;
    params.append(k, String(v));
  });
  return params.toString();
}

export const dieselApi = {
  list: (q: DieselListQuery = {}) => {
    const qs = toQs(q);
    return apiClient.getList<DieselRecord>(`/vehicle/diesel${qs ? `?${qs}` : ''}`);
  },
  listPaginated: (q: DieselListQuery = {}) => {
    const qs = toQs(q);
    return apiClient.get<PaginatedDiesel>(`/vehicle/diesel${qs ? `?${qs}` : ''}`);
  },
  create: (body: CreateDieselBody) =>
    apiClient.post<{ message: string; dieselEntry: DieselRecord }>('/vehicle/diesel', body),
  update: (id: string, body: CreateDieselBody) =>
    apiClient.patch<{ message: string; dieselEntry: DieselRecord }>(
      `/vehicle/diesel/${id}`,
      body,
    ),
  delete: (id: string) => apiClient.delete<void>(`/vehicle/diesel/${id}`),
  byMonth: (monthKey: string) =>
    apiClient.get<DieselRecord[]>(`/vehicle/diesel/by-month/${encodeURIComponent(monthKey)}`),
};
