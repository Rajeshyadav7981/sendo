import { apiClient } from '@shared/api/client';

export interface VehicleScheduleHistoryEntry {
  _id?: string;
  scheduleDate?: string;
  changedAt?: string;
  source?: string;
}

export interface VehicleOnboardingData {
  _id?: string;
  vehicleNumber?: string;
  registerName?: string;
  vehicleType?: string;
  grossVehicleWeight?: string | number;
  registrationDate?: string;
  fitnessValidUpto?: string;
  taxValidUpto?: string;
  insuranceValidUpto?: string;
  pollutionValidUpto?: string;
  statePermitValidUpto?: string;
  nationalPermit?: string;
  permitUpto?: string;
  scheduleDate?: string;
  scheduleInterval?: number;
  scheduleLitres?: number;
  scheduleKmPerLitre?: number;
  scheduleKmPerFill?: number;
  scheduleKmActual?: number;
  remarks?: string;
  RegistrationCertificate?: string;
  Insurance?: string;
  PollutionCertificate?: string;
  RoadTax?: string;
  FitnessCertificate?: string;
  Permit?: string;
  StatePermit?: string;
  TemporaryPermit?: string;
  scheduleDateHistory?: VehicleScheduleHistoryEntry[];
}

export const onboardingApi = {
  vehicle: (vehicleNumber: string) =>
    apiClient.get<VehicleOnboardingData>(
      `/onboarding/vehicle/${encodeURIComponent(vehicleNumber)}`,
    ),
};
