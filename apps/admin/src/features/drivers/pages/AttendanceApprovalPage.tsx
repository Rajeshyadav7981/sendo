import { useMemo, useState, type CSSProperties } from 'react';
import { Modal } from 'antd';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';
import {
  useAllAttendance,
  useDeleteAttendance,
  useUpdateAttendanceStatus,
} from '../attendance.hooks';
import type { AttendanceRecord } from '../attendance.api';

type AttendanceStatus = 'Present' | 'Absent' | 'Pending';
type StatusFilter = 'All' | AttendanceStatus;

const toAttendance = (status: AttendanceRecord['status']): AttendanceStatus => {
  if (status === 'Approved') return 'Present';
  if (status === 'Rejected') return 'Absent';
  return 'Pending';
};

function parseCustomDate(dateStr?: string | null): string {
  if (!dateStr) return 'Invalid Date';
  const parts = dateStr.split(' ');
  if (parts.length < 3) return 'Invalid Date';
  const [datePart, timePart, period] = parts;
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  if ([day, month, year, hours, minutes, seconds].some((n) => Number.isNaN(n))) return 'Invalid Date';
  let parsedHours = hours;
  if (period?.toLowerCase() === 'pm' && hours !== 12) parsedHours += 12;
  else if (period?.toLowerCase() === 'am' && hours === 12) parsedHours = 0;
  const date = new Date(year, month - 1, day, parsedHours, minutes, seconds);
  return Number.isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString('en-GB');
}

export default function AttendanceApprovalPage(): JSX.Element {
  const { data, isLoading } = useAllAttendance();
  const update = useUpdateAttendanceStatus();
  const remove = useDeleteAttendance();
  const [actingId, setActingId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = useMemo(() => {
    return (data ?? []).filter((r) => {
      const matchesSearch = (r.driverName ?? '').toLowerCase().includes(search.toLowerCase());
      const att = toAttendance(r.status);
      const matchesStatus = statusFilter === 'All' || att === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const handleAction = (id: string, status: 'Approved' | 'Rejected'): void => {
    setActingId(id);
    update.mutate({ id, status }, { onSettled: () => setActingId('') });
  };

  const handleDelete = (id: string): void => {
    Modal.confirm({
      title: 'Delete this attendance record?',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => remove.mutate(id),
    });
  };

  const handleDownload = (): void => {
    const list = (data ?? []).filter((r) => {
      const ts = new Date(parseCustomDate(r.startTime)).getTime();
      const start = startDate ? new Date(startDate).getTime() : -Infinity;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      return ts >= start && ts <= end;
    });
    const csv =
      'Driver ID,Driver Name,Vehicle Number,Start Time,Stop Time,Duration (sec),Status,Attendance\n' +
      list
        .map(
          (r) =>
            `${r.driverId},${r.driverName},${r.vehicleNumber},${r.startTime},${r.stopTime},${r.duration},${r.status},${toAttendance(r.status)}`,
        )
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Attendance_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SendoLegacyPage title="Attendance Records">
        <div style={s.sectionTitle}>Filter &amp; Search</div>
        <hr style={s.sectionDivider} />
        <div style={s.filterRow}>
          <div style={{ minWidth: 260 }}>
            <DriverSearchSelect
              value={search}
              onChange={setSearch}
              placeholder="Search by Driver Name..."
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} style={s.select}>
            <option value="All">All</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Pending">Pending</option>
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={s.date} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={s.date} />
          <button onClick={handleDownload} style={s.downloadBtn}>Download</button>
        </div>

        <div style={s.sectionTitle}>Driver Attendance Records</div>
        <hr style={s.sectionDivider} />

        {isLoading ? (
          <p style={{ fontSize: '13px' }}>Loading attendance...</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Driver ID','Driver Name','Vehicle Number','Start Time','Stop Time','Duration (sec)','Status','Attendance','Actions'].map((h) =>
                  <th style={s.th} key={h}>{h}</th>,
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={s.td}>{r.driverId}</td>
                  <td style={s.td}>{r.driverName}</td>
                  <td style={s.td}>{r.vehicleNumber}</td>
                  <td style={s.td}>{parseCustomDate(r.startTime)}</td>
                  <td style={s.td}>{parseCustomDate(r.stopTime)}</td>
                  <td style={s.td}>{r.duration}</td>
                  <td style={s.td}><span style={statusBadge(r.status)}>{r.status}</span></td>
                  <td style={s.td}>
                    {r.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          style={s.approveBtn(actingId === r.id)}
                          disabled={actingId === r.id}
                          onClick={() => handleAction(r.id, 'Approved')}
                        >Approve</button>
                        <button
                          style={s.rejectBtn(actingId === r.id)}
                          disabled={actingId === r.id}
                          onClick={() => handleAction(r.id, 'Rejected')}
                        >Reject</button>
                      </div>
                    ) : (
                      <span style={attendanceBadge(toAttendance(r.status))}>{toAttendance(r.status)}</span>
                    )}
                  </td>
                  <td style={s.td}>
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={remove.isPending}
                      style={s.deleteBtn}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </SendoLegacyPage>
  );
}

function statusBadge(status: string): CSSProperties {
  return {
    display: 'inline-block', padding: '4px 12px',
    backgroundColor: status === 'Approved' ? '#FFC107' : status === 'Rejected' ? '#000' : '#fff',
    color: status === 'Approved' ? '#000' : status === 'Rejected' ? '#fff' : '#000',
    fontWeight: 700, fontSize: '12px',
    border: status === 'Pending' ? '1.5px solid #000' : 'none',
  };
}

function attendanceBadge(status: AttendanceStatus): CSSProperties {
  return {
    display: 'inline-block', padding: '4px 12px',
    backgroundColor: status === 'Present' ? '#FFC107' : status === 'Absent' ? '#000' : '#fff',
    color: status === 'Present' ? '#000' : status === 'Absent' ? '#fff' : '#000',
    fontWeight: 700, fontSize: '12px',
    border: status === 'Pending' ? '1.5px solid #000' : 'none',
  };
}

const s = {
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#000', marginBottom: '4px' } as CSSProperties,
  sectionDivider: { border: 'none', borderTop: '2px solid #FFC107', marginBottom: '16px' } as CSSProperties,
  filterRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' } as CSSProperties,
  search: { padding: '8px 10px', width: '260px', border: '1.5px solid #000', fontSize: '13px', color: '#000', backgroundColor: '#fff' } as CSSProperties,
  select: { padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', color: '#000', backgroundColor: '#fff' } as CSSProperties,
  date: { padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', color: '#000', backgroundColor: '#fff' } as CSSProperties,
  downloadBtn: { padding: '8px 20px', backgroundColor: '#FFC107', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' } as CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '8px' } as CSSProperties,
  th: { backgroundColor: '#000', color: '#fff', padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 700, border: '1px solid #000' } as CSSProperties,
  td: { border: '1px solid #000', padding: '10px 14px', color: '#000', fontSize: '13px', textAlign: 'center', backgroundColor: '#fff' } as CSSProperties,
  approveBtn: (disabled: boolean): CSSProperties => ({
    padding: '6px 12px', backgroundColor: '#FFC107', color: '#000',
    border: '1.5px solid #000', fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, fontSize: '12px',
  }),
  rejectBtn: (disabled: boolean): CSSProperties => ({
    padding: '6px 12px', backgroundColor: '#000', color: '#fff',
    border: '1.5px solid #000', fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, fontSize: '12px',
  }),
  deleteBtn: { padding: '5px 12px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' } as CSSProperties,
};
