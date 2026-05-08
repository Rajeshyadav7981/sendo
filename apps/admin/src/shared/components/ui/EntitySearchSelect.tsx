import { AutoComplete, Select } from 'antd';
import type { CSSProperties } from 'react';
import './EntitySearchSelect.css';

export interface EntityOption {
  value: string;
  label: string;
  search?: string;
}

interface Props {
  value?: string;
  onChange?: (next: string) => void;
  options: EntityOption[];
  placeholder?: string;
  allowFreeText?: boolean;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  style?: CSSProperties;
  className?: string;
  id?: string;
  size?: 'small' | 'middle' | 'large';
}

const baseStyle: CSSProperties = { width: '100%' };

export function EntitySearchSelect({
  value,
  onChange,
  options,
  placeholder = 'Search…',
  allowFreeText = false,
  loading,
  disabled,
  style,
  className,
  id,
  size = 'middle',
}: Props): JSX.Element {
  const selected = value ?? '';
  const mergedClass = `sendo-search-select${className ? ` ${className}` : ''}`;
  const mergedStyle: CSSProperties = { ...baseStyle, ...(style ?? {}) };

  const matches = (q: string, opt: EntityOption | undefined): boolean => {
    if (!opt) return false;
    if (opt.search) return opt.search.includes(q);
    return opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q);
  };

  if (allowFreeText) {
    return (
      <AutoComplete
        id={id}
        className={mergedClass}
        style={mergedStyle}
        size={size}
        allowClear
        disabled={disabled}
        placeholder={placeholder}
        value={selected}
        onChange={(v) => onChange?.(typeof v === 'string' ? v : '')}
        onClear={() => onChange?.('')}
        filterOption={(input, option) => {
          const q = String(input).trim().toLowerCase();
          if (!q) return true;
          const opt = options.find((o) => o.value === option?.value);
          return matches(q, opt);
        }}
        options={options.map((o) => ({ value: o.value, label: o.label }))}
        notFoundContent={loading ? 'Loading…' : null}
      />
    );
  }

  return (
    <Select
      id={id}
      className={mergedClass}
      style={mergedStyle}
      size={size}
      allowClear
      showSearch
      disabled={disabled}
      loading={loading}
      placeholder={placeholder}
      value={selected || undefined}
      onChange={(v) => onChange?.((v as string | undefined) ?? '')}
      options={options.map((o) => ({ value: o.value, label: o.label }))}
      filterOption={(input, option) => {
        const q = input.trim().toLowerCase();
        if (!q) return true;
        const opt = options.find((o) => o.value === option?.value);
        return matches(q, opt);
      }}
      optionFilterProp="label"
    />
  );
}
