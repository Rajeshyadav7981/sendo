import { type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';

interface Tile {
  label: string;
  path: string;
  icon: string;
  desc: string;
}

const TILES: Tile[] = [
  { label: 'Driver Onboarding', path: '/driver-onboarding', icon: '👤', desc: 'Register & manage drivers' },
  { label: 'Attendance', path: '/driver-attendance-approval', icon: '📅', desc: 'Mark & approve attendance' },
  { label: 'Attendance Records', path: '/attendance-records', icon: '📋', desc: 'View historical records' },
  { label: 'Leave Requests', path: '/driver-leave-admin', icon: '🏖️', desc: 'Manage driver leaves' },
  { label: 'Advance', path: '/driver-advance', icon: '💰', desc: 'Driver advance requests' },
  { label: 'Salary', path: '/driver-salary', icon: '💵', desc: 'Payroll & salary processing' },
  { label: 'Deduction', path: '/driver-deduction', icon: '📉', desc: 'Track driver deductions' },
  { label: 'Driver Timesheet', path: '/driver-timeSheet', icon: '⏱️', desc: 'Duty hours tracking' },
  { label: 'Live Tracking', path: '/driver-liveTracking', icon: '📍', desc: 'Real-time driver location' },
];

export default function DriverManagementPage(): JSX.Element {
  const nav = useNavigate();

  const s: Record<string, CSSProperties> = {
    sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#000', marginBottom: '4px' },
    sectionDivider: { border: 'none', borderTop: '2px solid #FFC107', marginBottom: '20px' },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '18px',
    },
    tile: {
      backgroundColor: '#fff',
      border: '1.5px solid #000',
      padding: '28px 16px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.15s',
    },
    tileIcon: { fontSize: '34px', marginBottom: '10px' },
    tileLabel: {
      fontWeight: 700,
      fontSize: '13px',
      marginBottom: '6px',
      color: '#000',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    },
    tileDesc: { fontSize: '12px', color: '#555' },
  };

  return (
    <SendoLegacyPage title="Driver Management">
      <div style={s.sectionTitle}>Modules</div>
      <hr style={s.sectionDivider} />
      <div style={s.grid}>
        {TILES.map((t) => (
          <div
            key={t.path}
            style={s.tile}
            onClick={() => nav(t.path)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#FFC107';
              e.currentTarget.style.borderColor = '#FFC107';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#000000';
            }}
          >
            <div style={s.tileIcon}>{t.icon}</div>
            <div style={s.tileLabel}>{t.label}</div>
            <div style={s.tileDesc}>{t.desc}</div>
          </div>
        ))}
      </div>
    </SendoLegacyPage>
  );
}
