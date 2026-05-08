import { useMemo, useState } from 'react';
import { Input, Table, Tag } from 'antd';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import { DriverSearchSelect } from '@shared/components/ui/DriverSearchSelect';
import { VendorSearchSelect } from '@shared/components/ui/VendorSearchSelect';
import { useCreateTripSheet, useTripSheets } from '../vendors.hooks';
import type { CreateTripSheetBody, TripSheet } from '../vendors.api';

interface FormState {
  tripNumber: string;
  vendorName: string;
  vehicleNumber: string;
  driverName: string;
  origin: string;
  destination: string;
  loadingDate: string;
  unloadingDate: string;
  material: string;
  weight: string;
  freight: string;
  advancePaid: string;
  balanceFreight: string;
  status: string;
}

const STATUS_OPTIONS = ['Pending', 'In Transit', 'Completed', 'Cancelled'] as const;

const today = (): string => new Date().toISOString().split('T')[0];

const blank: FormState = {
  tripNumber: '',
  vendorName: '',
  vehicleNumber: '',
  driverName: '',
  origin: '',
  destination: '',
  loadingDate: today(),
  unloadingDate: '',
  material: '',
  weight: '',
  freight: '',
  advancePaid: '',
  balanceFreight: '',
  status: 'Pending',
};

function statusTag(status: string | undefined | null): JSX.Element {
  if (status === 'Completed') return <Tag color="green">Completed</Tag>;
  if (status === 'In Transit') return <Tag color="blue">In Transit</Tag>;
  if (status === 'Cancelled') return <Tag color="red">Cancelled</Tag>;
  return <Tag color="gold">Pending</Tag>;
}

function toNum(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function TripSheetPage(): JSX.Element {
  const { data, isLoading } = useTripSheets();
  const create = useCreateTripSheet();
  const [form, setForm] = useState<FormState>(blank);
  const [search, setSearch] = useState('');

  const set = <K extends keyof FormState>(k: K, v: FormState[K]): void => {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === 'freight' || k === 'advancePaid') {
        const f = Number(next.freight);
        const a = Number(next.advancePaid);
        if (Number.isFinite(f) && Number.isFinite(a) && next.freight && next.advancePaid) {
          next.balanceFreight = (f - a).toFixed(2);
        }
      }
      return next;
    });
  };

  const handleSave = (): void => {
    const payload: CreateTripSheetBody = {
      tripNumber: form.tripNumber.trim() || null,
      vendorName: form.vendorName.trim() || null,
      vehicleNumber: form.vehicleNumber.trim() || null,
      driverName: form.driverName.trim() || null,
      origin: form.origin.trim() || null,
      destination: form.destination.trim() || null,
      loadingDate: form.loadingDate || null,
      unloadingDate: form.unloadingDate || null,
      material: form.material.trim() || null,
      weight: toNum(form.weight),
      freight: toNum(form.freight),
      advancePaid: toNum(form.advancePaid),
      balanceFreight: toNum(form.balanceFreight),
      status: form.status,
    };
    create.mutate(payload, { onSuccess: () => setForm(blank) });
  };

  const filtered = useMemo<TripSheet[]>(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (r) =>
        (r.tripNumber ?? '').toLowerCase().includes(q) ||
        (r.vendorName ?? '').toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <SendoLegacyPage title="Trip Sheet">
      <div className="px-5 pb-5">
        <div className="font-bold text-sm border-b-2 border-yellow-400 pb-1 mb-4 mt-2 uppercase">
          Add Trip
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
          <Field label="Trip Number">
            <input
              className="sendo-input"
              value={form.tripNumber}
              onChange={(e) => set('tripNumber', e.target.value)}
            />
          </Field>
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
          <Field label="Driver Name">
            <DriverSearchSelect
              bindBy="name"
              allowFreeText
              value={form.driverName}
              onChange={(v) => set('driverName', v)}
              placeholder="Search driver…"
            />
          </Field>
          <Field label="Origin">
            <input
              className="sendo-input"
              value={form.origin}
              onChange={(e) => set('origin', e.target.value)}
            />
          </Field>
          <Field label="Destination">
            <input
              className="sendo-input"
              value={form.destination}
              onChange={(e) => set('destination', e.target.value)}
            />
          </Field>
          <Field label="Loading Date">
            <input
              type="date"
              className="sendo-input"
              value={form.loadingDate}
              onChange={(e) => set('loadingDate', e.target.value)}
            />
          </Field>
          <Field label="Unloading Date">
            <input
              type="date"
              className="sendo-input"
              value={form.unloadingDate}
              onChange={(e) => set('unloadingDate', e.target.value)}
            />
          </Field>
          <Field label="Material">
            <input
              className="sendo-input"
              value={form.material}
              onChange={(e) => set('material', e.target.value)}
            />
          </Field>
          <Field label="Weight (Tons)">
            <input
              type="number"
              className="sendo-input"
              value={form.weight}
              onChange={(e) => set('weight', e.target.value)}
            />
          </Field>
          <Field label="Freight (₹)">
            <input
              type="number"
              className="sendo-input"
              value={form.freight}
              onChange={(e) => set('freight', e.target.value)}
            />
          </Field>
          <Field label="Advance Paid (₹)">
            <input
              type="number"
              className="sendo-input"
              value={form.advancePaid}
              onChange={(e) => set('advancePaid', e.target.value)}
            />
          </Field>
          <Field label="Balance Freight (₹) — Auto">
            <input
              type="number"
              className="sendo-input bg-gray-50"
              value={form.balanceFreight}
              readOnly
            />
          </Field>
          <Field label="Status">
            <select
              className="sendo-select"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
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
            {create.isPending ? 'Saving…' : 'Save Trip Sheet'}
          </button>
        </div>

        <div className="border-t-2 border-gray-100 my-6" />

        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div className="font-bold text-sm uppercase">Trip Records</div>
          <Input.Search
            placeholder="Search by trip no or vendor…"
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 320 }}
          />
        </div>

        <Table<TripSheet>
          rowKey={(r) => r.id ?? `${r.tripNumber}-${r.createdAt}`}
          loading={isLoading}
          dataSource={filtered}
          pagination={{ pageSize: 25 }}
          scroll={{ x: 'max-content' }}
          columns={[
            { title: 'Trip No', dataIndex: 'tripNumber' },
            { title: 'Vendor', dataIndex: 'vendorName' },
            { title: 'Vehicle', dataIndex: 'vehicleNumber' },
            { title: 'Driver', dataIndex: 'driverName' },
            { title: 'From', dataIndex: 'origin' },
            { title: 'To', dataIndex: 'destination' },
            {
              title: 'Load Date',
              dataIndex: 'loadingDate',
              render: (v: string | null | undefined) =>
                v ? new Date(v).toLocaleDateString('en-IN') : '',
            },
            { title: 'Material', dataIndex: 'material' },
            {
              title: 'Weight',
              dataIndex: 'weight',
              render: (v: number | null | undefined) => (v != null ? `${v}T` : ''),
            },
            {
              title: 'Freight',
              dataIndex: 'freight',
              render: (v: number | null | undefined) => (v != null ? `₹${v}` : ''),
            },
            {
              title: 'Advance',
              dataIndex: 'advancePaid',
              render: (v: number | null | undefined) => (v != null ? `₹${v}` : ''),
            },
            {
              title: 'Balance',
              dataIndex: 'balanceFreight',
              render: (v: number | null | undefined) =>
                v != null ? <b>₹{v}</b> : '',
            },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (v: string) => statusTag(v),
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
