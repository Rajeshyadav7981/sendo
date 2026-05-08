import { useEffect, useState, type CSSProperties } from 'react';
import { useVehicleLocations } from '../tracking.hooks';
import type { VehicleLocation } from '../tracking.api';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';

interface HistoryEntry extends VehicleLocation {
  time: string;
}

export default function VehicleGpsIntegrationPage(): JSX.Element {
  const [tracking, setTracking] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const { data, error } = useVehicleLocations(tracking, 5_000);

  const vehicle: VehicleLocation | null = data && data.length > 0 ? data[0] : null;

  useEffect(() => {
    if (vehicle) {
      const entry: HistoryEntry = { ...vehicle, time: new Date().toLocaleTimeString() };
      setHistory((p) => [entry, ...p].slice(0, 10));
    }
  }, [vehicle]);

  const errorMsg = error ? 'Unable to fetch GPS data. Check backend connection.' : '';

  return (
    <SendoLegacyPage title="Vehicle GPS Integration">
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
        <div style={s.sectionTitle}>GPS Tracking Control</div>
        <hr style={s.sectionDivider} />

        <div style={{ ...s.gpsBox, backgroundColor: tracking ? '#fffde7' : '#f5f5f5' }}>
          <div style={s.statusRow}>
            <span style={{ ...s.dot, backgroundColor: tracking ? '#FFC107' : '#ccc', animation: tracking ? 'pulse 1s infinite' : 'none' }} />
            {tracking ? 'Live tracking active — updating every 5 seconds' : 'GPS tracking inactive'}
          </div>

          {errorMsg && <div style={s.errorBox}>⚠ {errorMsg}</div>}

          <div style={s.btnRow}>
            <button
              style={{ ...s.startBtn, backgroundColor: tracking ? '#ccc' : '#FFC107', cursor: tracking ? 'not-allowed' : 'pointer' }}
              disabled={tracking}
              onClick={() => setTracking(true)}
            >📡 Start Tracking</button>
            <button
              style={{ ...s.stopBtn, backgroundColor: !tracking ? '#ccc' : '#000', color: !tracking ? '#000' : '#fff', cursor: !tracking ? 'not-allowed' : 'pointer' }}
              disabled={!tracking}
              onClick={() => setTracking(false)}
            >■ Stop Tracking</button>
          </div>
        </div>

        {vehicle && (
          <>
            <div style={s.sectionTitle}>Current Location</div>
            <hr style={s.sectionDivider} />
            <div style={s.coordGrid}>
              <div style={s.coordCard}>
                <div style={s.coordVal}>{(vehicle.lat ?? vehicle.latitude)?.toFixed(4) ?? '—'}</div>
                <div style={s.coordLabel}>Latitude</div>
              </div>
              <div style={s.coordCard}>
                <div style={s.coordVal}>{(vehicle.lng ?? vehicle.longitude)?.toFixed(4) ?? '—'}</div>
                <div style={s.coordLabel}>Longitude</div>
              </div>
              <div style={s.coordCard}>
                <div style={s.coordVal}>{vehicle.speed ?? '—'}</div>
                <div style={s.coordLabel}>Speed (km/h)</div>
              </div>
            </div>
          </>
        )}

        {history.length > 0 && (
          <>
            <div style={{ ...s.sectionTitle, marginTop: '24px' }}>Location History (last 10)</div>
            <hr style={s.sectionDivider} />
            <table style={s.table}>
              <thead>
                <tr>
                  {['Time','Latitude','Longitude','Speed'].map((h) =>
                    <th style={s.th} key={h}>{h}</th>,
                  )}
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={`${h.time}-${i}`}>
                    <td style={s.td}>{h.time}</td>
                    <td style={s.td}>{(h.lat ?? h.latitude)?.toFixed(5)}</td>
                    <td style={s.td}>{(h.lng ?? h.longitude)?.toFixed(5)}</td>
                    <td style={s.td}>{h.speed} km/h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
    </SendoLegacyPage>
  );
}

const s: Record<string, CSSProperties> = {
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#000', marginBottom: '4px' },
  sectionDivider: { border: 'none', borderTop: '2px solid #FFC107', marginBottom: '16px' },
  gpsBox: { border: '1.5px solid #000', padding: '24px', textAlign: 'center', marginBottom: '16px' },
  statusRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#000', marginBottom: '16px' },
  dot: { width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block' },
  btnRow: { display: 'flex', gap: '12px', justifyContent: 'center' },
  startBtn: { color: '#000', border: 'none', padding: '8px 28px', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' },
  stopBtn: { border: 'none', padding: '8px 28px', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' },
  coordGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' },
  coordCard: { border: '1.5px solid #000', padding: '12px 16px', textAlign: 'center', backgroundColor: '#fff' },
  coordVal: { fontSize: '18px', fontWeight: 700, color: '#000' },
  coordLabel: { fontSize: '11px', color: '#555', marginTop: '4px', fontWeight: 700 },
  errorBox: { border: '1.5px solid #000', backgroundColor: '#fffde7', padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: '#000', marginBottom: '12px', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '8px' },
  th: { backgroundColor: '#000', color: '#fff', padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 700, border: '1px solid #000' },
  td: { border: '1px solid #000', padding: '10px 14px', fontSize: '13px', textAlign: 'center', backgroundColor: '#fff', color: '#000' },
};
