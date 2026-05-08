import { useMemo, useState, type CSSProperties } from 'react';
import {
  useAdvanceRecords,
  useApproveAdvance,
  useManualAdvance,
  usePendingAdvances,
} from '../billing.hooks';
import type { DriverAdvance } from '../billing.api';
import { useAuthStore } from '@store/auth.store';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';

type StatusFilter = 'All' | 'Approved' | 'Rejected' | 'Pending';

export default function DriverAdvancePage(): JSX.Element {
  const pending = usePendingAdvances();
  const records = useAdvanceRecords();
  const approve = useApproveAdvance();
  const adminName = useAuthStore((s) => s.user?.fullName ?? 'Admin User');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showManual, setShowManual] = useState(false);

  const filteredRecords = useMemo(() => {
    const list = records.data ?? [];
    return list.filter((r) => {
      const recordDate = new Date(r.month);
      const fromOk = !startDate || new Date(startDate) <= recordDate;
      const toOk = !endDate || new Date(endDate) >= recordDate;
      const statusOk = statusFilter === 'All' || r.approvalStatus === statusFilter;
      const text = `${r.driverId} ${r.driverName}`.toLowerCase();
      return fromOk && toOk && statusOk && text.includes(search.toLowerCase());
    });
  }, [records.data, search, statusFilter, startDate, endDate]);

  const handleApproval = (advance: DriverAdvance, status: 'Approved' | 'Rejected'): void => {
    let approvedAmount = 0;
    if (status === 'Approved') {
      const input = window.prompt('Enter approved amount:');
      const n = parseFloat(input ?? '');
      const requested = Number(advance.requestedAmount ?? 0);
      if (!isFinite(n) || n <= 0 || n > requested) {
        window.alert(`Invalid approved amount. It should be a number and <= ₹${requested}`);
        return;
      }
      approvedAmount = n;
    }
    approve.mutate({
      advanceId: advance.id,
      status,
      approvedAmount,
      adminName,
    });
  };

  const handleDownload = (): void => {
    const csv =
      'Driver Id,Driver Name,Date,Requested Amount,Approved Amount,Status\n' +
      filteredRecords
        .map(
          (r) =>
            `${r.driverId},${r.driverName},${r.month},₹${r.requestedAmount},₹${r.approvedAmount || ''},${r.approvalStatus}`,
        )
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'advance_records.csv';
    link.click();
  };

  return (
    <SendoLegacyPage title="Advance Approval Management">
        <button onClick={() => setShowManual(true)} style={s.manualBtn}>
          Add Manual Advance Request
        </button>

        {showManual && <ManualRequestModal onClose={() => setShowManual(false)} />}

        <div style={s.sectionTitle}>Filter &amp; Search</div>
        <hr style={s.sectionDivider} />
        <div style={s.filterRow}>
          <input
            type="text"
            placeholder="Search by Driver Name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={s.search}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} style={s.select}>
            <option value="All">All</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Pending">Pending</option>
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={s.date} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={s.date} />
          <button onClick={handleDownload} style={s.downloadBtn}>Download</button>
        </div>

        <div style={s.sectionTitle}>Pending Advance Requests</div>
        <hr style={s.sectionDivider} />
        {pending.isLoading ? (
          <p style={{ fontSize: '13px' }}>Loading advance requests...</p>
        ) : (pending.data?.length ?? 0) === 0 ? (
          <p style={{ fontSize: '13px' }}>No pending advance requests.</p>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                {['Driver ID','Driver Name','Month','Requested Amount','Action'].map((h) =>
                  <th style={s.th} key={h}>{h}</th>,
                )}
              </tr>
            </thead>
            <tbody>
              {(pending.data ?? []).map((a) => (
                <tr key={a.id}>
                  <td style={s.td}>{a.driverId}</td>
                  <td style={s.td}>{a.driverName}</td>
                  <td style={s.td}>{a.month}</td>
                  <td style={s.td}>₹{a.requestedAmount}</td>
                  <td style={s.td}>
                    <button style={s.approveBtn} onClick={() => handleApproval(a, 'Approved')}>Approve</button>
                    <button style={s.rejectBtn} onClick={() => handleApproval(a, 'Rejected')}>Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {(records.data?.length ?? 0) > 0 && (
          <>
            <div style={{ ...s.sectionTitle, marginTop: '28px' }}>Records Table</div>
            <hr style={s.sectionDivider} />
            <table style={s.table}>
              <thead>
                <tr>
                  {['Driver ID','Driver Name','Date','Requested Amount','Approved Amount','Status'].map((h) =>
                    <th style={s.th} key={h}>{h}</th>,
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => (
                  <tr key={r.id}>
                    <td style={s.td}>{r.driverId}</td>
                    <td style={s.td}>{r.driverName}</td>
                    <td style={s.td}>{r.month}</td>
                    <td style={s.td}>₹{r.requestedAmount}</td>
                    <td style={s.td}>{r.approvalStatus === 'Approved' ? `₹${r.approvedAmount}` : '—'}</td>
                    <td style={s.td}><span style={statusBadge(r.approvalStatus)}>{r.approvalStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
    </SendoLegacyPage>
  );
}

function ManualRequestModal({ onClose }: { onClose: () => void }): JSX.Element {
  const create = useManualAdvance();
  const adminName = useAuthStore((s) => s.user?.fullName ?? 'Admin User');
  const [form, setForm] = useState({
    driverId: '', driverName: '', month: '',
    requestedAmount: '', approvedAmount: '',
  });

  const submit = (): void => {
    create.mutate(
      {
        driverId: form.driverId,
        driverName: form.driverName,
        month: form.month,
        requestedAmount: Number(form.requestedAmount),
        approvedAmount: Number(form.approvedAmount),
        status: 'Approved',
        adminName,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <h3 style={s.modalHeaderText}>Manual Advance Request</h3>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div style={s.modalBody}>
          <hr style={s.sectionDivider} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#000' }}>Driver ID:</label>
              <DriverSearchSelect
                bindBy="id"
                required
                value={form.driverId}
                onChange={(v) => setForm((p) => ({ ...p, driverId: v }))}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#000' }}>Driver Name:</label>
              <DriverSearchSelect
                required
                value={form.driverName}
                onChange={(v) => setForm((p) => ({ ...p, driverName: v }))}
              />
            </div>
            {[
              { key: 'month', label: 'Month', type: 'month' },
              { key: 'requestedAmount', label: 'Requested Amount (₹)', type: 'number' },
              { key: 'approvedAmount', label: 'Approved Amount (₹)', type: 'number' },
            ].map(({ key, label, type }) => (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '13px', fontWeight: 700, color: '#000' }}>{label}:</label>
                <input
                  style={s.modalInput}
                  type={type}
                  required
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '16px' }}>
            <button onClick={onClose} style={s.cancelModalBtn}>Cancel</button>
            <button onClick={submit} disabled={create.isPending} style={s.submitModalBtn}>
              {create.isPending ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
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

const s: Record<string, CSSProperties> = {
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#000', marginBottom: '4px', marginTop: '20px' },
  sectionDivider: { border: 'none', borderTop: '2px solid #FFC107', marginBottom: '16px' },
  filterRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' },
  search: { padding: '8px 10px', width: '220px', border: '1.5px solid #000', fontSize: '13px', color: '#000', backgroundColor: '#fff' },
  select: { padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', color: '#000', backgroundColor: '#fff' },
  date: { padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', color: '#000', backgroundColor: '#fff' },
  downloadBtn: { padding: '8px 20px', backgroundColor: '#FFC107', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' },
  manualBtn: { padding: '8px 20px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', marginBottom: '16px' },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '8px' },
  th: { backgroundColor: '#000', color: '#fff', padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 700, border: '1px solid #000' },
  td: { border: '1px solid #000', padding: '10px 14px', color: '#000', fontSize: '13px', textAlign: 'center', backgroundColor: '#fff' },
  approveBtn: { backgroundColor: '#FFC107', color: '#000', border: 'none', padding: '7px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', display: 'block', width: '88px', marginBottom: '5px' },
  rejectBtn: { backgroundColor: '#000', color: '#fff', border: 'none', padding: '7px 16px', cursor: 'pointer', fontWeight: 700, fontSize: '12px', display: 'block', width: '88px' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', width: '100%', maxWidth: '500px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' },
  modalHeader: { backgroundColor: '#FFC107', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalHeaderText: { fontSize: '16px', fontWeight: 700, color: '#000', textTransform: 'uppercase', margin: 0, letterSpacing: '1px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', fontWeight: 700, color: '#000', cursor: 'pointer', lineHeight: 1 },
  modalBody: { padding: '24px' },
  modalInput: { width: '100%', padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', backgroundColor: '#fff', color: '#000', outline: 'none', boxSizing: 'border-box' },
  submitModalBtn: { padding: '8px 24px', backgroundColor: '#FFC107', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  cancelModalBtn: { padding: '8px 24px', backgroundColor: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' },
};
