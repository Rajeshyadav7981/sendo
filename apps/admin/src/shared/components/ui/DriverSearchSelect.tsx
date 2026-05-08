import { useMemo, type CSSProperties } from 'react';
import { useDrivers } from '@features/drivers/drivers.hooks';
import { EntitySearchSelect, type EntityOption } from './EntitySearchSelect';

interface Props {
  value?: string;
  onChange?: (next: string) => void;
  /** What to bind to: `id` returns the driver's `driverId`, `name` returns "First Surname". Default: `name`. */
  bindBy?: 'id' | 'name';
  placeholder?: string;
  allowFreeText?: boolean;
  disabled?: boolean;
  required?: boolean;
  style?: CSSProperties;
  className?: string;
  id?: string;
  size?: 'small' | 'middle' | 'large';
}

function fullName(d: { firstName?: string | null; surname?: string | null }): string {
  return [d.firstName ?? '', d.surname ?? ''].map((s) => String(s).trim()).filter(Boolean).join(' ');
}

export function DriverSearchSelect({
  value,
  onChange,
  bindBy = 'name',
  placeholder = 'Search driver…',
  allowFreeText = false,
  disabled,
  required,
  style,
  className,
  id,
  size,
}: Props): JSX.Element {
  const { data = [], isLoading } = useDrivers();

  const options = useMemo<EntityOption[]>(() => {
    const seen = new Set<string>();
    return data
      .map((d) => {
        const name = fullName(d) || String(d.driverId ?? '').trim();
        const did = String(d.driverId ?? '').trim();
        const value = bindBy === 'id' ? did : name;
        if (!value || seen.has(value)) return null;
        seen.add(value);
        const search = `${name} ${did}`.toLowerCase();
        const label = bindBy === 'id' && name ? `${did} — ${name}` : name || did;
        return { value, label, search };
      })
      .filter((x): x is EntityOption => x !== null)
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }));
  }, [data, bindBy]);

  return (
    <EntitySearchSelect
      id={id}
      className={className}
      size={size}
      style={style}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      options={options}
      allowFreeText={allowFreeText}
      loading={isLoading}
      disabled={disabled}
      required={required}
    />
  );
}
