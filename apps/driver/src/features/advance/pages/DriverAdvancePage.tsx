import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuthStore } from '@store/auth.store';
import { useModalBackButton } from '@shared/hooks/useModalBackButton';
import {
  useDeleteAdvance,
  useDriverAdvancePaginated,
  useDriverDeductions,
  useRequestAdvance,
  useUpdateAdvance,
} from '../advance.hooks';
import type { AdvanceRequest } from '../advance.api';

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

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtMoney(v: unknown): string {
  if (v == null || v === '') return '—';
  const n = Number(v);
  return Number.isFinite(n) ? `₹${n.toLocaleString('en-IN')}` : '—';
}

export default function DriverAdvancePage(): JSX.Element {
  const driver = useAuthStore((s) => s.driver);
  const driverId = driver?.driverId ?? '';
  const driverName = driver?.driverName ?? 'N/A';
  const monthKey = currentMonthKey();

  const request = useRequestAdvance();
  const update = useUpdateAdvance();
  const remove = useDeleteAdvance();
  const deductions = useDriverDeductions(driverId);

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const [page, setPage] = useState(1);
  const [filterPreset, setFilterPreset] = useState<'all' | 'month' | 'year' | 'custom'>('month');
  const [filterMonth, setFilterMonth] = useState(monthKey);
  const [filterYear, setFilterYear] = useState(() => String(new Date().getFullYear()));
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const [previewing, setPreviewing] = useState<AdvanceRequest | null>(null);
  const [previewMode, setPreviewMode] = useState<'view' | 'edit'>('view');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editForm, setEditForm] = useState({ amount: '', month: '', reason: '' });

  const dateRange = useMemo(() => {
    if (filterPreset === 'all') return { requestedAtFrom: undefined, requestedAtTo: undefined };
    if (filterPreset === 'month') {
      const [y, m] = filterMonth.split('-').map(Number);
      if (!y || !m) return { requestedAtFrom: undefined, requestedAtTo: undefined };
      return {
        requestedAtFrom: new Date(y, m - 1, 1).toISOString(),
        requestedAtTo: new Date(y, m, 0, 23, 59, 59, 999).toISOString(),
      };
    }
    if (filterPreset === 'year') {
      const y = Number(filterYear);
      if (!y) return { requestedAtFrom: undefined, requestedAtTo: undefined };
      return {
        requestedAtFrom: new Date(y, 0, 1).toISOString(),
        requestedAtTo: new Date(y, 11, 31, 23, 59, 59, 999).toISOString(),
      };
    }
    return {
      requestedAtFrom: customFrom ? new Date(`${customFrom}T00:00:00`).toISOString() : undefined,
      requestedAtTo: customTo ? new Date(`${customTo}T23:59:59.999`).toISOString() : undefined,
    };
  }, [filterPreset, filterMonth, filterYear, customFrom, customTo]);

  useEffect(() => {
    setPage(1);
  }, [filterPreset, filterMonth, filterYear, customFrom, customTo]);

  const paginatedQuery = useDriverAdvancePaginated({
    driverId,
    page,
    limit: PAGE_SIZE,
    requestedAtFrom: dateRange.requestedAtFrom,
    requestedAtTo: dateRange.requestedAtTo,
  });

  const items = paginatedQuery.data?.items ?? [];
  const total = paginatedQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const dedRows = (deductions.data ?? [])
    .slice()
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')));

  const onSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!driverId) return;
    const value = Number(amount);
    if (!value || value <= 0) return;
    request.mutate(
      {
        driverId,
        driverName,
        month: monthKey,
        requestedAmount: value,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      } as Parameters<typeof request.mutate>[0],
      {
        onSuccess: () => {
          setAmount('');
          setReason('');
        },
      },
    );
  };

  const openPreview = (a: AdvanceRequest): void => {
    setPreviewing(a);
    setPreviewMode('view');
    setConfirmingDelete(false);
    setEditForm({
      amount: String(a.requestedAmount ?? ''),
      month: a.month ?? monthKey,
      reason: a.reason ?? '',
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
    const value = Number(editForm.amount);
    if (!value || value <= 0) return;
    update.mutate(
      {
        id: previewing.id,
        body: {
          requestedAmount: value,
          month: editForm.month,
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
        <div className="bg-black px-4 py-3 text-lg font-bold text-yellow-400">Driver Advance</div>
        <div className="space-y-3 bg-white p-4">
          <div className="flex justify-between text-sm">
            <span>
              <strong>Driver:</strong> {driverName}
            </span>
            <span>
              <strong>ID:</strong> {driverId || 'N/A'}
            </span>
          </div>
          <div className="text-xs text-gray-500">Month: {monthKey}</div>

          <form onSubmit={onSubmit} className="space-y-2 pt-2">
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                required
                placeholder="Amount (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 rounded-md border-2 border-black px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={request.isPending}
                className="rounded-md bg-black px-5 py-2 text-sm font-bold text-white disabled:opacity-70"
              >
                {request.isPending ? 'Requesting…' : 'Request'}
              </button>
            </div>
            <input
              type="text"
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              className="w-full rounded-md border-2 border-black px-3 py-2 text-sm"
            />
          </form>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border-2 border-black shadow-md">
        <div className="flex items-center justify-between bg-yellow-400 px-4 py-2 text-sm font-bold text-black">
          <span>Advance History</span>
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
            <p className="text-center text-xs text-gray-500">No advance records for this period.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => openPreview(r)}
                    className="w-full rounded-md border border-gray-200 bg-white p-2.5 text-left text-xs transition hover:border-yellow-400 hover:bg-yellow-50 active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {r.month ?? '—'}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ring-1 ${statusBadge(r.approvalStatus)}`}
                      >
                        {r.approvalStatus}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="font-bold">{fmtMoney(r.requestedAmount)}</span>
                      {r.approvalStatus === 'Approved' && Number(r.approvedAmount) > 0 ? (
                        <span className="text-green-700">
                          Approved: {fmtMoney(r.approvedAmount)}
                        </span>
                      ) : null}
                    </div>
                    {r.reason ? (
                      <p className="mt-0.5 truncate text-gray-500">{r.reason}</p>
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

      <div className="overflow-hidden rounded-md border-2 border-black shadow-md">
        <div className="bg-yellow-400 px-4 py-2 text-sm font-bold text-black">Deductions</div>
        <div className="bg-white p-3">
          {deductions.isLoading ? (
            <p className="text-center text-xs text-gray-500">Loading…</p>
          ) : dedRows.length === 0 ? (
            <p className="text-center text-xs text-gray-500">No deductions on file.</p>
          ) : (
            <ul className="space-y-2">
              {dedRows.map((d) => (
                <li key={d.id} className="rounded-md border border-gray-200 p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{fmtMoney(d.amount)}</span>
                    <span className="text-gray-500">{fmtDate(d.date)}</span>
                  </div>
                  {d.reason || d.remarks ? (
                    <p className="mt-1 text-gray-600">{d.reason || d.remarks}</p>
                  ) : null}
                  {d.recoveryStatus ? (
                    <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-700">
                      {d.recoveryStatus}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
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
                {previewMode === 'edit' ? 'Edit advance' : 'Advance details'}
              </p>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-bold ring-1 ${statusBadge(previewing.approvalStatus)}`}
              >
                {previewing.approvalStatus}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {previewMode === 'view' ? (
                <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
                  <dt className="text-gray-500">Month</dt>
                  <dd className="font-bold">{previewing.month ?? '—'}</dd>
                  <dt className="text-gray-500">Requested</dt>
                  <dd className="font-bold">{fmtMoney(previewing.requestedAmount)}</dd>
                  <dt className="text-gray-500">Approved</dt>
                  <dd className="font-bold text-green-700">
                    {Number(previewing.approvedAmount) > 0
                      ? fmtMoney(previewing.approvedAmount)
                      : '—'}
                  </dd>
                  <dt className="text-gray-500">Reason</dt>
                  <dd>{previewing.reason ?? '—'}</dd>
                  <dt className="text-gray-500">Requested at</dt>
                  <dd>{fmtDate(previewing.requestedAt)}</dd>
                  {previewing.approvedAt ? (
                    <>
                      <dt className="text-gray-500">
                        {previewing.approvalStatus === 'Approved' ? 'Approved' : 'Rejected'}
                      </dt>
                      <dd>{fmtDate(previewing.approvedAt)}</dd>
                    </>
                  ) : null}
                  {previewing.approvedBy ? (
                    <>
                      <dt className="text-gray-500">By</dt>
                      <dd>{previewing.approvedBy}</dd>
                    </>
                  ) : null}
                </dl>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-500">
                    Pending requests can still be edited. Once admin reviews it, it&apos;s locked.
                  </p>
                  <label className="block text-xs font-medium">
                    Amount (₹)
                    <input
                      type="number"
                      min="1"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs font-medium">
                    Month (YYYY-MM)
                    <input
                      type="month"
                      value={editForm.month}
                      onChange={(e) => setEditForm({ ...editForm, month: e.target.value })}
                      className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                    />
                  </label>
                  <label className="block text-xs font-medium">
                    Reason
                    <input
                      type="text"
                      value={editForm.reason}
                      onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                      maxLength={200}
                      className="mt-1 w-full rounded border-2 border-black p-2 text-sm"
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-gray-200 p-3">
              {confirmingDelete ? (
                <div className="rounded-md border-2 border-red-500 bg-red-50 p-2.5 text-xs">
                  <p className="font-bold text-red-700">Delete this advance request?</p>
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
                  {previewing.approvalStatus === 'Pending' ? (
                    <>
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
                    disabled={update.isPending || !editForm.amount}
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
