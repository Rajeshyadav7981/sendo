import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import {
  trackerApi,
  type EscalationCreateBody,
  type EscalationsQuery,
  type FillsQuery,
  type OdometerCreateBody,
} from './tracker.api';
import { formatTrackerRequestError } from '@shared/api/client';

export const trackerKeys = {
  vehicles: ['tracker', 'vehicles'] as const,
  vehicleSearch: (q: string, page: number, limit: number) =>
    ['tracker', 'vehicleSearch', q, page, limit] as const,
  vehicleDetails: (vehicle: string) => ['tracker', 'vehicleDetails', vehicle] as const,
  fillMonths: ['tracker', 'fillMonths'] as const,
  fills: (q: FillsQuery) => ['tracker', 'fills', q] as const,
  schedule: (vehicle: string) => ['tracker', 'schedule', vehicle] as const,
  odometer: (vehicle: string, page: number, limit: number) =>
    ['tracker', 'odometer', vehicle, page, limit] as const,
  escalations: (q: EscalationsQuery) =>
    ['tracker', 'escalations', q.vehicle ?? '', q.from ?? '', q.to ?? '', q.page, q.limit] as const,
};

export function useVehicles(): ReturnType<typeof useQuery<Awaited<ReturnType<typeof trackerApi.listVehicles>>>> {
  return useQuery({
    queryKey: trackerKeys.vehicles,
    queryFn: trackerApi.listVehicles,
  });
}

export function useVehicleDetails(
  vehicle: string,
): ReturnType<typeof useQuery<Awaited<ReturnType<typeof trackerApi.vehicleDetails>>>> {
  return useQuery({
    queryKey: trackerKeys.vehicleDetails(vehicle),
    queryFn: () => trackerApi.vehicleDetails(vehicle),
    enabled: Boolean(vehicle),
    staleTime: 5 * 60_000,
  });
}

export function useVehicleSearch(
  q: string,
  page: number,
  limit: number,
): ReturnType<typeof useQuery<Awaited<ReturnType<typeof trackerApi.searchVehicles>>>> {
  return useQuery({
    queryKey: trackerKeys.vehicleSearch(q, page, limit),
    queryFn: () => trackerApi.searchVehicles(q, page, limit),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useFillMonths(): ReturnType<typeof useQuery<Awaited<ReturnType<typeof trackerApi.fillMonths>>>> {
  return useQuery({
    queryKey: trackerKeys.fillMonths,
    queryFn: trackerApi.fillMonths,
  });
}

export function useFills(q: FillsQuery, enabled: boolean): ReturnType<typeof useQuery<Awaited<ReturnType<typeof trackerApi.listFills>>>> {
  return useQuery({
    queryKey: trackerKeys.fills(q),
    queryFn: () => trackerApi.listFills(q),
    enabled,
  });
}

export function useScheduleForVehicle(vehicle: string): ReturnType<typeof useQuery<Awaited<ReturnType<typeof trackerApi.scheduleForVehicle>>>> {
  return useQuery({
    queryKey: trackerKeys.schedule(vehicle),
    queryFn: () => trackerApi.scheduleForVehicle(vehicle),
    enabled: Boolean(vehicle),
  });
}

export function useOdometerReadings(
  vehicle: string,
  page = 1,
  limit = 25,
): ReturnType<typeof useQuery<Awaited<ReturnType<typeof trackerApi.listOdometerPaginated>>>> {
  return useQuery({
    queryKey: trackerKeys.odometer(vehicle, page, limit),
    queryFn: () => trackerApi.listOdometerPaginated(vehicle, page, limit),
    enabled: Boolean(vehicle),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export function useEscalations(
  q: EscalationsQuery,
): ReturnType<typeof useQuery<Awaited<ReturnType<typeof trackerApi.listEscalationsPaginated>>>> {
  return useQuery({
    queryKey: trackerKeys.escalations(q),
    queryFn: () => trackerApi.listEscalationsPaginated(q),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });
}

export interface CreateOdometerVars {
  vehicle: string;
  body: OdometerCreateBody;
}

export function useCreateOdometer(): ReturnType<
  typeof useMutation<Awaited<ReturnType<typeof trackerApi.createOdometer>>, Error, CreateOdometerVars>
> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicle, body }: CreateOdometerVars) =>
      trackerApi.createOdometer(vehicle, body),
    onSuccess: (_d, vars) => {
      message.success('Reading saved.');
      qc.invalidateQueries({ queryKey: ['tracker', 'odometer', vars.vehicle] });
    },
    onError: (err) => message.error(formatTrackerRequestError(err)),
  });
}

export function useCreateEscalation(): ReturnType<typeof useMutation<Awaited<ReturnType<typeof trackerApi.createEscalation>>, Error, EscalationCreateBody>> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EscalationCreateBody) => trackerApi.createEscalation(body),
    onSuccess: () => {
      message.success('Escalation submitted.');
      qc.invalidateQueries({ queryKey: ['tracker', 'escalations'] });
    },
    onError: (err) => message.error(formatTrackerRequestError(err)),
  });
}
