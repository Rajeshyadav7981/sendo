import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tripsApi, type TripSheetListQuery } from './trips.api';
import { useTripStore } from '@store/trip.store';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export const tripKeys = {
  all: ['trip'] as const,
  status: (id: string) => [...tripKeys.all, 'status', id] as const,
  sheets: (id: string) => [...tripKeys.all, 'sheets', id] as const,
  sheetsPaginated: (query: TripSheetListQuery) =>
    [...tripKeys.all, 'sheets', 'paginated', query] as const,
};

export function useDriverTripSheets(driverId: string) {
  return useQuery({
    queryKey: tripKeys.sheets(driverId),
    queryFn: () => tripsApi.myTripSheets(driverId),
    enabled: !!driverId,
  });
}

export function useDriverTripSheetsPaginated(query: TripSheetListQuery) {
  return useQuery({
    queryKey: tripKeys.sheetsPaginated(query),
    queryFn: () => tripsApi.myTripSheetsPaginated(query),
    enabled: !!query.driverId,
    placeholderData: (prev) => prev,
  });
}

export function useTripStatus(driverId: string) {
  return useQuery({
    queryKey: tripKeys.status(driverId),
    queryFn: () => tripsApi.status(driverId),
    enabled: !!driverId,
    refetchInterval: 30_000,
  });
}

export function useStartTrip() {
  const setRunning = useTripStore((s) => s.setRunning);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, vehicleNumber }: { driverId: string; vehicleNumber: string }) =>
      tripsApi.start(driverId, vehicleNumber),
    onSuccess: (_, { vehicleNumber, driverId }) => {
      setRunning(true, vehicleNumber);
      void qc.invalidateQueries({ queryKey: tripKeys.status(driverId) });
      toastSuccess('Trip started');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useStopTrip() {
  const reset = useTripStore((s) => s.reset);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (driverId: string) => tripsApi.stop(driverId),
    onSuccess: (data, driverId) => {
      reset();
      void qc.invalidateQueries({ queryKey: tripKeys.status(driverId) });
      toastSuccess(`Trip stopped (${data.duration}s)`);
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}
