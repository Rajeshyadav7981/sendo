import { VehicleSearchSelect } from './VehicleSearchSelect';
import { formatMonthLabel } from '@shared/lib/months';

interface Props {
  vehicleCount?: number;
  months: string[];
  years: string[];
  vehicleValue: string;
  monthValue: string;
  yearValue: string;
  fillStatus: string;
  filledBy: string;
  paidByOptions: string[];
  onVehicleChange: (v: string) => void;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
  onFillStatusChange: (v: string) => void;
  onFilledByChange: (v: string) => void;
  onClear: () => void;
}

export function VehicleMonthFilters({
  vehicleCount,
  months,
  years,
  vehicleValue,
  monthValue,
  yearValue,
  fillStatus,
  filledBy,
  paidByOptions,
  onVehicleChange,
  onMonthChange,
  onYearChange,
  onFillStatusChange,
  onFilledByChange,
  onClear,
}: Props): JSX.Element {
  return (
    <div className="sup-panel emp-html-bar" style={{ marginBottom: '1rem' }}>
      <div className="sup-emp-filters">
        <div className="sup-emp-field">
          <label htmlFor="emp-vehicle-select">
            Vehicle{vehicleCount ? ` (${vehicleCount})` : ''}
          </label>
          <VehicleSearchSelect
            id="emp-vehicle-select"
            value={vehicleValue}
            onChange={onVehicleChange}
            placeholder="Type to search vehicles…"
          />
        </div>
        <div className="sup-emp-field">
          <label htmlFor="emp-month">Month</label>
          <select
            id="emp-month"
            value={monthValue}
            onChange={(e) => onMonthChange(e.target.value)}
          >
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="sup-emp-field">
          <label htmlFor="emp-year">Year</label>
          <select id="emp-year" value={yearValue} onChange={(e) => onYearChange(e.target.value)}>
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="sup-emp-field">
          <label htmlFor="emp-fill-status">Fill status</label>
          <select
            id="emp-fill-status"
            value={fillStatus}
            onChange={(e) => onFillStatusChange(e.target.value)}
          >
            <option value="">All</option>
            <option value="active">Active (filled)</option>
            <option value="inactive">Inactive (0 fills)</option>
          </select>
        </div>
        <div className="sup-emp-field">
          <label htmlFor="emp-filled-by">Filled by</label>
          <select
            id="emp-filled-by"
            value={filledBy}
            onChange={(e) => onFilledByChange(e.target.value)}
          >
            <option value="">All</option>
            {paidByOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="sup-emp-field sup-emp-clear-wrap">
          <label>&nbsp;</label>
          <button type="button" className="sup-btn sup-btn-outline" onClick={onClear}>
            ✕ Clear
          </button>
        </div>
      </div>
    </div>
  );
}
