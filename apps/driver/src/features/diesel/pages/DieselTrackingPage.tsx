import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';
import { useTripStore } from '@store/trip.store';
import { useDriverVehicles } from '@features/profile/profile.hooks';
import { FleetVehicleSelect } from '@shared/components/forms/FleetVehicleSelect';
import {
  useCreateDiesel,
  useDeleteDiesel,
  useDieselPaginated,
  useDieselRecords,
  useUpdateDiesel,
} from '../diesel.hooks';
import type { CreateDieselBody, DieselRecord } from '../diesel.api';

const fmt = (v: unknown): string =>
  v === null || v === undefined || v === '' ? '—' : String(v);

const fmtNum = (v: unknown, d: number | null = 2): string => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return d === null ? String(n) : n.toFixed(d);
};

const fmtMoney = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN')}` : '—';
};

const fmtDate = (d: string | undefined): string => {
  if (!d) return '—';
  const dt = new Date(d);
  return Number.isNaN(dt.getTime())
    ? '—'
    : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const rowDateSource = (r: DieselRecord): string | undefined =>
  r.fuelDate ?? r.date ?? r.createdAt;

const todayIso = (): string => new Date().toISOString().slice(0, 10);

const PAYMENT_MODES = ['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer'];
const PAGE_SIZE = 10;

export default function DieselTrackingPage(): JSX.Element {
  const navigate = useNavigate();
  const driver = useAuthStore((s) => s.driver);
  const driverName = driver?.driverName ?? '';
  const driverId = driver?.driverId ?? '';
  const tripVehicle = useTripStore((s) => s.vehicleNumber);
  const fallbackVehicle = driver?.vehicleNumber ?? '';

  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(todayIso());
  const [vehicleNumber, setVehicleNumber] = useState(tripVehicle ?? fallbackVehicle);
  const [pumpName, setPumpName] = useState('');
  const [volume, setVolume] = useState('');
  const [ratePerLiter, setRatePerLiter] = useState('');
  const [startKm, setStartKm] = useState('');
  const [editStartKm, setEditStartKm] = useState(false);
  const [endKm, setEndKm] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paidBy, setPaidBy] = useState(driverName);
  const [remarks, setRemarks] = useState('');

  const create = useCreateDiesel();
  const update = useUpdateDiesel();
  const remove = useDeleteDiesel();

  const vehiclesQuery = useDriverVehicles(driverId);

  const recentForVehicle = useDieselRecords({
    vehicleNumber: vehicleNumber || undefined,
    limit: 1,
  });

  const [page, setPage] = useState(1);
  const [filterPreset, setFilterPreset] = useState<'all' | 'month' | 'year' | 'custom'>('month');
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterYear, setFilterYear] = useState(() => String(new Date().getFullYear()));
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [previewing, setPreviewing] = useState<DieselRecord | null>(null);
  const [previewMode, setPreviewMode] = useState<'view' | 'edit'>('view');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editForm, setEditForm] = useState({
    date: '',
    vehicleNumber: '',
    pumpName: '',
    volume: '',
    ratePerLiter: '',
    startKm: '',
    endKm: '',
    paymentMode: 'Cash',
    paidBy: '',
    remarks: '',
  });

  const dateRange = useMemo(() => {
    if (filterPreset === 'all') return { dateFrom: undefined, dateTo: undefined };
    if (filterPreset === 'month') {
      const [y, m] = filterMonth.split('-').map(Number);
      if (!y || !m) return { dateFrom: undefined, dateTo: undefined };
      return {
        dateFrom: new Date(y, m - 1, 1).toISOString(),
        dateTo: new Date(y, m, 0, 23, 59, 59, 999).toISOString(),
      };
    }
    if (filterPreset === 'year') {
      const y = Number(filterYear);
      if (!y) return { dateFrom: undefined, dateTo: undefined };
      return {
        dateFrom: new Date(y, 0, 1).toISOString(),
        dateTo: new Date(y, 11, 31, 23, 59, 59, 999).toISOString(),
      };
    }
    return {
      dateFrom: customFrom ? new Date(`${customFrom}T00:00:00`).toISOString() : undefined,
      dateTo: customTo ? new Date(`${customTo}T23:59:59.999`).toISOString() : undefined,
    };
  }, [filterPreset, filterMonth, filterYear, customFrom, customTo]);

  useEffect(() => {
    setPage(1);
  }, [filterPreset, filterMonth, filterYear, customFrom, customTo, vehicleNumber]);

  const paginatedQuery = useDieselPaginated({
    vehicleNumber: vehicleNumber || undefined,
    driverName: driverName || undefined,
    page,
    limit: PAGE_SIZE,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
  });

  useEffect(() => {
    if (
      !vehicleNumber &&
      vehiclesQuery.data?.primaryVehicleNumber
    ) {
      setVehicleNumber(vehiclesQuery.data.primaryVehicleNumber);
    }
  }, [vehiclesQuery.data, vehicleNumber]);

  const totalAmount = useMemo(() => {
    const v = Number(volume);
    const r = Number(ratePerLiter);
    if (!Number.isFinite(v) || !Number.isFinite(r) || v <= 0 || r <= 0) return 0;
    return Math.round(v * r);
  }, [volume, ratePerLiter]);

  const lastEndKmForVehicle = useMemo(() => {
    const target = vehicleNumber.trim().toUpperCase();
    if (!target) return null;
    const records = recentForVehicle.data ?? [];
    const matching = records
      .filter((r) => String(r.vehicleNumber ?? r.vehicleNo ?? '').toUpperCase() === target)
      .map((r) => ({ when: rowDateSource(r) ?? '', endKm: Number(r.endKm) }))
      .filter((x) => Number.isFinite(x.endKm) && x.endKm > 0)
      .sort((a, b) => b.when.localeCompare(a.when));
    return matching[0]?.endKm ?? null;
  }, [recentForVehicle.data, vehicleNumber]);

  useEffect(() => {
    if (showForm && !startKm && lastEndKmForVehicle != null) {
      setStartKm(String(lastEndKmForVehicle));
    }
  }, [showForm, lastEndKmForVehicle, startKm]);

  const totalKm = useMemo(() => {
    const a = Number(startKm);
    const b = Number(endKm);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
    return b - a;
  }, [startKm, endKm]);

  const mileage = useMemo(() => {
    if (totalKm == null || totalKm <= 0) return null;
    const v = Number(volume);
    if (!Number.isFinite(v) || v <= 0) return null;
    return +(totalKm / v).toFixed(2);
  }, [totalKm, volume]);

  const editTotalKm = useMemo(() => {
    const a = Number(editForm.startKm);
    const b = Number(editForm.endKm);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return null;
    return b - a;
  }, [editForm.startKm, editForm.endKm]);

  const editMileage = useMemo(() => {
    if (editTotalKm == null || editTotalKm <= 0) return null;
    const v = Number(editForm.volume);
    if (!Number.isFinite(v) || v <= 0) return null;
    return +(editTotalKm / v).toFixed(2);
  }, [editTotalKm, editForm.volume]);

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!vehicleNumber.trim() || !volume) return;
    const body: CreateDieselBody = {
      date,
      vehicleNumber: vehicleNumber.trim(),
      driverName: driverName || undefined,
      pumpName: pumpName || undefined,
      fuelType: 'Diesel',
      volume: Number(volume),
      ratePerLiter: ratePerLiter ? Number(ratePerLiter) : undefined,
      totalAmount: totalAmount || undefined,
      startKm: startKm ? Number(startKm) : undefined,
      endKm: endKm ? Number(endKm) : undefined,
      totalKm: totalKm != null ? totalKm : undefined,
      mileage: mileage != null ? mileage : undefined,
      paymentMode,
      paidBy: paidBy || undefined,
      remarks: remarks || undefined,
    };
    create.mutate(body, {
      onSuccess: () => {
        setShowForm(false);
        setVolume('');
        setRatePerLiter('');
        setStartKm('');
        setEditStartKm(false);
        setEndKm('');
        setPumpName('');
        setRemarks('');
      },
    });
  };

  const openPreview = (r: DieselRecord): void => {
    setPreviewing(r);
    setPreviewMode('view');
    setConfirmingDelete(false);
    setEditForm({
      date: rowDateSource(r)?.slice(0, 10) ?? todayIso(),
      vehicleNumber: String(r.vehicleNumber ?? r.vehicleNo ?? ''),
      pumpName: String(r.pumpName ?? r.fuelStation ?? ''),
      volume: String(r.volume ?? ''),
      ratePerLiter: String(r.ratePerLiter ?? r.pricePerLiter ?? ''),
      startKm: String(r.startKm ?? ''),
      endKm: String(r.endKm ?? ''),
      paymentMode: String(r.paymentMode ?? r.paymentType ?? 'Cash'),
      paidBy: String(r.paidBy ?? ''),
      remarks: '',
    });
  };

  const closePreview = (): void => {
    setPreviewing(null);
    setPreviewMode('view');
    setConfirmingDelete(false);
  };

  const onSubmitEdit = (): void => {
    const id = previewing?.id ?? previewing?._id;
    if (!id) return;
    const body: CreateDieselBody = {
      date: editForm.date ? new Date(`${editForm.date}T00:00:00`).toISOString() : undefined,
      vehicleNumber: editForm.vehicleNumber.trim(),
      pumpName: editForm.pumpName || undefined,
      fuelType: 'Diesel',
      volume: editForm.volume ? Number(editForm.volume) : undefined,
      ratePerLiter: editForm.ratePerLiter ? Number(editForm.ratePerLiter) : undefined,
      startKm: editForm.startKm ? Number(editForm.startKm) : undefined,
      endKm: editForm.endKm ? Number(editForm.endKm) : undefined,
      paymentMode: editForm.paymentMode,
      paidBy: editForm.paidBy || undefined,
    };
    update.mutate(
      { id, body },
      {
        onSuccess: (res) => {
          if (res?.dieselEntry) setPreviewing(res.dieselEntry);
          setPreviewMode('view');
        },
      },
    );
  };

  const onConfirmDelete = (): void => {
    const id = previewing?.id ?? previewing?._id;
    if (!id) return;
    remove.mutate(id, { onSuccess: () => closePreview() });
  };

  const items = paginatedQuery.data?.items ?? [];
  const total = paginatedQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-3xl space-y-3 p-2">
      <div className="overflow-hidden rounded-md border-2 border-black shadow-md">
        <div className="flex items-center justify-between bg-black px-4 py-3 text-base font-bold text-yellow-400">
          <span>Diesel Tracking</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black"
            >
              {showForm ? 'Close' : '+ Log a Fill'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-md bg-white px-3 py-1.5 text-xs font-bold text-black"
            >
              ←
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={onSubmit} className="space-y-3 bg-white p-4">
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-medium">
                Date
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                />
              </label>
              <div className="block text-xs font-medium">
                <p className="mb-1">Vehicle</p>
                <FleetVehicleSelect
                  value={vehicleNumber}
                  onChange={setVehicleNumber}
                />
              </div>
            </div>
            <label className="block text-xs font-medium">
              Pump / fuel station
              <input
                type="text"
                value={pumpName}
                onChange={(e) => setPumpName(e.target.value)}
                placeholder="HP, IOCL, etc."
                className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-medium">
                Volume (L)
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                />
              </label>
              <label className="block text-xs font-medium">
                Rate / litre (₹)
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ratePerLiter}
                  onChange={(e) => setRatePerLiter(e.target.value)}
                  className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                />
              </label>
            </div>
            <label className="block text-xs font-medium">
              Current odometer (km) <span className="text-red-600">*</span>
              <input
                type="number"
                min="0"
                required
                placeholder="Read it off the dashboard"
                value={endKm}
                onChange={(e) => setEndKm(e.target.value)}
                className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
              />
            </label>
            {lastEndKmForVehicle != null && !editStartKm ? (
              <div className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
                <span>
                  Last fill ended at <strong>{lastEndKmForVehicle} km</strong> — used as start.
                </span>
                <button
                  type="button"
                  onClick={() => setEditStartKm(true)}
                  className="text-yellow-700 underline"
                >
                  Meter reset? Edit
                </button>
              </div>
            ) : null}
            {editStartKm || lastEndKmForVehicle == null ? (
              <label className="block text-xs font-medium">
                Start km
                {lastEndKmForVehicle == null ? (
                  <span className="ml-1 text-[10px] font-normal text-gray-500">
                    (no previous fill on record)
                  </span>
                ) : null}
                <input
                  type="number"
                  min="0"
                  value={startKm}
                  onChange={(e) => setStartKm(e.target.value)}
                  className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                />
              </label>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-medium">
                Payment
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                >
                  {PAYMENT_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium">
                Paid by
                <input
                  type="text"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                />
              </label>
            </div>
            <label className="block text-xs font-medium">
              Remarks
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
              />
            </label>
            <div className="grid grid-cols-3 gap-2 rounded bg-yellow-50 px-3 py-2 text-center text-xs">
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-bold">{fmtMoney(totalAmount)}</p>
              </div>
              <div>
                <p className="text-gray-500">KM diff</p>
                <p className="font-bold">{totalKm != null ? totalKm : '—'}</p>
              </div>
              <div>
                <p className="text-gray-500">Mileage</p>
                <p className="font-bold text-green-700">
                  {mileage != null ? `${mileage} km/L` : '—'}
                </p>
              </div>
            </div>
            <button
              type="submit"
              disabled={create.isPending}
              className="w-full rounded-md bg-black px-3 py-2 text-sm font-bold text-yellow-400 disabled:opacity-60"
            >
              {create.isPending ? 'Saving…' : 'Save Fill'}
            </button>
          </form>
        )}
      </div>

      <div className="overflow-hidden rounded-md border-2 border-black shadow-md">
        <div className="flex items-center justify-between bg-yellow-400 px-4 py-2 text-sm font-bold text-black">
          <span>My Diesel History</span>
          {paginatedQuery.data ? (
            <span className="text-[10px] font-normal opacity-80">{total} total</span>
          ) : null}
        </div>
        <div className="space-y-3 bg-white p-3">
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
          ) : items.length === 0 ? (
            <p className="text-center text-xs text-gray-500">No diesel records for this period.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((r, i) => (
                <li key={r.id ?? r._id ?? `${rowDateSource(r)}-${i}`}>
                  <button
                    type="button"
                    onClick={() => openPreview(r)}
                    className="w-full rounded-md border border-gray-200 bg-white p-2.5 text-left text-xs transition hover:border-yellow-400 hover:bg-yellow-50 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {fmtDate(rowDateSource(r))}
                      </span>
                      <span className="font-mono text-[10px] uppercase text-gray-700">
                        {r.vehicleNumber ?? r.vehicleNo ?? '—'}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="font-bold">
                        {fmtNum(r.volume, null)} L · {fmtMoney(r.totalAmount ?? r.amount)}
                      </span>
                      <span className="text-[10px] text-green-700">
                        {r.mileage ? `${fmtNum(r.mileage, 2)} km/L` : '—'}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-gray-500">
                      {fmt(r.pumpName ?? r.fuelStation ?? r.stationName)}
                      {r.paymentMode || r.paymentType
                        ? ` · ${r.paymentMode ?? r.paymentType}`
                        : ''}
                    </p>
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
                  disabled={page <= 1 || paginatedQuery.isFetching}
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
                  disabled={page >= totalPages || paginatedQuery.isFetching}
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
          onClick={() => !update.isPending && !remove.isPending && closePreview()}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-md flex-col rounded-t-2xl border-2 border-black bg-white shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <p className="text-base font-bold">
                {previewMode === 'edit' ? 'Edit diesel entry' : 'Diesel entry'}
              </p>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase">
                {fmtDate(rowDateSource(previewing))}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {previewMode === 'view' ? (
                <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
                  <dt className="text-gray-500">Date</dt>
                  <dd className="font-bold">{fmtDate(rowDateSource(previewing))}</dd>
                  <dt className="text-gray-500">Vehicle</dt>
                  <dd className="font-mono font-bold uppercase">
                    {previewing.vehicleNumber ?? previewing.vehicleNo ?? '—'}
                  </dd>
                  <dt className="text-gray-500">Pump</dt>
                  <dd>{fmt(previewing.pumpName ?? previewing.fuelStation)}</dd>
                  <dt className="text-gray-500">Volume</dt>
                  <dd className="font-bold">{fmtNum(previewing.volume, 2)} L</dd>
                  <dt className="text-gray-500">Rate</dt>
                  <dd>{fmtMoney(previewing.ratePerLiter ?? previewing.pricePerLiter)}</dd>
                  <dt className="text-gray-500">Total</dt>
                  <dd className="font-bold">
                    {fmtMoney(previewing.totalAmount ?? previewing.amount)}
                  </dd>
                  <dt className="text-gray-500">Start km</dt>
                  <dd>{fmtNum(previewing.startKm, 0)}</dd>
                  <dt className="text-gray-500">End km</dt>
                  <dd>{fmtNum(previewing.endKm, 0)}</dd>
                  <dt className="text-gray-500">KM diff</dt>
                  <dd className="font-bold">{fmtNum(previewing.totalKm, 0)}</dd>
                  <dt className="text-gray-500">Mileage</dt>
                  <dd className="font-bold text-green-700">
                    {previewing.mileage ? `${fmtNum(previewing.mileage, 2)} km/L` : '—'}
                  </dd>
                  <dt className="text-gray-500">Paid by</dt>
                  <dd>
                    {fmt(previewing.paidBy)}
                    {previewing.paymentMode || previewing.paymentType
                      ? ` · ${previewing.paymentMode ?? previewing.paymentType}`
                      : ''}
                  </dd>
                </dl>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium">
                      Date
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                        className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                      />
                    </label>
                    <div className="block text-xs font-medium">
                      <p className="mb-1">Vehicle</p>
                      <FleetVehicleSelect
                        id="diesel-edit-vehicle"
                        value={editForm.vehicleNumber}
                        onChange={(v) => setEditForm({ ...editForm, vehicleNumber: v })}
                      />
                    </div>
                  </div>
                  <label className="block text-xs font-medium">
                    Pump
                    <input
                      type="text"
                      value={editForm.pumpName}
                      onChange={(e) => setEditForm({ ...editForm, pumpName: e.target.value })}
                      className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium">
                      Volume (L)
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.volume}
                        onChange={(e) => setEditForm({ ...editForm, volume: e.target.value })}
                        className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium">
                      Rate / litre (₹)
                      <input
                        type="number"
                        step="0.01"
                        value={editForm.ratePerLiter}
                        onChange={(e) =>
                          setEditForm({ ...editForm, ratePerLiter: e.target.value })
                        }
                        className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium">
                      Start km
                      <input
                        type="number"
                        value={editForm.startKm}
                        onChange={(e) => setEditForm({ ...editForm, startKm: e.target.value })}
                        className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium">
                      End km
                      <input
                        type="number"
                        value={editForm.endKm}
                        onChange={(e) => setEditForm({ ...editForm, endKm: e.target.value })}
                        className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium">
                      Payment
                      <select
                        value={editForm.paymentMode}
                        onChange={(e) =>
                          setEditForm({ ...editForm, paymentMode: e.target.value })
                        }
                        className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                      >
                        {PAYMENT_MODES.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs font-medium">
                      Paid by
                      <input
                        type="text"
                        value={editForm.paidBy}
                        onChange={(e) => setEditForm({ ...editForm, paidBy: e.target.value })}
                        className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                      />
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded bg-yellow-50 px-3 py-2 text-center text-xs">
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-bold">
                        {fmtMoney(
                          Number(editForm.volume) * Number(editForm.ratePerLiter) || 0,
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">KM diff</p>
                      <p className="font-bold">{editTotalKm != null ? editTotalKm : '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Mileage</p>
                      <p className="font-bold text-green-700">
                        {editMileage != null ? `${editMileage} km/L` : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-gray-200 p-3">
              {confirmingDelete ? (
                <div className="rounded-md border-2 border-red-500 bg-red-50 p-2.5 text-xs">
                  <p className="font-bold text-red-700">Delete this diesel entry?</p>
                  <p className="mt-1 text-red-600">
                    This entry will be permanently removed.
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
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="rounded-md border-2 border-red-500 bg-white px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
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
                    disabled={update.isPending || !editForm.vehicleNumber.trim()}
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
