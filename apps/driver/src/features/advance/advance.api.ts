import { apiClient } from '@shared/api/client';

export interface AdvanceRequest {
  id: string;
  driverId: string;
  driverName: string;
  month: string;
  requestedAmount: number;
  approvedAmount: number;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  reason?: string | null;
  requestedAt?: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
}

export interface DriverDeduction {
  id: string;
  driverId: string;
  driverName?: string | null;
  date?: string | null;
  amount?: number | string | null;
  reason?: string | null;
  remarks?: string | null;
  recoveryStatus?: string | null;
}

export interface AdvanceListQuery {
  driverId?: string;
  page?: number;
  limit?: number;
  status?: string;
  requestedAtFrom?: string;
  requestedAtTo?: string;
}

export interface PaginatedAdvances {
  items: AdvanceRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateAdvanceBody {
  requestedAmount?: number;
  month?: string;
  reason?: string | null;
}

function toQs(q: AdvanceListQuery): string {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v == null || v === '') return;
    p.append(k, String(v));
  });
  return p.toString();
}

export const advanceApi = {
  request: (body: Omit<AdvanceRequest, 'id' | 'approvedAmount' | 'approvalStatus'>) =>
    apiClient.post<{ message: string; data: AdvanceRequest }>('/advance/request', body),
  approvedForDriver: (driverId: string) =>
    apiClient.getList<AdvanceRequest>(`/advance/approved/${driverId}`),
  allForDriver: (driverId: string) =>
    apiClient.getList<AdvanceRequest>(
      `/advance/result?driverId=${encodeURIComponent(driverId)}&limit=200`,
    ),
  paginated: (query: AdvanceListQuery) => {
    const qs = toQs(query);
    return apiClient.get<PaginatedAdvances>(`/advance/result${qs ? `?${qs}` : ''}`);
  },
  update: (id: string, body: UpdateAdvanceBody) =>
    apiClient.patch<{ message: string; data: AdvanceRequest }>(
      `/advance/request/${id}`,
      body,
    ),
  delete: (id: string) => apiClient.delete<void>(`/advance/request/${id}`),
  deductionsForDriver: (driverId: string) =>
    apiClient.getList<DriverDeduction>(`/driver/deductions/${driverId}`),
};
