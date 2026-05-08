import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expensesApi } from './expenses.api';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export const expensesKeys = {
  all: ['expenses'] as const,
  vehicle: () => [...expensesKeys.all, 'vehicle'] as const,
  other: () => [...expensesKeys.all, 'other'] as const,
};

export const useVehicleExpenses = () =>
  useQuery({ queryKey: expensesKeys.vehicle(), queryFn: expensesApi.vehicle });

export const useOtherExpensesList = () =>
  useQuery({ queryKey: expensesKeys.other(), queryFn: expensesApi.other });

export function useCreateVehicleExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: expensesApi.createVehicle,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: expensesKeys.vehicle() });
      toastSuccess('Expense saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateOtherExpenseRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: expensesApi.createOther,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: expensesKeys.other() });
      toastSuccess('Other expense saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
