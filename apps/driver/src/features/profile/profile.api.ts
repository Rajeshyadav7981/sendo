import { apiClient } from '@shared/api/client';

export interface DriverProfile {
  id?: string;
  driverId?: string;
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
  basicPayment?: string | number | null;
  bankAccountNumber?: string | null;
  ifsc?: string | null;
  bankName?: string | null;
  panNo?: string | null;
  aadharNumber?: string | null;
  contactNumber?: string | null;
  emergencyContact?: string | null;
  shiftType?: string | null;
  state?: string | null;
  shiftA?: boolean;
  shiftB?: boolean;
  isActive?: boolean;
  assignedVehicleNumber?: string | null;
  profilePicture?: string | null;
  filePaths?: Record<string, string | null>;
}

export interface DriverVehicle {
  vehicleNumber?: string;
  registerName?: string;
  vehicleType?: string;
}

export interface DriverShiftSummary {
  driverId?: string;
  shiftA?: boolean;
  shiftB?: boolean;
  shiftType?: string | null;
  [k: string]: unknown;
}

export const profileApi = {
  shift: (driverId: string) =>
    apiClient.get<DriverShiftSummary>(`/onboarding/driver-shift/${encodeURIComponent(driverId)}`),
  vehiclesForDriver: (driverId: string) =>
    apiClient.get<{ vehicles: DriverVehicle[]; primaryVehicleNumber: string | null }>(
      `/onboarding/vehicle-list-for-driver/${encodeURIComponent(driverId)}`,
    ),
  update: (driverId: string, body: Partial<DriverProfile>) =>
    apiClient.put<{ message: string; updatedDriver: DriverProfile }>(
      `/onboarding/drivers/${encodeURIComponent(driverId)}`,
      body,
    ),
};
