import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useDrivers } from '@features/drivers/drivers.hooks';
import { useVehicles, useLiveLocations } from '@features/vehicles/vehicles.hooks';

const COLORS = ['#28a745', '#dc3545'];

function driverDisplayName(d: Record<string, unknown>): string {
  const surname =
    d.surname && String(d.surname).toLowerCase() !== 'null' ? String(d.surname) : '';
  const parts = [d.firstName, d.secondName, surname]
    .filter((p): p is string => typeof p === 'string' && !!p)
    .map((p) => p.trim());
  const joined = parts.join(' ').trim();
  return joined || '—';
}

export default function HomePage(): JSX.Element {
  const vehiclesQ = useVehicles();
  const driversQ = useDrivers();
  const locationsQ = useLiveLocations();

  const [query, setQuery] = useState('');
  const [stoppedCount, setStoppedCount] = useState(0);
  const [movingCount, setMovingCount] = useState(0);
  const [trackedCount, setTrackedCount] = useState(0);

  useEffect(() => {
    const data = locationsQ.data;
    if (!Array.isArray(data) || data.length === 0) return;
    const stopped = data.filter((v) => Number((v as { speed?: number }).speed) === 0).length;
    const moving = data.filter((v) => Number((v as { speed?: number }).speed) > 0).length;
    setStoppedCount(stopped);
    setMovingCount(moving);
    setTrackedCount(data.length);
  }, [locationsQ.data]);

  const fleetRecords = (vehiclesQ.data ?? []) as Record<string, unknown>[];
  const driversList = (driversQ.data ?? []) as Record<string, unknown>[];
  const fleetLoading = vehiclesQ.isLoading || driversQ.isLoading;

  const q = query.trim().toLowerCase();

  const filteredVehicles = useMemo(() => {
    const list = [...fleetRecords].sort((a, b) =>
      String(a.vehicleNumber ?? '').localeCompare(String(b.vehicleNumber ?? ''), undefined, {
        numeric: true,
      }),
    );
    if (!q) return list;
    return list.filter((v) => {
      const hay = [v.vehicleNumber, v.registerName, v.vehicleType]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [fleetRecords, q]);

  const filteredDrivers = useMemo(() => {
    const list = [...driversList].sort((a, b) =>
      String(a.driverId ?? '').localeCompare(String(b.driverId ?? ''), undefined, { numeric: true }),
    );
    if (!q) return list;
    return list.filter((d) => {
      const hay = [d.driverId, driverDisplayName(d), d.contactNumber]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [driversList, q]);

  const pieData = [
    { name: 'Moving', value: movingCount },
    { name: 'Stopped', value: stoppedCount },
  ].filter((d) => d.value > 0);

  return (
    <div className="sendo-page">
      <h2 className="sendo-heading">Home — Fleet & drivers</h2>

      <div className="px-5 pb-8 pt-4">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search vehicles or drivers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-[220px] max-w-[360px] flex-1 rounded border-[1.5px] border-black px-2.5 py-2 text-[13px]"
          />
          <Link to="/monthly-data-entry" className="text-[13px] font-semibold text-[#0066cc]">
            Monthly diesel spreadsheet →
          </Link>
          <Link to="/vehicle-onboarding" className="text-[13px] font-semibold text-[#0066cc]">
            Vehicle Management →
          </Link>
          <Link to="/driver-onboarding" className="text-[13px] font-semibold text-[#0066cc]">
            Driver Management →
          </Link>
        </div>

        <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
          {[
            { lbl: 'Vehicles (onboarded)', val: fleetRecords.length },
            { lbl: 'Drivers (onboarded)', val: driversList.length },
          ].map((s) => (
            <div
              key={s.lbl}
              className="rounded border-[1.5px] border-t-4 border-black border-t-sendo-yellow bg-white px-4 py-3.5"
            >
              <div className="font-mono text-[1.35rem] font-bold">{s.val}</div>
              <div className="mt-1.5 text-[11px] uppercase tracking-wider text-[#555]">{s.lbl}</div>
            </div>
          ))}
        </div>

        {fleetLoading ? (
          <p className="text-[#555]">Loading vehicles and drivers…</p>
        ) : (
          <div
            className="grid items-start gap-4"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' }}
          >
            <section className="overflow-hidden rounded border-[1.5px] border-black bg-white">
              <div className="border-b border-[#e0e0e0] bg-[#fafafa] px-3.5 py-2.5 text-[13px] font-bold">
                Vehicles
              </div>
              <div className="max-h-[360px] overflow-auto">
                {filteredVehicles.length === 0 ? (
                  <div className="p-4 text-[13px] text-[#555]">
                    No vehicles match.{' '}
                    <Link to="/vehicle-onboarding" className="text-[#0066cc]">
                      Add in Vehicle Management
                    </Link>
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="bg-black px-2 py-2.5 text-left text-[11px] font-bold text-white">
                          Vehicle no.
                        </th>
                        <th className="bg-black px-2 py-2.5 text-left text-[11px] font-bold text-white">
                          Owner / register
                        </th>
                        <th className="bg-black px-2 py-2.5 text-left text-[11px] font-bold text-white">
                          Type
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVehicles.map((v, i) => (
                        <tr
                          key={String(v.id ?? v.vehicleNumber ?? i)}
                          className={i % 2 ? 'bg-[#fafafa]' : 'bg-white'}
                        >
                          <td className="border border-[#e0e0e0] p-2 text-[12px] font-bold" style={{ fontFamily: 'ui-monospace, monospace' }}>
                            {String(v.vehicleNumber ?? '—')}
                          </td>
                          <td className="border border-[#e0e0e0] p-2 text-[12px]">
                            {String(v.registerName ?? '—')}
                          </td>
                          <td className="border border-[#e0e0e0] p-2 text-[12px]">
                            {String(v.vehicleType ?? '—')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded border-[1.5px] border-black bg-white">
              <div className="border-b border-[#e0e0e0] bg-[#fafafa] px-3.5 py-2.5 text-[13px] font-bold">
                Drivers
              </div>
              <div className="max-h-[360px] overflow-auto">
                {filteredDrivers.length === 0 ? (
                  <div className="p-4 text-[13px] text-[#555]">
                    No drivers match.{' '}
                    <Link to="/driver-onboarding" className="text-[#0066cc]">
                      Add in Driver Management
                    </Link>
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="bg-black px-2 py-2.5 text-left text-[11px] font-bold text-white">
                          Driver ID
                        </th>
                        <th className="bg-black px-2 py-2.5 text-left text-[11px] font-bold text-white">
                          Name
                        </th>
                        <th className="bg-black px-2 py-2.5 text-left text-[11px] font-bold text-white">
                          Contact
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDrivers.map((d, i) => (
                        <tr
                          key={String(d.id ?? d.driverId ?? i)}
                          className={i % 2 ? 'bg-[#fafafa]' : 'bg-white'}
                        >
                          <td className="border border-[#e0e0e0] p-2 text-[12px] font-bold" style={{ fontFamily: 'ui-monospace, monospace' }}>
                            {String(d.driverId ?? '—')}
                          </td>
                          <td className="border border-[#e0e0e0] p-2 text-[12px]">
                            {driverDisplayName(d)}
                          </td>
                          <td className="border border-[#e0e0e0] p-2 text-[12px]">
                            {String(d.contactNumber ?? '—')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        )}

        <div className="mt-7 border-t-2 border-[#e0e0e0] pt-5">
          <h3 className="mb-3 text-[17px]">Live fleet overview</h3>
          <p className="mb-3 -mt-1.5 text-[12px] text-[#555]">
            From GPS / tracking (<code>/vehicle/fetch-locations</code>), not onboarding.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-wrap gap-4">
              <div className="rounded-md border border-black px-4 py-2.5">
                Moving: <strong>{movingCount}</strong>
              </div>
              <div className="rounded-md border border-black px-4 py-2.5">
                Stopped: <strong>{stoppedCount}</strong>
              </div>
              <div className="rounded-md border border-black px-4 py-2.5">
                Tracked units: <strong>{trackedCount}</strong>
              </div>
            </div>
            {pieData.length > 0 ? (
              <div className="h-[220px] w-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <span className="text-[#888]">No moving/stopped breakdown loaded yet.</span>
            )}
            <Link to="/live-fleet-tracking" className="font-semibold text-[#0066cc]">
              Open full live fleet map →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
