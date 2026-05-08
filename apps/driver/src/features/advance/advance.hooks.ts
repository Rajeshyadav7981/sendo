import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  advanceApi,
  type AdvanceListQuery,
  type AdvanceRequest,
  type UpdateAdvanceBody,
} from './advance.api';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export const advanceKeys = {
  all: ['advance'] as const,
  approved: (driverId: string) => [...advanceKeys.all, 'approved', driverId] as const,
  history: (driverId: string) => [...advanceKeys.all, 'history', driverId] as const,
  paginated: (query: AdvanceListQuery) => [...advanceKeys.all, 'paginated', query] as const,
  deductions: (driverId: string) => [...advanceKeys.all, 'deductions', driverId] as const,
};

export function useApprovedAdvances(driverId: string) {
  return useQuery({
    queryKey: advanceKeys.approved(driverId),
    queryFn: () => advanceApi.approvedForDriver(driverId),
    enabled: !!driverId,
  });
}

export function useDriverAdvanceHistory(driverId: string) {
  return useQuery({
    queryKey: advanceKeys.history(driverId),
    queryFn: () => advanceApi.allForDriver(driverId),
    enabled: !!driverId,
  });
}

export function useDriverAdvancePaginated(query: AdvanceListQuery) {
  return useQuery({
    queryKey: advanceKeys.paginated(query),
    queryFn: () => advanceApi.paginated(query),
    enabled: !!query.driverId,
    placeholderData: (prev) => prev,
  });
}

export function useDriverDeductions(driverId: string) {
  return useQuery({
    queryKey: advanceKeys.deductions(driverId),
    queryFn: () => advanceApi.deductionsForDriver(driverId),
    enabled: !!driverId,
  });
}

export function useRequestAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<AdvanceRequest, 'id' | 'approvedAmount' | 'approvalStatus'>) =>
      advanceApi.request(body),
    onSuccess: (_, body) => {
      toastSuccess(`Advance requested for ${body.month}`);
      void qc.invalidateQueries({ queryKey: advanceKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUpdateAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAdvanceBody }) =>
      advanceApi.update(id, body),
    onSuccess: () => {
      toastSuccess('Advance updated');
      void qc.invalidateQueries({ queryKey: advanceKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useDeleteAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => advanceApi.delete(id),
    onSuccess: () => {
      toastSuccess('Advance deleted');
      void qc.invalidateQueries({ queryKey: advanceKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
