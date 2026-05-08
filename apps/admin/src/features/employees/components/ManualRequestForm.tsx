import { Button, DatePicker, Form, InputNumber, Input } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useManualAdvance } from '../employees.hooks';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';

interface FormValues {
  driverId: string;
  driverName?: string;
  month?: Dayjs;
  requestedAmount: number;
  reason?: string;
}

interface Props {
  onClose: () => void;
}

export function ManualRequestForm({ onClose }: Props): JSX.Element {
  const [form] = Form.useForm<FormValues>();
  const submit = useManualAdvance();

  const onFinish = (values: FormValues): void => {
    submit.mutate(
      {
        driverId: values.driverId.trim(),
        driverName: values.driverName,
        month: values.month?.format('YYYY-MM'),
        requestedAmount: values.requestedAmount,
        reason: values.reason,
      },
      {
        onSuccess: () => {
          form.resetFields();
          setTimeout(onClose, 1200);
        },
      },
    );
  };

  return (
    <div
      style={{
        background: '#fffdf0',
        border: '1px solid #FFC107',
        borderRadius: 8,
        padding: '16px 18px',
        marginBottom: 16,
        maxWidth: 700,
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 12 }}>
        ✏️ Manual Advance Request
      </div>
      <Form<FormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark={false}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
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
            <DatePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="requestedAmount"
            label="Requested Amount (₹) *"
            rules={[{ required: true, message: 'Amount required' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <Form.Item name="reason" label="Reason">
          <Input.TextArea rows={2} placeholder="Reason for advance..." />
        </Form.Item>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" htmlType="submit" loading={submit.isPending}>
            ✅ Submit
          </Button>
          <Button onClick={onClose}>✕ Close</Button>
        </div>
      </Form>
    </div>
  );
}

void dayjs;
