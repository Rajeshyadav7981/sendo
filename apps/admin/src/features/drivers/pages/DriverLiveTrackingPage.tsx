import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';

interface Coord {
  lat: number;
  lng: number;
  accuracy: string;
  time: string;
}

export default function DriverLiveTrackingPage(): JSX.Element {
  const [location, setLocation] = useState<Coord | null>(null);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<Coord[]>([]);
  const [driverName, setDriverName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const watchIdRef = useRef<number | null>(null);

  const handleStart = (): void => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported by this browser.');
      return;
    }
    setError('');
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: Coord = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy?.toFixed(0) ?? '0',
          time: new Date().toLocaleTimeString(),
        };
        setLocation(coords);
        setHistory((p) => [coords, ...p].slice(0, 15));
      },
      (err) => setError(`Location error: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 0 },
    );
    setTracking(true);
  };

  const handleStop = (): void => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    setTracking(false);
  };

  useEffect(() => () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
  }, []);

  return (
    <SendoLegacyPage title="Driver Live Tracking">
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
        <div style={s.sectionTitle}>Driver Information</div>
        <hr style={s.sectionDivider} />
        <div style={s.inputRow}>
          <div style={s.fieldGroup}>
            <label style={s.label}>Driver Name</label>
            <DriverSearchSelect
              value={driverName}
              onChange={setDriverName}
              disabled={tracking}
              placeholder="Select driver"
            />
          </div>
          <div style={s.fieldGroup}>
            <label style={s.label}>Vehicle Number</label>
            <VehicleSearchSelect
              value={vehicleNo}
              onChange={setVehicleNo}
              style={tracking ? s.inputDisabled : s.input}
              disabled={tracking}
              placeholder="Select vehicle"
            />
          </div>
        </div>

        <div style={s.sectionTitle}>Tracking Status</div>
        <hr style={s.sectionDivider} />
        <div style={{ ...s.statusBox, backgroundColor: tracking ? '#fffde7' : '#f5f5f5' }}>
          <div style={s.pulseWrap}>
            <span style={{ ...s.pulse, backgroundColor: tracking ? '#FFC107' : '#ccc', animation: tracking ? 'blink 1s infinite' : 'none' }} />
            {tracking ? 'Live location tracking active' : 'Tracking inactive — press Start to begin'}
          </div>

          {error && (
            <div style={{ color: '#000', fontSize: '12px', marginBottom: '10px', fontWeight: 700 }}>⚠ {error}</div>
          )}

          {location && (
            <div style={s.coordGrid}>
              <div style={s.coordCard}>
                <div style={s.coordVal}>{location.lat.toFixed(5)}</div>
                <div style={s.coordLabel}>Latitude</div>
              </div>
              <div style={s.coordCard}>
                <div style={s.coordVal}>{location.lng.toFixed(5)}</div>
                <div style={s.coordLabel}>Longitude</div>
              </div>
              <div style={s.coordCard}>
                <div style={s.coordVal}>±{location.accuracy}m</div>
                <div style={s.coordLabel}>Accuracy</div>
              </div>
            </div>
          )}

          <div style={s.btnRow}>
            <button
              style={{ ...s.startBtn, backgroundColor: tracking ? '#ccc' : '#FFC107', cursor: tracking ? 'not-allowed' : 'pointer' }}
              disabled={tracking}
              onClick={handleStart}
            >▶ Start Tracking</button>
            <button
              style={{ ...s.stopBtn, backgroundColor: !tracking ? '#ccc' : '#000', color: !tracking ? '#000' : '#fff', cursor: !tracking ? 'not-allowed' : 'pointer' }}
              disabled={!tracking}
              onClick={handleStop}
            >■ Stop Tracking</button>
          </div>
        </div>

        {history.length > 0 && (
          <>
            <div style={{ ...s.sectionTitle, marginTop: '24px' }}>Location History</div>
            <hr style={s.sectionDivider} />
            <table style={s.table}>
              <thead>
                <tr>
                  {['Time','Latitude','Longitude','Accuracy'].map((h) =>
                    <th style={s.th} key={h}>{h}</th>,
                  )}
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={`${h.time}-${i}`}>
                    <td style={i === 0 ? s.tdHighlight : s.td}>{h.time}</td>
                    <td style={i === 0 ? s.tdHighlight : s.td}>{h.lat.toFixed(6)}</td>
                    <td style={i === 0 ? s.tdHighlight : s.td}>{h.lng.toFixed(6)}</td>
                    <td style={i === 0 ? s.tdHighlight : s.td}>±{h.accuracy}m</td>
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
  inputRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', fontWeight: 700, color: '#000' },
  input: { padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', backgroundColor: '#fff', color: '#000', outline: 'none', boxSizing: 'border-box' },
  inputDisabled: { padding: '8px 10px', border: '1.5px solid #000', fontSize: '13px', backgroundColor: '#f5f5f5', color: '#000', outline: 'none', boxSizing: 'border-box', cursor: 'not-allowed' },
  statusBox: { border: '1.5px solid #000', padding: '20px 24px', textAlign: 'center', marginBottom: '16px' },
  pulseWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', color: '#000', marginBottom: '12px', fontWeight: 700 },
  pulse: { width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block' },
  coordGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' },
  coordCard: { border: '1.5px solid #000', padding: '12px', textAlign: 'center', backgroundColor: '#fff' },
  coordVal: { fontSize: '15px', fontWeight: 700, color: '#000', fontVariantNumeric: 'tabular-nums' },
  coordLabel: { fontSize: '11px', color: '#555', marginTop: '4px', fontWeight: 700 },
  btnRow: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' },
  startBtn: { color: '#000', border: 'none', padding: '8px 28px', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' },
  stopBtn: { border: 'none', padding: '8px 28px', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '8px' },
  th: { backgroundColor: '#000', color: '#fff', padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 700, border: '1px solid #000' },
  td: { border: '1px solid #000', padding: '10px 14px', fontSize: '13px', textAlign: 'center', backgroundColor: '#fff', color: '#000', fontVariantNumeric: 'tabular-nums' },
  tdHighlight: { border: '1px solid #000', padding: '10px 14px', fontSize: '13px', textAlign: 'center', backgroundColor: '#fffde7', color: '#000', fontVariantNumeric: 'tabular-nums' },
};
