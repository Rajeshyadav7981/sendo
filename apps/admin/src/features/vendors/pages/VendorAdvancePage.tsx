import { useMemo, useState } from 'react';
import { Input, Table, Tag } from 'antd';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import { VendorSearchSelect } from '@shared/components/ui/VendorSearchSelect';
import { useCreateVendorAdvance, useVendorAdvances } from '../vendors.hooks';
import type { CreateVendorAdvanceBody, VendorAdvance } from '../vendors.api';

interface FormState {
  vendorName: string;
  vehicleNumber: string;
  advanceType: string;
  amount: string;
  date: string;
  paymentMode: string;
  reason: string;
  status: string;
}

const ADVANCE_TYPES = ['Trip Advance', 'Fuel Advance', 'Maintenance Advance', 'Other'] as const;
const PAYMENT_MODES = ['Cash', 'Bank Transfer', 'UPI', 'Cheque'] as const;
const STATUSES = ['Pending', 'Approved', 'Rejected'] as const;

const today = (): string => new Date().toISOString().split('T')[0];

const blank: FormState = {
  vendorName: '',
  vehicleNumber: '',
  advanceType: '',
  amount: '',
  date: today(),
  paymentMode: 'Cash',
  reason: '',
  status: 'Pending',
};

function statusTag(status: string | undefined | null): JSX.Element {
  if (status === 'Approved') return <Tag color="green">Approved</Tag>;
  if (status === 'Rejected') return <Tag color="red">Rejected</Tag>;
  return <Tag color="gold">Pending</Tag>;
}

export default function VendorAdvancePage(): JSX.Element {
  const { data, isLoading } = useVendorAdvances();
  const create = useCreateVendorAdvance();
  const [form, setForm] = useState<FormState>(blank);
  const [search, setSearch] = useState('');

  const set = <K extends keyof FormState>(k: K, v: FormState[K]): void =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = (): void => {
    const payload: CreateVendorAdvanceBody = {
      vendorName: form.vendorName.trim() || null,
      vehicleNumber: form.vehicleNumber.trim() || null,
      advanceType: form.advanceType || null,
      amount: form.amount.trim() ? Number(form.amount) : null,
      date: form.date || null,
      paymentMode: form.paymentMode || null,
      reason: form.reason.trim() || null,
      status: form.status || null,
    };
    create.mutate(payload, { onSuccess: () => setForm(blank) });
  };

  const filtered = useMemo<VendorAdvance[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (r) =>
        (r.vendorName ?? '').toLowerCase().includes(q) ||
        (r.vehicleNumber ?? '').toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <SendoLegacyPage title="Vendor Advance">
      <div className="px-5 pb-5">
        <div className="font-bold text-sm border-b-2 border-yellow-400 pb-1 mb-4 mt-2 uppercase">
          Add Advance
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          <Field label="Vendor Name">
            <VendorSearchSelect
              allowFreeText
              value={form.vendorName}
              onChange={(v) => set('vendorName', v)}
              placeholder="Search vendor…"
            />
          </Field>
          <Field label="Vehicle Number">
            <VehicleSearchSelect
              value={form.vehicleNumber}
              onChange={(v) => set('vehicleNumber', v)}
              placeholder="Select vehicle…"
            />
          </Field>
          <Field label="Advance Type">
            <select
              className="sendo-select"
              value={form.advanceType}
              onChange={(e) => set('advanceType', e.target.value)}
            >
              <option value="">Select</option>
              {ADVANCE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Amount (₹)">
            <input
              type="number"
              className="sendo-input"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              className="sendo-input"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
            />
          </Field>
          <Field label="Payment Mode">
            <select
              className="sendo-select"
              value={form.paymentMode}
              onChange={(e) => set('paymentMode', e.target.value)}
            >
              {PAYMENT_MODES.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
          <Field label="Reason">
            <input
              className="sendo-input"
              value={form.reason}
              onChange={(e) => set('reason', e.target.value)}
            />
          </Field>
          <Field label="Status">
            <select
              className="sendo-select"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex justify-end gap-3 pb-4">
          <button type="button" className="sendo-btn-black" onClick={() => setForm(blank)}>
            Clear
          </button>
          <button
            type="button"
            className="sendo-btn-yellow"
            disabled={create.isPending}
            onClick={handleSave}
          >
            {create.isPending ? 'Saving…' : 'Save Advance'}
          </button>
        </div>

        <div className="border-t-2 border-gray-100 my-6" />

        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div className="font-bold text-sm uppercase">Advance Records</div>
          <div className="flex gap-3 items-center">
            <Input.Search
              placeholder="Search vendor or vehicle…"
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 320 }}
            />
            <span className="text-xs text-gray-500 font-bold">
              {filtered.length} records
            </span>
          </div>
        </div>

        <Table<VendorAdvance>
          rowKey={(r, i) => r.id ?? `adv-${i ?? 0}`}
          loading={isLoading}
          dataSource={filtered}
          pagination={{ pageSize: 25 }}
          scroll={{ x: 'max-content' }}
          columns={[
            { title: 'Vendor Name', dataIndex: 'vendorName' },
            { title: 'Vehicle Number', dataIndex: 'vehicleNumber' },
            { title: 'Advance Type', dataIndex: 'advanceType' },
            {
              title: 'Amount',
              dataIndex: 'amount',
              render: (v: number | null | undefined) => (v != null ? <b>₹{v}</b> : ''),
            },
            {
              title: 'Date',
              dataIndex: 'date',
              render: (v: string | null | undefined) =>
                v ? new Date(v).toLocaleDateString('en-IN') : '',
            },
            { title: 'Payment Mode', dataIndex: 'paymentMode' },
            { title: 'Reason', dataIndex: 'reason' },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (v: string | null | undefined) => statusTag(v),
            },
          ]}
        />
      </div>
    </SendoLegacyPage>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div>
      <label className="sendo-label">{label}</label>
      {children}
    </div>
  );
}
