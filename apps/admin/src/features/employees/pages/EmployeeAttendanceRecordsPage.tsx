import { useMemo, useState } from 'react';
import { Button, DatePicker, Input, Select, Table, Tag, type TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { useAttendanceAll } from '../employees.hooks';
import type { AttendanceRecord } from '../employees.api';

function parseDateStr(str?: string): Date | null {
  if (!str) return null;
  const parts = str.split(' ');
  if (parts.length < 3) return null;
  const [d, mo, y] = parts[0].split('/').map(Number);
  let [h, m, s] = parts[1].split(':').map(Number);
  const period = parts[2]?.toLowerCase();
  if (period === 'pm' && h !== 12) h += 12;
  if (period === 'am' && h === 12) h = 0;
  return new Date(y, mo - 1, d, h, m, s);
}

const attendanceStatus = (s: string): 'Present' | 'Absent' | 'Pending' => {
  if (s === 'Approved') return 'Present';
  if (s === 'Rejected') return 'Absent';
  return 'Pending';
};

const COLOR: Record<string, string> = { Present: 'success', Absent: 'error', Pending: 'warning' };

export default function EmployeeAttendanceRecordsPage(): JSX.Element {
  const records = useAttendanceAll();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const filtered = useMemo<AttendanceRecord[]>(() => {
    const list = records.data ?? [];
    return list.filter((r) => {
      const q = search.toLowerCase();
      const ok =
        (r.driverName || '').toLowerCase().includes(q) ||
        (r.driverId || '').toLowerCase().includes(q) ||
        (r.vehicleNumber || '').toLowerCase().includes(q);
      const att = attendanceStatus(r.status);
      const matchStatus = !statusFilter || att === statusFilter;
      const d = parseDateStr(r.startTime);
      const start = range?.[0]?.toDate();
      const end = range?.[1]?.toDate();
      const ms = !start || (d && d >= start);
      const me = !end || (d && d <= new Date(end.setHours(23, 59, 59, 999)));
      return ok && matchStatus && ms && me;
    });
  }, [records.data, search, statusFilter, range]);

  const downloadCSV = (): void => {
    const h = 'Driver ID,Name,Vehicle,Start,Stop,Duration,Approval Status,Attendance\n';
    const rows = filtered
      .map(
        (r) =>
          `${r.driverId},${r.driverName},${r.vehicleNumber},${r.startTime},${r.stopTime},${r.duration},${r.status},${attendanceStatus(r.status)}`,
      )
      .join('\n');
    const blob = new Blob([h + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `att_records_${range?.[0]?.format('YYYY-MM-DD') || 'all'}_to_${range?.[1]?.format('YYYY-MM-DD') || 'all'}.csv`;
    a.click();
  };

  const columns: TableColumnsType<AttendanceRecord> = [
    { title: '#', render: (_, __, i) => i + 1, align: 'center', width: 60 },
    { title: 'Driver ID', dataIndex: 'driverId', align: 'center' },
    { title: 'Driver Name', dataIndex: 'driverName', align: 'center' },
    { title: 'Vehicle No.', dataIndex: 'vehicleNumber', align: 'center' },
    {
      title: 'Date',
      align: 'center',
      render: (_, r) => {
        const d = parseDateStr(r.startTime);
        return d ? d.toLocaleDateString('en-GB') : '—';
      },
    },
    { title: 'Start Time', dataIndex: 'startTime', align: 'center' },
    { title: 'Stop Time', dataIndex: 'stopTime', align: 'center' },
    { title: 'Duration', dataIndex: 'duration', align: 'center' },
    {
      title: 'Approval',
      dataIndex: 'status',
      align: 'center',
      render: (v: string) => <Tag color={COLOR[attendanceStatus(v)]}>{v}</Tag>,
    },
    {
      title: 'Attendance',
      align: 'center',
      render: (_, r) => {
        const a = attendanceStatus(r.status);
        return <Tag color={COLOR[a]}>{a}</Tag>;
      },
    },
  ];

  return (
    <SendoLegacyPage title="Attendance Records">
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px', flexWrap: 'wrap' }}>
        <Input
          placeholder="Search name, ID, vehicle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
        />
        <Select
          placeholder="All Attendance"
          value={statusFilter || undefined}
          onChange={(v) => setStatusFilter(v ?? '')}
          allowClear
          style={{ width: 160 }}
          options={['Present', 'Absent', 'Pending'].map((s) => ({ value: s, label: s }))}
        />
        <DatePicker.RangePicker
          value={range as [Dayjs, Dayjs] | null}
          onChange={(v) => setRange(v as [Dayjs | null, Dayjs | null] | null)}
        />
        <Button type="primary" onClick={downloadCSV}>⬇ Download</Button>
        <span style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: 13, color: '#555' }}>
          {filtered.length} records
        </span>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <Table<AttendanceRecord>
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
