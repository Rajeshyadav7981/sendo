import { useMemo, useState } from 'react';
import { Input, Table, Tag } from 'antd';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import { VendorSearchSelect } from '@shared/components/ui/VendorSearchSelect';
import { useCreateVendorPayment, useVendorPayments } from '../vendors.hooks';
import type { CreateVendorPaymentBody, VendorPayment } from '../vendors.api';

interface FormState {
  vendorName: string;
  vehicleNumber: string;
  invoiceNumber: string;
  tripNumber: string;
  grossAmount: string;
  deductions: string;
  netAmount: string;
  paymentDate: string;
  paymentMode: string;
  utrNumber: string;
  remarks: string;
  status: string;
}

const PAYMENT_MODES = ['Bank Transfer', 'NEFT', 'RTGS', 'UPI', 'Cheque', 'Cash'] as const;
const STATUSES = ['Pending', 'Paid', 'On Hold'] as const;

const today = (): string => new Date().toISOString().split('T')[0];

const blank: FormState = {
  vendorName: '',
  vehicleNumber: '',
  invoiceNumber: '',
  tripNumber: '',
  grossAmount: '',
  deductions: '',
  netAmount: '',
  paymentDate: today(),
  paymentMode: 'Bank Transfer',
  utrNumber: '',
  remarks: '',
  status: 'Pending',
};

function statusTag(status: string | undefined | null): JSX.Element {
  if (status === 'Paid') return <Tag color="green">Paid</Tag>;
  if (status === 'On Hold') return <Tag color="red">On Hold</Tag>;
  return <Tag color="gold">Pending</Tag>;
}

function toNum(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function VendorPaymentPage(): JSX.Element {
  const { data, isLoading } = useVendorPayments();
  const create = useCreateVendorPayment();
  const [form, setForm] = useState<FormState>(blank);
  const [search, setSearch] = useState('');

  const set = <K extends keyof FormState>(k: K, v: FormState[K]): void => {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === 'grossAmount' || k === 'deductions') {
        const g = Number(next.grossAmount);
        const d = Number(next.deductions);
        if (
          Number.isFinite(g) &&
          Number.isFinite(d) &&
          next.grossAmount &&
          next.deductions
        ) {
          next.netAmount = (g - d).toFixed(2);
        }
      }
      return next;
    });
  };

  const handleSave = (): void => {
    const payload: CreateVendorPaymentBody = {
      vendorName: form.vendorName.trim() || null,
      vehicleNumber: form.vehicleNumber.trim() || null,
      invoiceNumber: form.invoiceNumber.trim() || null,
      tripNumber: form.tripNumber.trim() || null,
      grossAmount: toNum(form.grossAmount),
      deductions: toNum(form.deductions),
      netAmount: toNum(form.netAmount),
      paymentDate: form.paymentDate || null,
      paymentMode: form.paymentMode || null,
      utrNumber: form.utrNumber.trim() || null,
      remarks: form.remarks.trim() || null,
      status: form.status || null,
    };
    create.mutate(payload, { onSuccess: () => setForm(blank) });
  };

  const filtered = useMemo<VendorPayment[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter((r) => (r.vendorName ?? '').toLowerCase().includes(q));
  }, [data, search]);

  return (
    <SendoLegacyPage title="Vendor Payments">
      <div className="px-5 pb-5">
        <div className="font-bold text-sm border-b-2 border-yellow-400 pb-1 mb-4 mt-2 uppercase">
          Add Payment
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
          <Field label="Invoice Number">
            <input
              className="sendo-input"
              value={form.invoiceNumber}
              onChange={(e) => set('invoiceNumber', e.target.value)}
            />
          </Field>
          <Field label="Trip Number">
            <input
              className="sendo-input"
              value={form.tripNumber}
              onChange={(e) => set('tripNumber', e.target.value)}
            />
          </Field>
          <Field label="Gross Amount (₹)">
            <input
              type="number"
              className="sendo-input"
              value={form.grossAmount}
              onChange={(e) => set('grossAmount', e.target.value)}
            />
          </Field>
          <Field label="Deductions (₹)">
            <input
              type="number"
              className="sendo-input"
              value={form.deductions}
              onChange={(e) => set('deductions', e.target.value)}
            />
          </Field>
          <Field label="Net Amount (₹) — Auto">
            <input
              type="number"
              className="sendo-input bg-gray-50"
              value={form.netAmount}
              readOnly
            />
          </Field>
          <Field label="Payment Date">
            <input
              type="date"
              className="sendo-input"
              value={form.paymentDate}
              onChange={(e) => set('paymentDate', e.target.value)}
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
          <Field label="UTR / Reference">
            <input
              className="sendo-input"
              value={form.utrNumber}
              onChange={(e) => set('utrNumber', e.target.value)}
            />
          </Field>
          <Field label="Remarks">
            <input
              className="sendo-input"
              value={form.remarks}
              onChange={(e) => set('remarks', e.target.value)}
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
            {create.isPending ? 'Saving…' : 'Save Payment'}
          </button>
        </div>

        <div className="border-t-2 border-gray-100 my-6" />

        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div className="font-bold text-sm uppercase">Payment Records</div>
          <Input.Search
            placeholder="Search by vendor name…"
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
        </div>

        <Table<VendorPayment>
          rowKey={(r, i) => r.id ?? `pay-${i ?? 0}`}
          loading={isLoading}
          dataSource={filtered}
          pagination={{ pageSize: 25 }}
          scroll={{ x: 'max-content' }}
          columns={[
            { title: 'Vendor', dataIndex: 'vendorName' },
            { title: 'Vehicle', dataIndex: 'vehicleNumber' },
            { title: 'Invoice', dataIndex: 'invoiceNumber' },
            { title: 'Trip', dataIndex: 'tripNumber' },
            {
              title: 'Gross',
              dataIndex: 'grossAmount',
              render: (v: number | null | undefined) => (v != null ? `₹${v}` : ''),
            },
            {
              title: 'Deductions',
              dataIndex: 'deductions',
              render: (v: number | null | undefined) => (v != null ? `₹${v}` : ''),
            },
            {
              title: 'Net',
              dataIndex: 'netAmount',
              render: (v: number | null | undefined) =>
                v != null ? <b>₹{v}</b> : '',
            },
            {
              title: 'Date',
              dataIndex: 'paymentDate',
              render: (v: string | null | undefined) =>
                v ? new Date(v).toLocaleDateString('en-IN') : '',
            },
            { title: 'Mode', dataIndex: 'paymentMode' },
            { title: 'UTR', dataIndex: 'utrNumber' },
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
