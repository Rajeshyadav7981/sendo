import { type ChangeEvent, useState } from 'react';
import { SendoLegacyPage } from '@shared/components/common/SendoLegacyPage';
import { VehicleSearchSelect } from '@shared/components/ui/VehicleSearchSelect';
import { useCreateVehicleExpense, useVehicleExpenses } from '../expenses.hooks';

interface VehicleExpense {
  vehicleNumber: string;
  category: string;
  date: string;
  amount: string;
  paidBy: string;
  paymentMethod: string;
  description: string;
  vendor: string;
}

const CATEGORIES = ['Fuel', 'Tyre', 'Repair', 'Maintenance', 'Insurance', 'Road Tax', 'Toll', 'Lubrication', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Card', 'Cheque', 'UPI', 'Bank Transfer'] as const;

const blank: VehicleExpense = {
  vehicleNumber: '',
  category: '',
  date: new Date().toISOString().split('T')[0],
  amount: '',
  paidBy: '',
  paymentMethod: 'Cash',
  description: '',
  vendor: '',
};

export default function VehicleExpensesPage(): JSX.Element {
  const records = useVehicleExpenses();
  const create = useCreateVehicleExpense();

  const [form, setForm] = useState<VehicleExpense>(blank);
  const [search, setSearch] = useState('');

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const onSave = (): void => {
    create.mutate(
      {
        ...form,
        expenseType: 'Vehicle Expense',
        amount: form.amount ? Number(form.amount) : null,
      },
      { onSuccess: () => setForm(blank) },
    );
  };

  const list = (records.data ?? []) as Array<Record<string, unknown>>;
  const filtered = list.filter((r) =>
    String(r.vehicleNumber ?? '').toLowerCase().includes(search.toLowerCase()),
  );
  const total = filtered.reduce((a, r) => a + Number(r.amount ?? 0), 0);
  const uniqueVehicles = new Set(filtered.map((r) => r.vehicleNumber)).size;

  return (
    <SendoLegacyPage title="VEHICLE EXPENSES">
      <div className="px-5 py-5">
        <div className="mb-5 flex flex-wrap gap-3.5">
          <Summary value={`₹${total.toLocaleString('en-IN')}`} label="Total Expenses" bg="#fff8e1" />
          <Summary value={String(filtered.length)} label="Entries" bg="#f0f0f0" />
          <Summary value={String(uniqueVehicles)} label="Vehicles" bg="#e8f5e9" />
        </div>

        <div className="mb-4 mt-2.5 border-b-2 border-sendo-yellow pb-1.5 text-[15px] font-bold">
          Add Vehicle Expense
        </div>
        <div className="mb-5 grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <Field label="Vehicle Number:">
            <VehicleSearchSelect
              value={form.vehicleNumber}
              onChange={(v) => setForm((p) => ({ ...p, vehicleNumber: v }))}
              placeholder="Select vehicle…"
            />
          </Field>
          <Field label="Category:">
            <select className="sendo-input" name="category" value={form.category} onChange={onChange}>
              <option value="">Select</option>
              {CATEGORIES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Date:">
            <input className="sendo-input" type="date" name="date" value={form.date} onChange={onChange} />
          </Field>
          <Field label="Amount (₹):">
            <input className="sendo-input" type="number" name="amount" value={form.amount} onChange={onChange} />
          </Field>
          <Field label="Paid By:">
            <input className="sendo-input" type="text" name="paidBy" value={form.paidBy} onChange={onChange} />
          </Field>
          <Field label="Payment Method:">
            <select className="sendo-input" name="paymentMethod" value={form.paymentMethod} onChange={onChange}>
              {PAYMENT_METHODS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Vendor / Supplier:">
            <input className="sendo-input" type="text" name="vendor" value={form.vendor} onChange={onChange} />
          </Field>
          <Field label="Description:">
            <input className="sendo-input" type="text" name="description" value={form.description} onChange={onChange} />
          </Field>
        </div>

        <div className="flex justify-end gap-3 pb-2.5">
          <button
            type="button"
            onClick={() => setForm(blank)}
            className="rounded bg-black px-7 py-2 text-[14px] font-bold text-white"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={create.isPending}
            className="sendo-btn-yellow px-7 py-2 text-[14px]"
          >
            {create.isPending ? 'Saving…' : 'Save Expense'}
          </button>
        </div>

        <div className="my-6 border-t-2 border-[#f0f0f0]" />

        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="border-b-2 border-sendo-yellow pb-1.5 text-[15px] font-bold">Expense Records</div>
          <input
            placeholder="Search by vehicle number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[280px] rounded border-[1.5px] border-black px-3 py-2 text-[14px]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Vehicle', 'Category', 'Date', 'Amount', 'Paid By', 'Method', 'Vendor', 'Description'].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap border-b-2 border-[#e0a800] bg-sendo-yellow px-3.5 py-3 text-left text-[14px] font-bold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border-b border-[#f0f0f0] px-3.5 py-7 text-center text-[14px] text-[#aaa]">
                    No records yet
                  </td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={String(r.id ?? i)} className={i % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {String(r.vehicleNumber ?? '')}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {String(r.category ?? r.expenseType ?? '')}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {r.date ? new Date(String(r.date)).toLocaleDateString('en-IN') : ''}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px] font-bold">
                      ₹{Number(r.amount ?? 0).toLocaleString('en-IN')}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {String(r.paidBy ?? '')}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {String(r.paymentMethod ?? r.paymentMode ?? '')}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {String(r.vendor ?? '')}
                    </td>
                    <td className="whitespace-nowrap border-b border-[#f0f0f0] px-3.5 py-2.5 text-[14px]">
                      {String(r.description ?? '')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SendoLegacyPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }): JSX.Element {
  return (
    <div>
      <label className="mb-1.5 block text-[14px] font-bold">{label}</label>
      {children}
    </div>
  );
}

function Summary({ value, label, bg }: { value: string; label: string; bg: string }): JSX.Element {
  return (
    <div
      className="min-w-[140px] flex-1 rounded-md border-[1.5px] border-black px-4 py-3.5"
      style={{ backgroundColor: bg }}
    >
      <div className="text-[22px] font-bold">{value}</div>
      <div className="mt-1 text-[13px] text-[#555]">{label}</div>
    </div>
  );
}
