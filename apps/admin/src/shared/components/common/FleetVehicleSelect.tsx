import { useEffect, useState, type CSSProperties, type ChangeEvent } from 'react';
import { apiClient } from '@shared/api/client';

interface FleetVehicleSelectProps {
  name?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLSelectElement>) => void;
  style?: CSSProperties;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  placeholderOption?: string;
}

interface VehicleListItem {
  vehicleNumber?: string;
  [k: string]: unknown;
}

export default function FleetVehicleSelect({
  name = 'vehicleNumber',
  value,
  onChange,
  style,
  required,
  disabled,
  id,
  className,
  placeholderOption = 'Select vehicle',
}: FleetVehicleSelectProps): JSX.Element {
  const [fleetNumbers, setFleetNumbers] = useState<string[]>([]);

  useEffect(() => {
    apiClient
      .get<VehicleListItem[] | string[]>('/onboarding/vehicleList')
      .then((rows) => {
        const arr = Array.isArray(rows) ? rows : [];
        const ids = [
          ...new Set(
            arr
              .map((v) => (typeof v === 'string' ? v : v?.vehicleNumber))
              .map((x) => String(x ?? '').trim())
              .filter(Boolean),
          ),
        ];
        ids.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        setFleetNumbers(ids);
      })
      .catch(() => setFleetNumbers([]));
  }, []);

  const v = String(value ?? '').trim();
  const inFleet = !!v && fleetNumbers.includes(v);

  return (
    <select
      id={id}
      className={className}
      name={name}
      style={style}
      value={value ?? ''}
      onChange={onChange}
      required={required}
      disabled={disabled}
    >
      <option value="">{placeholderOption}</option>
      {fleetNumbers.map((num) => (
        <option key={num} value={num}>
          {num}
        </option>
      ))}
      {v && !inFleet ? (
        <option value={v}>{v} — saved value (not in fleet list)</option>
      ) : null}
    </select>
  );
}
