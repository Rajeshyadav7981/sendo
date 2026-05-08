import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '@store/auth.store';
import { useDriverVehicles } from '@features/profile/profile.hooks';
import {
  useDeleteAttendance,
  useDriverAttendance,
  useDriverAttendancePaginated,
  useSendAttendance,
  useUpdateAttendanceFields,
} from '../attendance.hooks';
import type { AttendanceRecord } from '../attendance.api';
import { FleetVehicleSelect } from '@shared/components/forms/FleetVehicleSelect';

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function diff(start: string, stop: string): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = stop.split(':').map(Number);
  if (![sh, sm, eh, em].every(Number.isFinite)) return '';
  const total = eh * 60 + em - (sh * 60 + sm);
  if (total <= 0) return '';
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function statusBadge(status: string): string {
  if (status === 'Approved') return 'bg-green-100 text-green-800 ring-green-200';
  if (status === 'Rejected') return 'bg-red-100 text-red-800 ring-red-200';
  return 'bg-yellow-100 text-yellow-800 ring-yellow-200';
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })} · ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

interface TimeParts {
  h12: number;
  m: number;
  period: 'AM' | 'PM';
}

function parse24(value: string): TimeParts {
  const [hh, mm] = value.split(':').map(Number);
  const h = Number.isFinite(hh) ? hh : 0;
  const m = Number.isFinite(mm) ? mm : 0;
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return { h12, m, period };
}

function format24(parts: TimeParts): string {
  let h = parts.h12 % 12;
  if (parts.period === 'PM') h += 12;
  return `${String(h).padStart(2, '0')}:${String(parts.m).padStart(2, '0')}`;
}

function fmt12(value: string): string {
  const p = parse24(value);
  return `${p.h12}:${String(p.m).padStart(2, '0')} ${p.period}`;
}

