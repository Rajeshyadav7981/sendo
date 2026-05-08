import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Modal } from 'antd';
import { useCreateTimesheet, useDeleteTimesheet, useTimesheets } from '../attendance.hooks';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';

function fmt(secs: number): string {
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function DriverTimeSheetPage(): JSX.Element {
  const records = useTimesheets();
  const create = useCreateTimesheet();
  const remove = useDeleteTimesheet();

  const handleDelete = (id: string): void => {
    Modal.confirm({
      title: 'Delete this timesheet record?',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => remove.mutate(id),
    });
  };

  const [tracking, setTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [driverName, setDriverName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (tracking) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tracking]);

  const handleStart = (): void => {
    setStartTime(new Date());
    setElapsed(0);
    setTracking(true);
  };

  const handleStop = (): void => {
    setTracking(false);
    const endTime = new Date();
    create.mutate(
      {
        driverName,
        vehicleNumber,
        date: new Date().toISOString().split('T')[0],
        startTime: startTime?.toLocaleTimeString(),
        endTime: endTime.toLocaleTimeString(),
        totalHours: (elapsed / 3600).toFixed(2),
        totalMinutes: Math.round(elapsed / 60),
      },
      { onSettled: () => setElapsed(0) },
    );
  };

  return (
    <SendoLegacyPage title="Driver Timesheet">
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
              value={vehicleNumber}
              onChange={setVehicleNumber}
              style={tracking ? s.inputDisabled : s.input}
              disabled={tracking}
              placeholder="Select vehicle"
            />
          </div>
        </div>

        <div style={s.sectionTitle}>Duty Timer</div>
        <hr style={s.sectionDivider} />
        <div style={{ ...s.timerBox, backgroundColor: tracking ? '#fffde7' : '#f5f5f5' }}>
          <div style={{ ...s.timer, color: tracking ? '#000' : '#555' }}>{fmt(elapsed)}</div>
          <div style={s.timerNote}>
            {tracking ? `Started at ${startTime?.toLocaleTimeString()}` : 'Press Start to begin tracking'}
          </div>
          <div style={s.btnRow}>
            <button
              style={{ ...s.startBtn, backgroundColor: tracking ? '#ccc' : '#FFC107', cursor: tracking ? 'not-allowed' : 'pointer' }}
              disabled={tracking}
              onClick={handleStart}
            >▶ Start Duty</button>
            <button
              style={{ ...s.stopBtn, backgroundColor: !tracking ? '#ccc' : '#000', color: !tracking ? '#000' : '#fff', cursor: !tracking ? 'not-allowed' : 'pointer' }}
              disabled={!tracking}
              onClick={handleStop}
            >■ End Duty</button>
          </div>
        </div>

        <div style={{ ...s.sectionTitle, marginTop: '24px' }}>Timesheet Records</div>
        <hr style={s.sectionDivider} />
        <table style={s.table}>
          <thead>
            <tr>
              {['Driver','Vehicle','Date','Start','End','Hours','Minutes','Actions'].map((h) =>
                <th style={s.th} key={h}>{h}</th>,
              )}
            </tr>
          </thead>
          <tbody>
            {records.isLoading ? (
              <tr><td colSpan={8} style={{ ...s.tdEmpty }}>Loading...</td></tr>
            ) : (records.data?.length ?? 0) > 0 ? (records.data ?? []).map((r) => (
              <tr key={r.id}>
                <td style={s.td}>{r.driverName}</td>
                <td style={s.td}>{r.vehicleNumber}</td>
                <td style={s.td}>{r.date}</td>
                <td style={s.td}>{r.startTime}</td>
                <td style={s.td}>{r.endTime}</td>
                <td style={s.td}><strong>{r.totalHours}h</strong></td>
                <td style={s.td}>{r.totalMinutes} min</td>
                <td style={s.td}>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    style={s.deleteBtn}
                    disabled={remove.isPending}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={8} style={s.tdEmpty}>No timesheet records yet</td></tr>
            )}
          </tbody>
        </table>
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
  timerBox: { textAlign: 'center', padding: '32px 24px', border: '1.5px solid #000', marginBottom: '16px' },
  timer: { fontSize: '52px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '6px' },
  timerNote: { fontSize: '12px', color: '#555', marginTop: '8px', fontWeight: 700 },
  btnRow: { display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' },
  startBtn: { color: '#000', border: 'none', padding: '8px 28px', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' },
  stopBtn: { border: 'none', padding: '8px 28px', fontWeight: 700, fontSize: '13px', textTransform: 'uppercase' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '8px' },
  th: { backgroundColor: '#000', color: '#fff', padding: '12px 16px', textAlign: 'center', fontSize: '13px', fontWeight: 700, border: '1px solid #000' },
  td: { border: '1px solid #000', padding: '10px 14px', fontSize: '13px', textAlign: 'center', backgroundColor: '#fff', color: '#000' },
  tdEmpty: { border: '1px solid #000', padding: '24px 14px', fontSize: '13px', textAlign: 'center', backgroundColor: '#fff', color: '#888' },
  deleteBtn: { padding: '5px 12px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' },
};
