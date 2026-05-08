import { apiClient } from '@shared/api/client';

export interface DriverAdvance {
  id: string;
  driverId: string;
  driverName: string;
  month: string;
  requestedAmount: string;
  approvedAmount: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
}

export interface LeaveRecord {
  id: string;
  driverId: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  leaveType?: string | null;
  createdAt: string;
}

export interface DeductionRecord {
  id: string;
  driverId?: string | null;
  driverName?: string | null;
  driverMobile?: string | null;
  vehicleNumber?: string | null;
  lossType?: string | null;
  location?: string | null;
  description?: string | null;
  amount?: string | null;
  recoveryStatus?: string | null;
  remarks?: string | null;
  date?: string | null;
  createdAt: string;
}

export interface PayoutSummary {
  totalDays: number;
  basicPayment: string;
  dailyWage: string;
  totalWorkingDays: number;
  totalHolidays: number | string;
  earnedPayment: string;
  totalAdvanceDeduction: string;
  referralBonus: string;
  payableAmount: string;
}

export const billingApi = {
  advances: () => apiClient.getList<DriverAdvance>('/advance/result'),
  pendingAdvances: () => apiClient.getList<DriverAdvance>('/advance/pending'),
  records: () => apiClient.getList<DriverAdvance>('/advance/records'),
  requestAdvance: (body: {
    driverId: string;
    driverName: string;
    month: string;
    requestedAmount: number;
  }) =>
    apiClient.post<{ message: string; data: DriverAdvance }>('/advance/request', body),
  manualAdvance: (body: {
    driverId: string;
    driverName: string;
    month: string;
    requestedAmount: number;
    approvedAmount: number;
    status: 'Pending' | 'Approved' | 'Rejected';
    adminName: string;
  }) => apiClient.post<{ message: string; data: DriverAdvance }>('/advance/manual', body),
  updateLeaveFull: (
    id: string,
    body: Partial<{
      driverId: string;
      startDate: string;
      endDate: string;
      reason: string;
      status: 'Pending' | 'Approved' | 'Rejected';
      leaveType: string;
    }>,
  ) => apiClient.put<{ message: string; data: LeaveRecord }>(`/advance/leaves/${id}`, body),
  approveAdvance: (body: {
    advanceId: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    approvedAmount?: number;
    adminName?: string;
  }) => apiClient.post<{ message: string; data: DriverAdvance }>('/advance/approve', body),
  approvedForDriver: (driverId: string) =>
    apiClient.get<DriverAdvance[]>(`/advance/approved/${driverId}`),

  leaves: () => apiClient.getList<LeaveRecord>('/advance/leaves'),
  leavesForDriver: (driverId: string) =>
    apiClient.get<LeaveRecord[]>(`/advance/leaves/${driverId}`),
  createLeave: (body: {
    driverId: string;
    startDate: string;
    endDate: string;
    reason?: string;
  }) => apiClient.post<{ success: true; message: string }>('/advance/leaves', body),
  updateLeave: (id: string, body: { status: 'Approved' | 'Rejected'; leaveType?: string }) =>
    apiClient.put<{ message: string; data: LeaveRecord }>(`/advance/leaves/${id}`, body),
  deleteLeave: (id: string) =>
    apiClient.delete<{ message: string }>(`/advance/leaves/${id}`),
  approvedLeaves: (driverId: string) =>
    apiClient.get<{ approvedLeaves: LeaveRecord[] }>(`/advance/approved-leaves/${driverId}`),

  payout: (driverId: string, month: string) =>
    apiClient.get<PayoutSummary>(`/advance/payout/${driverId}/${month}`),
  approveSalary: (driverId: string, month: string) =>
    apiClient.get<{ message: string; salaryApprove: unknown }>(
      `/advance/approve/${driverId}/${month}`,
    ),

  deductions: () => apiClient.get<DeductionRecord[]>('/driver/deductions'),
  deductionsForDriver: (driverId: string) =>
    apiClient.get<DeductionRecord[]>(`/driver/deductions/${driverId}`),
  createDeduction: (body: Record<string, unknown>) =>
    apiClient.post<{ message: string; data: DeductionRecord }>('/driver/deductions', body),
};
