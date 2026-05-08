import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi } from './billing.api';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export const billingKeys = {
  all: ['billing'] as const,
  advances: () => [...billingKeys.all, 'advances'] as const,
  pending: () => [...billingKeys.all, 'pending'] as const,
  records: () => [...billingKeys.all, 'records'] as const,
  approvedForDriver: (id: string) => [...billingKeys.all, 'approved', id] as const,
  leaves: () => [...billingKeys.all, 'leaves'] as const,
  leavesByDriver: (id: string) => [...billingKeys.all, 'leaves', id] as const,
  approvedLeaves: (id: string) => [...billingKeys.all, 'approved-leaves', id] as const,
  payout: (id: string, month: string) => [...billingKeys.all, 'payout', id, month] as const,
  deductions: () => [...billingKeys.all, 'deductions'] as const,
  deductionsByDriver: (id: string) => [...billingKeys.all, 'deductions', id] as const,
};

export const useAdvances = () =>
  useQuery({ queryKey: billingKeys.advances(), queryFn: billingApi.advances });
export const usePendingAdvances = () =>
  useQuery({ queryKey: billingKeys.pending(), queryFn: billingApi.pendingAdvances });
export const useAdvanceRecords = () =>
  useQuery({ queryKey: billingKeys.records(), queryFn: billingApi.records });
export const useApprovedAdvances = (driverId: string) =>
  useQuery({
    queryKey: billingKeys.approvedForDriver(driverId),
    queryFn: () => billingApi.approvedForDriver(driverId),
    enabled: !!driverId,
  });

export function useRequestAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: billingApi.requestAdvance,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.advances() });
      void qc.invalidateQueries({ queryKey: billingKeys.pending() });
      toastSuccess('Advance request submitted');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useApproveAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: billingApi.approveAdvance,
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: billingKeys.advances() });
      void qc.invalidateQueries({ queryKey: billingKeys.pending() });
      void qc.invalidateQueries({ queryKey: billingKeys.records() });
      toastSuccess(`Advance ${variables.status.toLowerCase()}`);
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useManualAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: billingApi.manualAdvance,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.all });
      toastSuccess('Manual advance added');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export const useLeaves = () =>
  useQuery({ queryKey: billingKeys.leaves(), queryFn: billingApi.leaves });

export const useLeavesByDriver = (driverId: string) =>
  useQuery({
    queryKey: billingKeys.leavesByDriver(driverId),
    queryFn: () => billingApi.leavesForDriver(driverId),
    enabled: !!driverId,
  });

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: billingApi.createLeave,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.leaves() });
      toastSuccess('Leave request submitted');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUpdateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { status: 'Approved' | 'Rejected'; leaveType?: string };
    }) => billingApi.updateLeave(id, body),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: billingKeys.leaves() });
      toastSuccess(`Leave ${variables.body.status}`);
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useDeleteLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: billingApi.deleteLeave,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.leaves() });
      toastSuccess('Leave deleted');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useEditLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<{
        driverId: string;
        startDate: string;
        endDate: string;
        reason: string;
        status: 'Pending' | 'Approved' | 'Rejected';
        leaveType: string;
      }>;
    }) => billingApi.updateLeaveFull(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.leaves() });
      toastSuccess('Leave updated');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export const usePayout = (driverId: string, month: string) =>
  useQuery({
    queryKey: billingKeys.payout(driverId, month),
    queryFn: () => billingApi.payout(driverId, month),
    enabled: !!driverId && !!month,
  });

export function useApproveSalary() {
  return useMutation({
    mutationFn: ({ driverId, month }: { driverId: string; month: string }) =>
      billingApi.approveSalary(driverId, month),
    onSuccess: () => toastSuccess('Salary approved'),
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export const useDeductions = () =>
  useQuery({ queryKey: billingKeys.deductions(), queryFn: billingApi.deductions });

export const useDeductionsByDriver = (driverId: string) =>
  useQuery({
    queryKey: billingKeys.deductionsByDriver(driverId),
    queryFn: () => billingApi.deductionsForDriver(driverId),
    enabled: !!driverId,
  });

export function useCreateDeduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: billingApi.createDeduction,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: billingKeys.deductions() });
      toastSuccess('Deduction saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
