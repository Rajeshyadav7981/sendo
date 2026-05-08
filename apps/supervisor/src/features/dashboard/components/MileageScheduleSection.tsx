import { ScheduleConfigBadges } from './ScheduleConfigBadges';
import type { ScheduleConfig } from '@features/tracker/tracker.api';

interface Props {
  scheduleCfg: ScheduleConfig | null | undefined;
  lastClosingKm: number | null;
}

export function MileageScheduleSection({ scheduleCfg, lastClosingKm }: Props): JSX.Element {
  const expected = scheduleCfg?.kmActual != null ? Number(scheduleCfg.kmActual) : null;
  const actual = lastClosingKm != null ? Number(lastClosingKm) : null;
  const showBar = Boolean(expected && actual && expected > 0);
  const pct = showBar && expected && actual ? Math.min(100, Math.round((actual / expected) * 100)) : 0;

  return (
    <div>
      <ScheduleConfigBadges cfg={scheduleCfg} />
      {showBar && expected != null && actual != null ? (
        <div style={{ marginTop: '0.75rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: '#333',
              marginBottom: '0.35rem',
              fontWeight: 700,
            }}
          >
            Actual vs expected (closing km vs schedule actual)
          </div>
          <div className="emp-mileage-bar-wrap">
            <div className="emp-mileage-bar-fill" style={{ width: `${pct}%` }} />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.35rem',
              fontSize: '0.75rem',
              fontFamily: 'ui-monospace, monospace',
              color: '#111',
            }}
          >
            <span>Actual {actual.toLocaleString()} km</span>
            <span>Target {expected.toLocaleString()} km</span>
          </div>
        </div>
      ) : (
        <p className="sup-muted" style={{ margin: '0.65rem 0 0' }}>
          Bar appears when schedule has actual km and latest odometer reading exists.
        </p>
      )}
    </div>
  );
}
