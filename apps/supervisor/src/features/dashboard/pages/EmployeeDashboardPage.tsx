import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useFillMonths,
  useFills,
  useOdometerReadings,
  useScheduleForVehicle,
  useVehicles,
} from '@features/tracker/tracker.hooks';
import {
  daysInCalendarMonth,
  dayOfMonthFromFillDate,
  mergeTrackerMonthOptions,
  mergeTrackerYearOptions,
} from '@shared/lib/months';
import { formatTrackerRequestError } from '@shared/api/client';
import { useAuthStore } from '@store/auth.store';
import type { FillRow, ScheduleConfig } from '@features/tracker/tracker.api';
import { EmployeeNavbar } from '../components/EmployeeNavbar';
import { EmployeeSidebar } from '../components/EmployeeSidebar';
import { EmployeeStatCards } from '../components/EmployeeStatCards';
import { VehicleMonthFilters } from '../components/VehicleMonthFilters';
import { FillsTable } from '../components/FillsTable';
import { OdometerForm } from '../components/OdometerForm';
import { EscalationForm } from '../components/EscalationForm';
import { EmpVehicleHeader } from '../components/EmpVehicleHeader';
import { EmpVehicleDetailsSection } from '../components/EmpVehicleDetailsSection';
import { FillCalendarStrip } from '../components/FillCalendarStrip';
import { DoubleFillsSection } from '../components/DoubleFillsSection';
import { ScheduleStatusMini } from '../components/ScheduleStatusMini';
import { MileageScheduleSection } from '../components/MileageScheduleSection';

type NavKey = 'overview' | 'odometer' | 'escalation';

