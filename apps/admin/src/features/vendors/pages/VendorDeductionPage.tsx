import { useMemo, useState } from 'react';
import { Input, Table } from 'antd';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import { VendorSearchSelect } from '@shared/components/ui/VendorSearchSelect';
import { useCreateVendorDeduction, useVendorDeductions } from '../vendors.hooks';
import type { CreateVendorDeductionBody, VendorDeduction } from '../vendors.api';

interface FormState {
  vendorName: string;
  vehicleNumber: string;
  deductionType: string;
  amount: string;
  date: string;
  description: string;
  tripNumber: string;
}

const DEDUCTION_TYPES = [
  'Advance Recovery',
  'Penalty',
  'Damage',
  'Short Delivery',
  'Other',
] as const;

const today = (): string => new Date().toISOString().split('T')[0];

const blank: FormState = {
  vendorName: '',
  vehicleNumber: '',
  deductionType: '',
  amount: '',
  date: today(),
  description: '',
  tripNumber: '',
};

export default function VendorDeductionPage(): JSX.Element {
  const { data, isLoading } = useVendorDeductions();
  const create = useCreateVendorDeduction();
  const [form, setForm] = useState<FormState>(blank);
  const [search, setSearch] = useState('');

  const set = <K extends keyof FormState>(k: K, v: FormState[K]): void =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = (): void => {
    const payload: CreateVendorDeductionBody = {
      vendorName: form.vendorName.trim() || null,
      vehicleNumber: form.vehicleNumber.trim() || null,
      deductionType: form.deductionType || null,
      amount: form.amount.trim() ? Number(form.amount) : null,
      date: form.date || null,
      description: form.description.trim() || null,
      tripNumber: form.tripNumber.trim() || null,
    };
    create.mutate(payload, { onSuccess: () => setForm(blank) });
  };

  const filtered = useMemo<VendorDeduction[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((r) => (r.vendorName ?? '').toLowerCase().includes(q));
  }, [data, search]);

  return (
    <SendoLegacyPage title="Vendor Deductions">
      <div className="px-5 pb-5">
        <div className="font-bold text-sm border-b-2 border-yellow-400 pb-1 mb-4 mt-2 uppercase">
          Add Deduction
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
          <Field label="Trip Number">
            <input
              className="sendo-input"
              value={form.tripNumber}
              onChange={(e) => set('tripNumber', e.target.value)}
            />
          </Field>
          <Field label="Deduction Type">
            <select
              className="sendo-select"
              value={form.deductionType}
              onChange={(e) => set('deductionType', e.target.value)}
            >
              <option value="">Select</option>
              {DEDUCTION_TYPES.map((t) => (
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
          <Field label="Description">
            <input
              className="sendo-input"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
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
            {create.isPending ? 'Saving…' : 'Save Deduction'}
          </button>
        </div>

        <div className="border-t-2 border-gray-100 my-6" />

        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div className="font-bold text-sm uppercase">Deduction Records</div>
          <Input.Search
            placeholder="Search by vendor name…"
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
        </div>

        <Table<VendorDeduction>
          rowKey={(r, i) => r.id ?? `ded-${i ?? 0}`}
          loading={isLoading}
          dataSource={filtered}
          pagination={{ pageSize: 25 }}
          scroll={{ x: 'max-content' }}
          columns={[
            { title: 'Vendor Name', dataIndex: 'vendorName' },
            { title: 'Vehicle Number', dataIndex: 'vehicleNumber' },
            { title: 'Trip No', dataIndex: 'tripNumber' },
            { title: 'Deduction Type', dataIndex: 'deductionType' },
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
            { title: 'Description', dataIndex: 'description' },
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
