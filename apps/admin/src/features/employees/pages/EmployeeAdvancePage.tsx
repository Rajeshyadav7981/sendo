import { useMemo, useState } from 'react';
import { Button, Input, InputNumber, Modal, Table, Tag, type TableColumnsType } from 'antd';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import {
  useAdvanceRecords,
  usePendingAdvances,
  useUpdateAdvance,
} from '../employees.hooks';
import type { AdvanceRequest } from '../employees.api';
import { ManualRequestForm } from '../components/ManualRequestForm';

const COLOR: Record<string, string> = {
  Approved: 'success',
  Rejected: 'error',
  Pending: 'warning',
};

export default function EmployeeAdvancePage(): JSX.Element {
  const pending = usePendingAdvances();
  const records = useAdvanceRecords();
  const update = useUpdateAdvance();
  const [showManual, setShowManual] = useState(false);
  const [search, setSearch] = useState('');

  const filteredRecords = useMemo<AdvanceRequest[]>(() => {
    const list = records.data ?? [];
    return list.filter((r) => {
      const q = search.toLowerCase();
      return (
        (r.driverId || '').toLowerCase().includes(q) ||
        (r.driverName || '').toLowerCase().includes(q)
      );
    });
  }, [records.data, search]);

  const handleApprove = (r: AdvanceRequest): void => {
    let amount = 0;
    Modal.confirm({
      title: `Approve advance for ${r.driverId}`,
      content: (
        <div>
          <p>Maximum: ₹{r.requestedAmount}</p>
          <InputNumber
            min={1}
            max={r.requestedAmount}
            placeholder="Approved amount"
            style={{ width: '100%' }}
            onChange={(v) => {
              amount = Number(v ?? 0);
            }}
          />
        </div>
      ),
      okText: 'Approve',
      onOk: () => {
        if (!amount || amount <= 0 || amount > r.requestedAmount) {
          Modal.warning({ title: `Invalid amount. Must be > 0 and ≤ ₹${r.requestedAmount}` });
          return;
        }
        update.mutate({ id: r._id, status: 'Approved', approvedAmount: amount });
      },
    });
  };

  const handleReject = (r: AdvanceRequest): void => {
    Modal.confirm({
      title: `Reject advance for ${r.driverId}?`,
      okButtonProps: { danger: true },
      onOk: () => update.mutate({ id: r._id, status: 'Rejected', approvedAmount: 0 }),
    });
  };

  const downloadCSV = (): void => {
    const h = 'Driver ID,Name,Month,Requested,Approved,Status\n';
    const rows = filteredRecords
      .map(
        (r) =>
          `${r.driverId},${r.driverName},${r.month},${r.requestedAmount},${r.approvedAmount || ''},${r.approvalStatus}`,
      )
      .join('\n');
    const blob = new Blob([h + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'advance_records.csv';
    a.click();
  };

  const pendingColumns: TableColumnsType<AdvanceRequest> = [
    { title: 'Driver ID', dataIndex: 'driverId', align: 'center' },
    { title: 'Driver Name', dataIndex: 'driverName', align: 'center' },
    { title: 'Month', dataIndex: 'month', align: 'center' },
    {
      title: 'Requested Amount',
      dataIndex: 'requestedAmount',
      align: 'center',
      render: (v: number) => `₹${v}`,
    },
    {
      title: 'Action',
      align: 'center',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <Button type="primary" size="small" onClick={() => handleApprove(r)}>Approve</Button>
          <Button danger size="small" onClick={() => handleReject(r)}>Reject</Button>
        </div>
      ),
    },
  ];

  const recordColumns: TableColumnsType<AdvanceRequest> = [
    { title: 'Driver ID', dataIndex: 'driverId', align: 'center' },
    { title: 'Driver Name', dataIndex: 'driverName', align: 'center' },
    { title: 'Month', dataIndex: 'month', align: 'center' },
    {
      title: 'Requested',
      dataIndex: 'requestedAmount',
      align: 'center',
      render: (v: number) => `₹${v}`,
    },
    {
      title: 'Approved',
      align: 'center',
      render: (_, r) => (r.approvalStatus === 'Approved' ? `₹${r.approvedAmount}` : '—'),
    },
    {
      title: 'Status',
      dataIndex: 'approvalStatus',
      align: 'center',
      render: (v: string) => <Tag color={COLOR[v]}>{v}</Tag>,
    },
  ];

  return (
    <SendoLegacyPage title="Advance Requests">
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px', flexWrap: 'wrap' }}>
        <Button onClick={() => setShowManual((s) => !s)}>
          {showManual ? '✕ Close Form' : '✏ Manual Request'}
        </Button>
        <Input
          placeholder="Search driver..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
        />
        <Button type="primary" onClick={downloadCSV}>⬇ Download</Button>
      </div>

      {showManual && (
        <div style={{ padding: '0 16px' }}>
          <ManualRequestForm onClose={() => setShowManual(false)} />
        </div>
      )}

      <div style={{ fontWeight: 'bold', fontSize: 14, padding: '8px 16px 8px' }}>
        Pending Advance Requests ({pending.data?.length ?? 0})
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <Table<AdvanceRequest>
          rowKey="_id"
          loading={pending.isLoading}
          dataSource={pending.data ?? []}
          columns={pendingColumns}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No pending requests.' }}
        />
      </div>

      <div style={{ fontWeight: 'bold', fontSize: 14, padding: '8px 16px 8px' }}>
        Records ({filteredRecords.length})
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <Table<AdvanceRequest>
          rowKey="_id"
          loading={records.isLoading}
          dataSource={filteredRecords}
          columns={recordColumns}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: 'No records.' }}
        />
      </div>
    </SendoLegacyPage>
  );
}
