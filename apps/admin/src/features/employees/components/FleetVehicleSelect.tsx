import { Select } from 'antd';

export const FLEET_VEHICLES = [
  'KA01AE8482', 'KA01AF8611', 'KA01AM6327', 'KA01AM6328', 'KA01AM6329', 'KA01AM6330',
  'KA01AM6331', 'KA01AR0996', 'KA01AR0997', 'KA02C6247', 'KA03AH4987', 'KA04AC1128',
  'KA04AC1182', 'KA06AA0880', 'KA09C1390', 'KA20A6593', 'KA20D0564', 'KA41D4863',
  'KA51AC8745', 'KA51AG7183', 'KA51AH5365', 'KA51AH5366', 'KA51AH5457', 'KA51AH8375',
  'KA51AH8379', 'KA51AJ4011', 'KA51AK4010', 'KA51AK4936', 'KA51AK4937', 'KA51AK4938',
  'KA51AK4939', 'KA51AK4940', 'KA51AK4941', 'KA51AK4942', 'KA51AK4943', 'KA51AK4944',
  'KA51AK4945', 'KA51AL7240', 'KA51AL7241', 'KA51AL7242', 'KA51AL7243', 'KA51AL7244',
  'KA51AM2815', 'KA53A7588', 'NEW 17FT', 'NEW 20FT', 'NEW 20FT 8416', 'NEW VEHICLE',
] as const;

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function FleetVehicleSelect({ value, onChange, placeholder, style }: Props): JSX.Element {
  return (
    <Select
      showSearch
      style={{ minWidth: 200, ...style }}
      placeholder={placeholder ?? 'Select vehicle'}
      value={value || undefined}
      onChange={(v) => onChange?.(String(v))}
      options={FLEET_VEHICLES.map((v) => ({ value: v, label: v }))}
      filterOption={(input, opt) =>
        String(opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
      }
    />
  );
}
