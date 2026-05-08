interface StatItem {
  label: string;
  value: string;
}

interface Props {
  items: StatItem[];
}

const TONES = ['cyan', 'violet', 'amber', 'rose', 'sky', 'lime'] as const;

export function EmployeeStatCards({ items }: Props): JSX.Element {
  return (
    <div className="sup-emp-stats">
      {items.map(({ label, value }, idx) => (
        <div key={label} className={`sup-emp-stat tone-${TONES[idx % TONES.length]}`}>
          <div className="sup-emp-stat-top">{label}</div>
          <div className="sup-emp-stat-val">{value}</div>
        </div>
      ))}
    </div>
  );
}
