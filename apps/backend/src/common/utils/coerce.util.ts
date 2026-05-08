/** Coerce arbitrary input to a finite number, or null. */
export const toNumOrNull = (v: unknown): number | null => {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Coerce arbitrary input to a Date, or null. */
export const toDateOrNull = (v: unknown): Date | null => {
  if (v === null || v === undefined || v === '') return null;
  const d = v instanceof Date ? v : new Date(v as string | number);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Format the day portion (UTC) for comparisons (YYYY-MM-DD). */
export const utcDayKey = (d: unknown): string | null => {
  const t = toDateOrNull(d);
  if (!t) return null;
  return t.toISOString().split('T')[0];
};
