import { apiClient } from '@shared/api/client';

export interface Driver {
  id: string;
  driverId: string;
  firstName?: string | null;
  secondName?: string | null;
  surname?: string | null;
  fatherName?: string | null;
  address?: string | null;
  dob?: string | null;
  dlNumber?: string | null;
  dlValidTill?: string | null;
  dlType?: string | null;
  joiningDate?: string | null;
  basicPayment?: string | null;
  nameAsPerBank?: string | null;
  bankAccountNumber?: string | null;
  ifsc?: string | null;
  bankName?: string | null;
  panNo?: string | null;
  aadharNumber?: string | null;
  contactNumber?: string | null;
  emergencyContact?: string | null;
  shiftType?: string | null;
  referBy?: string | null;
  state?: string | null;
  shiftA: boolean;
  shiftB: boolean;
  isDraft: boolean;
  referralBonus?: string | null;
  profilePicture?: string | null;
  aadharFile?: string | null;
  panFile?: string | null;
  dlFile?: string | null;
  bankPassbookFile?: string | null;
  filePaths?: Record<string, string | null>;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: unknown;
}

export const driversApi = {
  list: () => apiClient.getList<Driver>('/onboarding/drivers'),
  latestId: () => apiClient.get<{ latestId: string }>('/onboarding/latest-id'),
  checkDriver: (driverId: string) =>
    apiClient.post<{ valid: boolean; driverId?: string }>('/onboarding/checkDriver', { driverId }),
  checkPhoneNumber: (phoneNumber: string) =>
    apiClient.post<{ message: string; driverDetails: Driver }>(
      '/onboarding/checkPhoneNumber',
      { phoneNumber },
    ),
  getShift: (driverId: string) => apiClient.get<Driver>(`/onboarding/driver-shift/${driverId}`),

  create: (form: FormData) =>
    apiClient.postForm<{ message: string; driverDetails: Driver }>(
      '/onboarding/driver-confirm',
      form,
    ),
  addon: (body: { driverId: string; shiftType: string; state: string; referBy?: string }) =>
    apiClient.post<{ message: string; data: Driver }>('/onboarding/driver-addon-data', body),

  update: (driverId: string, body: Partial<Driver>) =>
    apiClient.put<{ message: string; updatedDriver: Driver }>(
      `/onboarding/drivers/${driverId}`,
      body,
    ),
  delete: (driverId: string) =>
    apiClient.delete<{ message: string }>(`/onboarding/drivers/${driverId}`),
  exportCsv: () => apiClient.raw.get('/onboarding/driver-csv', { responseType: 'blob' }),

  saveDraft: (body: { driverId: string } & Record<string, unknown>) =>
    apiClient.post<{ message: string; driver: Driver }>('/onboarding/save-draft', body),
  submit: (body: { driverId: string } & Record<string, unknown>) =>
    apiClient.post<{ message: string; driver: Driver }>('/onboarding/submit', body),
  drafts: () => apiClient.get<Driver[]>('/onboarding/get-all-drafts'),
  draft: (driverId: string) => apiClient.get<Driver>(`/onboarding/get-draft/${driverId}`),
  cancelDraft: (driverId: string) =>
    apiClient.delete<{ message: string }>(`/onboarding/cancel-draft/${driverId}`),

  vehiclesForDriver: (driverId: string) =>
    apiClient.get<unknown>(
      `/onboarding/vehicle-list-for-driver/${encodeURIComponent(driverId)}`,
    ),
  assignVehicle: (body: {
    driverId: string;
    vehicleNumber: string;
    assignedBy?: string;
    isPrimary?: boolean;
  }) => apiClient.post<unknown>('/onboarding/assign-vehicle', body),
  unassignVehicle: (driverId: string, vehicleNumber: string) =>
    apiClient.delete<{ message: string }>(
      `/onboarding/unassign-vehicle/${encodeURIComponent(driverId)}/${encodeURIComponent(vehicleNumber)}`,
    ),
};
