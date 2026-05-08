type NavKey = 'overview' | 'odometer' | 'escalation';

interface Props {
  navHighlight: NavKey;
  onNavOverview: () => void;
  onNavOdometer: () => void;
  onNavEscalation: () => void;
  selectedVehicle: string;
  onLogout: () => void;
  onSwitchVehicle: () => void;
}

export function EmployeeSidebar({
  navHighlight,
  onNavOverview,
  onNavOdometer,
  onNavEscalation,
  selectedVehicle,
  onLogout,
  onSwitchVehicle,
}: Props): JSX.Element {
  return (
    <aside className="sup-emp-sidebar-wrap">
      <div className="sup-emp-logo">
        <div className="sup-emp-logo-badge">S</div>
        <div>
          <div className="sup-emp-logo-title">Sendo Tracker</div>
          <div className="sup-emp-logo-sub">Fleet dashboard</div>
        </div>
      </div>
      <div className="sup-emp-identity">
        <div className="sup-emp-identity-label">Logged in as</div>
        <div className="sup-emp-identity-vehicle">{selectedVehicle || 'No vehicle selected'}</div>
        <div className="sup-emp-identity-role">Employee</div>
      </div>
      <div className="sup-emp-brand">Actions</div>
      <div className="sup-emp-quick-actions">
        <button type="button" onClick={onSwitchVehicle}>
          🔄 Switch vehicle
        </button>
      </div>
      <div className="sup-emp-brand">Navigate</div>
      <nav className="sup-emp-nav">
        <button
          type="button"
          className={navHighlight === 'overview' ? 'active' : ''}
          onClick={onNavOverview}
        >
          📊 Overview
        </button>
        <button
          type="button"
          className={navHighlight === 'odometer' ? 'active' : ''}
          onClick={onNavOdometer}
        >
          🔢 Odometer
        </button>
        <button
          type="button"
          className={navHighlight === 'escalation' ? 'active' : ''}
          onClick={onNavEscalation}
        >
          🚨 Escalation
        </button>
      </nav>
      <button type="button" className="sup-emp-logout" onClick={onLogout}>
        ⏻ Logout
      </button>
    </aside>
  );
}
