import { type FormEvent, useMemo, useState } from 'react';
import { useCreateEscalation, useEscalations } from '@features/tracker/tracker.hooks';
import type { EscalationSeverity } from '@features/tracker/tracker.api';

interface Props {
  vehicle: string;
  anchorId?: string;
  title?: string;
}

const CATEGORIES: ReadonlyArray<{ label: string; value: string }> = [
  { label: '⛽ Fuel mismatch', value: 'Fuel' },
  { label: '📅 Schedule violation', value: 'Schedule' },
  { label: '💰 Amount issue', value: 'Amount' },
  { label: '👤 Driver issue', value: 'Driver' },
  { label: '🔁 Double fill', value: 'DoubleFill' },
  { label: '📋 Other', value: 'Other' },
] as const;

const SEVERITIES: ReadonlyArray<{ label: string; value: EscalationSeverity }> = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

type RangePreset = 'all' | '7d' | '30d' | 'month' | 'custom';

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfThisMonth(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function fmtDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function severityClass(s?: EscalationSeverity): string {
  if (s === 'high') return 'sup-badge sup-badge-red';
  if (s === 'medium') return 'sup-badge sup-badge-amber';
  return 'sup-badge sup-badge-grey';
}

function statusClass(s: string): string {
  if (s === 'resolved') return 'sup-badge sup-badge-green';
  if (s === 'reopened') return 'sup-badge sup-badge-amber';
  return 'sup-badge sup-badge-red';
}

export function EscalationForm({ vehicle, anchorId, title = 'Raise escalation' }: Props): JSX.Element {
  const [category, setCategory] = useState<string>(CATEGORIES[0]?.value ?? 'Other');
  const [severity, setSeverity] = useState<EscalationSeverity>('medium');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');

  const [preset, setPreset] = useState<RangePreset>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const range = useMemo<{ from?: string; to?: string }>(() => {
    if (preset === 'all') return {};
    if (preset === '7d') return { from: isoDaysAgo(7), to: isoToday() };
    if (preset === '30d') return { from: isoDaysAgo(30), to: isoToday() };
    if (preset === 'month') return { from: startOfThisMonth(), to: isoToday() };
    return {
      from: customFrom || undefined,
      to: customTo || undefined,
    };
  }, [preset, customFrom, customTo]);

  const escQuery = useEscalations({
    vehicle: vehicle || undefined,
    from: range.from,
    to: range.to,
    page: 1,
    limit: 25,
  });
  const createEsc = useCreateEscalation();

  const recent = escQuery.data?.items ?? [];
  const total = escQuery.data?.total ?? 0;

  const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setMsg('');
    if (!vehicle) {
      setMsg('Select a vehicle in Overview.');
      return;
    }
    if (!category.trim()) {
      setMsg('Pick a category.');
      return;
    }
    if (!note.trim()) {
      setMsg('Describe the issue.');
      return;
    }
    try {
      await createEsc.mutateAsync({
        vehicle,
        category,
        severity,
        note: note.trim(),
        raisedBy: 'employee-web',
      });
      setMsg('Escalation submitted.');
      setNote('');
    } catch {
      setMsg('Submit failed (check password / network).');
    }
  };

  if (!vehicle) {
    return (
      <div className="sup-panel" id={anchorId}>
        <h2 className="sup-panel-title">{title}</h2>
        <p className="sup-muted">Choose a vehicle above, then log an escalation for that asset.</p>
      </div>
    );
  }

  return (
    <div className="sup-panel" id={anchorId}>
      <h2 className="sup-panel-title">{title}</h2>
      <p className="sup-panel-desc">
        Vehicle: <strong>{vehicle}</strong>
      </p>

      <form className="sup-emp-form-grid" style={{ marginTop: '1rem' }} onSubmit={onSubmit}>
        <div className="sup-emp-field">
          <label htmlFor="esc-cat">Category</label>
          <select
            id="esc-cat"
            value={category}
            required
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sup-emp-field">
          <label htmlFor="esc-sev">Severity</label>
          <select
            id="esc-sev"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as EscalationSeverity)}
          >
            {SEVERITIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sup-emp-field">
          <label htmlFor="esc-note">Description</label>
          <textarea
            id="esc-note"
            required
            minLength={3}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button type="submit" className="sup-btn sup-btn-amber" disabled={createEsc.isPending}>
          {createEsc.isPending ? 'Submitting…' : 'Submit'}
        </button>
      </form>
      <p
        className="sup-error sup-emp-msg"
        style={{
          marginTop: '0.5rem',
          color: msg.startsWith('Submit') ? undefined : msg ? '#16a34a' : undefined,
        }}
      >
        {msg}
      </p>

      <div style={{ marginTop: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'wrap',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>
            Recent on {vehicle}{' '}
            <span style={{ color: '#737373', fontWeight: 400 }}>({total})</span>
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {(['7d', '30d', 'month', 'all', 'custom'] as RangePreset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={`sup-btn ${preset === p ? 'sup-btn-amber' : ''}`}
                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              >
                {p === '7d'
                  ? 'Last 7d'
                  : p === '30d'
                    ? 'Last 30d'
                    : p === 'month'
                      ? 'This month'
                      : p === 'all'
                        ? 'All'
                        : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {preset === 'custom' ? (
          <div
            style={{
              marginTop: '0.5rem',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
            }}
          >
            <label className="sup-emp-field" style={{ margin: 0 }}>
              <span style={{ fontSize: '0.7rem', color: '#737373' }}>From</span>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </label>
            <label className="sup-emp-field" style={{ margin: 0 }}>
              <span style={{ fontSize: '0.7rem', color: '#737373' }}>To</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </label>
          </div>
        ) : null}

        {escQuery.isLoading ? (
          <p className="sup-muted" style={{ marginTop: '0.75rem' }}>
            Loading…
          </p>
        ) : recent.length === 0 ? (
          <p className="sup-muted" style={{ marginTop: '0.75rem' }}>
            No escalations in this range for {vehicle}.
          </p>
        ) : (
          <div className="sup-emp-table-wrap" style={{ marginTop: '0.5rem' }}>
            <table className="sup-emp-table">
              <thead>
                <tr>
                  <th>Raised</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Raised by</th>
                  <th>Note</th>
                  <th>Resolved</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r._id}>
                    <td>{fmtDateTime(r.createdAt)}</td>
                    <td>{r.category}</td>
                    <td>
                      <span className={severityClass(r.severity)}>{r.severity ?? '—'}</span>
                    </td>
                    <td>
                      <span className={statusClass(r.status)}>{r.status}</span>
                    </td>
                    <td>{r.raisedBy ?? '—'}</td>
                    <td style={{ maxWidth: 280 }}>{r.note ?? '—'}</td>
                    <td>
                      {r.resolvedAt ? (
                        <>
                          {fmtDateTime(r.resolvedAt)}
                          {r.resolvedBy ? (
                            <div style={{ color: '#737373', fontSize: '0.72rem' }}>
                              by {r.resolvedBy}
                            </div>
                          ) : null}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
