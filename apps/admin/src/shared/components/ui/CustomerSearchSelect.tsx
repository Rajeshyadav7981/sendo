import { useMemo, type CSSProperties } from 'react';
import { useCustomers } from '@features/customers/customers.hooks';
import { EntitySearchSelect, type EntityOption } from './EntitySearchSelect';

interface Props {
  value?: string;
  onChange?: (next: string) => void;
  placeholder?: string;
  allowFreeText?: boolean;
  disabled?: boolean;
  required?: boolean;
  style?: CSSProperties;
  className?: string;
  id?: string;
  size?: 'small' | 'middle' | 'large';
}

export function CustomerSearchSelect({
  value,
  onChange,
  placeholder = 'Search customer…',
  allowFreeText = false,
  disabled,
  required,
  style,
  className,
  id,
  size,
}: Props): JSX.Element {
  const { data = [], isLoading } = useCustomers();

  const options = useMemo<EntityOption[]>(() => {
    const seen = new Set<string>();
    return data
      .map((c) => String(c.companyName ?? '').trim())
      .filter((n) => {
        if (!n || seen.has(n)) return false;
        seen.add(n);
        return true;
      })
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      .map((n) => ({ value: n, label: n, search: n.toLowerCase() }));
  }, [data]);

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
