import { apiClient } from '@shared/api/client';

export interface Vendor {
  id: string;
  supplierName: string;
  venderSiteCode: 'Rental' | 'Adhoc';
  phoneNumber: string;
  emailId: string;
  panNumber: string;
  IFSCcode: string;
  beneficiaryName: string;
  accountNumber: string;
  branchName: string;
  state: string;
  pinCode: string;
  townCity: string;
  addressLine1: string;
  addressLine2?: string | null;
  serviceRegistrationNumber: string;
  serviceTax?: string | null;
  tdsRateSection?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface VendorAdvance {
  id?: string;
  vendorName?: string | null;
  vehicleNumber?: string | null;
  advanceType?: string | null;
  amount?: number | null;
  date?: string | null;
  paymentMode?: string | null;
  reason?: string | null;
  status?: string | null;
  createdAt?: string;
}

export interface VendorDeduction {
  id?: string;
  vendorName?: string | null;
  vehicleNumber?: string | null;
  deductionType?: string | null;
  amount?: number | null;
  date?: string | null;
  description?: string | null;
  tripNumber?: string | null;
  createdAt?: string;
}

export interface VendorPayment {
  id?: string;
  vendorName?: string | null;
  vehicleNumber?: string | null;
  invoiceNumber?: string | null;
  tripNumber?: string | null;
  grossAmount?: number | null;
  deductions?: number | null;
  netAmount?: number | null;
  paymentDate?: string | null;
  paymentMode?: string | null;
  utrNumber?: string | null;
  remarks?: string | null;
  status?: string | null;
  createdAt?: string;
}

export interface TripSheet {
  id: string;
  tripNumber?: string | null;
  vendorName?: string | null;
  vehicleNumber?: string | null;
  driverName?: string | null;
  origin?: string | null;
  destination?: string | null;
  loadingDate?: string | null;
  unloadingDate?: string | null;
  material?: string | null;
  weight?: number | null;
  freight?: number | null;
  advancePaid?: number | null;
  balanceFreight?: number | null;
  status: string;
  createdAt: string;
}

export type CreateVendorBody = Omit<Vendor, 'id' | 'createdAt'>;
export type CreateVendorAdvanceBody = Omit<VendorAdvance, 'id' | 'createdAt'>;
export type CreateVendorDeductionBody = Omit<VendorDeduction, 'id' | 'createdAt'>;
export type CreateVendorPaymentBody = Omit<VendorPayment, 'id' | 'createdAt'>;
export type CreateTripSheetBody = Omit<TripSheet, 'id' | 'createdAt' | 'status'> & {
  status?: string;
};

export const vendorsApi = {
  list: () => apiClient.get<Vendor[]>('/onboarding/vendors'),
  create: (body: CreateVendorBody) => apiClient.post<Vendor>('/onboarding/vendor', body),
  update: (id: string, body: Partial<CreateVendorBody>) =>
    apiClient.put<Vendor>(`/onboarding/vendor/${encodeURIComponent(id)}`, body),
  remove: (id: string) =>
    apiClient.delete<{ message: string }>(`/onboarding/vendor/${encodeURIComponent(id)}`),

  advances: () => apiClient.get<VendorAdvance[]>('/advance/vendor-advance'),
  createAdvance: (body: CreateVendorAdvanceBody) =>
    apiClient.post<VendorAdvance>('/advance/vendor-advance', body),

  deductions: () => apiClient.get<VendorDeduction[]>('/advance/vendor-deduction'),
  createDeduction: (body: CreateVendorDeductionBody) =>
    apiClient.post<VendorDeduction>('/advance/vendor-deduction', body),

  payments: () => apiClient.get<VendorPayment[]>('/advance/vendor-payment'),
  createPayment: (body: CreateVendorPaymentBody) =>
    apiClient.post<VendorPayment>('/advance/vendor-payment', body),

  tripSheets: () => apiClient.getList<TripSheet>('/trip/trip-sheet'),
  createTripSheet: (body: CreateTripSheetBody) =>
    apiClient.post<TripSheet>('/trip/trip-sheet', body),
};
