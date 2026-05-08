import { daysInCalendarMonth, dayOfMonthFromFillDate } from '@shared/lib/months';
import type { FillRow } from '@features/tracker/tracker.api';

interface Props {
  monthKey: string;
  fills: FillRow[];
}

export function ScheduleStatusMini({ monthKey, fills }: Props): JSX.Element {
  const dim = monthKey ? daysInCalendarMonth(monthKey) : 0;
  const filled = new Set<number>();
  (fills ?? []).forEach((f) => {
    const d = dayOfMonthFromFillDate(f.date, monthKey);
    if (d != null && Number(f.litres) > 0) filled.add(d);
  });
  const fillDays = filled.size;
  const notFilled: string = dim > 0 ? String(Math.max(0, dim - fillDays)) : '—';

  return (
    <table className="emp-html-mini-table">
      <tbody>
        <tr>
          <td>Days in month</td>
          <td>{dim || '—'}</td>
        </tr>
        <tr>
          <td>Days with fill</td>
          <td>{monthKey ? String(fillDays) : '—'}</td>
        </tr>
        <tr>
          <td>Days without fill</td>
          <td>{notFilled}</td>
        </tr>
      </tbody>
    </table>
  );
}
