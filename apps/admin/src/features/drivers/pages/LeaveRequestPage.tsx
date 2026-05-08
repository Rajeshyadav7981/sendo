import { useMemo, useState, type CSSProperties } from 'react';
import {
  useDeleteLeave,
  useEditLeave,
  useLeaves,
  useUpdateLeave,
} from '../billing.hooks';
import type { LeaveRecord } from '../billing.api';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';

type StatusFilter = '' | 'Pending' | 'Approved' | 'Rejected';

function formatDate(d?: string | null): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export default function LeaveRequestPage(): JSX.Element {
  const { data, isLoading } = useLeaves();
  const update = useUpdateLeave();
  const editLeave = useEditLeave();
  const remove = useDeleteLeave();

  const [filterDriverId, setFilterDriverId] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [leaveType, setLeaveType] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editedReason, setEditedReason] = useState('');

  const filtered = useMemo(() => {
    return (data ?? []).filter((r) => {
      const dOk = !filterDriverId || (r.driverId ?? '').toLowerCase().includes(filterDriverId.toLowerCase());
      const sOk = !filterStatus || r.status === filterStatus;
      return dOk && sOk;
    });
  }, [data, filterDriverId, filterStatus]);

  const pending = filtered.filter((r) => r.status === 'Pending');
  const processed = filtered.filter((r) => r.status !== 'Pending');

  const handleAction = (id: string, status: 'Approved' | 'Rejected'): void => {
    if (status === 'Approved' && !leaveType[id]) {
      window.alert('Please select leave type before approving.');
      return;
    }
    update.mutate({ id, body: { status, leaveType: leaveType[id] } });
  };

  const handleEdit = (request: LeaveRecord): void => {
    setEditId(request.id);
    setEditedReason(request.reason ?? '');
  };

  const handleUpdate = (id: string): void => {
    editLeave.mutate(
      { id, body: { reason: editedReason } },
      { onSuccess: () => setEditId(null) },
    );
  };

  const handleDelete = (id: string): void => {
    if (!window.confirm('Are you sure you want to delete this leave request?')) return;
    remove.mutate(id);
  };

  const handleDownload = (): void => {
    const start = filterStart ? new Date(filterStart).getTime() : -Infinity;
    const end = filterEnd ? new Date(filterEnd).getTime() : Infinity;
    const list = (data ?? []).filter((r) => {
      const ts = r.startDate ? new Date(r.startDate).getTime() : 0;
      return ts >= start && ts <= end;
    });
    const csv =
      'Driver ID,Start Date,End Date,Reason,Status,Leave Type\n' +
      list
        .map((r) => `${r.driverId},${r.startDate},${r.endDate},${r.reason},${r.status},${r.leaveType}`)
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Leaves_${filterStart}_to_${filterEnd}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <SendoLegacyPage title="Leave Requests">
        <div style={s.sectionTitle}>Filter &amp; Search</div>
        <hr style={s.sectionDivider} />
        <div style={s.filterRow}>
          <div style={{ minWidth: 220 }}>
            <DriverSearchSelect
              bindBy="id"
              value={filterDriverId}
              onChange={setFilterDriverId}
              placeholder="Filter by Driver ID"
            />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as StatusFilter)} style={s.filterSelect}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
          <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} style={s.filterInput} />
          <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} style={s.filterInput} />
          <button onClick={handleDownload} style={s.downloadBtn}>Download</button>
        </div>

        {isLoading ? (
          <p style={{ fontSize: '13px' }}>Loading leave requests...</p>
        ) : (
          <>
            <div style={s.sectionTitle}>Pending Requests</div>
            <hr style={s.sectionDivider} />
            <table style={s.table}>
              <thead>
                <tr>
                  {['Driver ID','Start Date','End Date','Reason','Status','Leave Type','Actions'].map((h) =>
                    <th style={s.th} key={h}>{h}</th>,
                  )}
                </tr>
              </thead>
              <tbody>
                {pending.length > 0 ? pending.map((r) => (
                  <tr key={r.id}>
                    <td style={s.td}>{r.driverId}</td>
                    <td style={s.td}>{formatDate(r.startDate)}</td>
                    <td style={s.td}>{formatDate(r.endDate)}</td>
                    <td style={s.td}>{r.reason}</td>
                    <td style={s.td}><span style={badge(r.status)}>{r.status}</span></td>
                    <td style={s.td}>
                      <select
                        style={s.inlineSelect}
                        onChange={(e) => setLeaveType((p) => ({ ...p, [r.id]: e.target.value }))}
                        value={leaveType[r.id] ?? ''}
                      >
                        <option value="">Select Type</option>
                        <option value="Paid Leave">Paid Leave</option>
                        <option value="Unpaid Leave">Unpaid Leave</option>
                      </select>
                    </td>
                    <td style={s.td}>
                      <button
                        style={{ ...s.approveBtn, opacity: !leaveType[r.id] ? 0.5 : 1 }}
                        onClick={() => handleAction(r.id, 'Approved')}
                        disabled={!leaveType[r.id]}
                      >Approve</button>
                      <button style={s.rejectBtn} onClick={() => handleAction(r.id, 'Rejected')}>Reject</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} style={{ ...s.td, color: '#888' }}>No pending requests</td></tr>
                )}
              </tbody>
            </table>

            <div style={{ ...s.sectionTitle, marginTop: '28px' }}>Approved / Rejected Requests</div>
            <hr style={s.sectionDivider} />
            <table style={s.table}>
              <thead>
                <tr>
                  {['Driver ID','Start Date','End Date','Reason','Status','Leave Type','Actions'].map((h) =>
                    <th style={s.th} key={h}>{h}</th>,
                  )}
                </tr>
              </thead>
              <tbody>
                {processed.length > 0 ? processed.map((r) => (
                  <tr key={r.id}>
                    <td style={s.td}>{r.driverId}</td>
                    <td style={s.td}>{formatDate(r.startDate)}</td>
                    <td style={s.td}>{formatDate(r.endDate)}</td>
                    <td style={s.td}>
                      {editId === r.id ? (
                        <input style={s.inlineInput} value={editedReason} onChange={(e) => setEditedReason(e.target.value)} />
                      ) : r.reason}
                    </td>
                    <td style={s.td}><span style={badge(r.status)}>{r.status}</span></td>
                    <td style={s.td}>{r.leaveType ?? '—'}</td>
                    <td style={s.td}>
                      {editId === r.id ? (
                        <button style={s.updateBtn} onClick={() => handleUpdate(r.id)}>Update</button>
                      ) : (
                        <>
                          <button style={s.editBtn} onClick={() => handleEdit(r)}>Edit</button>
                          <button style={s.deleteBtn} onClick={() => handleDelete(r.id)}>Delete</button>
                        </>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} style={{ ...s.td, color: '#888' }}>No processed requests</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}
    </SendoLegacyPage>
  );
}

function badge(status: string): CSSProperties {
  return {
    display: 'inline-block', padding: '4px 10px',
    backgroundColor: status === 'Approved' ? '#FFC107' : status === 'Rejected' ? '#000' : '#fff',
    color: status === 'Approved' ? '#000' : status === 'Rejected' ? '#fff' : '#000',
    fontWeight: 700, fontSize: '12px',
    border: status === 'Pending' ? '1.5px solid #000' : 'none',
  };
}

const s: Record<string, CSSProperties> = {
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#000', marginBottom: '4px', marginTop: '20px' },
  sectionDivider: { border: 'none', borderTop: '2px solid #FFC107', marginBottom: '16px' },
  filterRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' },
  filterInput: { padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', color: '#000', backgroundColor: '#fff' },
  filterSelect: { padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', color: '#000', backgroundColor: '#fff' },
  downloadBtn: { padding: '8px 20px', backgroundColor: '#FFC107', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '8px' },
  th: { backgroundColor: '#000', color: '#fff', padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 700, border: '1px solid #000' },
  td: { border: '1px solid #000', padding: '10px 14px', color: '#000', fontSize: '13px', textAlign: 'center', backgroundColor: '#fff' },
  approveBtn: { backgroundColor: '#FFC107', color: '#000', border: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', display: 'block', width: '80px', marginBottom: '4px' },
  rejectBtn: { backgroundColor: '#000', color: '#fff', border: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', display: 'block', width: '80px' },
  editBtn: { backgroundColor: '#FFC107', color: '#000', border: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', display: 'block', width: '80px', marginBottom: '4px' },
  deleteBtn: { backgroundColor: '#000', color: '#fff', border: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', display: 'block', width: '80px' },
  updateBtn: { backgroundColor: '#FFC107', color: '#000', border: 'none', padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', width: '80px' },
  inlineSelect: { padding: '6px 8px', border: '1.5px solid #000', fontSize: '12px', color: '#000', backgroundColor: '#fff' },
  inlineInput: { padding: '6px 8px', border: '1.5px solid #000', fontSize: '12px', color: '#000', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' },
};
