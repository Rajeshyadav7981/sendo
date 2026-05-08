import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '@shared/api/client';

const COLORS = ['#FFC107', '#000', '#27ae60', '#e53935', '#1565c0', '#f39c12'];

interface Trip {
  status?: string;
  freight?: string | number;
  advancePaid?: string | number;
}
interface Expense {
  expenseType?: string;
  amount?: string | number;
}

export default function DashboardReportsPage(): JSX.Element {
  const tripsQ = useQuery({
    queryKey: ['dashboard-reports', 'trips'],
    queryFn: () => apiClient.getList<Trip>('/trip/trip-sheet').catch(() => [] as Trip[]),
  });
  const expensesQ = useQuery({
    queryKey: ['dashboard-reports', 'expenses'],
    queryFn: () => apiClient.getList<Expense>('/vehicle/expenses').catch(() => [] as Expense[]),
  });
  const driversQ = useQuery({
    queryKey: ['dashboard-reports', 'drivers'],
    queryFn: () =>
      apiClient
        .getList<unknown>('/onboarding/drivers')
        .catch(() =>
          apiClient.getList<unknown>('/onboarding/driver').catch(() => [] as unknown[]),
        ),
  });
  const vehiclesQ = useQuery({
    queryKey: ['dashboard-reports', 'vehicles'],
    queryFn: () => apiClient.getList<unknown>('/onboarding/all-vehicles').catch(() => [] as unknown[]),
  });

  const loading =
    tripsQ.isLoading || expensesQ.isLoading || driversQ.isLoading || vehiclesQ.isLoading;

  const trips = tripsQ.data ?? [];
  const expenses = expensesQ.data ?? [];
  const drivers = driversQ.data ?? [];
  const vehicles = vehiclesQ.data ?? [];

  const tripsByStatus = ['Pending', 'In Transit', 'Completed', 'Cancelled']
    .map((s) => ({ name: s, value: trips.filter((t) => t.status === s).length }))
    .filter((d) => d.value > 0);

  const expenseByType = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      const t = e.expenseType ?? 'Other';
      acc[t] = (acc[t] ?? 0) + parseFloat(String(e.amount ?? 0));
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value: Math.round(value) }));

  const totalRevenue = trips.reduce((a, t) => a + parseFloat(String(t.freight ?? 0)), 0);
  const totalExpenses = expenses.reduce((a, e) => a + parseFloat(String(e.amount ?? 0)), 0);
  const totalAdvancePaid = trips.reduce((a, t) => a + parseFloat(String(t.advancePaid ?? 0)), 0);
  const net = totalRevenue - totalExpenses;

  if (loading) {
    return (
      <div className="sendo-page">
        <div className="bg-sendo-yellow px-5 py-4 text-[22px] font-bold uppercase tracking-wider text-black">
          DASHBOARD REPORTS
        </div>
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-[16px] text-[#888]">
          <div className="text-[40px]">⏳</div>
          <div>Loading dashboard data…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="sendo-page">
      <div className="bg-sendo-yellow px-5 py-4 text-[22px] font-bold uppercase tracking-wider text-black">
        DASHBOARD REPORTS
      </div>

      <div className="px-5 py-6">
        <div className="mb-4 mt-2.5 border-b-2 border-sendo-yellow pb-1.5 text-[15px] font-bold">
          Key Metrics
        </div>
        <div className="mb-7 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Stat icon="🗺️" value={String(trips.length)} label="Total Trips" bg="#e3f2fd" />
          <Stat
            icon="💰"
            value={`₹${totalRevenue.toLocaleString('en-IN')}`}
            label="Total Revenue"
            bg="#e8f5e9"
          />
          <Stat
            icon="💸"
            value={`₹${totalExpenses.toLocaleString('en-IN')}`}
            label="Total Expenses"
            bg="#ffebee"
          />
          <Stat icon="👤" value={String(drivers.length)} label="Drivers" bg="#fff8e1" />
          <Stat icon="🚛" value={String(vehicles.length)} label="Vehicles" bg="#f3e5f5" />
          <Stat
            icon={net >= 0 ? '📈' : '📉'}
            value={`₹${Math.abs(net).toLocaleString('en-IN')}`}
            label={`Net ${net >= 0 ? 'Profit' : 'Loss'}`}
            bg={net >= 0 ? '#e8f5e9' : '#ffebee'}
          />
        </div>

        <div className="mb-4 mt-2.5 border-b-2 border-sendo-yellow pb-1.5 text-[15px] font-bold">
          Analytics
        </div>
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <ChartCard title="Trip Status Breakdown">
            {tripsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={tripsByStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {tripsByStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-10 text-center text-[14px] text-[#aaa]">No trip data yet</div>
            )}
          </ChartCard>

          <ChartCard title="Expenses by Type (₹)">
            {expenseByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={expenseByType} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-30} textAnchor="end" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                  <Bar dataKey="value" fill="#FFC107" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="py-10 text-center text-[14px] text-[#aaa]">No expense data yet</div>
            )}
          </ChartCard>
        </div>

        <div className="mb-4 mt-2.5 border-b-2 border-sendo-yellow pb-1.5 text-[15px] font-bold">
          Financial Summary
        </div>
        <div className="rounded-md border-[1.5px] border-black bg-white p-5">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b-2 border-[#e0a800] bg-sendo-yellow px-4 py-3 text-left text-[14px] font-bold">
                  Metric
                </th>
                <th className="border-b-2 border-[#e0a800] bg-sendo-yellow px-4 py-3 text-left text-[14px] font-bold">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['Total Trips', String(trips.length)],
                  ['Completed Trips', String(trips.filter((t) => t.status === 'Completed').length)],
                  ['In Transit Trips', String(trips.filter((t) => t.status === 'In Transit').length)],
                  ['Total Freight Revenue', `₹${totalRevenue.toLocaleString('en-IN')}`],
                  ['Total Advance Paid', `₹${totalAdvancePaid.toLocaleString('en-IN')}`],
                  ['Total Expenses', `₹${totalExpenses.toLocaleString('en-IN')}`],
                  ['Net Profit / Loss', `₹${net.toLocaleString('en-IN')}`],
                  ['Registered Drivers', String(drivers.length)],
                  ['Registered Vehicles', String(vehicles.length)],
                ] as Array<[string, string]>
              ).map(([label, val], i) => (
                <tr key={label} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                  <td className="border-b border-[#f0f0f0] px-4 py-2.5 text-[14px]">{label}</td>
                  <td className="border-b border-[#f0f0f0] px-4 py-2.5 text-[14px] font-bold">
                    {val}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, value, label, bg }: { icon: string; value: string; label: string; bg: string }): JSX.Element {
  return (
    <div className="rounded-md border-[1.5px] border-black px-5 py-4" style={{ backgroundColor: bg }}>
      <div className="mb-1.5 text-[24px]">{icon}</div>
      <div className="text-[28px] font-bold">{value}</div>
      <div className="mt-1 text-[13px] text-[#555]">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }): JSX.Element {
  return (
    <div className="rounded-md border-[1.5px] border-black bg-white p-5">
      <div className="mb-4 border-b-2 border-sendo-yellow pb-1.5 text-[14px] font-bold">{title}</div>
      {children}
    </div>
  );
}
