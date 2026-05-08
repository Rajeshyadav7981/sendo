import { type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '@shared/components/common/PageContainer';

interface Tile {
  label: string;
  path: string;
  icon: string;
}

const TILES: Tile[] = [
  { label: 'Vehicle Onboarding', path: '/vehicle-onboarding', icon: '🚛' },
  { label: 'Documents', path: '/vehicle-documents', icon: '📄' },
  { label: 'Truck Maintenance', path: '/truck-maintenance', icon: '🔧' },
  { label: 'Live Fleet Tracking', path: '/live-fleet-tracking', icon: '📍' },
  { label: 'Diesel', path: '/diesel', icon: '⛽' },
  { label: 'Expenses', path: '/expenses', icon: '💸' },
];

const tileBase: CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '28px 16px',
  textAlign: 'center',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
  border: '2px solid transparent',
  transition: 'all 0.15s',
};

export default function VehicleManagementPage(): JSX.Element {
  const nav = useNavigate();
  return (
    <PageContainer title="Vehicle Management">
      <div
        style={{
          padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '18px',
        }}
      >
        {TILES.map((t) => (
          <div
            key={t.path}
            onClick={() => nav(t.path)}
            style={tileBase}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#FFC107';
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.transform = '';
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>{t.icon}</div>
            <div style={{ fontWeight: 'bold', fontSize: 14, color: '#111' }}>{t.label}</div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
