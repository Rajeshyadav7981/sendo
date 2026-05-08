import type { ScheduleConfig } from '@features/tracker/tracker.api';

interface Props {
  cfg: ScheduleConfig | null | undefined;
}

export function ScheduleConfigBadges({ cfg }: Props): JSX.Element {
  const c = cfg && typeof cfg === 'object' ? cfg : null;
  const has =
    c &&
    (['interval', 'ltrsPerFill', 'kmPerLitre', 'kmPerFill', 'kmActual'] as const).some(
      (k) => c[k] != null,
    );

  if (!has || !c) {
    return <p className="sup-muted">No schedule row for this vehicle.</p>;
  }

  const chips: { key: string; label: string; hint: string }[] = [];
  if (c.interval != null) chips.push({ key: 'int', label: `${c.interval}d`, hint: 'Refill every' });
  if (c.ltrsPerFill != null)
    chips.push({ key: 'ltr', label: `${c.ltrsPerFill}L`, hint: 'Litres / fill' });
  if (c.kmPerLitre != null)
    chips.push({ key: 'kpl', label: `${c.kmPerLitre} km/L`, hint: 'KM per litre' });
  if (c.kmPerFill != null)
    chips.push({ key: 'kpf', label: `${c.kmPerFill} km`, hint: 'Expected / fill' });
  if (c.kmActual != null) {
    chips.push({
      key: 'kpa',
      label: `${Number(c.kmActual).toLocaleString()} km`,
      hint: 'Actual mileage',
    });
  }

  return (
    <div className="sup-emp-schedule-badges">
      {chips.map(({ key, label, hint }) => (
        <div key={key} className="sup-emp-schedule-chip" title={hint}>
          <span className="sup-emp-schedule-chip-val">{label}</span>
          <span className="sup-emp-schedule-chip-hint">{hint}</span>
        </div>
      ))}
    </div>
  );
}
