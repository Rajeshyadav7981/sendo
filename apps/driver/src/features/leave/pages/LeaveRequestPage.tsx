import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuthStore } from '@store/auth.store';
import { useModalBackButton } from '@shared/hooks/useModalBackButton';
import {
  useCancelLeave,
  useDriverLeavesPaginated,
  useRequestLeave,
  useUpdateLeave,
} from '../leave.hooks';
import type { LeaveRecord } from '../leave.api';

const REASONS = ['Health Issue', 'Personal Reason', 'Family Emergency', 'Others'] as const;
const PAGE_SIZE = 10;

function statusBadge(s: string | undefined): string {
  if (s === 'Approved') return 'bg-green-100 text-green-800 ring-green-200';
  if (s === 'Rejected') return 'bg-red-100 text-red-800 ring-red-200';
  return 'bg-yellow-100 text-yellow-800 ring-yellow-200';
}

function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function dayCount(start: string, end: string): number {
  const a = new Date(start);
  const b = new Date(end);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000) + 1);
}

export default function LeaveRequestPage(): JSX.Element {
  const driver = useAuthStore((s) => s.driver);
  const driverId = driver?.driverId ?? '';

  const submit = useRequestLeave();
  const update = useUpdateLeave(driverId);
  const remove = useCancelLeave(driverId);

  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '' });
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [filterPreset, setFilterPreset] = useState<'all' | 'month' | 'year' | 'custom'>('month');
  const [filterMonth, setFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterYear, setFilterYear] = useState(() => String(new Date().getFullYear()));
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [previewing, setPreviewing] = useState<LeaveRecord | null>(null);
  const [previewMode, setPreviewMode] = useState<'view' | 'edit'>('view');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editForm, setEditForm] = useState({ startDate: '', endDate: '', reason: '' });

  const dateRange = useMemo(() => {
    if (filterPreset === 'all') return { startDateFrom: undefined, startDateTo: undefined };
    if (filterPreset === 'month') {
      const [y, m] = filterMonth.split('-').map(Number);
      if (!y || !m) return { startDateFrom: undefined, startDateTo: undefined };
      return {
        startDateFrom: new Date(y, m - 1, 1).toISOString().slice(0, 10),
        startDateTo: new Date(y, m, 0).toISOString().slice(0, 10),
      };
    }
    if (filterPreset === 'year') {
      const y = Number(filterYear);
      if (!y) return { startDateFrom: undefined, startDateTo: undefined };
      return {
        startDateFrom: `${y}-01-01`,
        startDateTo: `${y}-12-31`,
      };
    }
    return {
      startDateFrom: customFrom || undefined,
      startDateTo: customTo || undefined,
    };
  }, [filterPreset, filterMonth, filterYear, customFrom, customTo]);

  useEffect(() => {
    setPage(1);
  }, [filterPreset, filterMonth, filterYear, customFrom, customTo]);

  const paginatedQuery = useDriverLeavesPaginated(driverId, {
    page,
    limit: PAGE_SIZE,
    startDateFrom: dateRange.startDateFrom,
    startDateTo: dateRange.startDateTo,
  });

  const items = paginatedQuery.data?.items ?? [];
  const total = paginatedQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setError('');
    if (!driverId) {
      setError('Driver ID not found. Please log in again.');
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError('End date cannot be before start date.');
      return;
    }
    submit.mutate(
      { driverId, startDate: form.startDate, endDate: form.endDate, reason: form.reason },
      { onSuccess: () => setForm({ startDate: '', endDate: '', reason: '' }) },
    );
  };

  const openPreview = (l: LeaveRecord): void => {
    setPreviewing(l);
    setPreviewMode('view');
    setConfirmingDelete(false);
    setEditForm({
      startDate: l.startDate?.slice(0, 10) ?? '',
      endDate: l.endDate?.slice(0, 10) ?? '',
      reason: l.reason ?? '',
    });
  };

  const closePreview = (): void => {
    setPreviewing(null);
    setPreviewMode('view');
    setConfirmingDelete(false);
  };

  useModalBackButton({
    isOpen: !!previewing,
    currentMode: confirmingDelete ? 'confirm' : previewMode,
    modeHandlers: {
      edit: () => setPreviewMode('view'),
      confirm: () => setConfirmingDelete(false),
    },
    onClose: closePreview,
  });

  const onSubmitEdit = (): void => {
    if (!previewing?.id) return;
    if (new Date(editForm.endDate) < new Date(editForm.startDate)) return;
    update.mutate(
      {
        id: previewing.id,
        body: {
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          reason: editForm.reason || null,
        },
      },
      {
        onSuccess: (res) => {
          if (res?.data) setPreviewing(res.data);
          setPreviewMode('view');
        },
      },
    );
  };

  const onConfirmDelete = (): void => {
    if (!previewing?.id) return;
    remove.mutate(previewing.id, { onSuccess: () => closePreview() });
  };

  return (
    <div className="mx-auto max-w-xl space-y-3 p-2">
      <div className="overflow-hidden rounded-md border-2 border-black shadow-md">
        <div className="bg-black px-4 py-3 text-lg font-bold text-yellow-400">Leave Request</div>
        <div className="space-y-3 bg-white p-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs font-bold">
                Start Date
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="mt-1 w-full rounded-md border-2 border-black px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-bold">
                End Date
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="mt-1 w-full rounded-md border-2 border-black px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block text-xs font-bold">
              Reason
              <select
                required
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="mt-1 w-full rounded-md border-2 border-black px-3 py-2 text-sm"
              >
                <option value="">Select a reason</option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            {form.startDate && form.endDate ? (
              <div className="rounded bg-yellow-50 px-3 py-2 text-xs text-gray-700">
                {dayCount(form.startDate, form.endDate)} day(s) requested
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submit.isPending}
              className="w-full rounded-md bg-yellow-400 px-3 py-3 text-sm font-bold text-black disabled:opacity-70"
            >
              {submit.isPending ? 'Submitting…' : 'Submit Leave Request'}
            </button>
          </form>

          {error ? (
            <p className="text-center text-xs font-bold text-red-600">{error}</p>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border-2 border-black shadow-md">
        <div className="flex items-center justify-between bg-yellow-400 px-4 py-2 text-sm font-bold text-black">
          <span>Leave History</span>
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
            <p className="text-center text-xs text-gray-500">No leave requests for this period.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => openPreview(l)}
                    className="w-full rounded-md border border-gray-200 bg-white p-2.5 text-left text-xs transition hover:border-yellow-400 hover:bg-yellow-50 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {fmtDate(l.startDate)} → {fmtDate(l.endDate)}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ring-1 ${statusBadge(l.status)}`}
                      >
                        {l.status}
                      </span>
                    </div>
                    <p className="mt-1 font-semibold">
                      {dayCount(l.startDate, l.endDate)} day(s) · {l.reason ?? '—'}
                    </p>
                    {l.leaveType ? (
                      <p className="mt-0.5 text-gray-500">{l.leaveType}</p>
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
                {previewMode === 'edit' ? 'Edit leave request' : 'Leave details'}
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
                  <dt className="text-gray-500">Start</dt>
                  <dd className="font-bold">{fmtDate(previewing.startDate)}</dd>
                  <dt className="text-gray-500">End</dt>
                  <dd className="font-bold">{fmtDate(previewing.endDate)}</dd>
                  <dt className="text-gray-500">Days</dt>
                  <dd>{dayCount(previewing.startDate, previewing.endDate)}</dd>
                  <dt className="text-gray-500">Reason</dt>
                  <dd>{previewing.reason ?? '—'}</dd>
                  {previewing.leaveType ? (
                    <>
                      <dt className="text-gray-500">Type</dt>
                      <dd>{previewing.leaveType}</dd>
                    </>
                  ) : null}
                  <dt className="text-gray-500">Submitted</dt>
                  <dd>{fmtDate(previewing.createdAt)}</dd>
                  {previewing.approvedAt ? (
                    <>
                      <dt className="text-gray-500">
                        {previewing.status === 'Approved' ? 'Approved' : 'Rejected'}
                      </dt>
                      <dd>{fmtDate(previewing.approvedAt)}</dd>
                    </>
                  ) : null}
                </dl>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-500">
                    Pending requests can still be edited. Once admin reviews it, it&apos;s locked.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-medium">
                      Start date
                      <input
                        type="date"
                        value={editForm.startDate}
                        onChange={(e) =>
                          setEditForm({ ...editForm, startDate: e.target.value })
                        }
                        className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium">
                      End date
                      <input
                        type="date"
                        value={editForm.endDate}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                        className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                      />
                    </label>
                  </div>
                  <label className="block text-xs font-medium">
                    Reason
                    <select
                      value={editForm.reason}
                      onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                      className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                    >
                      <option value="">Select a reason</option>
                      {REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>
                  {editForm.startDate && editForm.endDate ? (
                    <div className="rounded bg-yellow-50 px-3 py-2 text-xs text-gray-700">
                      {dayCount(editForm.startDate, editForm.endDate)} day(s)
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-gray-200 p-3">
              {confirmingDelete ? (
                <div className="rounded-md border-2 border-red-500 bg-red-50 p-2.5 text-xs">
                  <p className="font-bold text-red-700">Cancel this leave request?</p>
                  <p className="mt-1 text-red-600">
                    This pending request will be permanently removed.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      disabled={remove.isPending}
                      onClick={() => setConfirmingDelete(false)}
                      className="flex-1 rounded-md border-2 border-black bg-white px-3 py-1.5 text-xs font-bold disabled:opacity-60"
                    >
                      Keep
                    </button>
                    <button
                      type="button"
                      disabled={remove.isPending}
                      onClick={onConfirmDelete}
                      className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {remove.isPending ? 'Cancelling…' : 'Yes, cancel'}
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
                      >
                        Cancel
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
                    disabled={
                      update.isPending || !editForm.startDate || !editForm.endDate
                    }
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
