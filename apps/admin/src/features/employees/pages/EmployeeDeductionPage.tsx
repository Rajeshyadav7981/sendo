import { useMemo, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Modal, Select, Table, type TableColumnsType } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import {
  useCreateDeduction,
  useDeductions,
  useDeleteDeduction,
} from '../employees.hooks';
import type { Deduction } from '../employees.api';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';

interface FormValues {
  driverId: string;
  driverName?: string;
  month?: Dayjs;
  deductionType?: string;
  amount: number;
  reason?: string;
}

const TYPES = ['Late Fine', 'Damage', 'Uniform', 'Loan Repayment', 'Other'];

export default function EmployeeDeductionPage(): JSX.Element {
  const records = useDeductions();
  const create = useCreateDeduction();
  const remove = useDeleteDeduction();
  const [form] = Form.useForm<FormValues>();
  const [search, setSearch] = useState('');

  const filtered = useMemo<Deduction[]>(() => {
    const list = records.data ?? [];
    return list.filter(
      (r) =>
        (r.driverId || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.driverName || '').toLowerCase().includes(search.toLowerCase()),
    );
  }, [records.data, search]);

  const onFinish = (values: FormValues): void => {
    create.mutate(
      {
        driverId: values.driverId.trim(),
        driverName: values.driverName,
        month: values.month?.format('YYYY-MM'),
        deductionType: values.deductionType,
        amount: values.amount,
        reason: values.reason,
      },
      { onSuccess: () => form.resetFields() },
    );
  };

  const handleDelete = (id: string): void => {
    Modal.confirm({
      title: 'Delete this deduction?',
      okButtonProps: { danger: true },
      onOk: () => remove.mutate(id),
    });
  };

  const columns: TableColumnsType<Deduction> = [
    { title: '#', render: (_, __, i) => i + 1, align: 'center', width: 60 },
    { title: 'Driver ID', dataIndex: 'driverId', align: 'center' },
    { title: 'Name', dataIndex: 'driverName', align: 'center', render: (v?: string) => v || '—' },
    { title: 'Month', dataIndex: 'month', align: 'center', render: (v?: string) => v || '—' },
    {
      title: 'Type',
      dataIndex: 'deductionType',
      align: 'center',
      render: (v?: string) => v || '—',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      align: 'center',
      render: (v) => `₹${v}`,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      align: 'center',
      render: (v?: string) => v || '—',
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
    <SendoLegacyPage title="Employee Deduction">
      <div style={{ padding: 20 }}>
        <Card title="Add Deduction" style={{ maxWidth: 720, marginBottom: 16 }}>
          <Form<FormValues>
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <Form.Item
                name="driverId"
                label="Driver ID *"
                rules={[{ required: true, message: 'Driver ID required' }]}
              >
                <DriverSearchSelect bindBy="id" placeholder="Select driver ID" />
              </Form.Item>
              <Form.Item name="driverName" label="Driver Name">
                <DriverSearchSelect placeholder="Select driver" />
              </Form.Item>
              <Form.Item name="month" label="Month">
                <Input
                  type="month"
                  onChange={(e) => {
                    const v = e.target.value;
                    form.setFieldValue('month', v ? dayjs(`${v}-01`) : undefined);
                  }}
                />
              </Form.Item>
              <Form.Item name="deductionType" label="Deduction Type">
                <Select
                  placeholder="-- Select Type --"
                  allowClear
                  options={TYPES.map((t) => ({ value: t, label: t }))}
                />
              </Form.Item>
              <Form.Item
                name="amount"
                label="Amount (₹) *"
                rules={[{ required: true, message: 'Amount required' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>
            <Form.Item name="reason" label="Reason">
              <Input.TextArea rows={2} placeholder="Reason for deduction..." />
            </Form.Item>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="primary" htmlType="submit" loading={create.isPending}>
                ✅ Save Deduction
              </Button>
              <Button onClick={() => form.resetFields()}>🗑 Clear</Button>
            </div>
          </Form>
        </Card>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <Input
            placeholder="Search driver..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 220 }}
          />
          <span style={{ alignSelf: 'center', fontSize: 13, color: '#555' }}>
            {filtered.length} records
          </span>
        </div>

        <Table<Deduction>
          rowKey="_id"
          loading={records.isLoading}
          dataSource={filtered}
          columns={columns}
          pagination={{ pageSize: 20 }}
          locale={{ emptyText: 'No deductions found' }}
        />
      </div>
    </SendoLegacyPage>
  );
}
