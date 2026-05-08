import { useMemo, useState } from 'react';
import { usePendingAttendance, useUpdateAttendanceStatus } from '../attendance.hooks';

function badgeClass(status: string): string {
  if (status === 'Approved') return 'bg-green-50 text-green-700 border-green-600';
  if (status === 'Rejected') return 'bg-red-50 text-red-700 border-red-600';
  return 'bg-gray-100 text-gray-700 border-gray-400';
}

const fmt = (v: string | undefined): string => (v ? String(v) : '—');

export default function DriverAttendanceApprovalPage(): JSX.Element {
  const { data = [], isLoading, isError, refetch, isRefetching } = usePendingAttendance();
  const updateStatus = useUpdateAttendanceStatus();
  const [search, setSearch] = useState('');
  const [actingId, setActingId] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((r) => {
      return [r.driverName, r.driverId, r.vehicleNumber, r.status]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase())
        .some((s) => s.includes(q));
    });
  }, [data, search]);

  const setStatus = (id: string, status: 'Approved' | 'Rejected'): void => {
    setActingId(id);
    updateStatus.mutate({ id, status }, { onSettled: () => setActingId('') });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-3 p-2">
      <div className="overflow-hidden rounded-md border-2 border-black shadow-md">
        <div className="flex items-center justify-between bg-black px-4 py-3 text-lg font-bold text-yellow-400">
          <span>Driver Attendance Approval</span>
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isLoading || isRefetching}
            className="rounded-md bg-yellow-400 px-3 py-1.5 text-xs font-bold text-black disabled:opacity-60"
          >
            {isRefetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <div className="space-y-3 bg-white p-3">
          {isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              Failed to load pending attendance.
            </div>
          )}

          <input
            type="text"
            placeholder="Search by driver name, ID, vehicle number, or status"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border-2 border-black px-3 py-2 text-sm"
          />

          {isLoading ? (
            <p className="text-center text-xs text-gray-500">Loading pending attendance…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {['Driver', 'Driver ID', 'Vehicle', 'Start', 'Stop', 'Duration', 'Shift', 'Status', 'Attendance'].map((h) => (
                      <th
                        key={h}
                        className="whitespace-nowrap border-b-2 border-yellow-600 bg-yellow-400 px-2 py-2 text-left font-bold text-black"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="border-b border-gray-200 px-2 py-3 text-center text-gray-500">
                        No records found.
                        <div className="mt-1.5 text-xs text-gray-500">
                          If you just approved/rejected, click Refresh to reload pending list.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const id = String(r._id ?? r.id ?? '');
                      const status = r.status || 'Pending';
                      const disabled = actingId === id;
                      return (
                        <tr key={id || `${r.driverId}-${r.startTime}`}>
                          <td className="border-b border-gray-200 px-2 py-2">{fmt(r.driverName)}</td>
                          <td className="border-b border-gray-200 px-2 py-2">{fmt(r.driverId)}</td>
                          <td className="border-b border-gray-200 px-2 py-2">{fmt(r.vehicleNumber)}</td>
                          <td className="border-b border-gray-200 px-2 py-2">{fmt(r.startTime)}</td>
                          <td className="border-b border-gray-200 px-2 py-2">{fmt(r.stopTime)}</td>
                          <td className="border-b border-gray-200 px-2 py-2">{fmt(r.duration)}</td>
                          <td className="border-b border-gray-200 px-2 py-2">{fmt((r as unknown as Record<string, string | undefined>).driverShiftLabel ?? (r as unknown as Record<string, string | undefined>).shiftDetail)}</td>
                          <td className="border-b border-gray-200 px-2 py-2">
                            <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-bold ${badgeClass(status)}`}>
                              {status}
                            </span>
                          </td>
                          <td className="border-b border-gray-200 px-2 py-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={disabled || !id}
                                onClick={() => setStatus(id, 'Approved')}
                                className="rounded-md bg-green-600 px-2 py-1 text-xs font-bold text-white disabled:opacity-60"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={disabled || !id}
                                onClick={() => setStatus(id, 'Rejected')}
                                className="rounded-md bg-red-600 px-2 py-1 text-xs font-bold text-white disabled:opacity-60"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
