import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, DatePicker, Input, Modal, Table, type TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import {
  useCreateTimesheet,
  useDeleteTimesheet,
  useTimesheet,
} from '../employees.hooks';
import type { TimesheetRecord } from '../employees.api';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';

const fmtTime = (secs: number): string => {
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

export default function EmployeeTimesheetPage(): JSX.Element {
  const records = useTimesheet();
  const create = useCreateTimesheet();
  const remove = useDeleteTimesheet();

  const [tracking, setTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [driverName, setDriverName] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (tracking) {
      intervalRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tracking]);

  const handleStart = (): void => {
    if (!driverName.trim()) {
      setError('Enter driver name before starting.');
      return;
    }
    setError('');
    setStartTime(new Date());
    setElapsed(0);
    setTracking(true);
  };

  const handleStop = (): void => {
    setTracking(false);
    const endTime = new Date();
    const totalMins = Math.round(elapsed / 60);
    create.mutate(
      {
        driverName: driverName.trim(),
        vehicleNumber: vehicleNo.trim(),
        date: new Date().toISOString().split('T')[0],
        startTime: startTime?.toLocaleTimeString() ?? '',
        endTime: endTime.toLocaleTimeString(),
        totalHours: (elapsed / 3600).toFixed(2),
        totalMinutes: totalMins,
      },
      {
        onSuccess: () => setElapsed(0),
        onError: () => setError('Save failed — check backend connection.'),
      },
    );
  };

  const handleDelete = (id: string): void => {
    Modal.confirm({
      title: 'Delete this timesheet record?',
      okButtonProps: { danger: true },
      onOk: () => remove.mutate(id),
    });
  };

  const filtered = useMemo<TimesheetRecord[]>(() => {
    const list = records.data ?? [];
    return list.filter((r) => {
      const q = search.toLowerCase();
      const ok =
        (r.driverName || '').toLowerCase().includes(q) ||
        (r.vehicleNumber || '').toLowerCase().includes(q);
      const d = r.date ? new Date(r.date) : null;
      const start = range?.[0]?.toDate();
      const end = range?.[1]?.toDate();
      const ms = !start || (d && d >= start);
      const me = !end || (d && d <= new Date(end.setHours(23, 59, 59, 999)));
      return ok && ms && me;
    });
  }, [records.data, search, range]);

  const downloadCSV = (): void => {
    const h = 'Driver Name,Vehicle,Date,Start Time,End Time,Total Hours,Total Minutes\n';
    const rows = filtered
      .map(
        (r) =>
          `${r.driverName},${r.vehicleNumber || ''},${r.date},${r.startTime},${r.endTime},${r.totalHours},${r.totalMinutes}`,
      )
      .join('\n');
    const blob = new Blob([h + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'timesheet_records.csv';
    a.click();
  };

  const columns: TableColumnsType<TimesheetRecord> = [
    { title: '#', render: (_, __, i) => i + 1, align: 'center', width: 60 },
    { title: 'Driver Name', dataIndex: 'driverName', align: 'center', render: (v) => <strong>{v}</strong> },
    { title: 'Vehicle', dataIndex: 'vehicleNumber', align: 'center', render: (v?: string) => v || '—' },
    {
      title: 'Date',
      align: 'center',
      render: (_, r) => (r.date ? new Date(r.date).toLocaleDateString('en-GB') : '—'),
    },
    { title: 'Start Time', dataIndex: 'startTime', align: 'center' },
    { title: 'End Time', dataIndex: 'endTime', align: 'center' },
    {
      title: 'Total Hours',
      dataIndex: 'totalHours',
      align: 'center',
      render: (v) => <strong>{v} h</strong>,
    },
    {
      title: 'Total Mins',
      dataIndex: 'totalMinutes',
      align: 'center',
      render: (v) => `${v} min`,
    },
    {
      title: 'Action',
      align: 'center',
      render: (_, r) => (
        <Button danger size="small" onClick={() => handleDelete(r._id)}>
          🗑 Delete
        </Button>
      ),
    },
  ];

  return (
    <SendoLegacyPage title="Employee Timesheet">
      <div style={{ padding: 20 }}>
        <div
          style={{
            background: '#fff',
            border: '2px solid #000',
            borderRadius: 10,
            padding: '20px 24px',
            marginBottom: 20,
            maxWidth: 600,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#555',
              marginBottom: 4,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: tracking ? '#22c55e' : '#ccc',
                marginRight: 8,
              }}
            />
            {tracking ? 'Shift In Progress' : 'Ready to Start'}
          </div>

          <div
            style={{
              fontSize: 48,
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: tracking ? '#FFC107' : '#000',
              letterSpacing: 2,
              margin: '10px 0',
            }}
          >
            {fmtTime(elapsed)}
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ width: 220 }}>
              <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>Driver Name *</div>
              <DriverSearchSelect
                placeholder="Driver name..."
                value={driverName}
                onChange={setDriverName}
                disabled={tracking}
              />
            </div>
            <div style={{ width: 220 }}>
              <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 4 }}>Vehicle No.</div>
              <VehicleSearchSelect
                placeholder="e.g. KA01AE8482"
                value={vehicleNo}
                onChange={setVehicleNo}
                disabled={tracking}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {!tracking ? (
              <Button type="primary" size="large" onClick={handleStart}>
                ▶ Start Shift
              </Button>
            ) : (
              <Button size="large" onClick={handleStop} loading={create.isPending}>
                ■ Stop &amp; Save
              </Button>
            )}
            {!tracking && (
              <Button
                size="large"
                onClick={() => {
                  setDriverName('');
                  setVehicleNo('');
                  setElapsed(0);
                  setError('');
                }}
              >
                Clear
              </Button>
            )}
          </div>

          {error && (
            <div
              style={{
                background: '#fde8e8',
                border: '1px solid #c0392b',
                color: '#c0392b',
                padding: '8px 14px',
                borderRadius: 6,
                fontSize: 13,
                marginTop: 10,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <Input
            placeholder="Search driver or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
          />
          <DatePicker.RangePicker
            value={range as [Dayjs, Dayjs] | null}
            onChange={(v) => setRange(v as [Dayjs | null, Dayjs | null] | null)}
          />
          <Button type="primary" onClick={downloadCSV}>⬇ Download</Button>
          <span style={{ alignSelf: 'center', fontSize: 13, color: '#555' }}>
            {filtered.length} records
          </span>
        </div>

        <Table<TimesheetRecord>
          rowKey="_id"
          loading={records.isLoading}
          dataSource={filtered}
          columns={columns}
          pagination={{ pageSize: 25 }}
          locale={{ emptyText: 'No records found' }}
        />
      </div>
    </SendoLegacyPage>
  );
}
