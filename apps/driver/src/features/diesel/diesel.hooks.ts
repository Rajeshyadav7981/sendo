import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';
import { dieselApi, type CreateDieselBody, type DieselListQuery } from './diesel.api';

export const dieselKeys = {
  all: ['diesel'] as const,
  list: (q?: DieselListQuery) => [...dieselKeys.all, 'list', q ?? {}] as const,
  paginated: (q?: DieselListQuery) => [...dieselKeys.all, 'paginated', q ?? {}] as const,
};

export function useDieselRecords(query: DieselListQuery = {}) {
  return useQuery({
    queryKey: dieselKeys.list(query),
    queryFn: () => dieselApi.list(query),
  });
}

export function useDieselPaginated(query: DieselListQuery) {
  return useQuery({
    queryKey: dieselKeys.paginated(query),
    queryFn: () => dieselApi.listPaginated(query),
    placeholderData: (prev) => prev,
  });
}

export function useCreateDiesel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateDieselBody) => dieselApi.create(body),
    onSuccess: () => {
      toastSuccess('Diesel entry saved');
      void qc.invalidateQueries({ queryKey: dieselKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUpdateDiesel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateDieselBody }) =>
      dieselApi.update(id, body),
    onSuccess: () => {
      toastSuccess('Diesel entry updated');
      void qc.invalidateQueries({ queryKey: dieselKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useDeleteDiesel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dieselApi.delete(id),
    onSuccess: () => {
      toastSuccess('Diesel entry deleted');
      void qc.invalidateQueries({ queryKey: dieselKeys.all });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
