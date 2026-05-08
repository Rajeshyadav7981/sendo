import { type CSSProperties, useEffect, useState } from 'react';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { apiClient } from '@shared/api/client';

interface TripSheet {
  driverName?: string | null;
  vehicleNumber?: string | null;
  freight?: string | number | null;
  status?: string | null;
}

interface ExpenseRow {
  amount?: string | number | null;
}

interface Summary {
  trips: number;
  revenue: number;
  expenses: number;
  drivers: number;
  vehicles: number;
  pending: number;
}

const ZERO: Summary = {
  trips: 0, revenue: 0, expenses: 0, drivers: 0, vehicles: 0, pending: 0,
};

const PERIODS = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'] as const;

const styles: Record<string, CSSProperties> = {
  page: { padding: '24px', backgroundColor: '#fff', minHeight: '100vh' },
  heading: {
    textAlign: 'center', backgroundColor: '#000', color: '#fff',
    padding: '12px 24px', borderRadius: '8px', width: 'fit-content',
    margin: '0 auto 24px', fontSize: '1.5rem', fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  filterRow: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20,
  },
  metricVal: { fontSize: 28, fontWeight: 'bold', color: '#111' },
  metricLabel: { fontSize: 12, color: '#666', marginTop: 6 },
  metricIcon: { fontSize: 28, marginBottom: 8 },
  card: {
    backgroundColor: '#fff', borderRadius: 8, padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 20,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12, color: '#333' },
};

const filterBtn = (active: boolean): CSSProperties => ({
  padding: '7px 18px',
  borderRadius: 20,
  border: active ? 'none' : '1px solid #ddd',
  background: active ? '#FFC107' : '#fff',
  fontWeight: active ? 'bold' : 'normal',
  cursor: 'pointer',
  fontSize: 13,
});

const metricCard = (bg: string): CSSProperties => ({
  background: bg,
  borderRadius: 10,
  padding: '20px 24px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
});

const profitBar = (pct: number, profit: number): CSSProperties => ({
  height: 8,
  borderRadius: 4,
  background: profit >= 0 ? '#27ae60' : '#e53935',
  width: `${Math.min(Math.abs(pct), 100)}%`,
  transition: 'width 0.5s',
});

export default function MisPage(): JSX.Element {
  const [summary, setSummary] = useState<Summary>(ZERO);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('This Month');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      const [tripRes, expRes] = await Promise.allSettled([
        apiClient.getList<TripSheet>('/trip/trip-sheet'),
        apiClient.getList<ExpenseRow>('/vehicle/expenses'),
      ]);
      if (cancelled) return;
      const trips = tripRes.status === 'fulfilled' ? tripRes.value : [];
      const expenses = expRes.status === 'fulfilled' ? expRes.value : [];
      setSummary({
        trips: trips.length,
        revenue: trips.reduce((a, t) => a + Number(t.freight || 0), 0),
        expenses: expenses.reduce((a, e) => a + Number(e.amount || 0), 0),
        drivers: new Set(trips.map((t) => t.driverName).filter(Boolean) as string[]).size,
        vehicles: new Set(trips.map((t) => t.vehicleNumber).filter(Boolean) as string[]).size,
        pending: trips.filter((t) => t.status === 'Pending').length,
      });
      setLoading(false);
    };
    void load();
    return (): void => {
      cancelled = true;
    };
  }, [period]);

  const profit = summary.revenue - summary.expenses;
  const margin = summary.revenue > 0 ? (profit / summary.revenue) * 100 : 0;

  const metrics: Array<{ icon: string; label: string; value: string | number; color: string }> = [
    { icon: '🗺️', label: 'Total Trips', value: summary.trips, color: '#e3f2fd' },
    { icon: '💰', label: 'Total Revenue', value: `₹${summary.revenue.toLocaleString('en-IN')}`, color: '#e8f5e9' },
    { icon: '📉', label: 'Total Expenses', value: `₹${summary.expenses.toLocaleString('en-IN')}`, color: '#fde8e8' },
    { icon: profit >= 0 ? '📈' : '📉', label: 'Net Profit/Loss', value: `₹${Math.abs(profit).toLocaleString('en-IN')}`, color: profit >= 0 ? '#f0fdf4' : '#fff5f5' },
    { icon: '👤', label: 'Active Drivers', value: summary.drivers, color: '#fff8e1' },
    { icon: '🚛', label: 'Active Vehicles', value: summary.vehicles, color: '#f3e5f5' },
  ];

  return (
    <SendoLegacyPage title="MIS Reports">
      <div style={styles.page}>
        <h2 style={styles.heading}>MIS Reports</h2>
        <div style={styles.filterRow}>
          {PERIODS.map((p) => (
            <button key={p} type="button" style={filterBtn(period === p)} onClick={() => setPeriod(p)}>
              {p}
            </button>
          ))}
          {loading && (
            <span style={{ fontSize: 12, color: '#888', marginLeft: 8, alignSelf: 'center' }}>
              Refreshing…
            </span>
          )}
        </div>

        <div style={styles.grid}>
          {metrics.map((m) => (
            <div key={m.label} style={metricCard(m.color)}>
              <div style={styles.metricIcon}>{m.icon}</div>
              <div style={styles.metricVal}>{m.value}</div>
              <div style={styles.metricLabel}>{m.label}</div>
            </div>
          ))}
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Profitability Snapshot</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 6 }}>
            <span>Revenue: <b style={{ color: '#27ae60' }}>₹{summary.revenue.toLocaleString('en-IN')}</b></span>
            <span>Expenses: <b style={{ color: '#e53935' }}>₹{summary.expenses.toLocaleString('en-IN')}</b></span>
            <span>
              {profit >= 0 ? 'Profit' : 'Loss'}:{' '}
              <b style={{ color: profit >= 0 ? '#27ae60' : '#e53935' }}>
                ₹{Math.abs(profit).toLocaleString('en-IN')}
              </b>
            </span>
          </div>
          <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8 }}>
            <div style={profitBar(Math.abs(margin), profit)} />
          </div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
            {summary.revenue > 0
              ? `Margin: ${margin.toFixed(1)}%`
              : 'No revenue data yet'}
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.sectionTitle}>Quick Summary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Pending Trips', summary.pending, '#fff8e1'],
              ['Completed Trips', summary.trips - summary.pending, '#e8f5e9'],
            ].map(([l, v, c]) => (
              <div
                key={String(l)}
                style={{
                  background: String(c),
                  borderRadius: 8,
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, color: '#555' }}>{l}</span>
                <span style={{ fontSize: 22, fontWeight: 'bold' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SendoLegacyPage>
  );
}
