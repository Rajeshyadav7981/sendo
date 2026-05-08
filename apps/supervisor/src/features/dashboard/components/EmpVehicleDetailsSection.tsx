import type { VehicleDetails } from '@features/tracker/tracker.api';
import { useVehicleDetails } from '@features/tracker/tracker.hooks';
import { formatMonthLabel } from '@shared/lib/months';

interface Props {
  vehicle: string;
  anchorId?: string;
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function fmtDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function expiryStatus(value: string | null | undefined): {
  label: string;
  color: string;
} | null {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (!Number.isFinite(target)) return null;
  const days = Math.floor((target - Date.now()) / (24 * 60 * 60 * 1000));
  if (days < 0) return { label: 'Expired', color: '#dc2626' };
  if (days <= 30) return { label: `${days}d left`, color: '#d97706' };
  return null;
}

interface RowSpec {
  label: string;
  value: string;
  badge?: { label: string; color: string } | null;
  mono?: boolean;
}

function buildRows(v: VehicleDetails | undefined): RowSpec[][] {
  if (!v) return [];
  const text = (x: unknown): string => {
    if (x == null) return '—';
    const s = String(x).trim();
    return s === '' ? '—' : s;
  };
  return [
    [
      { label: 'Vehicle no.', value: text(v.vehicleNumber), mono: true },
      { label: 'Type', value: text(v.vehicleType) },
      { label: 'Owner', value: text(v.registerName) },
      { label: 'GVW', value: text(v.grossVehicleWeight) },
      { label: 'Fuel type', value: text(v.fuelType) },
    ],
    [
      { label: 'Registration', value: fmtDate(v.registrationDate) },
      {
        label: 'Fitness',
        value: fmtDate(v.fitnessValidUpto),
        badge: expiryStatus(v.fitnessValidUpto),
      },
      {
        label: 'Tax',
        value: fmtDate(v.taxValidUpto),
        badge: expiryStatus(v.taxValidUpto),
      },
      {
        label: 'Insurance',
        value: fmtDate(v.insuranceValidUpto),
        badge: expiryStatus(v.insuranceValidUpto),
      },
      {
        label: 'Pollution',
        value: fmtDate(v.pollutionValidUpto),
        badge: expiryStatus(v.pollutionValidUpto),
      },
    ],
    [
      { label: 'National permit', value: text(v.nationalPermit) },
      {
        label: 'Permit upto',
        value: fmtDate(v.permitUpto),
        badge: expiryStatus(v.permitUpto),
      },
      { label: 'State permit', value: text(v.statePermit) },
      {
        label: 'State permit upto',
        value: fmtDate(v.statePermitValidUpto),
        badge: expiryStatus(v.statePermitValidUpto),
      },
      { label: 'Temp. permit', value: text(v.temporaryPermit) },
    ],
    [
      { label: 'Chassis #', value: text(v.chassisNumber), mono: true },
      { label: 'Engine #', value: text(v.engineNumber), mono: true },
      { label: 'Schedule date', value: fmtDate(v.scheduleDate) },
      {
        label: 'Schedule month',
        value: v.scheduleDate
          ? formatMonthLabel(String(v.scheduleDate).slice(0, 7))
          : '—',
      },
    ],
    [
      {
        label: 'Refill interval',
        value: v.scheduleInterval != null ? `${v.scheduleInterval} days` : '—',
      },
      {
        label: 'Litres / fill',
        value: v.scheduleLitres != null ? `${v.scheduleLitres} L` : '—',
      },
      {
        label: 'KM / litre',
        value: v.scheduleKmPerLitre != null ? `${v.scheduleKmPerLitre} km/L` : '—',
      },
      {
        label: 'KM / fill',
        value: v.scheduleKmPerFill != null ? `${v.scheduleKmPerFill} km` : '—',
      },
      {
        label: 'Odometer KM',
        value: v.scheduleKmActual != null ? `${v.scheduleKmActual} km` : '—',
      },
    ],
  ];
}

export function EmpVehicleDetailsSection({ vehicle, anchorId }: Props): JSX.Element | null {
  const query = useVehicleDetails(vehicle);

  if (!vehicle) return null;

  if (query.isLoading) {
    return (
      <div className="sup-panel" id={anchorId}>
        <h2 className="sup-panel-title">🚛 Vehicle details</h2>
        <p className="sup-muted">Loading vehicle details…</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="sup-panel" id={anchorId}>
        <h2 className="sup-panel-title">🚛 Vehicle details</h2>
        <p className="sup-muted">
          No admin onboarding details found for {vehicle}. Ask the admin to add this vehicle in
          the Vehicle Onboarding screen.
        </p>
      </div>
    );
  }

  const rowGroups = buildRows(query.data);
  const remarks = query.data.remarks ?? '';

  return (
    <div className="sup-panel" id={anchorId}>
      <h2 className="sup-panel-title">🚛 Vehicle details</h2>
      <p className="sup-panel-desc">
        Onboarded by admin · last updated{' '}
        {fmtDate(String((query.data as Record<string, unknown>).updatedAt ?? ''))}
      </p>

      <div className="sup-emp-table-wrap" style={{ marginTop: '0.75rem' }}>
        <table className="sup-emp-table">
          <tbody>
            {rowGroups.map((rows, gi) => (
              <tr key={gi}>
                {rows.map((cell) => (
                  <td
                    key={cell.label}
                    style={{
                      verticalAlign: 'top',
                      padding: '0.55rem 0.75rem',
                      minWidth: '160px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: '#737373',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {cell.label}
                    </div>
                    <div
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        marginTop: '2px',
                        fontFamily: cell.mono
                          ? 'ui-monospace, SFMono-Regular, monospace'
                          : undefined,
                      }}
                    >
                      {cell.value}
                      {cell.badge ? (
                        <span
                          style={{
                            marginLeft: '6px',
                            display: 'inline-block',
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            color: '#fff',
                            backgroundColor: cell.badge.color,
                          }}
                        >
                          {cell.badge.label}
                        </span>
                      ) : null}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {remarks ? (
        <div
          style={{
            marginTop: '0.75rem',
            padding: '0.65rem 0.85rem',
            backgroundColor: '#fffdf2',
            border: '1px solid #FFC107',
            borderRadius: '4px',
            fontSize: '0.8125rem',
          }}
        >
          <strong>Remarks:</strong> {remarks}
        </div>
      ) : null}
    </div>
  );
}
