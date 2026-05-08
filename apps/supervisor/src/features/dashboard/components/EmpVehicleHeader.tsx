import type { FillRow } from '@features/tracker/tracker.api';
import { formatMonthLabel } from '@shared/lib/months';

interface Props {
  vehicle: string;
  monthKey: string;
  fills: FillRow[];
  scheduleHint: string;
}

export function EmpVehicleHeader({ vehicle, monthKey, fills, scheduleHint }: Props): JSX.Element {
  const first = fills.length > 0 ? fills[0] : null;
  const driverLine = first
    ? [first.driver, first.paidBy].filter(Boolean).join(' · ')
    : '—';

  return (
    <div className="emp-html-header">
      <div className="emp-html-header-top">
        <div className="emp-html-header-month">
          {monthKey ? formatMonthLabel(monthKey) : '—'}
        </div>
        <div className="emp-html-header-veh">{vehicle || 'Select vehicle'}</div>
      </div>
      <div className="emp-html-header-sub">{driverLine}</div>
      {scheduleHint ? (
        <div
          className="emp-html-header-sched"
          style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#444' }}
        >
          {scheduleHint}
        </div>
      ) : null}
    </div>
  );
}
