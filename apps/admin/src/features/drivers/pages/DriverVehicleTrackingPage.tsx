import { useEffect, useState, type CSSProperties } from 'react';
import { useVehicleLocations } from '../tracking.hooks';
import type { VehicleLocation } from '../tracking.api';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';

export default function DriverVehicleTrackingPage(): JSX.Element {
  const [tracking, setTracking] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { data, error, dataUpdatedAt } = useVehicleLocations(tracking, 5_000);

  useEffect(() => {
    if (dataUpdatedAt) setLastUpdated(new Date(dataUpdatedAt).toLocaleTimeString());
  }, [dataUpdatedAt]);

  const vehicles: VehicleLocation[] = data ?? [];
  const selectedVehicle = selected !== null ? vehicles[selected] : null;
  const errorMsg = error ? 'Unable to fetch vehicle locations. Check backend connection.' : '';

  return (
    <SendoLegacyPage title="Driver Vehicle Tracking">
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
        <div style={s.sectionTitle}>Tracking Controls</div>
        <hr style={s.sectionDivider} />
        <div style={s.controlRow}>
          <div style={s.pulseWrap}>
            <span style={{ ...s.pulse, backgroundColor: tracking ? '#FFC107' : '#ccc', animation: tracking ? 'blink 1s infinite' : 'none' }} />
            {tracking ? `Live · Updated ${lastUpdated ?? '...'}` : 'Tracking inactive'}
          </div>
          <button
            style={{ ...s.startBtn, backgroundColor: tracking ? '#ccc' : '#FFC107', cursor: tracking ? 'not-allowed' : 'pointer' }}
            disabled={tracking}
            onClick={() => setTracking(true)}
          >📡 Start Tracking</button>
          <button
            style={{ ...s.stopBtn, backgroundColor: !tracking ? '#ccc' : '#000', color: !tracking ? '#000' : '#fff', cursor: !tracking ? 'not-allowed' : 'pointer' }}
            disabled={!tracking}
            onClick={() => setTracking(false)}
          >■ Stop</button>
        </div>

        {errorMsg && <div style={s.errorBox}>⚠ {errorMsg}</div>}

        <div style={s.sectionTitle}>Vehicle Locations</div>
        <hr style={s.sectionDivider} />

        {vehicles.length > 0 ? (
          <>
            <div style={{ fontSize: '12px', color: '#555', fontWeight: 700, marginBottom: '12px' }}>
              {vehicles.length} vehicle(s) tracked · Click a card to view details
            </div>
            <div style={s.grid}>
              {vehicles.map((v, i) => {
                const moving = Number(v.speed) > 0;
                const isSel = selected === i;
                return (
                  <div
                    key={`${v.id ?? v.vehicleNumber ?? i}`}
                    style={{
                      ...s.vehicleCard,
                      border: isSel ? '2px solid #FFC107' : '1.5px solid #000',
                      backgroundColor: isSel ? '#fffde7' : '#fff',
                    }}
                    onClick={() => setSelected(isSel ? null : i)}
                  >
                    <div style={s.vehId}>{v.id ?? v.vehicleNumber ?? `Vehicle ${i + 1}`}</div>
                    <div style={s.vehCoords}>
                      {(v.lat ?? v.latitude)?.toFixed(4)}, {(v.lng ?? v.longitude)?.toFixed(4)}
                    </div>
                    <span
                      style={{
                        ...s.vehStatus,
                        color: moving ? '#000' : '#fff',
                        backgroundColor: moving ? '#FFC107' : '#000',
                      }}
                    >
                      {moving ? `Moving · ${v.speed} km/h` : 'Stopped'}
                    </span>
                  </div>
                );
              })}
            </div>

            {selectedVehicle && (
              <div style={s.detailBox}>
                <div style={s.detailBoxTitle}>
                  Vehicle {selectedVehicle.id ?? selectedVehicle.vehicleNumber ?? `#${(selected ?? 0) + 1}`} — Details
                </div>
                <div style={s.detailGrid}>
                  <div style={s.detailCard}>
                    <div style={s.detailVal}>{(selectedVehicle.lat ?? selectedVehicle.latitude)?.toFixed(5)}</div>
                    <div style={s.detailLabel}>Latitude</div>
                  </div>
                  <div style={s.detailCard}>
                    <div style={s.detailVal}>{(selectedVehicle.lng ?? selectedVehicle.longitude)?.toFixed(5)}</div>
                    <div style={s.detailLabel}>Longitude</div>
                  </div>
                  <div style={s.detailCard}>
                    <div style={s.detailVal}>{selectedVehicle.speed ?? '0'} km/h</div>
                    <div style={s.detailLabel}>Speed</div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={s.emptyBox}>
            {tracking ? 'Fetching vehicle locations...' : 'Start tracking to see vehicle locations'}
          </div>
        )}
    </SendoLegacyPage>
  );
}

const s: Record<string, CSSProperties> = {
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#000', marginBottom: '4px' },
  sectionDivider: { border: 'none', borderTop: '2px solid #FFC107', marginBottom: '16px' },
  controlRow: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' },
  pulseWrap: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#000' },
  pulse: { width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' },
  startBtn: { color: '#000', border: 'none', padding: '8px 24px', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' },
  stopBtn: { border: 'none', padding: '8px 24px', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginTop: '8px' },
  vehicleCard: { padding: '16px', cursor: 'pointer', transition: 'all 0.15s' },
  vehId: { fontWeight: 700, fontSize: '13px', marginBottom: '4px', color: '#000', textTransform: 'uppercase' },
  vehCoords: { fontSize: '12px', color: '#555', margin: '4px 0' },
  vehStatus: { fontSize: '11px', fontWeight: 700, padding: '2px 10px', display: 'inline-block' },
  detailBox: { border: '1.5px solid #000', padding: '20px', marginTop: '20px', backgroundColor: '#fffde7' },
  detailBoxTitle: { fontSize: '13px', fontWeight: 700, color: '#000', marginBottom: '12px', textTransform: 'uppercase' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' },
  detailCard: { border: '1.5px solid #000', padding: '12px 16px', textAlign: 'center', backgroundColor: '#fff' },
  detailVal: { fontSize: '16px', fontWeight: 700, color: '#000' },
  detailLabel: { fontSize: '11px', color: '#555', marginTop: '4px', fontWeight: 700 },
  emptyBox: { border: '1.5px solid #000', padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px', fontWeight: 700, backgroundColor: '#f5f5f5' },
  errorBox: { border: '1.5px solid #000', backgroundColor: '#fffde7', padding: '8px 12px', fontSize: '12px', fontWeight: 700, color: '#000', marginBottom: '12px' },
};
