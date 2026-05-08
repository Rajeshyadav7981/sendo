import { apiClient } from '@shared/api/client';

export interface AttendanceRecord {
  id: string;
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  startTime: string;
  stopTime: string;
  duration: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  driverShiftLabel?: string | null;
  shiftDetail?: string | null;
  createdAt: string;
}

export interface Timesheet {
  id: string;
  driverName?: string | null;
  vehicleNumber?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  totalHours?: string | null;
  totalMinutes?: string | null;
}

export const attendanceApi = {
  all: () => apiClient.getList<AttendanceRecord>('/attendance/all'),
  byDriver: (driverId: string) =>
    apiClient.get<AttendanceRecord[]>(`/attendance/${driverId}`),
  byId: (id: string) => apiClient.get<AttendanceRecord>(`/attendance/record/${id}`),
  send: (body: Omit<AttendanceRecord, 'id' | 'status' | 'createdAt'>) =>
    apiClient.post<{ message: string; _id: string }>('/attendance/send', body),
  updateStatus: (id: string, status: 'Approved' | 'Rejected') =>
    apiClient.put<{ message: string; updatedAttendance: AttendanceRecord }>(
      `/attendance/${id}`,
      { status },
    ),

  timesheets: () => apiClient.getList<Timesheet>('/onboarding/timesheet'),
  createTimesheet: (body: Record<string, unknown>) =>
    apiClient.post<Timesheet>('/onboarding/timesheet', body),
  deleteTimesheet: (id: string) =>
    apiClient.delete<{ message?: string }>(`/onboarding/timesheet/${encodeURIComponent(id)}`),

  remove: (id: string) =>
    apiClient.delete<{ message?: string }>(`/attendance/${encodeURIComponent(id)}`),
};
