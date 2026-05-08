import { apiClient } from '@shared/api/client';

export interface AttendanceRecord {
  _id?: string;
  id?: string;
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  startTime: string;
  stopTime: string;
  duration: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt?: string;
  updatedAt?: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
}

export interface UpdateAttendanceFieldsBody {
  vehicleNumber?: string;
  startTime?: string;
  stopTime?: string;
  duration?: string;
}

export interface AttendanceListQuery {
  page?: number;
  limit?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedAttendance {
  items: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
}

function toQs(q: AttendanceListQuery): string {
  const p = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v == null || v === '') return;
    p.append(k, String(v));
  });
  return p.toString();
}

export const attendanceApi = {
  send: (body: Omit<AttendanceRecord, 'status'>) =>
    apiClient.post<{ message: string; _id: string }>('/attendance/send', body),
  byDriver: (driverId: string) =>
    apiClient.get<AttendanceRecord[]>(`/attendance/${driverId}`),
  byDriverPaginated: (driverId: string, query: AttendanceListQuery) => {
    const qs = toQs(query);
    return apiClient.get<PaginatedAttendance>(
      `/attendance/${driverId}${qs ? `?${qs}` : ''}`,
    );
  },
  byId: (id: string) => apiClient.get<AttendanceRecord>(`/attendance/record/${id}`),
  update: (id: string, body: UpdateAttendanceFieldsBody) =>
    apiClient.patch<{ message: string; updatedAttendance: AttendanceRecord }>(
      `/attendance/${id}`,
      body,
    ),
  delete: (id: string) => apiClient.delete<void>(`/attendance/${id}`),
};
