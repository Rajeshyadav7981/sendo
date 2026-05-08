import { apiClient } from '@shared/api/client';

export interface LeaveRecord {
  id: string;
  driverId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  leaveType?: string;
  createdAt?: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
}

export interface LeaveListQuery {
  page?: number;
  limit?: number;
  status?: string;
  startDateFrom?: string;
  startDateTo?: string;
}

export interface PaginatedLeaves {
  items: LeaveRecord[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateLeaveBody {
  startDate?: string;
  endDate?: string;
  reason?: string | null;
}

function toQs(q: LeaveListQuery): string {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v == null || v === '') return;
    p.append(k, String(v));
  });
  return p.toString();
}

export const leaveApi = {
  request: (body: { driverId: string; startDate: string; endDate: string; reason?: string }) =>
    apiClient.post<{ success: true; message: string }>('/advance/leaves', body),
  byDriver: (driverId: string) => apiClient.getList<LeaveRecord>(`/advance/leaves/${driverId}`),
  byDriverPaginated: (driverId: string, query: LeaveListQuery) => {
    const qs = toQs(query);
    return apiClient.get<PaginatedLeaves>(
      `/advance/leaves/${driverId}${qs ? `?${qs}` : ''}`,
    );
  },
  approved: (driverId: string) =>
    apiClient.get<{ approvedLeaves: LeaveRecord[] }>(`/advance/approved-leaves/${driverId}`),
  update: (id: string, body: UpdateLeaveBody) =>
    apiClient.patch<{ message: string; data: LeaveRecord }>(`/advance/leaves/${id}`, body),
  cancel: (id: string) => apiClient.delete<{ message: string }>(`/advance/leaves/${id}`),
};
