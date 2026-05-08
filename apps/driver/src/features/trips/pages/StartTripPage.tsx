import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';
import { useTripStore } from '@store/trip.store';
import {
  useDriverTripSheetsPaginated,
  useStopTrip,
  useTripStatus,
} from '../trips.hooks';
import type { TripSheet } from '../trips.api';

const PAGE_SIZE = 10;

function formatDuration(sec: number | undefined): string {
  if (!sec || sec < 0) return '00:00:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

const fmtDate = (d: string | undefined): string =>
  d ? new Date(d).toLocaleDateString('en-IN') : '—';

function statusBadge(s: string | undefined): string {
  if (!s) return 'bg-gray-100 text-gray-700';
  const k = s.toLowerCase();
  if (k.includes('complete') || k.includes('delivered')) return 'bg-green-100 text-green-800';
  if (k.includes('cancel') || k.includes('reject')) return 'bg-red-100 text-red-800';
  if (k.includes('pending') || k.includes('progress')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-700';
}

export default function StartTripPage(): JSX.Element {
  const navigate = useNavigate();
  const driver = useAuthStore((s) => s.driver);
  const driverId = driver?.driverId ?? '';
  const tripState = useTripStore();
  const { data: status } = useTripStatus(driverId);
  const stopTrip = useStopTrip();

  const [, setTick] = useState(0);
  const [confirmStop, setConfirmStop] = useState(false);
  const [page, setPage] = useState(1);
  const [filterPreset, setFilterPreset] = useState<'all' | 'month' | 'year' | 'custom'>('month');
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterYear, setFilterYear] = useState(() => String(new Date().getFullYear()));
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [previewing, setPreviewing] = useState<TripSheet | null>(null);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1_000);
    return () => clearInterval(t);
  }, []);

  const dateRange = useMemo(() => {
    if (filterPreset === 'all') return { loadingDateFrom: undefined, loadingDateTo: undefined };
    if (filterPreset === 'month') {
      const [y, m] = filterMonth.split('-').map(Number);
      if (!y || !m) return { loadingDateFrom: undefined, loadingDateTo: undefined };
      return {
        loadingDateFrom: new Date(y, m - 1, 1).toISOString(),
        loadingDateTo: new Date(y, m, 0, 23, 59, 59, 999).toISOString(),
      };
    }
    if (filterPreset === 'year') {
      const y = Number(filterYear);
      if (!y) return { loadingDateFrom: undefined, loadingDateTo: undefined };
      return {
        loadingDateFrom: new Date(y, 0, 1).toISOString(),
        loadingDateTo: new Date(y, 11, 31, 23, 59, 59, 999).toISOString(),
      };
    }
    return {
      loadingDateFrom: customFrom ? new Date(`${customFrom}T00:00:00`).toISOString() : undefined,
      loadingDateTo: customTo ? new Date(`${customTo}T23:59:59.999`).toISOString() : undefined,
    };
  }, [filterPreset, filterMonth, filterYear, customFrom, customTo]);

  useEffect(() => {
    setPage(1);
  }, [filterPreset, filterMonth, filterYear, customFrom, customTo]);

  const sheets = useDriverTripSheetsPaginated({
    driverId,
    page,
    limit: PAGE_SIZE,
    loadingDateFrom: dateRange.loadingDateFrom,
    loadingDateTo: dateRange.loadingDateTo,
  });

  const items = sheets.data?.items ?? [];
  const total = sheets.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const startEpoch =
    (status?.startTime ? new Date(status.startTime).getTime() : null) ??
    tripState.startTime ??
    null;
  const seconds = startEpoch
    ? Math.max(0, Math.floor((Date.now() - startEpoch) / 1_000))
    : status?.duration ?? 0;

  const humanDuration = (s: number): string => {
    if (s < 60) return `${s}s`;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const onConfirmedStop = (): void => {
    stopTrip.mutate(driverId, {
      onSuccess: () => {
        setConfirmStop(false);
        navigate('/');
      },
    });
  };

  return (
    <div className="mx-auto max-w-md space-y-3 p-3">
      <div className="overflow-hidden rounded-xl border-2 border-black bg-white">
        <div className="bg-black px-4 py-3 text-center text-base font-bold text-yellow-400">
          Trip In Progress
        </div>
        <div className="space-y-3 p-5 text-center">
          <p className="text-xs text-gray-500">
            Vehicle: <strong>{tripState.vehicleNumber ?? '—'}</strong>
          </p>
          <div className="font-mono text-4xl font-bold tracking-widest">
            {formatDuration(seconds)}
          </div>
          <button
            type="button"
            className="w-full rounded-md bg-red-600 px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
            disabled={!driverId || stopTrip.isPending}
            onClick={() => setConfirmStop(true)}
          >
            {stopTrip.isPending ? 'Stopping…' : 'Stop Trip'}
          </button>
        </div>
      </div>

      {confirmStop ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => !stopTrip.isPending && setConfirmStop(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-2xl border-2 border-black bg-white p-5 shadow-xl sm:rounded-2xl"
          >
            <p className="text-base font-bold">Stop trip?</p>
            <p className="mt-2 text-xs text-gray-600">
              Vehicle <strong>{tripState.vehicleNumber ?? '—'}</strong> has been running for{' '}
              <strong>{humanDuration(seconds)}</strong>. Stopping ends the trip — you can&apos;t undo this.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={stopTrip.isPending}
                onClick={() => setConfirmStop(false)}
                className="flex-1 rounded-md border-2 border-black bg-white px-3 py-2 text-sm font-bold disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={stopTrip.isPending}
                onClick={onConfirmedStop}
                className="flex-1 rounded-md bg-red-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {stopTrip.isPending ? 'Stopping…' : 'Yes, stop trip'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border-2 border-black bg-white">
        <div className="flex items-center justify-between bg-yellow-400 px-4 py-2 text-sm font-bold text-black">
          <span>My Past Trips</span>
          {sheets.data ? (
            <span className="text-[10px] font-normal opacity-80">{total} total</span>
          ) : null}
        </div>
        <div className="space-y-3 p-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {(['month', 'year', 'all', 'custom'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFilterPreset(p)}
                  className={`flex-1 rounded-md border-2 px-2 py-1.5 text-[11px] font-bold transition ${
                    filterPreset === p
                      ? 'border-black bg-black text-yellow-400'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  {p === 'month' ? 'Month' : p === 'year' ? 'Year' : p === 'all' ? 'All' : 'Custom'}
                </button>
              ))}
            </div>
            {filterPreset === 'month' ? (
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full rounded border-2 border-black p-2 text-xs"
              />
            ) : null}
            {filterPreset === 'year' ? (
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full rounded border-2 border-black p-2 text-xs"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            ) : null}
            {filterPreset === 'custom' ? (
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[10px] text-gray-500">
                  From
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="mt-0.5 w-full rounded border-2 border-black p-2 text-xs"
                  />
                </label>
                <label className="block text-[10px] text-gray-500">
                  To
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="mt-0.5 w-full rounded border-2 border-black p-2 text-xs"
                  />
                </label>
              </div>
            ) : null}
          </div>

          {sheets.isLoading ? (
            <p className="text-center text-xs text-gray-500">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-center text-xs text-gray-500">No past trips for this period.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((t) => (
                <li key={t.id ?? `${t.tripNumber}-${t.loadingDate}`}>
                  <button
                    type="button"
                    onClick={() => setPreviewing(t)}
                    className="w-full rounded-md border border-gray-200 bg-white p-3 text-left text-xs transition hover:border-yellow-400 hover:bg-yellow-50 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{t.tripNumber ?? '(no trip #)'}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(t.status)}`}
                      >
                        {t.status ?? 'Pending'}
                      </span>
                    </div>
                    <p className="mt-1 text-gray-700">
                      {t.origin ?? '?'} → {t.destination ?? '?'}
                    </p>
                    <div className="mt-1 flex justify-between text-gray-500">
                      <span>{fmtDate(t.loadingDate)}</span>
                      <span>
                        {t.material ?? '—'}
                        {t.weight ? ` · ${t.weight}` : ''}
                      </span>
                    </div>
                    {t.freight ? (
                      <p className="mt-1 text-right font-semibold">₹{t.freight}</p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {total > PAGE_SIZE ? (
            <div className="flex items-center justify-between gap-2 border-t border-gray-200 pt-2 text-[11px]">
              <span className="text-gray-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page <= 1 || sheets.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border-2 border-black bg-white px-2 py-1 text-[10px] font-bold disabled:opacity-40"
                >
                  ‹ Prev
                </button>
                <span className="px-2 py-1 text-[10px] font-bold">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || sheets.isFetching}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border-2 border-black bg-white px-2 py-1 text-[10px] font-bold disabled:opacity-40"
                >
                  Next ›
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {previewing ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
          onClick={() => setPreviewing(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-2xl border-2 border-black bg-white shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <p className="text-base font-bold">Trip details</p>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(previewing.status)}`}
              >
                {previewing.status ?? 'Pending'}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
                <dt className="text-gray-500">Trip #</dt>
                <dd className="font-bold">{previewing.tripNumber ?? '—'}</dd>
                <dt className="text-gray-500">Vehicle</dt>
                <dd className="font-mono uppercase">{previewing.vehicleNumber ?? '—'}</dd>
                <dt className="text-gray-500">Origin</dt>
                <dd>{previewing.origin ?? '—'}</dd>
                <dt className="text-gray-500">Destination</dt>
                <dd>{previewing.destination ?? '—'}</dd>
                <dt className="text-gray-500">Loaded</dt>
                <dd>{fmtDate(previewing.loadingDate)}</dd>
                <dt className="text-gray-500">Unloaded</dt>
                <dd>{fmtDate(previewing.unloadingDate)}</dd>
                <dt className="text-gray-500">Material</dt>
                <dd>{previewing.material ?? '—'}</dd>
                <dt className="text-gray-500">Weight</dt>
                <dd>{previewing.weight ?? '—'}</dd>
                <dt className="text-gray-500">Freight</dt>
                <dd className="font-bold">{previewing.freight ? `₹${previewing.freight}` : '—'}</dd>
                {previewing.customerName ? (
                  <>
                    <dt className="text-gray-500">Customer</dt>
                    <dd>{previewing.customerName}</dd>
                  </>
                ) : null}
              </dl>
            </div>
            <div className="border-t border-gray-200 p-3">
              <button
                type="button"
                onClick={() => setPreviewing(null)}
                className="w-full rounded-md bg-black px-3 py-2 text-sm font-bold text-yellow-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
