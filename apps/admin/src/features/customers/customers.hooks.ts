import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersApi } from './customers.api';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export const customersKeys = {
  all: ['customers'] as const,
  list: () => [...customersKeys.all, 'list'] as const,
  invoices: () => [...customersKeys.all, 'invoices'] as const,
  payments: () => [...customersKeys.all, 'payments'] as const,
  agreements: () => [...customersKeys.all, 'agreements'] as const,
  gst: () => [...customersKeys.all, 'gst'] as const,
};

export const useCustomers = () =>
  useQuery({ queryKey: customersKeys.list(), queryFn: customersApi.list });

export const useInvoices = () =>
  useQuery({ queryKey: customersKeys.invoices(), queryFn: customersApi.invoices });

export const usePaymentStatuses = () =>
  useQuery({ queryKey: customersKeys.payments(), queryFn: customersApi.payments });

export const useAgreements = () =>
  useQuery({ queryKey: customersKeys.agreements(), queryFn: customersApi.agreements });

export const useGstEntries = () =>
  useQuery({ queryKey: customersKeys.gst(), queryFn: customersApi.gst });

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: customersKeys.list() });
      toastSuccess('Customer onboarded');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<import('./customers.api').CustomerInput> }) =>
      customersApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: customersKeys.list() });
      toastSuccess('Customer updated');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: customersKeys.list() });
      toastSuccess('Customer deleted');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.createInvoice,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: customersKeys.invoices() });
      toastSuccess('Invoice saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.createPayment,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: customersKeys.payments() });
      toastSuccess('Payment saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.createAgreement,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: customersKeys.agreements() });
      toastSuccess('Agreement saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateGstEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customersApi.createGst,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: customersKeys.gst() });
      toastSuccess('GST entry saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