function formatNum(n: number): string {
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function applyFillRowFilters(
  rows: FillRow[],
  fillStatus: string,
  filledBy: string,
): FillRow[] {
  let r = rows ?? [];
  if (fillStatus === 'active') {
    r = r.filter((x) => Number(x.litres) > 0);
  }
  if (fillStatus === 'inactive') {
    r = r.filter((x) => Number(x.litres) <= 0);
  }
  const fb = (filledBy ?? '').trim().toLowerCase();
  if (fb) {
    r = r.filter(
      (x) =>
        String(x.paidBy ?? '').toLowerCase() === fb ||
        String(x.driver ?? '').toLowerCase() === fb ||
        String(x.paidBy ?? '').toLowerCase().includes(fb) ||
        String(x.driver ?? '').toLowerCase().includes(fb),
    );
  }
  return r;
}

function buildScheduleLabel(cfg: ScheduleConfig | null | undefined): string {
  const obj = cfg && typeof cfg === 'object' ? cfg : null;
  const hasCfg =
    obj &&
    (['interval', 'ltrsPerFill', 'kmPerLitre', 'kmPerFill', 'kmActual'] as const).some(
      (k) => obj[k] != null,
    );
  if (!obj || !hasCfg) return 'No schedule row for this vehicle.';
  const parts = [
    obj.interval != null ? `every ${obj.interval}d` : null,
    obj.ltrsPerFill != null ? `${obj.ltrsPerFill} L/fill` : null,
    obj.kmPerLitre != null ? `${obj.kmPerLitre} km/L` : null,
    obj.kmPerFill != null ? `~${obj.kmPerFill} km/fill` : null,
  ].filter(Boolean);
  return parts.join(' · ') || 'Configured';
}

export default function EmployeeDashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const clearSession = useAuthStore((s) => s.clearSession);
  const [navHighlight, setNavHighlight] = useState<NavKey>('overview');
  const [vehicle, setVehicle] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [fillStatus, setFillStatus] = useState('');
  const [filledBy, setFilledBy] = useState('');

  const vehiclesQuery = useVehicles();
  const monthsQuery = useFillMonths();
  const fillsQuery = useFills({ vehicle, month }, Boolean(vehicle && month));
  const scheduleQuery = useScheduleForVehicle(vehicle);
  const odoQuery = useOdometerReadings(vehicle, 1, 50);

  const vehicles = vehiclesQuery.data ?? [];
  const months = useMemo(() => mergeTrackerMonthOptions(monthsQuery.data ?? []), [monthsQuery.data]);

  const bootError = useMemo(() => {
    const parts: string[] = [];
    const detailLines: string[] = [];
    if (vehiclesQuery.error) {
      parts.push('vehicles');
      detailLines.push(`Vehicles: ${formatTrackerRequestError(vehiclesQuery.error)}`);
    }
    if (monthsQuery.error) {
      parts.push('months index');
      detailLines.push(`Months: ${formatTrackerRequestError(monthsQuery.error)}`);
    }
    if (!parts.length) return null;
    return [
      `Could not load ${parts.join(' and ')}.`,
      ...detailLines,
      'Set VITE_API_BASE in .env and restart npm run dev.',
      'Month list uses offline defaults when the months API fails.',
    ].join('\n');
  }, [vehiclesQuery.error, monthsQuery.error]);

  const fills = useMemo(() => {
    const rows = fillsQuery.data ?? [];
    return [...rows].sort((a, b) => {
      const da = `${a.month ?? ''}-${a.date ?? ''}`;
      const db = `${b.month ?? ''}-${b.date ?? ''}`;
      return da.localeCompare(db);
    });
  }, [fillsQuery.data]);

  const lastClosingKm = useMemo(() => {
    const arr = odoQuery.data?.items ?? [];
    const max = arr.reduce((m, r) => Math.max(m, Number(r.reading) || 0), 0);
    return max > 0 ? max : null;
  }, [odoQuery.data]);

  useEffect(() => {
    if (!month && months.length) {
      setMonth(months[months.length - 1] ?? '');
    } else if (month && !months.includes(month) && months.length) {
      setMonth(months[months.length - 1] ?? '');
    }
  }, [months, month]);

  const years = useMemo(() => mergeTrackerYearOptions(months), [months]);

  const monthsForYear = useMemo(() => {
    if (!year) return months;
    return months.filter((m) => String(m).endsWith(`-${year}`));
  }, [months, year]);

  useEffect(() => {
    if (year && monthsForYear.length === 0) {
      setYear('');
    }
  }, [year, monthsForYear]);

  useEffect(() => {
    if (month && !monthsForYear.includes(month)) {
      setMonth(monthsForYear[monthsForYear.length - 1] ?? '');
    }
  }, [month, monthsForYear]);

  const paidByOptions = useMemo(() => {
    const s = new Set<string>();
    fills.forEach((f) => {
      if (f.paidBy && String(f.paidBy).trim()) s.add(String(f.paidBy).trim());
      if (f.driver && String(f.driver).trim()) s.add(String(f.driver).trim());
    });
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [fills]);

  const displayFills = useMemo(
    () => applyFillRowFilters(fills, fillStatus, filledBy),
    [fills, fillStatus, filledBy],
  );

  const scheduleLabel = useMemo(() => {
    if (!vehicle) return '';
    if (scheduleQuery.error) return 'Could not load schedule.';
    return buildScheduleLabel(scheduleQuery.data);
  }, [vehicle, scheduleQuery.data, scheduleQuery.error]);

  const stats = useMemo(() => {
    const shownFills = displayFills;
    const n = shownFills.length;
    const sumL = shownFills.reduce((a, r) => a + (Number(r.litres) || 0), 0);
    const sumA = shownFills.reduce((a, r) => a + (Number(r.amount) || 0), 0);
    const dim = vehicle && month ? daysInCalendarMonth(month) : 0;
    const uniqueDates = new Set<number>();
    shownFills.forEach((r) => {
      const d = month ? dayOfMonthFromFillDate(r.date, month) : null;
      if (d != null) uniqueDates.add(d);
    });
    const daysNot = dim > 0 ? String(Math.max(0, dim - uniqueDates.size)) : '—';
    const avgPer = n > 0 ? `${formatNum(sumL / n)}L` : '—';
    return [
      { label: 'Total fills', value: String(n) },
      { label: 'Total litres', value: `${formatNum(sumL)}L` },
      { label: 'Total amount', value: `₹${formatNum(sumA)}` },
      { label: 'Days not filled', value: daysNot },
      { label: 'Avg per fill', value: avgPer },
      { label: 'Early fills', value: '—' },
    ];
  }, [displayFills, vehicle, month]);

  const onClearFilters = (): void => {
    setVehicle('');
    setMonth(monthsForYear[monthsForYear.length - 1] ?? months[months.length - 1] ?? '');
    setYear('');
    setFillStatus('');
    setFilledBy('');
  };

  const scrollToId = useCallback((id: string, highlight: NavKey): void => {
    setNavHighlight(highlight);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const onSwitchVehicle = (): void => {
    setVehicle('');
    setNavHighlight('overview');
    scrollToId('sup-emp-filters', 'overview');
  };

  const onNavOverview = (): void => {
    setNavHighlight('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onNavOdometer = (): void => scrollToId('sup-emp-odo', 'odometer');
  const onNavEscalation = (): void => scrollToId('sup-emp-esc', 'escalation');

  const onLogout = (): void => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="sup-dash sup-emp-shell sup-emp-theme-sendo">
      <EmployeeSidebar
        navHighlight={navHighlight}
        onNavOverview={onNavOverview}
        onNavOdometer={onNavOdometer}
        onNavEscalation={onNavEscalation}
        selectedVehicle={vehicle}
        onLogout={onLogout}
        onSwitchVehicle={onSwitchVehicle}
      />

      <div className="sup-emp-content">
        <EmployeeNavbar meta="Supervisor" />

        <main style={{ padding: '1rem' }}>
          {bootError ? (
            <p className="sup-error" role="alert">
              {bootError}
            </p>
          ) : null}

          <div id="sup-emp-filters">
            <VehicleMonthFilters
              vehicleCount={vehicles.length}
              months={monthsForYear}
              years={years}
              vehicleValue={vehicle}
              monthValue={month}
              yearValue={year}
              fillStatus={fillStatus}
              filledBy={filledBy}
              paidByOptions={paidByOptions}
              onVehicleChange={setVehicle}
              onMonthChange={setMonth}
              onYearChange={setYear}
              onFillStatusChange={setFillStatus}
              onFilledByChange={setFilledBy}
              onClear={onClearFilters}
            />
          </div>
          {fillsQuery.error ? (
            <p className="sup-error" role="alert">
              Failed to load fills.
            </p>
          ) : null}

          <EmpVehicleHeader
            vehicle={vehicle}
            monthKey={month}
            fills={fills}
            scheduleHint={scheduleLabel}
          />

          {vehicle ? (
            <EmpVehicleDetailsSection vehicle={vehicle} anchorId="sup-emp-vehicle-details" />
          ) : null}

          <div className="stats-row">
            <EmployeeStatCards items={stats} />
          </div>

          <div className="emp-html-section" id="sup-emp-sched-status">
            <h2 className="emp-html-section-title">📋 Schedule status</h2>
            <ScheduleStatusMini monthKey={month} fills={fills} />
          </div>

          <div className="emp-html-section" id="sup-emp-mileage">
            <h2 className="emp-html-section-title">📋 Schedule config · mileage</h2>
            <MileageScheduleSection scheduleCfg={scheduleQuery.data} lastClosingKm={lastClosingKm} />
          </div>

          <div className="emp-html-section" id="sup-emp-fill-strip">
            <h2 className="emp-html-section-title">📅 Fill calendar strip</h2>
            <FillCalendarStrip monthKey={month} fills={fills} onRaiseEscalation={onNavEscalation} />
          </div>

          <div className="emp-html-section" id="sup-emp-double-fills">
            <h2 className="emp-html-section-title">⚡ Double fills</h2>
            <DoubleFillsSection fills={fills} />
          </div>

          <div className="sup-panel" style={{ marginBottom: '1rem' }}>
            <h2 className="sup-panel-title">Fills detail</h2>
            <FillsTable
              fills={displayFills}
              loading={fillsQuery.isFetching}
              emptyHint={
                vehicle && month
                  ? 'No fills for this vehicle/month.'
                  : 'Pick vehicle and month to load rows.'
              }
            />
          </div>

          <OdometerForm anchorId="sup-emp-odo" title="🔢 Odometer readings" vehicle={vehicle} />

          <EscalationForm anchorId="sup-emp-esc" title="🚨 Escalation" vehicle={vehicle} />
        </main>
      </div>
    </div>
  );
}
