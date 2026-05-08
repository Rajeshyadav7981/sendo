import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi, type ListDocumentsQuery } from './vehicles.api';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export const vehiclesKeys = {
  all: ['vehicles'] as const,
  list: () => [...vehiclesKeys.all, 'list'] as const,
  byNumber: (n: string) => [...vehiclesKeys.all, n] as const,
  documents: (q?: ListDocumentsQuery) =>
    [...vehiclesKeys.all, 'documents', q ?? {}] as const,
  diesel: () => [...vehiclesKeys.all, 'diesel'] as const,
  dieselByMonth: (k: string) => [...vehiclesKeys.all, 'diesel-month', k] as const,
  expenses: () => [...vehiclesKeys.all, 'expenses'] as const,
  otherExpenses: () => [...vehiclesKeys.all, 'other-expenses'] as const,
  oil: () => [...vehiclesKeys.all, 'oil'] as const,
  spare: () => [...vehiclesKeys.all, 'spare-parts'] as const,
  truck: () => [...vehiclesKeys.all, 'truck-maintenance'] as const,
  tyres: () => [...vehiclesKeys.all, 'tyres'] as const,
  locations: () => [...vehiclesKeys.all, 'locations'] as const,
  history: (n: string) => [...vehiclesKeys.all, 'history', n] as const,
  parking: (n: string) => [...vehiclesKeys.all, 'parking', n] as const,
};

export const useVehicles = () =>
  useQuery({ queryKey: vehiclesKeys.list(), queryFn: vehiclesApi.all });

export const useVehicle = (vehicleNumber: string) =>
  useQuery({
    queryKey: vehiclesKeys.byNumber(vehicleNumber),
    queryFn: () => vehiclesApi.byNumber(vehicleNumber),
    enabled: !!vehicleNumber,
  });

export const useDocuments = (query: ListDocumentsQuery = {}) =>
  useQuery({
    queryKey: vehiclesKeys.documents(query),
    queryFn: () => vehiclesApi.documents(query),
    placeholderData: keepPreviousData,
  });

export const useDiesel = () =>
  useQuery({ queryKey: vehiclesKeys.diesel(), queryFn: vehiclesApi.diesel });

export const useDieselByMonth = (monthKey: string) =>
  useQuery({
    queryKey: vehiclesKeys.dieselByMonth(monthKey),
    queryFn: () => vehiclesApi.dieselByMonth(monthKey),
    enabled: !!monthKey,
  });

export const useExpenses = () =>
  useQuery({ queryKey: vehiclesKeys.expenses(), queryFn: vehiclesApi.expenses });

export const useOtherExpenses = () =>
  useQuery({ queryKey: vehiclesKeys.otherExpenses(), queryFn: vehiclesApi.otherExpenses });

export const useOilServices = () =>
  useQuery({ queryKey: vehiclesKeys.oil(), queryFn: vehiclesApi.oilService });

export const useSpareParts = () =>
  useQuery({ queryKey: vehiclesKeys.spare(), queryFn: vehiclesApi.spareParts });

export const useTruckMaintenance = () =>
  useQuery({ queryKey: vehiclesKeys.truck(), queryFn: vehiclesApi.truckMaintenance });

export const useTyres = () =>
  useQuery({ queryKey: vehiclesKeys.tyres(), queryFn: vehiclesApi.tyres });

export const useLiveLocations = () =>
  useQuery({
    queryKey: vehiclesKeys.locations(),
    queryFn: vehiclesApi.fetchLocations,
    refetchInterval: 30_000,
  });

export const useVehicleHistory = (vehicleNumber: string) =>
  useQuery({
    queryKey: vehiclesKeys.history(vehicleNumber),
    queryFn: () => vehiclesApi.history(vehicleNumber),
    enabled: !!vehicleNumber,
  });

export const useVehicleParking = (vehicleNumber: string) =>
  useQuery({
    queryKey: vehiclesKeys.parking(vehicleNumber),
    queryFn: () => vehiclesApi.parking(vehicleNumber),
    enabled: !!vehicleNumber,
  });

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => vehiclesApi.create(form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.list() });
      toastSuccess('Vehicle onboarded');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useRenewDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => vehiclesApi.renewDocument(form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.documents() });
      toastSuccess('Document renewed');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleNumber, body }: { vehicleNumber: string; body: Record<string, unknown> }) =>
      vehiclesApi.updateSchedule(vehicleNumber, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.list() });
      toastSuccess('Schedule updated');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      vehicleNumber,
      body,
    }: {
      vehicleNumber: string;
      body: Record<string, unknown>;
    }) => vehiclesApi.update(vehicleNumber, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.list() });
      toastSuccess('Vehicle updated');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vehicleNumber: string) => vehiclesApi.remove(vehicleNumber),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.list() });
      toastSuccess('Vehicle deleted');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateDiesel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.createDiesel,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.diesel() });
      toastSuccess('Diesel entry saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUpdateDiesel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      vehiclesApi.updateDiesel(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.diesel() });
      toastSuccess('Diesel entry updated');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useDeleteDiesel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehiclesApi.deleteDiesel(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.diesel() });
      toastSuccess('Diesel entry deleted');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.createExpense,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.expenses() });
      toastSuccess('Expense saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateOtherExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.createOtherExpense,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.otherExpenses() });
      toastSuccess('Other expense saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateOilService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.createOilService,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.oil() });
      toastSuccess('Oil service saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateSparePart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.createSparePart,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.spare() });
      toastSuccess('Spare part saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateTruckMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.createTruckMaintenance,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.truck() });
      toastSuccess('Maintenance entry saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useUpdateTruckMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, form }: { id: string; form: FormData }) =>
      vehiclesApi.updateTruckMaintenance(id, form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.truck() });
      toastSuccess('Maintenance entry updated');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useDeleteTruckMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehiclesApi.deleteTruckMaintenance(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.truck() });
      toastSuccess('Maintenance entry deleted');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useCreateTyre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.createTyre,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: vehiclesKeys.tyres() });
      toastSuccess('Tyre replacement saved');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
