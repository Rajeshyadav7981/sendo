import { daysInCalendarMonth, dayOfMonthFromFillDate } from '@shared/lib/months';
import type { FillRow } from '@features/tracker/tracker.api';

interface Props {
  monthKey: string;
  fills: FillRow[];
  onRaiseEscalation?: () => void;
}

export function FillCalendarStrip({ monthKey, fills, onRaiseEscalation }: Props): JSX.Element {
  const dim = monthKey ? daysInCalendarMonth(monthKey) : 0;
  const filledDays = new Set<number>();
  (fills ?? []).forEach((f) => {
    const d = dayOfMonthFromFillDate(f.date, monthKey);
    if (d != null && (Number(f.litres) > 0 || (f.fills && f.fills.length))) filledDays.add(d);
  });

  if (!dim) {
    return <p className="sup-muted">Pick a month to show the fill calendar strip.</p>;
  }

  const cells = [];
  for (let d = 1; d <= dim; d++) {
    const on = filledDays.has(d);
    cells.push(
      <div key={d} className={`emp-fill-cell ${on ? 'on' : 'off'}`} title={`Day ${d}`}>
        {d}
      </div>,
    );
  }

  return (
    <div>
      <div className="emp-fill-strip">{cells}</div>
      <div className="emp-fill-legend">
        <span>
          <span className="emp-dot green" /> On schedule
        </span>
        <span>
          <span className="emp-dot red" /> Too early
        </span>
        <span>
          <span className="emp-dot amber" /> Missed fill
        </span>
        <span>
          <span className="emp-dot blue" /> Filled (no schedule)
        </span>
      </div>
      {onRaiseEscalation ? (
        <div className="emp-esc-jump">
          <button type="button" className="sup-btn sup-btn-outline" onClick={onRaiseEscalation}>
            🚨 Raise escalation
          </button>
        </div>
      ) : null}
    </div>
  );
}
