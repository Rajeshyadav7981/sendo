import { type FormEvent, useState } from 'react';
import { useCreateOdometer, useOdometerReadings } from '@features/tracker/tracker.hooks';

interface Props {
  vehicle: string;
  anchorId?: string;
  title?: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function OdometerForm({ vehicle, anchorId, title = 'Odometer' }: Props): JSX.Element {
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [reading, setReading] = useState('');
  const [msg, setMsg] = useState('');

  const odoQuery = useOdometerReadings(vehicle, 1, 25);
  const createOdo = useCreateOdometer();

  const rows = odoQuery.data?.items ?? [];

  const onSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setMsg('');
    if (!vehicle) {
      setMsg('Select a vehicle first.');
      return;
    }
    if (!ISO_DATE.test(date)) {
      setMsg('Date must be YYYY-MM-DD.');
      return;
    }
    const km = Number(reading);
    if (!Number.isInteger(km) || km < 0) {
      setMsg('Enter a non-negative integer odometer reading (km).');
      return;
    }
    try {
      await createOdo.mutateAsync({
        vehicle,
        body: { dateKey: date, reading: km },
      });
      setMsg('Reading saved.');
      setReading('');
    } catch {
      setMsg('Could not save (check password / network).');
    }
  };

  if (!vehicle) {
    return (
      <div className="sup-panel" id={anchorId}>
        <h2 className="sup-panel-title">{title}</h2>
        <p className="sup-muted">Choose a vehicle above to enter odometer readings.</p>
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
          <label htmlFor="odo-date">Date</label>
          <input
            id="odo-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="sup-emp-field">
          <label htmlFor="odo-reading">Reading (km)</label>
          <input
            id="odo-reading"
            type="number"
            min={0}
            step={1}
            required
            inputMode="numeric"
            value={reading}
            placeholder="e.g. 45200"
            onChange={(e) => setReading(e.target.value)}
          />
        </div>
        <button type="submit" className="sup-btn sup-btn-amber" disabled={createOdo.isPending}>
          {createOdo.isPending ? 'Saving…' : 'Save reading'}
        </button>
      </form>
      {msg ? (
        <p
          className="sup-emp-msg"
          style={{
            marginTop: '0.5rem',
            color: msg.startsWith('Could') || msg.includes('password') ? '#dc2626' : '#15803d',
          }}
          role={msg.startsWith('Could') || msg.includes('password') ? 'alert' : 'status'}
        >
          {msg}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <>
          <h3 style={{ margin: '1.25rem 0 0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
            Recent readings
          </h3>
          <div className="sup-emp-table-wrap">
            <table className="sup-emp-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reading (km)</th>
                  <th>Entered by</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r._id ?? `${r.dateKey}-${r.reading}-${idx}`}>
                    <td>{r.dateKey}</td>
                    <td>{r.reading.toLocaleString()}</td>
                    <td>{r.enteredBy ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
