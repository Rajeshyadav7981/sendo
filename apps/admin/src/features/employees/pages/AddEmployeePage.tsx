import { useState } from 'react';
import { Button, Form, Input, Select } from 'antd';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { useCreateEmployee } from '../employees.hooks';

interface FormValues {
  name: string;
  password?: string;
  role?: string;
  phone?: string;
  email?: string;
}

const ROLES = ['Driver', 'Helper', 'Supervisor', 'Admin', 'Other'];

export default function AddEmployeePage(): JSX.Element {
  const [form] = Form.useForm<FormValues>();
  const create = useCreateEmployee();
  const [success, setSuccess] = useState<string>('');

  const onFinish = (values: FormValues): void => {
    const name = values.name.trim().toUpperCase();
    create.mutate(
      { ...values, name },
      {
        onSuccess: () => {
          setSuccess(`✅ Employee "${name}" added successfully!`);
          form.resetFields();
          setTimeout(() => setSuccess(''), 3000);
        },
      },
    );
  };

  return (
    <SendoLegacyPage title="Add Employee">
      <div style={{ padding: 20, maxWidth: 700 }}>
        <Form<FormValues>
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            <Form.Item
              name="name"
              label="Employee Name *"
              rules={[{ required: true, message: 'Employee name is required.' }]}
            >
              <Input placeholder="e.g. RAJAN KUMAR" />
            </Form.Item>
            <Form.Item name="password" label="Password">
              <Input.Password placeholder="Login password" />
            </Form.Item>
            <Form.Item name="role" label="Role">
              <Select
                placeholder="-- Select Role --"
                allowClear
                options={ROLES.map((r) => ({ value: r, label: r }))}
              />
            </Form.Item>
            <Form.Item name="phone" label="Phone">
              <Input placeholder="Phone number" />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input type="email" placeholder="Email address" />
            </Form.Item>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <Button type="primary" htmlType="submit" loading={create.isPending} className="sendo-btn-yellow">
              ✅ Save Employee
            </Button>
            <Button type="default" onClick={() => form.resetFields()}>🗑 Clear</Button>
          </div>
        </Form>

        {success && (
          <div
            style={{
              background: '#e6f9ee',
              border: '1px solid #27ae60',
              color: '#27ae60',
              padding: '10px 14px',
              borderRadius: 6,
              marginTop: 14,
              fontSize: 13,
            }}
          >
            {success}
          </div>
        )}
      </div>
    </SendoLegacyPage>
  );
}
