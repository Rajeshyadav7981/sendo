import { useMemo, useState } from 'react';
import { Button, Card, Input, Table, type TableColumnsType } from 'antd';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import {
  useApproveSalary,
  useSalariesAll,
  useSalarySingle,
} from '../employees.hooks';
import type { SalaryRecord } from '../employees.api';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function EmployeeSalaryPage(): JSX.Element {
  const [month, setMonth] = useState<string>(currentMonth());
  const [driverId, setDriverId] = useState<string>('');
  const [searchDriverId, setSearchDriverId] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const all = useSalariesAll(month);
  const single = useSalarySingle(searchDriverId, month);
  const approve = useApproveSalary();

  const filtered = useMemo<SalaryRecord[]>(() => {
    const list = all.data ?? [];
    return list.filter(
      (r) =>
        (r.driverId || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.driverName || '').toLowerCase().includes(search.toLowerCase()),
    );
  }, [all.data, search]);

  const handleApprove = (dId: string): void => {
    approve.mutate({ driverId: dId, month });
  };

  const columns: TableColumnsType<SalaryRecord> = [
    { title: 'Driver ID', dataIndex: 'driverId', align: 'center' },
    { title: 'Name', dataIndex: 'driverName', align: 'center' },
    { title: 'Days', dataIndex: 'noOfDays', align: 'center' },
    { title: 'Basic Pay', dataIndex: 'basicPayment', align: 'center', render: (v) => `₹${v ?? 0}` },
    { title: 'Per Day', dataIndex: 'perDayPayment', align: 'center', render: (v) => `₹${v ?? 0}` },
    {
      title: 'Total Advance',
      dataIndex: 'totalAdvance',
      align: 'center',
      render: (v) => `₹${v ?? 0}`,
    },
    {
      title: 'Total Deduction',
      dataIndex: 'totalDeduction',
      align: 'center',
      render: (v) => `₹${v ?? 0}`,
    },
    {
      title: 'Net Payout',
      dataIndex: 'netPayout',
      align: 'center',
      render: (v) => <strong>₹{v ?? 0}</strong>,
    },
    {
      title: 'Action',
      align: 'center',
      render: (_, r) => (
        <Button type="primary" size="small" onClick={() => handleApprove(r.driverId)}>
          Approve
        </Button>
      ),
    },
  ];

  return (
    <SendoLegacyPage title="Employee Salary">
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px', flexWrap: 'wrap' }}>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          style={{ width: 180 }}
        />
        <div style={{ width: 220 }}>
          <DriverSearchSelect
            bindBy="id"
            value={driverId}
            onChange={setDriverId}
            placeholder="Driver ID for detail..."
          />
        </div>
        <Button type="primary" onClick={() => setSearchDriverId(driverId.trim())}>
          🔍 Load Driver
        </Button>
        <Input
          placeholder="Search all..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 200 }}
        />
      </div>

      {searchDriverId && single.data && (
        <Card
          title={`Salary Summary — ${(single.data.driverName as string) || searchDriverId} (${month})`}
          style={{ margin: '0 16px 16px' }}
          extra={
            <Button type="primary" onClick={() => handleApprove(searchDriverId)}>
              ✅ Approve Payout
            </Button>
          }
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 12,
            }}
          >
            {[
              { lbl: 'Salary Month', val: (single.data.salaryMonth as string) || month },
              { lbl: 'Driver ID', val: single.data.driverId || searchDriverId },
              { lbl: 'No. of Days', val: single.data.noOfDays ?? '—' },
              { lbl: 'Basic Payment', val: `₹${single.data.basicPayment ?? 0}` },
              { lbl: 'Per Day', val: `₹${single.data.perDayPayment ?? 0}` },
              { lbl: 'Total Advance', val: `₹${single.data.totalAdvance ?? 0}` },
              { lbl: 'Total Deduction', val: `₹${single.data.totalDeduction ?? 0}` },
              { lbl: 'Net Payout', val: `₹${single.data.netPayout ?? 0}` },
            ].map((c) => (
              <div
                key={c.lbl}
                style={{
                  background: '#fff',
                  border: '1px solid #000',
                  borderRadius: 8,
                  padding: '16px 20px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 'bold', color: '#FFC107' }}>{c.val}</div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>{c.lbl}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div style={{ fontWeight: 'bold', fontSize: 14, padding: '8px 16px 8px' }}>
        All Employees — {month} ({filtered.length})
      </div>
      <div style={{ padding: '0 16px 16px' }}>
        <Table<SalaryRecord>
          rowKey={(r) => r._id ?? r.driverId}
          loading={all.isLoading}
          dataSource={filtered}
          columns={columns}
          pagination={{ pageSize: 25 }}
          locale={{ emptyText: 'No salary data for this month.' }}
        />
      </div>
    </SendoLegacyPage>
  );
}
