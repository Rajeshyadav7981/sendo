import { useMemo, useState } from 'react';
import { Button, DatePicker, Input, Modal, Select, Table, Tag, type TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { useDeleteLeave, useEmployeeLeaves, useUpdateLeave } from '../employees.hooks';
import type { LeaveRequest } from '../employees.api';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';

const COLOR: Record<string, string> = {
  Approved: 'success',
  Rejected: 'error',
  Pending: 'warning',
};

const fmt = (d?: string): string =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—';

export default function EmployeeLeaveRequestsPage(): JSX.Element {
  const leaves = useEmployeeLeaves();
  const update = useUpdateLeave();
  const remove = useDeleteLeave();
  const [filterDriver, setFilterDriver] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [leaveType, setLeaveType] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<LeaveRequest>>({});

  const filtered = useMemo<LeaveRequest[]>(() => {
    const list = leaves.data ?? [];
    return list.filter((r) => {
      const ok =
        !filterDriver ||
        (r.driverId || '').toLowerCase().includes(filterDriver.toLowerCase());
      const ms = !filterStatus || r.status === filterStatus;
      return ok && ms;
    });
  }, [leaves.data, filterDriver, filterStatus]);

  const pending = filtered.filter((r) => r.status === 'Pending');
  const processed = filtered.filter((r) => r.status !== 'Pending');

  const downloadCSV = (): void => {
    const h = 'Driver ID,Start Date,End Date,Reason,Status,Leave Type\n';
    const rows = filtered
      .map(
        (r) =>
          `${r.driverId},${r.startDate},${r.endDate},${r.reason || ''},${r.status},${r.leaveType || ''}`,
      )
      .join('\n');
    const blob = new Blob([h + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leave_requests_${range?.[0]?.format('YYYY-MM-DD') || 'all'}_to_${range?.[1]?.format('YYYY-MM-DD') || 'all'}.csv`;
    a.click();
  };

  const handleAction = (id: string, status: 'Approved' | 'Rejected'): void => {
    if (status === 'Approved' && !leaveType[id]) {
      Modal.warning({ title: 'Please select leave type before approving.' });
      return;
    }
    update.mutate({ id, body: { status, leaveType: leaveType[id] || null } });
  };

  const handleDelete = (id: string): void => {
    Modal.confirm({
      title: 'Delete this leave request?',
      okButtonProps: { danger: true },
      onOk: () => remove.mutate(id),
    });
  };

  const handleUpdate = (id: string): void => {
    const status = editForm.status === 'Approved' || editForm.status === 'Rejected'
      ? editForm.status
      : undefined;
    update.mutate(
      {
        id,
        body: {
          status,
          leaveType: editForm.leaveType ?? null,
          reason: editForm.reason,
        },
      },
      { onSuccess: () => setEditId(null) },
    );
  };

  const pendingColumns: TableColumnsType<LeaveRequest> = [
    { title: 'Driver ID', dataIndex: 'driverId', align: 'center' },
    { title: 'Start Date', align: 'center', render: (_, r) => fmt(r.startDate) },
    { title: 'End Date', align: 'center', render: (_, r) => fmt(r.endDate) },
    { title: 'Reason', dataIndex: 'reason', align: 'center' },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (v: string) => <Tag color={COLOR[v]}>{v}</Tag>,
    },
    {
      title: 'Leave Type',
      align: 'center',
      render: (_, r) => (
        <Select
          placeholder="Select Type"
          value={leaveType[r._id]}
          onChange={(v) => setLeaveType({ ...leaveType, [r._id]: String(v) })}
          options={[
            { value: 'Paid Leave', label: 'Paid Leave' },
            { value: 'Unpaid Leave', label: 'Unpaid Leave' },
          ]}
          style={{ width: 140 }}
          allowClear
        />
      ),
    },
    {
      title: 'Actions',
      align: 'center',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Button
            type="primary"
            size="small"
            onClick={() => handleAction(r._id, 'Approved')}
            disabled={!leaveType[r._id]}
          >
            Approve
          </Button>
          <Button danger size="small" onClick={() => handleAction(r._id, 'Rejected')}>
            Reject
          </Button>
        </div>
      ),
    },
  ];

  const processedColumns: TableColumnsType<LeaveRequest> = [
    { title: 'Driver ID', dataIndex: 'driverId', align: 'center' },
    { title: 'Start Date', align: 'center', render: (_, r) => fmt(r.startDate) },
    { title: 'End Date', align: 'center', render: (_, r) => fmt(r.endDate) },
    {
      title: 'Reason',
      align: 'center',
      render: (_, r) =>
        editId === r._id ? (
          <Input
            value={editForm.reason ?? ''}
            onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
          />
        ) : (
          r.reason || '—'
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      align: 'center',
      render: (v: string) => <Tag color={COLOR[v]}>{v}</Tag>,
    },
    {
      title: 'Leave Type',
      dataIndex: 'leaveType',
      align: 'center',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Actions',
      align: 'center',
      render: (_, r) =>
        editId === r._id ? (
          <Button type="primary" size="small" onClick={() => handleUpdate(r._id)}>
            Update
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            <Button
              size="small"
              onClick={() => {
                setEditId(r._id);
                setEditForm(r);
              }}
            >
              Edit
            </Button>
            <Button danger size="small" onClick={() => handleDelete(r._id)}>
              Delete
            </Button>
          </div>
        ),
    },
  ];

  return (
    <SendoLegacyPage title="Leave Requests">
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px', flexWrap: 'wrap' }}>
        <div style={{ width: 220 }}>
          <DriverSearchSelect
            bindBy="id"
            value={filterDriver}
            onChange={setFilterDriver}
            placeholder="Filter by Driver ID..."
          />
        </div>
        <Select
          placeholder="All Status"
          value={filterStatus || undefined}
          onChange={(v) => setFilterStatus(v ?? '')}
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

      <div style={{ fontWeight: 'bold', fontSize: 14, padding: '0 16px 8px' }}>
        Pending Requests ({pending.length})
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <Table<LeaveRequest>
          rowKey="_id"
          loading={leaves.isLoading}
          dataSource={pending}
          columns={pendingColumns}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No records' }}
        />
      </div>

      <div style={{ fontWeight: 'bold', fontSize: 14, padding: '8px 16px 8px' }}>
        Approved / Rejected Requests ({processed.length})
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <Table<LeaveRequest>
          rowKey="_id"
          loading={leaves.isLoading}
          dataSource={processed}
          columns={processedColumns}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No records' }}
        />
      </div>
    </SendoLegacyPage>
  );
}
