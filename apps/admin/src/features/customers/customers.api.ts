import { apiClient } from '@shared/api/client';

export interface Customer {
  id: string;
  companyName: string;
  address: string;
  pointOfContact: string;
  state: string;
  phoneNumber: string;
  emailId: string;
  gstNumber: string;
  rateCard: string;
  createdAt: string;
}

export type CustomerInput = Omit<Customer, 'id' | 'createdAt'>;

export interface Invoice {
  id: string;
  invoiceNumber?: string | null;
  customerName?: string | null;
  vehicleNumber?: string | null;
  tripFrom?: string | null;
  tripTo?: string | null;
  invoiceDate?: string | null;
  dueDate?: string | null;
  amount?: string | null;
  gstAmount?: string | null;
  totalAmount?: string | null;
  status: string;
}

export interface InvoiceInput {
  invoiceNumber?: string;
  customerName?: string;
  vehicleNumber?: string;
  tripFrom?: string;
  tripTo?: string;
  invoiceDate?: string;
  dueDate?: string;
  amount?: number;
  gstAmount?: number;
  totalAmount?: number;
  status?: string;
}

export interface PaymentStatusRow {
  id: string;
  customerName?: string | null;
  invoiceNumber?: string | null;
  invoiceAmount?: string | null;
  amountReceived?: string | null;
  balanceDue?: string | null;
  paymentDate?: string | null;
  paymentMode?: string | null;
  utrNumber?: string | null;
  remarks?: string | null;
  status: string;
}

export interface PaymentInput {
  customerName?: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
  amountReceived?: number;
  balanceDue?: number;
  paymentDate?: string;
  paymentMode?: string;
  utrNumber?: string;
  remarks?: string;
  status?: string;
}

export interface Agreement {
  id: string;
  customerName?: string | null;
  vehicleNumber?: string | null;
  agreementType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  ratePerKm?: string | null;
  fixedRate?: string | null;
  paymentTerms?: string | null;
  terms?: string | null;
  status: string;
}

export interface AgreementInput {
  customerName?: string;
  vehicleNumber?: string;
  agreementType?: string;
  startDate?: string;
  endDate?: string;
  ratePerKm?: number;
  fixedRate?: number;
  paymentTerms?: string;
  terms?: string;
  status?: string;
}

export interface GstEntry {
  id: string;
  customerName?: string | null;
  gstNumber?: string | null;
  invoiceNumber?: string | null;
  invoiceDate?: string | null;
  taxableAmount?: string | null;
  cgst?: string | null;
  sgst?: string | null;
  igst?: string | null;
  totalGST?: string | null;
  totalAmount?: string | null;
  filingPeriod?: string | null;
  filingStatus: string;
}

export interface GstEntryInput {
  customerName?: string;
  gstNumber?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  taxableAmount?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalGST?: number;
  totalAmount?: number;
  filingPeriod?: string;
  filingStatus?: string;
}

export const customersApi = {
  list: () => apiClient.get<Customer[]>('/customer/list'),
  create: (body: CustomerInput) => apiClient.post<Customer>('/customer/onboarding', body),
  update: (id: string, body: Partial<CustomerInput>) =>
    apiClient.put<Customer>(`/customer/${encodeURIComponent(id)}`, body),
  remove: (id: string) =>
    apiClient.delete<{ message: string }>(`/customer/${encodeURIComponent(id)}`),

  invoices: () => apiClient.getList<Invoice>('/customer/invoices'),
  createInvoice: (body: InvoiceInput) => apiClient.post<Invoice>('/customer/invoices', body),

  payments: () => apiClient.getList<PaymentStatusRow>('/customer/payment-status'),
  createPayment: (body: PaymentInput) =>
    apiClient.post<PaymentStatusRow>('/customer/payment-status', body),

  agreements: () => apiClient.get<Agreement[]>('/customer/agreements'),
  createAgreement: (body: AgreementInput) =>
    apiClient.post<Agreement>('/customer/agreements', body),

  gst: () => apiClient.get<GstEntry[]>('/customer/gst'),
  createGst: (body: GstEntryInput) => apiClient.post<GstEntry>('/customer/gst', body),
};
