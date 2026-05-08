import { apiClient } from '@shared/api/client';

export interface Employee {
  _id?: string;
  name: string;
  password?: string;
  role?: string;
  phone?: string;
  email?: string;
  [k: string]: unknown;
}

export interface AttendanceRecord {
  _id: string;
  driverId: string;
  driverName: string;
  vehicleNumber: string;
  startTime: string;
  stopTime: string;
  duration: string;
  shiftDetail?: string;
  driverShiftLabel?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface LeaveRequest {
  _id: string;
  driverId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  leaveType?: string | null;
}

export interface AdvanceRequest {
  _id: string;
  driverId: string;
  driverName: string;
  month: string;
  requestedAmount: number;
  approvedAmount?: number;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  reason?: string;
}

export interface SalaryRecord {
  _id?: string;
  driverId: string;
  driverName: string;
  salaryMonth?: string;
  noOfDays?: number;
  basicPayment?: number;
  perDayPayment?: number;
  totalAdvance?: number;
  totalDeduction?: number;
  netPayout?: number;
}

export interface Deduction {
  _id: string;
  driverId: string;
  driverName?: string;
  month?: string;
  deductionType?: string;
  amount: number | string;
  reason?: string;
}

export type EscalationSeverity = 'low' | 'medium' | 'high';
export type EscalationStatus = 'open' | 'resolved' | 'reopened';

export interface Escalation {
  _id?: string;
  id?: string;
  vehicle: string;
  /** Required by `CreateEscalationDto`. Free-text but bounded to 100 chars. */
  category: string;
  severity?: EscalationSeverity;
  note?: string | null;
  raisedBy?: string | null;
  status: EscalationStatus;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EscalationCreateBody {
  vehicle: string;
  category: string;
  severity?: EscalationSeverity;
  note?: string;
  raisedBy?: string;
}

export interface ScheduleRow {
  vehicle: string;
  vtype?: string;
  interval?: string | number;
  litres?: string | number;
  kmPerLitre?: string | number;
  expectedKm?: string | number;
  actualKm?: string | number;
}

export type ScheduleConfig = Record<string, ScheduleRow>;

export interface TimesheetRecord {
  _id: string;
  driverName: string;
  vehicleNumber?: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: string | number;
  totalMinutes: string | number;
}

export interface TimesheetCreate {
  driverName: string;
  vehicleNumber?: string;
  date: string;
  startTime: string;
  endTime: string;
  totalHours: string;
  totalMinutes: number;
}

const unwrap = <T>(res: T | { data: T }): T => {
  if (res && typeof res === 'object' && 'data' in (res as object)) {
    return (res as { data: T }).data;
  }
  return res as T;
};

export const employeesApi = {
  list: async (): Promise<Employee[]> =>
    unwrap(await apiClient.get<Employee[] | { data: Employee[] }>('/api/employees')),
  create: (body: Partial<Employee>) =>
    apiClient.post<{ message?: string; data?: Employee }>('/api/employees', body),
  update: (name: string, body: Partial<Employee>) =>
    apiClient.put<{ message?: string; data?: Employee }>(
      `/api/employees/${encodeURIComponent(name)}`,
      body,
    ),
  remove: (name: string) =>
    apiClient.delete<{ message?: string }>(`/api/employees/${encodeURIComponent(name)}`),

  attendancePending: () => apiClient.getList<AttendanceRecord>('/attendance/pending'),
  attendanceAll: () => apiClient.getList<AttendanceRecord>('/attendance/all'),
  attendanceUpdate: (id: string, status: 'Approved' | 'Rejected') =>
    apiClient.put<{ message?: string }>(`/attendance/${id}`, { status }),
  attendanceDelete: (id: string) =>
    apiClient.delete<{ message?: string }>(`/attendance/${encodeURIComponent(id)}`),

  leaves: () => apiClient.getList<LeaveRequest>('/advance/leaves'),
  leaveCreate: (body: { driverId: string; startDate: string; endDate: string; reason?: string }) =>
    apiClient.post<{ success: boolean; message: string }>('/advance/leaves', body),
  leaveUpdate: (
    id: string,
    body: { status?: 'Approved' | 'Rejected'; leaveType?: string | null; reason?: string },
  ) => apiClient.put<{ message?: string }>(`/advance/leaves/${id}`, body),
  leaveDelete: (id: string) => apiClient.delete<{ message?: string }>(`/advance/leaves/${id}`),

  advancesPending: () => apiClient.getList<AdvanceRequest>('/advance/pending'),
  advancesRecords: () => apiClient.getList<AdvanceRequest>('/advance/records'),
  advanceUpdate: (id: string, body: { status: 'Approved' | 'Rejected'; approvedAmount: number }) =>
    apiClient.put<{ message?: string }>(`/advance/${id}`, body),
  advanceManual: (body: {
    driverId: string;
    driverName?: string;
    month?: string;
    requestedAmount: string | number;
    reason?: string;
  }) => apiClient.post<{ message?: string }>('/advance/manual', body),

  salariesAll: (month: string) =>
    apiClient.get<SalaryRecord[]>(`/advance/payout/all/${encodeURIComponent(month)}`),
  salarySingle: (driverId: string, month: string) =>
    apiClient.get<SalaryRecord & Record<string, unknown>>(
      `/advance/payout/${encodeURIComponent(driverId)}/${encodeURIComponent(month)}`,
    ),
  salaryApprove: (driverId: string, month: string) =>
    apiClient.get<{ message?: string }>(
      `/payment/approve/${encodeURIComponent(driverId)}/${encodeURIComponent(month)}`,
    ),

  deductions: () => apiClient.get<Deduction[]>('/advance/deductions'),
  deductionCreate: (body: Partial<Deduction>) =>
    apiClient.post<{ message?: string; data?: Deduction }>('/advance/deductions', body),
  deductionDelete: (id: string) =>
    apiClient.delete<{ message?: string }>(`/advance/deductions/${id}`),

  escalations: async (): Promise<Escalation[]> =>
    unwrap(await apiClient.get<Escalation[] | { data: Escalation[] }>('/api/escalations')),
  escalationCreate: (body: EscalationCreateBody) =>
    apiClient.post<{ message?: string; data?: Escalation }>('/api/escalations', body),
  escalationUpdate: (id: string, body: { status?: EscalationStatus; note?: string }) =>
    apiClient.patch<{ message?: string }>(`/api/escalations/${id}`, body),
  escalationDelete: (id: string) =>
    apiClient.delete<{ message?: string }>(`/api/escalations/${id}`),

  schedule: async (): Promise<ScheduleConfig> =>
    unwrap(await apiClient.get<ScheduleConfig | { data: ScheduleConfig }>('/api/schedule')),
  scheduleSave: (body: ScheduleConfig) =>
    apiClient.post<{ message?: string }>('/api/schedule', body),

  timesheet: () => apiClient.getList<TimesheetRecord>('/onboarding/timesheet'),
  timesheetCreate: (body: TimesheetCreate) =>
    apiClient.post<{ message?: string; data?: TimesheetRecord }>('/onboarding/timesheet', body),
  timesheetDelete: (id: string) =>
    apiClient.delete<{ message?: string }>(`/onboarding/timesheet/${id}`),
};
