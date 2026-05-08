import { useNavigate } from 'react-router-dom';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';

const TILES: { label: string; path: string; icon: string; desc: string }[] = [
  { label: 'Employee List', path: '/employee-list', icon: '👥', desc: 'View & manage all employees' },
  { label: 'Add Employee', path: '/employee-add', icon: '➕', desc: 'Register a new employee' },
  { label: 'Set Passwords', path: '/employee-passwords', icon: '🔒', desc: 'Manage employee login passwords' },
  { label: 'Attendance Approvals', path: '/employee-attendance', icon: '📅', desc: 'Approve or reject attendance' },
  { label: 'Attendance Records', path: '/employee-att-records', icon: '📋', desc: 'View historical attendance' },
  { label: 'Leave Requests', path: '/employee-leave', icon: '🏖️', desc: 'Manage employee leaves' },
  { label: 'Advance Requests', path: '/employee-advance', icon: '💰', desc: 'Advance approval & records' },
  { label: 'Salary', path: '/employee-salary', icon: '💵', desc: 'Payroll & salary processing' },
  { label: 'Deduction', path: '/employee-deduction', icon: '📉', desc: 'Track employee deductions' },
  { label: 'Escalations', path: '/employee-escalations', icon: '🚨', desc: 'View & resolve escalations' },
  { label: 'Schedule Config', path: '/employee-schedule', icon: '⏱️', desc: 'Set fill & shift schedules' },
  { label: 'Timesheet', path: '/employee-timesheet', icon: '⏰', desc: 'Duty hours tracking' },
];

export default function EmployeeManagementPage(): JSX.Element {
  const nav = useNavigate();
  return (
    <SendoLegacyPage title="Employee Management">
      <div
        style={{
          padding: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18,
        }}
      >
        {TILES.map((t) => (
          <div
            key={t.path}
            onClick={() => nav(t.path)}
            style={{
              backgroundColor: '#fff',
              borderRadius: 8,
              padding: '28px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              border: '2px solid transparent',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FFC107';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.transform = '';
            }}
          >
            <div style={{ fontSize: 34, marginBottom: 8 }}>{t.icon}</div>
            <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 5, color: '#111' }}>
              {t.label}
            </div>
            <div style={{ fontSize: 11, color: '#888' }}>{t.desc}</div>
          </div>
        ))}
      </div>
    </SendoLegacyPage>
  );
}
