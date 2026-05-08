import { DatePicker as AntDatePicker, type DatePickerProps } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { CalendarOutlined } from '@ant-design/icons';

export interface DatePickerValue {
  /** ISO `YYYY-MM-DD` (or empty string for cleared). */
  value: string;
  onChange: (next: string) => void;
}

export interface SendoDatePickerProps
  extends Omit<DatePickerProps, 'value' | 'onChange' | 'format' | 'picker' | 'suffixIcon'> {
  value: string;
  onChange: (next: string) => void;
  /** Optional override; defaults to `DD MMM YYYY` for nicer reading. */
  displayFormat?: string;
}

const DEFAULT_FORMAT = 'DD MMM YYYY';

function toDayjs(iso: string | undefined): Dayjs | null {
  if (!iso) return null;
  const d = dayjs(iso);
  return d.isValid() ? d : null;
}

/**
 * Project-wide date picker. Stores ISO `YYYY-MM-DD` in state but renders
 * `DD MMM YYYY` so users see "08 May 2026" instead of `2026-05-08`.
 *
 * Drop-in replacement for `<input type="date">` — pass the same `value`
 * and `onChange(string)` you used before.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  displayFormat = DEFAULT_FORMAT,
  className,
  style,
  allowClear = true,
  ...rest
}: SendoDatePickerProps): JSX.Element {
  return (
    <AntDatePicker
      {...rest}
      value={toDayjs(value)}
      onChange={(d) => onChange(d ? d.format('YYYY-MM-DD') : '')}
      format={displayFormat}
      placeholder={placeholder}
      allowClear={allowClear}
      suffixIcon={<CalendarOutlined />}
      className={className}
      style={{ width: '100%', ...(style ?? {}) }}
    />
  );
}

export interface SendoRangePickerProps {
  value: { from: string; to: string };
  onChange: (next: { from: string; to: string }) => void;
  placeholder?: [string, string];
  className?: string;
  style?: React.CSSProperties;
  allowClear?: boolean;
  disabled?: boolean;
}

const { RangePicker: AntRangePicker } = AntDatePicker;

export function DateRangePicker({
  value,
  onChange,
  placeholder = ['From', 'To'],
  className,
  style,
  allowClear = true,
  disabled,
}: SendoRangePickerProps): JSX.Element {
  const range: [Dayjs | null, Dayjs | null] = [toDayjs(value.from), toDayjs(value.to)];
  return (
    <AntRangePicker
      value={range}
      onChange={(vals) => {
        onChange({
          from: vals?.[0] ? vals[0].format('YYYY-MM-DD') : '',
          to: vals?.[1] ? vals[1].format('YYYY-MM-DD') : '',
        });
      }}
      format={DEFAULT_FORMAT}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
      suffixIcon={<CalendarOutlined />}
      className={className}
      style={{ width: '100%', ...(style ?? {}) }}
    />
  );
}