function TimePicker12({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const parts = parse24(value);
  const update = (patch: Partial<TimeParts>): void => {
    onChange(format24({ ...parts, ...patch }));
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent): void => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <div className="mb-1 text-xs font-medium text-gray-700">{label}</div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex flex-1 items-center justify-between rounded-lg border-2 px-3 py-2.5 text-left transition ${
            open ? 'border-yellow-400 bg-yellow-50' : 'border-black bg-white hover:bg-gray-50'
          }`}
          aria-expanded={open}
          aria-label={`${label} time picker`}
        >
          <span className="font-mono text-lg font-bold tabular-nums">
            {String(parts.h12).padStart(2, '0')}:{String(parts.m).padStart(2, '0')}
          </span>
          <svg
            className={`h-4 w-4 text-gray-500 transition ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.4a.75.75 0 01-1.08 0l-4.25-4.4a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div
          role="group"
          aria-label={`${label} period`}
          className="flex overflow-hidden rounded-lg border-2 border-black"
        >
          {(['AM', 'PM'] as const).map((p) => {
            const active = parts.period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => update({ period: p })}
                aria-pressed={active}
                className={`px-3 text-xs font-bold transition ${
                  active ? 'bg-black text-yellow-400' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {open ? (
        <div
          role="dialog"
          className="absolute left-0 right-0 z-40 mt-1 max-h-[60vh] space-y-3 overflow-y-auto rounded-xl border-2 border-black bg-white p-3 shadow-xl"
        >
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">Hour</p>
            <div className="grid grid-cols-6 gap-1">
              {HOURS.map((h) => {
                const active = parts.h12 === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => update({ h12: h })}
                    className={`rounded-md py-2 text-xs font-bold transition ${
                      active
                        ? 'bg-black text-yellow-400'
                        : 'bg-gray-50 text-gray-700 hover:bg-yellow-50'
                    }`}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">Minute</p>
            <div className="grid grid-cols-6 gap-1">
              {MINUTES.map((m) => {
                const active = parts.m === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => update({ m })}
                    className={`rounded-md py-2 text-xs font-bold transition ${
                      active
                        ? 'bg-black text-yellow-400'
                        : 'bg-gray-50 text-gray-700 hover:bg-yellow-50'
                    }`}
                  >
                    {String(m).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded-md bg-black py-2 text-xs font-bold text-yellow-400"
          >
            Done
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function DriverAttendancePage(): JSX.Element {
  const driver = useAuthStore((s) => s.driver);
  const driverId = driver?.driverId ?? '';
  const driverName = driver?.driverName ?? '';
  const vehicleFromStore = driver?.vehicleNumber ?? '';

  const [vehicleNumber, setVehicleNumber] = useState(vehicleFromStore);
  const [startTime, setStartTime] = useState('09:00');
  const [stopTime, setStopTime] = useState(nowHHMM());
  const [previewing, setPreviewing] = useState<AttendanceRecord | null>(null);
  const [previewMode, setPreviewMode] = useState<'view' | 'edit'>('view');
  const [editVehicle, setEditVehicle] = useState('');
  const [editStart, setEditStart] = useState('09:00');
  const [editStop, setEditStop] = useState('17:00');

  const list = useDriverAttendance(driverId);
  const send = useSendAttendance();
  const update = useUpdateAttendanceFields(driverId);
  const remove = useDeleteAttendance(driverId);
  const vehiclesQuery = useDriverVehicles(driverId);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [filterPreset, setFilterPreset] = useState<'all' | 'month' | 'year' | 'custom'>('month');
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterYear, setFilterYear] = useState(() => String(new Date().getFullYear()));
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const dateRange = useMemo(() => {
    if (filterPreset === 'all') return { from: undefined, to: undefined };
    if (filterPreset === 'month') {
      const [y, m] = filterMonth.split('-').map(Number);
      if (!y || !m) return { from: undefined, to: undefined };
      const from = new Date(y, m - 1, 1, 0, 0, 0, 0);
      const to = new Date(y, m, 0, 23, 59, 59, 999);
      return { from: from.toISOString(), to: to.toISOString() };
    }
    if (filterPreset === 'year') {
      const y = Number(filterYear);
      if (!y) return { from: undefined, to: undefined };
      return {
        from: new Date(y, 0, 1, 0, 0, 0, 0).toISOString(),
        to: new Date(y, 11, 31, 23, 59, 59, 999).toISOString(),
      };
    }
    return {
      from: customFrom ? new Date(`${customFrom}T00:00:00`).toISOString() : undefined,
      to: customTo ? new Date(`${customTo}T23:59:59.999`).toISOString() : undefined,
    };
  }, [filterPreset, filterMonth, filterYear, customFrom, customTo]);

  useEffect(() => {
    setPage(1);
  }, [filterPreset, filterMonth, filterYear, customFrom, customTo]);

  const paginatedQuery = useDriverAttendancePaginated(driverId, {
    page,
    limit: PAGE_SIZE,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  });

  useEffect(() => {
    if (
      !vehicleNumber &&
      vehiclesQuery.data?.primaryVehicleNumber
    ) {
      setVehicleNumber(vehiclesQuery.data.primaryVehicleNumber);
    }
  }, [vehiclesQuery.data, vehicleNumber]);

  const openPreview = (a: AttendanceRecord): void => {
    setPreviewing(a);
    setPreviewMode('view');
    setEditVehicle(a.vehicleNumber);
    setEditStart(a.startTime);
    setEditStop(a.stopTime);
  };

  const closePreview = (): void => {
    setPreviewing(null);
    setPreviewMode('view');
    setConfirmingDelete(false);
  };

  const onConfirmDelete = (): void => {
    const id = previewing?.id ?? previewing?._id;
    if (!id) return;
    remove.mutate(id, {
      onSuccess: () => closePreview(),
    });
  };

  const onSubmitEdit = (): void => {
    const id = previewing?.id ?? previewing?._id;
    if (!id) return;
    const duration = diff(editStart, editStop) || '0m';
    update.mutate(
      {
        id,
        body: {
          vehicleNumber: editVehicle.trim(),
          startTime: editStart,
          stopTime: editStop,
          duration,
        },
      },
      {
        onSuccess: (res) => {
          if (res?.updatedAttendance) setPreviewing(res.updatedAttendance);
          setPreviewMode('view');
        },
      },
    );
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!driverId || !vehicleNumber.trim()) return;
    const duration = diff(startTime, stopTime) || '0m';
    send.mutate(
      {
        driverId,
        driverName,
        vehicleNumber: vehicleNumber.trim(),
        startTime,
        stopTime,
        duration,
      },
      { onSuccess: () => setStopTime(nowHHMM()) },
    );
  };


  const todayKey = new Date().toDateString();
  const todaysAttendance = (list.data ?? []).find((a) => {
    if (!a.createdAt) return false;
    const d = new Date(a.createdAt);
    return !Number.isNaN(d.getTime()) && d.toDateString() === todayKey;
  }) ?? null;

  return (
    <div className="mx-auto max-w-md space-y-3 p-3">
      <div className="overflow-hidden rounded-xl border-2 border-black bg-white">
        <div className="bg-black px-4 py-3 text-base font-bold text-yellow-400">Mark Attendance</div>
        {todaysAttendance ? (
          <div className="space-y-3 p-4">
            <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 p-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black">
                  ✓ MARKED
                </span>
                <span className="text-xs font-bold text-gray-700">{fmtDate(todaysAttendance.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm font-bold">
                {fmt12(todaysAttendance.startTime)} → {fmt12(todaysAttendance.stopTime)}
              </p>
              <p className="mt-0.5 text-xs text-gray-600">
                {todaysAttendance.vehicleNumber} · {todaysAttendance.duration} ·{' '}
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ${statusBadge(
                    todaysAttendance.status,
                  )}`}
                >
                  {todaysAttendance.status}
                </span>
              </p>
              <p className="mt-2 text-[11px] text-gray-500">
                You've already marked attendance for today.
                {todaysAttendance.status === 'Pending'
                  ? ' Tap below to view or edit it.'
                  : ' Once approved, the entry is locked.'}
              </p>
              <button
                type="button"
                onClick={() => openPreview(todaysAttendance)}
                className="mt-3 w-full rounded-md bg-black px-3 py-2 text-xs font-bold text-yellow-400"
              >
                {todaysAttendance.status === 'Pending' ? 'View / Edit today’s entry' : 'View today’s entry'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3 p-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-gray-100 px-2 py-1">
                <strong>{driverName || driverId || 'Driver'}</strong>
              </span>
              {driverId ? (
                <span className="rounded bg-gray-100 px-2 py-1">ID {driverId}</span>
              ) : null}
              <span className="rounded bg-gray-100 px-2 py-1">{fmtDate(new Date().toISOString())}</span>
            </div>
            <div className="block text-xs font-medium">
              <p className="mb-1">Vehicle</p>
              <FleetVehicleSelect
                value={vehicleNumber}
                onChange={setVehicleNumber}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <TimePicker12 label="Start time" value={startTime} onChange={setStartTime} />
              <TimePicker12 label="Stop time" value={stopTime} onChange={setStopTime} />
            </div>
            <div className="flex items-center justify-between rounded bg-yellow-50 px-3 py-2 text-xs">
              <span>
                {fmt12(startTime)} → {fmt12(stopTime)}
              </span>
              <span className="font-bold">{diff(startTime, stopTime) || '—'}</span>
            </div>
            <button
              type="submit"
              disabled={send.isPending || !driverId}
              className="w-full rounded-md bg-black px-3 py-2 text-sm font-bold text-yellow-400 disabled:opacity-60"
            >
              {send.isPending ? 'Submitting…' : 'Submit Attendance'}
            </button>
          </form>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border-2 border-black bg-white">
        <div className="flex items-center justify-between bg-yellow-400 px-4 py-2 text-sm font-bold text-black">
          <span>Past Attendance</span>
          {paginatedQuery.data ? (
            <span className="text-[10px] font-normal opacity-80">
              {paginatedQuery.data.total} total
            </span>
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

          {paginatedQuery.isLoading ? (
            <p className="text-center text-xs text-gray-500">Loading…</p>
          ) : (paginatedQuery.data?.items?.length ?? 0) === 0 ? (
            <p className="text-center text-xs text-gray-500">No attendance for this period.</p>
          ) : (
            <ul className="space-y-2">
              {(paginatedQuery.data?.items ?? []).map((a) => (
                <li key={a.id ?? a._id}>
                  <button
                    type="button"
                    onClick={() => openPreview(a)}
                    className="w-full rounded-md border border-gray-200 bg-white p-2.5 text-left text-xs transition hover:border-yellow-400 hover:bg-yellow-50 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {fmtDate(a.createdAt)}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ring-1 ${statusBadge(a.status)}`}
                      >
                        {a.status}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold">
                      {fmt12(a.startTime)} → {fmt12(a.stopTime)}
                    </p>
                    <p className="mt-0.5 text-gray-500">
                      {a.vehicleNumber} · {a.duration}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {paginatedQuery.data && paginatedQuery.data.total > PAGE_SIZE ? (
            <div className="flex items-center justify-between gap-2 border-t border-gray-200 pt-2 text-[11px]">
              <span className="text-gray-500">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, paginatedQuery.data.total)} of{' '}
                {paginatedQuery.data.total}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page <= 1 || paginatedQuery.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border-2 border-black bg-white px-2 py-1 text-[10px] font-bold disabled:opacity-40"
                >
                  ‹ Prev
                </button>
                <span className="px-2 py-1 text-[10px] font-bold">
                  {page} / {Math.max(1, Math.ceil(paginatedQuery.data.total / PAGE_SIZE))}
                </span>
                <button
                  type="button"
                  disabled={
                    page >= Math.ceil(paginatedQuery.data.total / PAGE_SIZE) ||
                    paginatedQuery.isFetching
                  }
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
          onClick={() => !update.isPending && closePreview()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-2xl border-2 border-black bg-white shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <p className="text-base font-bold">
                {previewMode === 'edit' ? 'Edit attendance' : 'Attendance details'}
              </p>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold ring-1 ${statusBadge(previewing.status)}`}
              >
                {previewing.status}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {previewMode === 'view' ? (
                <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
                  <dt className="text-gray-500">Date</dt>
                  <dd className="font-bold">{fmtDate(previewing.createdAt)}</dd>
                  <dt className="text-gray-500">Vehicle</dt>
                  <dd className="font-mono font-bold uppercase">{previewing.vehicleNumber}</dd>
                  <dt className="text-gray-500">Driver</dt>
                  <dd>{previewing.driverName || '—'}</dd>
                  <dt className="text-gray-500">Start</dt>
                  <dd>{fmt12(previewing.startTime)}</dd>
                  <dt className="text-gray-500">Stop</dt>
                  <dd>{fmt12(previewing.stopTime)}</dd>
                  <dt className="text-gray-500">Duration</dt>
                  <dd className="font-bold">{previewing.duration}</dd>
                  <dt className="text-gray-500">Submitted</dt>
                  <dd className="text-gray-700">{fmtDateTime(previewing.createdAt)}</dd>
                  {previewing.approvedAt ? (
                    <>
                      <dt className="text-gray-500">
                        {previewing.status === 'Approved' ? 'Approved' : 'Rejected'}
                      </dt>
                      <dd className="text-gray-700">{fmtDateTime(previewing.approvedAt)}</dd>
                    </>
                  ) : null}
                  <dt className="text-gray-500">ID</dt>
                  <dd className="font-mono text-[10px] text-gray-500">
                    {previewing.id ?? previewing._id ?? '—'}
                  </dd>
                </dl>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-500">
                    Pending records can still be corrected. Once admin reviews it, you can&apos;t
                    change it.
                  </p>
                  <div className="block text-xs font-medium">
                    <p className="mb-1">Vehicle</p>
                    <FleetVehicleSelect
                      id="edit-attendance-vehicle"
                      value={editVehicle}
                      onChange={setEditVehicle}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <TimePicker12 label="Start time" value={editStart} onChange={setEditStart} />
                    <TimePicker12 label="Stop time" value={editStop} onChange={setEditStop} />
                  </div>
                  <div className="flex items-center justify-between rounded bg-yellow-50 px-3 py-2 text-xs">
                    <span>
                      {fmt12(editStart)} → {fmt12(editStop)}
                    </span>
                    <span className="font-bold">{diff(editStart, editStop) || '—'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-gray-200 p-3">
              {confirmingDelete ? (
                <div className="rounded-md border-2 border-red-500 bg-red-50 p-2.5 text-xs">
                  <p className="font-bold text-red-700">Delete this attendance?</p>
                  <p className="mt-1 text-red-600">
                    This entry will be permanently removed. You can re-mark attendance for today
                    after deleting.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={remove.isPending}
                      onClick={() => setConfirmingDelete(false)}
                      className="flex-1 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={remove.isPending}
                      onClick={onConfirmDelete}
                      className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {remove.isPending ? 'Deleting…' : 'Yes, delete'}
                    </button>
                  </div>
                </div>
              ) : previewMode === 'view' ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closePreview}
                    className="flex-1 rounded-md border-2 border-black bg-white px-3 py-2 text-sm font-bold"
                  >
                    Close
                  </button>
                  {previewing.status === 'Pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(true)}
                        className="rounded-md border-2 border-red-500 bg-white px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                        aria-label="Delete attendance"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode('edit')}
                        className="flex-1 rounded-md bg-black px-3 py-2 text-sm font-bold text-yellow-400"
                      >
                        Edit
                      </button>
                    </>
                  ) : null}
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={update.isPending}
                    onClick={() => setPreviewMode('view')}
                    className="flex-1 rounded-md border-2 border-black bg-white px-3 py-2 text-sm font-bold disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={update.isPending || !editVehicle.trim()}
                    onClick={onSubmitEdit}
                    className="flex-1 rounded-md bg-black px-3 py-2 text-sm font-bold text-yellow-400 disabled:opacity-60"
                  >
                    {update.isPending ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
