import type { FillRow } from '@features/tracker/tracker.api';
import { formatMonthLabel } from '@shared/lib/months';

interface Props {
  fills: FillRow[];
  loading: boolean;
  emptyHint: string;
}

function fmtLitres(v: number | string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(1)} L`;
}

function fmtAmount(v: number | string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return d || '—';
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function FillsTable({ fills, loading, emptyHint }: Props): JSX.Element {
  if (loading) {
    return <p className="sup-muted">Loading fills…</p>;
  }

  if (!fills.length) {
    return <p className="sup-muted">{emptyHint}</p>;
  }

  return (
    <div className="sup-emp-table-wrap">
      <table className="sup-emp-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Month</th>
            <th>Filled by</th>
            <th>Litres</th>
            <th>Amount</th>
            <th>Paid by</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {fills.map((f, idx) => (
            <tr
              key={f._id ?? `${f.vehicle}-${f.date}-${f.month}-${f.time ?? ''}-${f.driver}-${idx}`}
            >
              <td>{fmtDate(f.date)}</td>
              <td>{formatMonthLabel(f.month)}</td>
              <td>{f.driver || '—'}</td>
              <td>{fmtLitres(f.litres)}</td>
              <td>{fmtAmount(f.amount)}</td>
              <td>{f.paidBy ?? '—'}</td>
              <td>{f.time ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
