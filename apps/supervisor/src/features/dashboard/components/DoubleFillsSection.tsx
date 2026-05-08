import type { FillRow } from '@features/tracker/tracker.api';

interface Props {
  fills: FillRow[];
}

export function DoubleFillsSection({ fills }: Props): JSX.Element {
  const rows = (fills ?? []).filter((f) => Boolean(f.fills && f.fills.length > 0));
  if (!rows.length) {
    return <p className="sup-muted">No multi-line fill rows for this period.</p>;
  }

  return (
    <div className="sup-emp-table-wrap">
      <table className="sup-emp-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Primary L</th>
            <th>Extra rows</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f, idx) => (
            <tr key={`${f.date}-${f.month}-${idx}`}>
              <td>{f.date}</td>
              <td>{f.litres}</td>
              <td>{(f.fills ?? []).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
