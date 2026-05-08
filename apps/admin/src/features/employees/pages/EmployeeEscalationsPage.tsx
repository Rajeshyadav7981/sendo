import { useMemo, useState } from 'react';
import { Badge, Button, Card, Form, Input, Modal, Select, Tag } from 'antd';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import {
  useCreateEscalation,
  useDeleteEscalation,
  useEscalations,
  useUpdateEscalation,
} from '../employees.hooks';
import type { Escalation, EscalationSeverity } from '../employees.api';

const CATEGORY_OPTIONS = [
  'Fuel Issue',
  'Late Arrival',
  'Vehicle Damage',
  'Route Deviation',
  'Misconduct',
  'Breakdown',
  'Customer Complaint',
  'Other',
];

const SEVERITY_OPTIONS: Array<{ value: EscalationSeverity; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

interface FormValues {
  vehicle: string;
  category: string;
  severity: EscalationSeverity;
  note: string;
}

export default function EmployeeEscalationsPage(): JSX.Element {
  const escalations = useEscalations();
  const create = useCreateEscalation();
  const update = useUpdateEscalation();
  const remove = useDeleteEscalation();
  const [form] = Form.useForm<FormValues>();
  const [vFilter, setVFilter] = useState<string>('');
  const [sFilter, setSFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);

  const vehicles = useMemo(
    () => [...new Set((escalations.data ?? []).map((e) => e.vehicle))].sort(),
    [escalations.data],
  );

  const filtered = useMemo<Escalation[]>(() => {
    const list = escalations.data ?? [];
    return list.filter((e) => {
      const mv = !vFilter || e.vehicle === vFilter;
      const ms = !sFilter || e.status === sFilter;
      return mv && ms;
    });
  }, [escalations.data, vFilter, sFilter]);

  const openCount = (escalations.data ?? []).filter((e) => e.status === 'open').length;

  const onFinish = (values: FormValues): void => {
    create.mutate(
      {
        vehicle: values.vehicle.trim(),
        category: values.category.trim(),
        severity: values.severity,
        note: values.note.trim(),
      },
      {
        onSuccess: () => {
          form.resetFields();
          setShowForm(false);
        },
      },
    );
  };

  const handleDelete = (id: string): void => {
    Modal.confirm({
      title: 'Delete this escalation?',
      okButtonProps: { danger: true },
      onOk: () => remove.mutate(id),
    });
  };

  return (
    <SendoLegacyPage
      title="🚨 Escalations"
      toolbar={
        openCount > 0 ? (
          <Badge
            count={`${openCount} Open`}
            style={{ backgroundColor: '#f87171' }}
          />
        ) : null
      }
    >
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <Select
            placeholder="All Vehicles"
            value={vFilter || undefined}
            onChange={(v) => setVFilter(v ?? '')}
            allowClear
            style={{ minWidth: 180 }}
            options={vehicles.map((v) => ({ value: v, label: v }))}
          />
          <Select
            placeholder="All Status"
            value={sFilter || undefined}
            onChange={(v) => setSFilter(v ?? '')}
            allowClear
            style={{ minWidth: 160 }}
            options={[
              { value: 'open', label: '🔴 Open' },
              { value: 'resolved', label: '🟢 Resolved' },
              { value: 'reopened', label: '🟠 Reopened' },
            ]}
          />
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? '✕ Cancel' : '➕ Add Escalation'}
          </Button>
        </div>

        {showForm && (
          <Card title="New Escalation" style={{ maxWidth: 700, marginBottom: 20 }}>
            <Form<FormValues>
              form={form}
              layout="vertical"
              initialValues={{ severity: 'medium', category: CATEGORY_OPTIONS[0] }}
              onFinish={onFinish}
              requiredMark={false}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Form.Item
                  name="vehicle"
                  label="Vehicle Number *"
                  rules={[
                    { required: true, message: 'Vehicle required' },
                    { max: 64, message: 'Max 64 chars' },
                  ]}
                >
                  <VehicleSearchSelect />
                </Form.Item>
                <Form.Item
                  name="category"
                  label="Category *"
                  rules={[
                    { required: true, message: 'Category required' },
                    { max: 100, message: 'Max 100 chars' },
                  ]}
                >
                  <Select options={CATEGORY_OPTIONS.map((t) => ({ value: t, label: t }))} />
                </Form.Item>
              </div>
              <Form.Item
                name="severity"
                label="Severity"
                rules={[{ required: true, message: 'Severity required' }]}
              >
                <Select options={SEVERITY_OPTIONS} />
              </Form.Item>
              <Form.Item
                name="note"
                label="Description *"
                rules={[
                  { required: true, message: 'Description required' },
                  { max: 1000, message: 'Keep it under 1000 chars' },
                ]}
              >
                <Input.TextArea rows={3} placeholder="Describe the issue..." />
              </Form.Item>
              <div style={{ display: 'flex', gap: 10 }}>
                <Button type="primary" htmlType="submit" loading={create.isPending}>
                  🚨 Submit Escalation
                </Button>
                <Button onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </Form>
          </Card>
        )}

        {escalations.isLoading ? (
          <p>Loading escalations...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>No escalations found</div>
        ) : (
          filtered.map((e) => (
            <Card
              key={e._id || e.id}
              style={{
                marginBottom: 10,
                borderColor:
                  e.status === 'resolved' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                <strong style={{ fontFamily: 'monospace', color: '#1565c0' }}>{e.vehicle}</strong>
                {e.createdAt ? (
                  <span style={{ fontSize: 12, color: '#888' }}>
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                ) : null}
                <Tag color="error">{e.category}</Tag>
                {e.severity ? (
                  <Tag color={e.severity === 'high' ? 'red' : e.severity === 'medium' ? 'orange' : 'gold'}>
                    {e.severity}
                  </Tag>
                ) : null}
                <span style={{ marginLeft: 'auto' }}>
                  {e.status === 'resolved' ? (
                    <Tag color="success">🟢 Resolved</Tag>
                  ) : e.status === 'reopened' ? (
                    <Tag color="warning">🟠 Reopened</Tag>
                  ) : (
                    <Tag color="error">🔴 Open</Tag>
                  )}
                </span>
              </div>
              <p style={{ margin: '0 0 10px', color: '#333', fontSize: 13 }}>{e.note}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {e.status === 'open' ? (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => update.mutate({ id: (e._id || e.id) as string, status: 'resolved' })}
                  >
                    ✓ Mark Resolved
                  </Button>
                ) : (
                  <Button
                    size="small"
                    onClick={() => update.mutate({ id: (e._id || e.id) as string, status: 'open' })}
                  >
                    ↩ Reopen
                  </Button>
                )}
                <Button size="small" danger onClick={() => handleDelete((e._id || e.id) as string)}>
                  🗑 Delete
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </SendoLegacyPage>
  );
}
