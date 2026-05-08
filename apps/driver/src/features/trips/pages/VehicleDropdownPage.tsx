import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuthStore } from '@store/auth.store';
import { useStartTrip } from '../trips.hooks';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@shared/api/client';

interface DriverVehicleRow {
  vehicleNumber?: string;
  registerName?: string;
  vehicleType?: string;
}

interface DriverVehicleResponse {
  vehicles: DriverVehicleRow[];
  primaryVehicleNumber: string | null;
}

export default function VehicleDropdownPage(): JSX.Element {
  const navigate = useNavigate();
  const driver = useAuthStore((s) => s.driver);
  const driverId = driver?.driverId ?? '';
  const startTrip = useStartTrip();
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [search, setSearch] = useState('');

  const list = useQuery({
    queryKey: ['driver-vehicles', driverId],
    queryFn: () =>
      apiClient.get<DriverVehicleResponse>(
        `/onboarding/vehicle-list-for-driver/${encodeURIComponent(driverId)}`,
      ),
    enabled: !!driverId,
  });

  const fallback = useQuery({
    queryKey: ['vehicleList', 'fallback'],
    queryFn: () => apiClient.getList<{ vehicleNumber: string }>('/onboarding/vehicleList'),
    enabled: !!driverId && (list.data?.vehicles?.length ?? 0) === 0 && !list.isLoading,
  });

  const tripStatus = useQuery({
    queryKey: ['trip-status', driverId],
    queryFn: () =>
      apiClient.get<{ isRunning: boolean }>(
        `/trip/get-trip-status/${encodeURIComponent(driverId)}`,
      ),
    enabled: !!driverId,
  });

  useEffect(() => {
    if (tripStatus.data?.isRunning) {
      navigate('/start-trip', { replace: true });
    }
  }, [tripStatus.data, navigate]);

  useEffect(() => {
    if (!vehicleNumber && list.data?.primaryVehicleNumber) {
      setVehicleNumber(list.data.primaryVehicleNumber);
    }
  }, [list.data, vehicleNumber]);

  const assigned = list.data?.vehicles ?? [];
  const usingFallback = assigned.length === 0 && (fallback.data?.length ?? 0) > 0;
  const allOptions: DriverVehicleRow[] = usingFallback
    ? (fallback.data ?? []).map((v) => ({ vehicleNumber: v.vehicleNumber }))
    : assigned;

  const options = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter((v) => {
      const num = String(v.vehicleNumber ?? '').toLowerCase();
      const type = String(v.vehicleType ?? '').toLowerCase();
      return num.includes(q) || type.includes(q);
    });
  }, [allOptions, search]);

  const showSearch = allOptions.length > 5;

  const onStart = (): void => {
    if (!driverId || !vehicleNumber) return;
    startTrip.mutate(
      { driverId, vehicleNumber },
      { onSuccess: () => navigate('/start-trip') },
    );
  };

  return (
    <div className="mx-auto max-w-md space-y-3 p-3">
      <div className="overflow-hidden rounded-xl border-2 border-black bg-white">
        <div className="bg-black px-4 py-3 text-base font-bold text-yellow-400">Start a Trip</div>
        <div className="space-y-3 p-4">
          <p className="text-xs text-gray-500">
            {usingFallback
              ? 'No vehicles assigned to you yet — showing the full fleet.'
              : 'Showing vehicles assigned to you.'}
          </p>

          {showSearch ? (
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                placeholder="Search vehicle number or type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border-2 border-black bg-white px-3 py-2 pl-9 text-sm outline-none focus:border-yellow-500"
                autoFocus
              />
            </div>
          ) : null}

          {list.isLoading ? (
            <p className="text-xs text-gray-500">Loading vehicles…</p>
          ) : allOptions.length === 0 ? (
            <p className="text-xs text-red-600">
              No vehicles available. Ask the office to assign a vehicle.
            </p>
          ) : options.length === 0 ? (
            <p className="text-xs text-gray-500">No vehicles match "{search}".</p>
          ) : (
            <ul className="space-y-2">
              {options.map((v) => (
                <li key={v.vehicleNumber}>
                  <button
                    type="button"
                    onClick={() => setVehicleNumber(v.vehicleNumber ?? '')}
                    className={`flex w-full items-center justify-between rounded-lg border-2 px-3 py-3 text-left text-sm transition ${
                      vehicleNumber === v.vehicleNumber
                        ? 'border-black bg-yellow-400'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <span className="font-bold">{v.vehicleNumber}</span>
                    {'vehicleType' in v && v.vehicleType ? (
                      <span className="text-xs text-gray-600">{v.vehicleType}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            className="w-full rounded-md bg-black px-3 py-3 text-sm font-bold text-yellow-400 disabled:opacity-60"
            disabled={!vehicleNumber || startTrip.isPending}
            onClick={onStart}
          >
            {startTrip.isPending ? 'Starting…' : 'Start Trip'}
          </button>
        </div>
      </div>
    </div>
  );
}
