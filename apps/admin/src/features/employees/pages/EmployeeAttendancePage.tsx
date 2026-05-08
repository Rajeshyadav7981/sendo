import { useMemo, useState } from 'react';
import { Button, DatePicker, Input, Modal, Select, Table, Tag, type TableColumnsType } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import {
  useAttendancePending,
  useDeleteEmployeeAttendance,
  useUpdateAttendance,
} from '../employees.hooks';
import type { AttendanceRecord } from '../employees.api';

const STATUS_COLOR: Record<string, string> = {
  Approved: 'success',
  Rejected: 'error',
  Pending: 'warning',
};

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

export default function EmployeeAttendancePage(): JSX.Element {
  const records = useAttendancePending();
  const update = useUpdateAttendance();
  const remove = useDeleteEmployeeAttendance();

  const handleDelete = (id: string): void => {
    Modal.confirm({
      title: 'Delete this attendance record?',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: () => remove.mutate(id),
    });
  };
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const filtered = useMemo<AttendanceRecord[]>(() => {
    const list = records.data ?? [];
    return list.filter((r) => {
      const q = search.toLowerCase();
      const ok =
        (r.driverId || '').toLowerCase().includes(q) ||
        (r.driverName || '').toLowerCase().includes(q) ||
        (r.vehicleNumber || '').toLowerCase().includes(q);
      const matchStatus = !statusFilter || r.status === statusFilter;
      const d = parseDateStr(r.startTime);
      const start = range?.[0]?.toDate();
      const end = range?.[1]?.toDate();
      const ms = !start || (d && d >= start);
      const me = !end || (d && d <= new Date(end.setHours(23, 59, 59, 999)));
      return ok && matchStatus && ms && me;
    });
  }, [records.data, search, statusFilter, range]);

  const downloadCSV = (): void => {
    const h = 'Driver ID,Name,Vehicle,Start Time,Stop Time,Duration,Shift,Status\n';
    const rows = filtered
      .map(
        (r) =>
          `${r.driverId},${r.driverName},${r.vehicleNumber},${r.startTime},${r.stopTime},${r.duration},${r.shiftDetail || ''},${r.status}`,
      )
      .join('\n');
    const blob = new Blob([h + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `attendance_${range?.[0]?.format('YYYY-MM-DD') || 'all'}_to_${range?.[1]?.format('YYYY-MM-DD') || 'all'}.csv`;
    a.click();
  };

  const columns: TableColumnsType<AttendanceRecord> = [
    { title: 'Driver ID', dataIndex: 'driverId', align: 'center' },
    { title: 'Driver Name', dataIndex: 'driverName', align: 'center' },
    { title: 'Vehicle No.', dataIndex: 'vehicleNumber', align: 'center' },
    { title: 'Start Time', dataIndex: 'startTime', align: 'center' },
    { title: 'Stop Time', dataIndex: 'stopTime', align: 'center' },
    { title: 'Duration', dataIndex: 'duration', align: 'center' },
    {
      title: 'Shift Type',
      dataIndex: 'shiftDetail',
      align: 'center',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Shift Detail',
      dataIndex: 'driverShiftLabel',
      align: 'center',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (v: 'Pending' | 'Approved' | 'Rejected') => (
        <Tag color={STATUS_COLOR[v]}>{v}</Tag>
      ),
    },
    {
      title: 'Actions',
      align: 'center',
      render: (_, r) => (
        <>
          <Button
            type="primary"
            size="small"
            style={{ marginRight: 6 }}
            onClick={() => update.mutate({ id: r._id, status: 'Approved' })}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            style={{ marginRight: 6 }}
            onClick={() => update.mutate({ id: r._id, status: 'Rejected' })}
          >
            Reject
          </Button>
          <Button
            danger
            size="small"
            onClick={() => handleDelete(r._id)}
            disabled={remove.isPending}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

  return (
    <SendoLegacyPage title="Attendance Approvals">
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px', flexWrap: 'wrap' }}>
        <Input
          placeholder="Search Driver ID, Name, Vehicle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
        />
        <Select
          placeholder="All Status"
          value={statusFilter || undefined}
          onChange={(v) => setStatusFilter(v ?? '')}
          allowClear
          style={{ width: 140 }}
          options={['Pending', 'Approved', 'Rejected'].map((s) => ({ value: s, label: s }))}
        />
        <DatePicker.RangePicker
          value={range as [Dayjs, Dayjs] | null}
          onChange={(v) => setRange(v as [Dayjs | null, Dayjs | null] | null)}
        />
        <Button type="primary" onClick={downloadCSV}>⬇ Download</Button>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <Table<AttendanceRecord>
          rowKey="_id"
          loading={records.isLoading}
          dataSource={filtered}
          columns={columns}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: 'No records found' }}
        />
      </div>
    </SendoLegacyPage>
  );
}

void dayjs;
