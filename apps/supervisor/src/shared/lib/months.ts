export const TRACKER_MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const ISO_MONTH = /^(\d{4})-(\d{2})$/;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parseIsoMonthKey(key: string): { year: number; monthIndex: number } | null {
  const m = ISO_MONTH.exec(String(key));
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11) return null;
  return { year, monthIndex };
}

export function formatMonthLabel(monthKey: string): string {
  const parsed = parseIsoMonthKey(monthKey);
  if (!parsed) return monthKey;
  return `${TRACKER_MONTH_SHORT[parsed.monthIndex]}-${parsed.year}`;
}

export function sortMonthKeysAsc(keys: string[]): string[] {
  return [...keys].sort();
}

function monthKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

export function rollingMonthKeys(count = 24): string[] {
  const keys: string[] = [];
  const d = new Date();
  for (let i = 0; i < count; i++) {
    keys.unshift(monthKeyFromDate(d));
    d.setMonth(d.getMonth() - 1);
  }
  return keys;
}

export function mergeTrackerMonthOptions(
  apiMonths: string[] | null | undefined,
  rollingCount = 48,
): string[] {
  const fromApi = (apiMonths ?? []).filter((m) => parseIsoMonthKey(m) !== null);
  const baseline = rollingMonthKeys(rollingCount);
  const merged = [...new Set<string>([...baseline, ...fromApi])];
  return sortMonthKeysAsc(merged);
}

export function yearsFromMonthKeys(monthKeys: string[]): Set<string> {
  const y = new Set<string>();
  for (const m of monthKeys ?? []) {
    const parsed = parseIsoMonthKey(m);
    if (parsed) y.add(String(parsed.year));
  }
  return y;
}

export function mergeTrackerYearOptions(monthKeys: string[]): string[] {
  return [...yearsFromMonthKeys(monthKeys)].sort((a, b) => Number(b) - Number(a));
}

export function daysInCalendarMonth(monthKey: string): number {
  const parsed = parseIsoMonthKey(monthKey);
  if (!parsed) return 31;
  return new Date(parsed.year, parsed.monthIndex + 1, 0).getDate();
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function dayOfMonthFromFillDate(
  dateStr: string | undefined,
  monthKey: string,
): number | null {
  if (!dateStr) return null;
  const m = ISO_DATE.exec(String(dateStr));
  if (!m) return null;
  const year = m[1];
  const month = m[2];
  const day = parseInt(m[3] ?? '', 10);
  const mk = parseIsoMonthKey(monthKey);
  if (!mk) return null;
  if (Number(year) !== mk.year || Number(month) !== mk.monthIndex + 1) return null;
  return Number.isFinite(day) ? day : null;
}
