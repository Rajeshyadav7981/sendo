import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vendorsApi, type CreateVendorBody } from './vendors.api';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export const vendorsKeys = {
  all: ['vendors'] as const,
  list: () => [...vendorsKeys.all, 'list'] as const,
  advances: () => [...vendorsKeys.all, 'advances'] as const,
  deductions: () => [...vendorsKeys.all, 'deductions'] as const,
  payments: () => [...vendorsKeys.all, 'payments'] as const,
  tripSheets: () => [...vendorsKeys.all, 'trip-sheets'] as const,
};

export const useVendors = () =>
  useQuery({ queryKey: vendorsKeys.list(), queryFn: vendorsApi.list });

export const useVendorAdvances = () =>
  useQuery({ queryKey: vendorsKeys.advances(), queryFn: vendorsApi.advances });

export const useVendorDeductions = () =>
  useQuery({ queryKey: vendorsKeys.deductions(), queryFn: vendorsApi.deductions });

export const useVendorPayments = () =>
  useQuery({ queryKey: vendorsKeys.payments(), queryFn: vendorsApi.payments });

export const useTripSheets = () =>
  useQuery({ queryKey: vendorsKeys.tripSheets(), queryFn: vendorsApi.tripSheets });

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vendorsApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vendorsKeys.list() });
      toastSuccess('Vendor onboarded');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateVendorBody> }) =>
      vendorsApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vendorsKeys.list() });
      toastSuccess('Vendor updated');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vendorsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vendorsKeys.list() });
      toastSuccess('Vendor deleted');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateVendorAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vendorsApi.createAdvance,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vendorsKeys.advances() });
      toastSuccess('Vendor advance saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateVendorDeduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vendorsApi.createDeduction,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vendorsKeys.deductions() });
      toastSuccess('Vendor deduction saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateVendorPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vendorsApi.createPayment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vendorsKeys.payments() });
      toastSuccess('Vendor payment saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateTripSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vendorsApi.createTripSheet,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vendorsKeys.tripSheets() });
      toastSuccess('Trip sheet saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
