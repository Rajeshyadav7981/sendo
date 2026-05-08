import { useMemo, useState, type CSSProperties } from 'react';
import { useApproveSalary, usePayout } from '../billing.hooks';
import { useDrivers } from '../drivers.hooks';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';

type StatusFilter = 'All' | 'Approved' | 'Pending' | 'Paid';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface SalaryRow {
  driverId: string;
  driverName: string;
  selectedMonth: string;
  totalDays?: number;
  basicPayment?: string;
  dailyWage?: string;
  totalWorkingDays?: number;
  earnedPayment?: string;
  totalHolidays?: number | string;
  referralBonus?: string;
  totalAdvanceDeduction?: string;
  deductions?: string;
  payableAmount?: string;
  approvalStatus?: string;
  paidAmount?: string;
  paidDate?: string;
  remarks?: string;
}

const HEADERS = [
  'Salary Month','Driver ID','Driver Name','No. of Days',
  'Basic Payment','Per Day Payment','No. of Working Days',
  'Earned Payment','Absent','Referral Bonus','Advance Deduction',
  'Other Deductions','Payable Amount','Approval Status',
  'Paid Amount','Paid Date','Remarks','Actions',
];

export default function SalaryPage(): JSX.Element {
  const drivers = useDrivers();
  const [driverId, setDriverId] = useState<string>('');
  const [month, setMonth] = useState<string>(currentMonth());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const payout = usePayout(driverId, month);
  const approve = useApproveSalary();

  const driverName = useMemo(() => {
    const d = drivers.data?.find((x) => x.driverId === driverId);
    return d ? `${d.firstName ?? ''} ${d.surname ?? ''}`.trim() : '';
  }, [drivers.data, driverId]);

  const rows = useMemo<SalaryRow[]>(() => {
    if (!driverId || !payout.data) return [];
    return [
      {
        driverId,
        driverName,
        selectedMonth: month,
        totalDays: payout.data.totalDays,
        basicPayment: payout.data.basicPayment,
        dailyWage: payout.data.dailyWage,
        totalWorkingDays: payout.data.totalWorkingDays,
        earnedPayment: payout.data.earnedPayment,
        totalHolidays: payout.data.totalHolidays,
        referralBonus: payout.data.referralBonus,
        totalAdvanceDeduction: payout.data.totalAdvanceDeduction,
        payableAmount: payout.data.payableAmount,
      },
    ];
  }, [payout.data, driverId, driverName, month]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const text = `${r.driverId} ${r.driverName} ${r.selectedMonth}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'All' || r.approvalStatus === statusFilter;
      const matchesDate =
        (!startDate || (r.paidDate ?? '') >= startDate) &&
        (!endDate || (r.paidDate ?? '') <= endDate);
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [rows, search, statusFilter, startDate, endDate]);

  const handleApprove = (): void => {
    if (!driverId) return;
    if (!window.confirm(`Approve payout for driver ${driverId} for ${month}?`)) return;
    approve.mutate({ driverId, month });
  };

  return (
    <SendoLegacyPage title="Driver Salary">
        <div style={s.sectionTitle}>Select Driver &amp; Month</div>
        <hr style={s.sectionDivider} />
        <div style={s.monthRow}>
          <label style={s.monthLabel}>Driver:</label>
          <div style={{ minWidth: 240 }}>
            <DriverSearchSelect
              bindBy="id"
              value={driverId}
              onChange={setDriverId}
              placeholder="Select driver"
            />
          </div>
          <label style={s.monthLabel}>Salary Month:</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={s.monthInput} />
        </div>

        <div style={s.sectionTitle}>Filter &amp; Search</div>
        <hr style={s.sectionDivider} />
        <div style={s.filterRow}>
          <input
            type="text"
            placeholder="Search by Driver ID, Name, or Month"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...s.filterInput, width: '240px' }}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} style={s.filterSelect}>
            <option value="All">All</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={s.filterInput} />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={s.filterInput} />
          <button onClick={() => undefined} style={s.downloadBtn}>Download</button>
        </div>

        <div style={s.sectionTitle}>Salary Summary ({month})</div>
        <hr style={s.sectionDivider} />
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={s.table}>
            <thead>
              <tr>{HEADERS.map((h) => <th style={s.th} key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {payout.isLoading ? (
                <tr>
                  <td colSpan={HEADERS.length} style={{ ...s.td, color: '#888', padding: '24px' }}>Loading salary data...</td>
                </tr>
              ) : filtered.length > 0 ? filtered.map((r) => (
                <tr key={`${r.driverId}-${r.selectedMonth}`}>
                  <td style={s.td}>{r.selectedMonth}</td>
                  <td style={s.td}>{r.driverId}</td>
                  <td style={s.td}>{r.driverName}</td>
                  <td style={s.td}>{r.totalDays ?? '—'}</td>
                  <td style={s.td}>₹{r.basicPayment ?? '—'}</td>
                  <td style={s.td}>₹{r.dailyWage ?? '—'}</td>
                  <td style={s.td}>{r.totalWorkingDays ?? '—'}</td>
                  <td style={s.td}>₹{r.earnedPayment ?? '—'}</td>
                  <td style={s.td}>{r.totalHolidays ?? '—'}</td>
                  <td style={s.td}>₹{r.referralBonus ?? '—'}</td>
                  <td style={s.td}>₹{r.totalAdvanceDeduction ?? '—'}</td>
                  <td style={s.td}>₹{r.deductions ?? '—'}</td>
                  <td style={s.td}>₹{r.payableAmount ?? '—'}</td>
                  <td style={s.td}>
                    <span style={statusBadge(r.approvalStatus)}>{r.approvalStatus ?? 'Pending'}</span>
                  </td>
                  <td style={s.td}>₹{r.paidAmount ?? '—'}</td>
                  <td style={s.td}>{r.paidDate ?? '—'}</td>
                  <td style={s.td}>{r.remarks ?? '—'}</td>
                  <td style={s.td}>
                    <button style={s.approveBtn} onClick={handleApprove} disabled={approve.isPending}>
                      Approve
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={HEADERS.length} style={{ ...s.td, color: '#888', padding: '24px' }}>
                    No salary records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </SendoLegacyPage>
  );
}

function statusBadge(status?: string): CSSProperties {
  return {
    display: 'inline-block', padding: '3px 10px',
    backgroundColor: status === 'Approved' || status === 'Paid' ? '#FFC107' : '#fff',
    color: '#000', fontWeight: 700, fontSize: '11px',
    border: '1.5px solid #000',
  };
}

const s: Record<string, CSSProperties> = {
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#000', marginBottom: '4px' },
  sectionDivider: { border: 'none', borderTop: '2px solid #FFC107', marginBottom: '16px' },
  monthRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' },
  monthLabel: { fontSize: '13px', fontWeight: 700, color: '#000' },
  monthInput: { padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', color: '#000', backgroundColor: '#fff' },
  filterRow: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' },
  filterInput: { padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', color: '#000', backgroundColor: '#fff' },
  filterSelect: { padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', color: '#000', backgroundColor: '#fff' },
  downloadBtn: { padding: '8px 20px', backgroundColor: '#FFC107', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '13px' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '1400px' },
  th: { backgroundColor: '#000', color: '#fff', padding: '12px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 700, border: '1px solid #000', whiteSpace: 'nowrap' },
  td: { border: '1px solid #000', padding: '10px 12px', color: '#000', fontSize: '12px', textAlign: 'center', backgroundColor: '#fff', whiteSpace: 'nowrap' },
  approveBtn: { padding: '6px 16px', backgroundColor: '#FFC107', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px' },
};
