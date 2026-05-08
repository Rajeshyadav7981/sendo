import { apiClient } from '@shared/api/client';

export interface Vehicle {
  id: string;
  vehicleNumber: string;
  registerName: string;
  vehicleType: string;
  grossVehicleWeight: string;
  registrationDate: string;
  fitnessValidUpto: string;
  taxValidUpto: string;
  insuranceValidUpto: string;
  pollutionValidUpto: string;
  nationalPermit: 'Yes' | 'No';
  permitUpto?: string | null;
  statePermit: 'Yes' | 'No';
  statePermitValidUpto?: string | null;
  temporaryPermit: 'Yes' | 'No';
  TemporarypermitUpto?: string | null;
  remarks?: string | null;
  filePaths?: Record<string, string | null>;
  [k: string]: unknown;
}

export interface DocumentRow {
  vehicleNumber: string;
  registerName: string;
  documentType: string;
  documentKey: string;
  documentNumber: string;
  issueDate: string | null;
  expiryDate: string | null;
  issuingAuthority: string;
  remarks: string;
  fileUrl: string | null;
  source: string | null;
  historyCount: number;
}

export type DocStatus = 'Valid' | 'Expiring' | 'Expired' | 'Missing';

export interface ListDocumentsQuery {
  vehicleNumber?: string;
  documentType?: string;
  status?: DocStatus;
  q?: string;
  year?: number;
  month?: number;
  expiringWithinDays?: number;
  page?: number;
  limit?: number;
  sort?: 'expiry' | 'vehicle' | 'type';
  order?: 'asc' | 'desc';
}

export interface DocumentListResponse {
  items: DocumentRow[];
  total: number;
  page: number;
  limit: number;
}

export interface DieselEntry {
  id: string;
  date?: string | null;
  vehicleNumber?: string | null;
  driverName?: string | null;
  pumpName?: string | null;
  volume?: string | null;
  totalAmount?: string | null;
  paidBy?: string | null;
  startKm?: string | null;
  endKm?: string | null;
  paymentMode?: string | null;
  [k: string]: unknown;
}

export const vehiclesApi = {
  list: () => apiClient.get<Array<Pick<Vehicle, 'vehicleNumber'>>>('/onboarding/vehicleList'),
  all: () => apiClient.get<Vehicle[]>('/onboarding/all-vehicles'),
  byNumber: (n: string) => apiClient.get<Vehicle>(`/onboarding/vehicle/${n}`),
  exportCsv: () => apiClient.raw.get('/onboarding/vehicle-csv', { responseType: 'blob' }),
  create: (form: FormData) =>
    apiClient.postForm<{ message: string; data: Vehicle }>('/onboarding/vehicle', form),

  documents: (query: ListDocumentsQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v == null || v === '') return;
      params.append(k, String(v));
    });
    const qs = params.toString();
    return apiClient.get<DocumentListResponse>(
      `/onboarding/documents${qs ? `?${qs}` : ''}`,
    );
  },
  documentHistory: (n: string, key: string) =>
    apiClient.get<unknown[]>(`/onboarding/document-history/${n}/${key}`),
  renewDocument: (form: FormData) =>
    apiClient.postForm<{ message: string; fileUrl: string | null; historyCount: number }>(
      '/onboarding/renew-document',
      form,
    ),

  updateSchedule: (n: string, body: Record<string, unknown>) =>
    apiClient.patch<{ message: string; vehicle: Vehicle }>(
      `/onboarding/vehicle/${n}/schedule`,
      body,
    ),

  update: (n: string, body: Record<string, unknown>) =>
    apiClient.patch<{ message: string; vehicle: Vehicle }>(
      `/onboarding/vehicle/${encodeURIComponent(n)}`,
      body,
    ),

  remove: (n: string) =>
    apiClient.delete<void>(`/onboarding/vehicle/${encodeURIComponent(n)}`),

  diesel: () => apiClient.getList<DieselEntry>('/vehicle/diesel'),
  dieselByMonth: (key: string) =>
    apiClient.get<{ data: Record<string, Record<string, unknown>> }>(
      `/vehicle/diesel/by-month/${key}`,
    ),
  createDiesel: (body: Record<string, unknown>) =>
    apiClient.post<{ message: string; dieselEntry: DieselEntry }>('/vehicle/diesel', body),
  updateDiesel: (id: string, body: Record<string, unknown>) =>
    apiClient.patch<{ message: string; dieselEntry: DieselEntry }>(
      `/vehicle/diesel/${encodeURIComponent(id)}`,
      body,
    ),
  deleteDiesel: (id: string) =>
    apiClient.delete<{ message: string }>(`/vehicle/diesel/${encodeURIComponent(id)}`),
  dieselCsv: () => apiClient.raw.get('/vehicle/diesel-csv', { responseType: 'blob' }),

  expenses: () => apiClient.get<unknown[]>('/vehicle/expenses'),
  createExpense: (body: Record<string, unknown>) =>
    apiClient.post<unknown>('/vehicle/expenses', body),
  otherExpenses: () => apiClient.get<unknown[]>('/vehicle/other-expenses'),
  createOtherExpense: (body: Record<string, unknown>) =>
    apiClient.post<unknown>('/vehicle/other-expenses', body),

  oilService: () => apiClient.get<unknown[]>('/vehicle/oil-service'),
  createOilService: (body: Record<string, unknown>) =>
    apiClient.post<unknown>('/vehicle/oil-service', body),

  spareParts: () => apiClient.get<unknown[]>('/vehicle/spare-parts'),
  createSparePart: (body: Record<string, unknown>) =>
    apiClient.post<unknown>('/vehicle/spare-parts', body),

  truckMaintenance: () => apiClient.get<unknown[]>('/vehicle/truck-maintenance'),
  createTruckMaintenance: (form: FormData) =>
    apiClient.postForm<{ message: string; entry: unknown }>('/vehicle/truck-maintenance', form),
  updateTruckMaintenance: (id: string, form: FormData) =>
    apiClient.patchForm<{ message: string; entry: unknown }>(
      `/vehicle/truck-maintenance/${encodeURIComponent(id)}`,
      form,
    ),
  deleteTruckMaintenance: (id: string) =>
    apiClient.delete<void>(`/vehicle/truck-maintenance/${encodeURIComponent(id)}`),

  tyres: () => apiClient.get<unknown[]>('/vehicle/tyre-replacement'),
  createTyre: (body: Record<string, unknown>) =>
    apiClient.post<unknown>('/vehicle/tyre-replacement', body),

  fetchLocations: () => apiClient.get<unknown[]>('/vehicle/fetch-locations'),
  homeLocations: () => apiClient.get<unknown[]>('/home/fetch-locations'),
  history: (n: string) =>
    apiClient.get<Array<{ time: string | null; location: string | null }>>(`/home/history/${n}`),
  parking: (n: string) =>
    apiClient.get<Array<{ time: string | null; location: string | null }>>(`/home/parking/${n}`),
};
