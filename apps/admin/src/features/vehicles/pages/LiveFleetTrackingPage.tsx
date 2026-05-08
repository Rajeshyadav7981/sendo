import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import { Table, Tag } from 'antd';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getVmRecordTableStyle,
  getVmRecordTdStyle,
  getVmRecordThStyle,
  vmPageShell,
  vmTableScrollWrap,
} from '../lib/vehicleManagementLayout';
import { useLiveLocations } from '../vehicles.hooks';

interface FleetRow {
  vehicleNumber?: string;
  status?: string;
  speed?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  location?: string;
  address?: string;
  [k: string]: unknown;
}

const C = {
  yellow: '#FFC107',
  black: '#000000',
  white: '#ffffff',
  border: '1.5px solid #000000',
  radius: '4px',
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  fontSizeSm: '13px',
};

const movingIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3068/3068321.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const stoppedIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/149/149059.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const num = (v: unknown): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function LiveFleetTrackingPage(): JSX.Element {
  const { data, isLoading } = useLiveLocations();
  const rows = (data ?? []) as FleetRow[];
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth <= 768,
  );

  useEffect(() => {
    const h = (): void => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const { moving, stopped } = useMemo(() => {
    let m = 0;
    let s = 0;
    for (const r of rows) {
      if (num(r.speed) > 0) m += 1;
      else s += 1;
    }
    return { moving: m, stopped: s };
  }, [rows]);

  const S: Record<string, CSSProperties> = {
    container: {
      ...vmPageShell(isMobile),
      fontFamily: C.fontFamily,
      backgroundColor: C.white,
      color: C.black,
      minHeight: 'calc(100vh - 70px)',
      boxShadow: '0px 4px 8px rgba(0,0,0,0.1)',
    },
    pageHeader: {
      backgroundColor: C.yellow,
      color: C.black,
      padding: '16px 20px',
      fontWeight: 'bold',
      fontSize: '20px',
      letterSpacing: '1px',
      textTransform: 'uppercase',
    },
    body: { padding: isMobile ? '14px' : '20px' },
    statsRow: { display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' },
    statCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      border: C.border,
      borderRadius: C.radius,
      padding: '8px 14px',
      backgroundColor: '#fffdf2',
      fontWeight: 'bold',
      fontSize: C.fontSizeSm,
    },
    statDot: {
      display: 'inline-block',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
    },
    mapWrap: {
      height: '60vh',
      overflow: 'hidden',
      borderRadius: C.radius,
      border: C.border,
      marginBottom: '14px',
    },
    tableWrap: { ...vmTableScrollWrap, marginTop: '4px' },
    table: getVmRecordTableStyle(isMobile, 6),
    th: getVmRecordThStyle(isMobile),
    td: { ...getVmRecordTdStyle(isMobile), color: C.black },
  };

  return (
    <div style={S.container}>
      <div style={S.pageHeader}>LIVE FLEET TRACKING</div>

      <div style={S.body}>
        <div style={S.statsRow}>
          <div style={S.statCard}>
            <span style={{ ...S.statDot, backgroundColor: '#28a745' }} />
            Moving: {moving}
          </div>
          <div style={S.statCard}>
            <span style={{ ...S.statDot, backgroundColor: '#dc3545' }} />
            Stopped: {stopped}
          </div>
          <div style={S.statCard}>
            <span style={{ ...S.statDot, backgroundColor: C.yellow }} />
            Total: {rows.length}
          </div>
        </div>

        <div style={S.mapWrap}>
          <MapContainer
            center={[20.5937, 78.9629]}
            zoom={5}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap"
            />
            {rows.map((v, i) => {
              const lat = num(v.latitude);
              const lng = num(v.longitude);
              if (!lat || !lng) return null;
              const speed = num(v.speed);
              return (
                <Marker
                  key={`${v.vehicleNumber ?? 'v'}-${i}`}
                  position={[lat, lng]}
                  icon={speed > 0 ? movingIcon : stoppedIcon}
                >
                  <Popup>
                    <div style={{ fontSize: '12px', lineHeight: 1.5 }}>
                      <b>Vehicle:</b> {v.vehicleNumber ?? '—'}
                      <br />
                      <b>Speed:</b> {speed} km/h
                      <br />
                      <b>Status:</b>{' '}
                      <span style={{ color: speed > 0 ? '#15803d' : '#b91c1c' }}>
                        {speed > 0 ? 'Moving' : 'Stopped'}
                      </span>
                      {v.location && (
                        <>
                          <br />
                          <b>Location:</b> {v.location}
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <div style={S.tableWrap}>
          <Table<FleetRow>
            rowKey={(row) => String(row.vehicleNumber ?? Math.random())}
            loading={isLoading}
            dataSource={rows}
            pagination={{ pageSize: 50, showSizeChanger: true, pageSizeOptions: [25, 50, 100] }}
            scroll={{ x: 'max-content' }}
            columns={[
              {
                title: 'Vehicle',
                dataIndex: 'vehicleNumber',
                render: (v: string) => (
                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{v}</span>
                ),
              },
              {
                title: 'Status',
                render: (_: unknown, row: FleetRow) => {
                  const speed = num(row.speed);
                  const tag = speed > 0 ? 'Moving' : 'Stopped';
                  return <Tag color={speed > 0 ? 'green' : 'orange'}>{tag}</Tag>;
                },
              },
              { title: 'Speed', dataIndex: 'speed' },
              { title: 'Lat', dataIndex: 'latitude' },
              { title: 'Lng', dataIndex: 'longitude' },
              { title: 'Address', dataIndex: 'address', ellipsis: true },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
